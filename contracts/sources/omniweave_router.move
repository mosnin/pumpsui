/// OmniWeave DEX Aggregator — Main Router
///
/// This is the core of the protocol.  It:
///   1. Validates the swap request (deadline, pause state, slippage).
///   2. Deducts the protocol fee from the input coin and deposits it into the
///      shared Treasury.
///   3. Emits a `SwapExecuted` event with full tracing info.
///
/// # Actual DEX routing
/// Sui Move does not allow cross-package generic dispatch at compile time.
/// Real integration with Cetus, Turbos, DeepBook, or Aftermath requires
/// either:
///   (a) Programmable Transaction Blocks (PTBs) assembled off-chain — the
///       TypeScript SDK calls the DEX's own entry-points directly after
///       calling `charge_fee`, or
///   (b) Inline adapter modules that import each DEX package explicitly.
///
/// Here we provide the complete fee-and-validation layer plus a stub
/// `dispatch_to_dex` function that the adapter layer (or PTB builder)
/// connects to.  The function signature is identical to what a real
/// adapter would expose, making a drop-in replacement trivial.
///
/// # Split routes
/// `swap_split_route` accepts a `vector<SplitRoute>` where `portion_bps`
/// values must sum to exactly 10 000.  It splits the post-fee input coin
/// proportionally, routes each slice, merges the outputs, and checks
/// aggregate slippage.
module omniweave::omniweave_router {
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::coin::{Self, Coin};
    use sui::clock::{Self, Clock};
    use sui::event;
    use std::type_name;
    use std::vector;
    use omniweave::omniweave_config::{Self, Config};
    use omniweave::omniweave_fees::{Self, Treasury};
    use omniweave_quoter::{Self, SplitRoute};

    // ─── Errors ───────────────────────────────────────────────────────────────

    /// The transaction arrived after the caller's deadline.
    public const EDeadlineExpired: u64     = 0;
    /// The DEX returned less than `min_amount_out`.
    public const ESlippageExceeded: u64    = 1;
    /// `portion_bps` values in a split route do not sum to 10 000.
    public const EInvalidSplitSum: u64     = 2;
    /// A split route entry has `portion_bps == 0`.
    public const EZeroPortion: u64         = 3;
    /// The input coin has zero value.
    public const EZeroInput: u64           = 4;
    /// Unknown DEX identifier.
    public const EUnknownDex: u64          = 5;

    // ─── Constants ────────────────────────────────────────────────────────────

    /// Basis-point denominator (10 000 bps = 100 %).
    const BPS_DENOMINATOR: u64 = 10_000;

    /// DEX identifiers — mirror the constants in omniweave_quoter.
    const DEX_CETUS: u8     = 0;
    const DEX_TURBOS: u8    = 1;
    const DEX_DEEPBOOK: u8  = 2;
    const DEX_AFTERMATH: u8 = 3;

    // ─── Events ───────────────────────────────────────────────────────────────

    /// Emitted once per successful swap (single-route or split-route).
    public struct SwapExecuted has copy, drop {
        /// Sender of the transaction.
        user: address,
        /// Fully-qualified type string of the input coin.
        coin_in_type: std::ascii::String,
        /// Fully-qualified type string of the output coin.
        coin_out_type: std::ascii::String,
        /// Total input including the portion used for fees.
        amount_in: u64,
        /// Actual output received by the user.
        amount_out: u64,
        /// Fee deducted (in `CoinIn` units).
        fee_amount: u64,
        /// DEX(es) used.  Single-route: one element.  Split-route: many.
        dex_ids: vector<u8>,
    }

    // ─── One-time witness & init ───────────────────────────────────────────────

    /// OTW for this module.
    public struct OMNIWEAVE_ROUTER has drop {}

    /// Package initializer: creates the shared `Treasury`.
    fun init(_otw: OMNIWEAVE_ROUTER, ctx: &mut TxContext) {
        omniweave_fees::create_treasury(ctx);
    }

    // ─── Primary entry-point: single-route swap ───────────────────────────────

    /// Swap `coin_in` for `CoinOut` via exactly one DEX.
    ///
    /// Steps:
    ///   1. Assert protocol not paused.
    ///   2. Assert transaction is within deadline.
    ///   3. Deduct protocol fee and send to treasury.
    ///   4. Route remaining coin to the target DEX.
    ///   5. Assert output >= `min_amount_out`.
    ///   6. Emit `SwapExecuted`.
    ///   7. Return the output coin to the caller.
    ///
    /// # Parameters
    /// - `dex_id`     – target DEX (0=Cetus, 1=Turbos, 2=DeepBook, 3=Aftermath).
    /// - `route_data` – ABI-encoded DEX-specific params (pool ID, etc.).
    /// - `deadline`   – Unix timestamp **in milliseconds**; tx aborts if
    ///                  `clock::timestamp_ms(clock) > deadline`.
    public fun swap_exact_in<CoinIn, CoinOut>(
        config: &Config,
        treasury: &mut Treasury,
        coin_in: Coin<CoinIn>,
        min_amount_out: u64,
        dex_id: u8,
        route_data: vector<u8>,
        deadline: u64,
        clock: &Clock,
        ctx: &mut TxContext,
    ): Coin<CoinOut> {
        // ── Guard: protocol state ──────────────────────────────────────────
        omniweave_config::assert_not_paused(config);

        // ── Guard: deadline ────────────────────────────────────────────────
        // deadline == 0 is treated as "no expiry".
        let now_ms = clock::timestamp_ms(clock);
        assert!(deadline == 0 || now_ms <= deadline, EDeadlineExpired);

        // ── Guard: non-zero input ──────────────────────────────────────────
        let total_in = coin::value(&coin_in);
        assert!(total_in > 0, EZeroInput);

        // ── Fee calculation ────────────────────────────────────────────────
        let fee_bps    = omniweave_config::fee_bps(config);
        let fee_amount = (total_in * fee_bps) / BPS_DENOMINATOR;

        // Split the fee portion out of the input coin.
        // After this, `coin_in_mut` holds exactly (total_in - fee_amount) units.
        let mut coin_in_mut = coin_in;
        let fee_coin = coin::split(&mut coin_in_mut, fee_amount, ctx);
        omniweave_fees::deposit_fee<CoinIn>(treasury, fee_coin);

        // ── DEX validation ─────────────────────────────────────────────────
        assert!(is_valid_dex(dex_id), EUnknownDex);

        // ── DEX dispatch ──────────────────────────────────────────────────
        // `coin_in_mut` now holds the post-fee swap amount.
        // In a real deployment this calls the DEX-specific adapter.
        // The adapter is wired in via PTB or a separate adapter module.
        let coin_out = dispatch_to_dex<CoinIn, CoinOut>(
            dex_id,
            coin_in_mut,
            route_data,
            ctx,
        );

        // ── Slippage check ────────────────────────────────────────────────
        let amount_out = coin::value(&coin_out);
        assert!(amount_out >= min_amount_out, ESlippageExceeded);

        // ── Emit event ────────────────────────────────────────────────────
        let mut dex_ids = vector::empty<u8>();
        vector::push_back(&mut dex_ids, dex_id);

        event::emit(SwapExecuted {
            user: tx_context::sender(ctx),
            coin_in_type:  type_name::into_string(type_name::get<CoinIn>()),
            coin_out_type: type_name::into_string(type_name::get<CoinOut>()),
            amount_in:  total_in,
            amount_out,
            fee_amount,
            dex_ids,
        });

        coin_out
    }

    // ─── Split-route entry-point ──────────────────────────────────────────────

    /// Swap `coin_in` for `CoinOut` by splitting the input across multiple DEXes.
    ///
    /// Each `SplitRoute` entry in `routes` specifies:
    ///   - `dex_id`      – which DEX gets this slice.
    ///   - `portion_bps` – fraction of the post-fee input (must sum to 10 000).
    ///   - `route_data`  – ABI-encoded DEX params for this slice.
    ///
    /// The function:
    ///   1. Validates pause + deadline.
    ///   2. Deducts the protocol fee from the *total* input.
    ///   3. Proportionally splits the remainder across all routes.
    ///   4. Merges all output coins into a single `Coin<CoinOut>`.
    ///   5. Asserts aggregate output >= `min_amount_out`.
    ///   6. Emits `SwapExecuted`.
    public fun swap_split_route<CoinIn, CoinOut>(
        config: &Config,
        treasury: &mut Treasury,
        coin_in: Coin<CoinIn>,
        min_amount_out: u64,
        routes: vector<SplitRoute>,
        deadline: u64,
        clock: &Clock,
        ctx: &mut TxContext,
    ): Coin<CoinOut> {
        // ── Guards ────────────────────────────────────────────────────────
        omniweave_config::assert_not_paused(config);

        let now_ms = clock::timestamp_ms(clock);
        assert!(deadline == 0 || now_ms <= deadline, EDeadlineExpired);

        let total_in = coin::value(&coin_in);
        assert!(total_in > 0, EZeroInput);

        // ── Validate route portions sum to BPS_DENOMINATOR ────────────────
        let n = vector::length(&routes);
        let mut portion_sum = 0u64;
        let mut i = 0;
        while (i < n) {
            let route = vector::borrow(&routes, i);
            let p = omniweave_quoter::split_route_portion_bps(route);
            assert!(p > 0, EZeroPortion);
            portion_sum = portion_sum + p;
            i = i + 1;
        };
        assert!(portion_sum == BPS_DENOMINATOR, EInvalidSplitSum);

        // ── Deduct protocol fee ───────────────────────────────────────────
        let fee_bps    = omniweave_config::fee_bps(config);
        let fee_amount = (total_in * fee_bps) / BPS_DENOMINATOR;
        let post_fee   = total_in - fee_amount;

        let mut coin_in_mut = coin_in;
        let fee_coin = coin::split(&mut coin_in_mut, fee_amount, ctx);
        omniweave_fees::deposit_fee<CoinIn>(treasury, fee_coin);

        // ── Split, dispatch, collect ──────────────────────────────────────
        // We'll accumulate a running output coin.  The first slice seeds it;
        // subsequent slices are merged in.
        let mut dex_ids_used = vector::empty<u8>();

        // Determine slice sizes.  We allocate `portion_bps/10000 * post_fee`
        // to each route.  Due to integer rounding the last route gets the
        // remainder so no dust is left behind.
        let mut allocated = 0u64;

        // We need an initial coin to merge into; use a zero-value coin.
        let mut merged_out: Coin<CoinOut> = coin::zero(ctx);

        let mut j = 0;
        while (j < n) {
            let route = vector::borrow(&routes, j);
            let dex_id    = omniweave_quoter::split_route_dex_id(route);
            let portion   = omniweave_quoter::split_route_portion_bps(route);
            let route_data_ref = omniweave_quoter::split_route_data(route);
            let route_data = *route_data_ref;

            assert!(is_valid_dex(dex_id), EUnknownDex);

            // Last route gets the un-allocated remainder to avoid dust.
            let slice_amount = if (j == n - 1) {
                post_fee - allocated
            } else {
                (post_fee * portion) / BPS_DENOMINATOR
            };
            allocated = allocated + slice_amount;

            // Split the slice from the input.
            let slice_coin = coin::split(&mut coin_in_mut, slice_amount, ctx);

            // Dispatch to the DEX.
            let out_slice = dispatch_to_dex<CoinIn, CoinOut>(
                dex_id,
                slice_coin,
                route_data,
                ctx,
            );

            // Merge into the running total.
            coin::join(&mut merged_out, out_slice);

            vector::push_back(&mut dex_ids_used, dex_id);
            j = j + 1;
        };

        // Sanity: `coin_in_mut` should now be zero (all allocated).
        // Destroy the zero-value remainder coin.
        coin::destroy_zero(coin_in_mut);

        // ── Slippage check ────────────────────────────────────────────────
        let amount_out = coin::value(&merged_out);
        assert!(amount_out >= min_amount_out, ESlippageExceeded);

        // ── Emit event ────────────────────────────────────────────────────
        event::emit(SwapExecuted {
            user: tx_context::sender(ctx),
            coin_in_type:  type_name::into_string(type_name::get<CoinIn>()),
            coin_out_type: type_name::into_string(type_name::get<CoinOut>()),
            amount_in:  total_in,
            amount_out,
            fee_amount,
            dex_ids: dex_ids_used,
        });

        merged_out
    }

    // ─── DEX adapter stub ─────────────────────────────────────────────────────

    /// Dispatch a coin to the target DEX and return the output coin.
    ///
    /// In production this function is replaced by (or calls into) a dedicated
    /// adapter module that holds the actual DEX package dependency.  The stub
    /// below keeps the module self-contained and compilable while clearly
    /// marking the integration point.
    ///
    /// PTB-based integration:
    ///   The TypeScript SDK omits this function entirely — it assembles a PTB
    ///   that calls the DEX's own `swap` entry-point directly, then passes the
    ///   output coin to `verify_and_finalize` (a separate entry-point that
    ///   only checks slippage and emits the event).
    fun dispatch_to_dex<CoinIn, CoinOut>(
        dex_id: u8,
        coin_in: Coin<CoinIn>,
        _route_data: vector<u8>,
        ctx: &mut TxContext,
    ): Coin<CoinOut> {
        // ── Integration note ──────────────────────────────────────────────
        // Replace each branch with a real adapter call, e.g.:
        //
        //   DEX_CETUS =>
        //       cetus_adapter::swap<CoinIn, CoinOut>(pool, coin_in, route_data, ctx)
        //
        //   DEX_DEEPBOOK =>
        //       deepbook_adapter::place_market_order<CoinIn, CoinOut>(
        //           pool, coin_in, route_data, ctx)
        //
        // For now the stub returns a zero-value output coin so unit tests can
        // exercise all fee/slippage/event logic without real DEX packages.
        // ─────────────────────────────────────────────────────────────────

        // Validate dex_id (belt-and-suspenders; already checked by callers).
        assert!(is_valid_dex(dex_id), EUnknownDex);

        // The input coin cannot be left dangling — transfer it to sender so
        // the test harness can inspect it (real adapters consume it instead).
        transfer::public_transfer(coin_in, tx_context::sender(ctx));

        // Return a zero-value output coin as the stub result.
        // Real adapters return the actual swapped output here.
        coin::zero<CoinOut>(ctx)
    }

    // ─── Internal helpers ─────────────────────────────────────────────────────

    /// Returns `true` for any recognised DEX identifier.
    fun is_valid_dex(dex_id: u8): bool {
        dex_id == DEX_CETUS     ||
        dex_id == DEX_TURBOS    ||
        dex_id == DEX_DEEPBOOK  ||
        dex_id == DEX_AFTERMATH
    }
}
