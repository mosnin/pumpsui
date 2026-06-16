/// OmniWeave off-chain quoter types.
///
/// This module defines the data structures used to represent routes and quotes.
/// It does NOT perform any swaps — it is purely a library of types and
/// view-friendly helpers consumed by the frontend / TypeScript SDK.
///
/// Typical flow:
///   1. Frontend calls a read-only RPC simulation with `build_multi_hop_route`.
///   2. The returned `MultiHopRoute` encodes the full path.
///   3. The frontend converts the route to `SplitRoute` entries and calls the
///      router entry-points.
module omniweave::omniweave_quoter {

    // ─── DEX identifiers ──────────────────────────────────────────────────────

    /// Cetus AMM (concentrated liquidity).
    const DEX_CETUS: u8     = 0;
    /// Turbos Finance AMM.
    const DEX_TURBOS: u8    = 1;
    /// DeepBook v2 order-book DEX.
    const DEX_DEEPBOOK: u8  = 2;
    /// Aftermath Finance AMM.
    const DEX_AFTERMATH: u8 = 3;

    // ─── Route primitives ─────────────────────────────────────────────────────

    /// A single hop: swap on one DEX between two adjacent tokens in a path.
    public struct RouteStep has copy, drop, store {
        /// DEX to use (see DEX_* constants above).
        dex_id: u8,
        /// ABI-encoded DEX-specific parameters (pool ID, tick range, etc.).
        /// Interpreted on-chain when the router calls the DEX adapter.
        route_data: vector<u8>,
        /// Minimum output expected for this individual step (0 = no check).
        min_amount_out: u64,
    }

    /// A multi-hop route: an ordered sequence of `RouteStep`s that must all
    /// execute to complete one logical swap (e.g. USDC → SUI → CETUS).
    public struct MultiHopRoute has copy, drop, store {
        /// Ordered list of swap steps.
        steps: vector<RouteStep>,
        /// Total minimum output across all hops (slippage check at the end).
        total_min_amount_out: u64,
        /// Unix timestamp (ms) after which the route is considered stale.
        deadline: u64,
    }

    /// A slice of a split route.  The router accepts a `vector<SplitRoute>`
    /// where the `portion_bps` values must sum to 10 000.
    public struct SplitRoute has copy, drop, store {
        /// Which DEX handles this slice.
        dex_id: u8,
        /// Fraction of the total input allocated here, in basis points.
        /// Must sum to 10 000 across all entries.
        portion_bps: u64,
        /// Encoded DEX-specific parameters for this slice.
        route_data: vector<u8>,
    }

    /// Quote returned from an off-chain simulation.  Serialized and passed back
    /// to the frontend; never stored on-chain.
    public struct Quote has copy, drop, store {
        /// Input amount (in smallest unit of `CoinIn`).
        amount_in: u64,
        /// Expected output before slippage.
        amount_out: u64,
        /// Protocol fee deducted from `amount_in` (in `CoinIn` units).
        fee_amount: u64,
        /// Price impact in basis points (1 bps = 0.01 %).
        price_impact_bps: u64,
        /// Route that achieves this quote.
        route: MultiHopRoute,
    }

    // ─── Constructors ─────────────────────────────────────────────────────────

    /// Build a `RouteStep`.
    public fun new_route_step(
        dex_id: u8,
        route_data: vector<u8>,
        min_amount_out: u64,
    ): RouteStep {
        RouteStep { dex_id, route_data, min_amount_out }
    }

    /// Assemble a `MultiHopRoute` from an ordered list of steps.
    public fun build_multi_hop_route(
        steps: vector<RouteStep>,
        total_min_amount_out: u64,
        deadline: u64,
    ): MultiHopRoute {
        MultiHopRoute { steps, total_min_amount_out, deadline }
    }

    /// Build a `SplitRoute` slice.
    public fun new_split_route(
        dex_id: u8,
        portion_bps: u64,
        route_data: vector<u8>,
    ): SplitRoute {
        SplitRoute { dex_id, portion_bps, route_data }
    }

    /// Build a `Quote` (called from off-chain simulation, not from on-chain tx).
    public fun new_quote(
        amount_in: u64,
        amount_out: u64,
        fee_amount: u64,
        price_impact_bps: u64,
        route: MultiHopRoute,
    ): Quote {
        Quote { amount_in, amount_out, fee_amount, price_impact_bps, route }
    }

    // ─── Accessors ────────────────────────────────────────────────────────────

    public fun route_step_dex_id(step: &RouteStep): u8               { step.dex_id }
    public fun route_step_route_data(step: &RouteStep): &vector<u8>  { &step.route_data }
    public fun route_step_min_out(step: &RouteStep): u64              { step.min_amount_out }

    public fun multi_hop_steps(route: &MultiHopRoute): &vector<RouteStep> { &route.steps }
    public fun multi_hop_min_out(route: &MultiHopRoute): u64              { route.total_min_amount_out }
    public fun multi_hop_deadline(route: &MultiHopRoute): u64             { route.deadline }

    public fun split_route_dex_id(sr: &SplitRoute): u8              { sr.dex_id }
    public fun split_route_portion_bps(sr: &SplitRoute): u64        { sr.portion_bps }
    public fun split_route_data(sr: &SplitRoute): &vector<u8>       { &sr.route_data }

    public fun quote_amount_in(q: &Quote): u64          { q.amount_in }
    public fun quote_amount_out(q: &Quote): u64         { q.amount_out }
    public fun quote_fee_amount(q: &Quote): u64         { q.fee_amount }
    public fun quote_price_impact(q: &Quote): u64       { q.price_impact_bps }
    public fun quote_route(q: &Quote): &MultiHopRoute   { &q.route }

    // ─── DEX constant accessors ───────────────────────────────────────────────

    public fun dex_cetus(): u8     { DEX_CETUS }
    public fun dex_turbos(): u8    { DEX_TURBOS }
    public fun dex_deepbook(): u8  { DEX_DEEPBOOK }
    public fun dex_aftermath(): u8 { DEX_AFTERMATH }
}
