/// OmniWeave fee treasury.
/// Accumulates protocol fees from every swap and lets the admin withdraw them.
///
/// Fees from different coin types are stored independently using a `Bag` so
/// the treasury is generic without requiring type parameters on the object
/// itself.  Each bag entry is keyed by the coin-type name string.
module omniweave::omniweave_fees {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::bag::{Self, Bag};
    use sui::event;
    use std::type_name;
    use omniweave::omniweave_config::AdminCap;

    // ─── Errors ───────────────────────────────────────────────────────────────

    /// Requested withdrawal amount exceeds available balance.
    const EInsufficientBalance: u64 = 0;

    // ─── Shared state ─────────────────────────────────────────────────────────

    /// Shared treasury that accumulates fees for every coin type.
    /// `balances` maps `std::ascii::String` (type name) → `Balance<T>`.
    public struct Treasury has key {
        id: UID,
        /// A heterogeneous bag holding one `Balance<T>` per coin type.
        balances: Bag,
    }

    // ─── Events ───────────────────────────────────────────────────────────────

    public struct FeeCollected has copy, drop {
        coin_type: std::ascii::String,
        amount: u64,
    }

    public struct FeeWithdrawn has copy, drop {
        coin_type: std::ascii::String,
        amount: u64,
        recipient: address,
    }

    // ─── Internal bag key ─────────────────────────────────────────────────────

    /// Phantom-typed key used to namespace balances inside the bag.
    /// Using a struct key prevents collision with any other bag usage.
    public struct BalanceKey<phantom T> has copy, drop, store {}

    // ─── Initialization ───────────────────────────────────────────────────────

    /// Creates the shared `Treasury`.  Called once from `omniweave_router`'s
    /// `init`, or can be published independently.
    public fun create_treasury(ctx: &mut TxContext) {
        let treasury = Treasury {
            id: object::new(ctx),
            balances: bag::new(ctx),
        };
        transfer::share_object(treasury);
    }

    // ─── Fee deposit (called by the router) ───────────────────────────────────

    /// Deposit a fee coin into the treasury.
    /// If no balance for `T` exists yet, a new entry is created automatically.
    public fun deposit_fee<T>(treasury: &mut Treasury, coin: Coin<T>) {
        let amount = coin::value(&coin);
        let coin_type = type_name::into_string(type_name::get<T>());

        let key = BalanceKey<T> {};
        if (bag::contains(&treasury.balances, key)) {
            let bal: &mut Balance<T> = bag::borrow_mut(&mut treasury.balances, key);
            balance::join(bal, coin::into_balance(coin));
        } else {
            bag::add(&mut treasury.balances, key, coin::into_balance(coin));
        };

        event::emit(FeeCollected { coin_type, amount });
    }

    // ─── Fee withdrawal (admin only) ──────────────────────────────────────────

    /// Withdraw `amount` units of coin `T` from the treasury.
    /// Requires the caller to present their `AdminCap`.
    /// The withdrawn coin is transferred to the configured `recipient`.
    public fun withdraw_fees<T>(
        treasury: &mut Treasury,
        _admin_cap: &AdminCap,
        amount: u64,
        recipient: address,
        ctx: &mut TxContext,
    ) {
        let key = BalanceKey<T> {};
        assert!(bag::contains(&treasury.balances, key), EInsufficientBalance);

        let bal: &mut Balance<T> = bag::borrow_mut(&mut treasury.balances, key);
        assert!(balance::value(bal) >= amount, EInsufficientBalance);

        let withdrawn = balance::split(bal, amount);
        let coin = coin::from_balance(withdrawn, ctx);
        transfer::public_transfer(coin, recipient);

        let coin_type = type_name::into_string(type_name::get<T>());
        event::emit(FeeWithdrawn { coin_type, amount, recipient });
    }

    // ─── View helpers ─────────────────────────────────────────────────────────

    /// Returns the accumulated balance for coin type `T`, or 0 if none.
    public fun balance_of<T>(treasury: &Treasury): u64 {
        let key = BalanceKey<T> {};
        if (bag::contains(&treasury.balances, key)) {
            let bal: &Balance<T> = bag::borrow(&treasury.balances, key);
            balance::value(bal)
        } else {
            0
        }
    }
}
