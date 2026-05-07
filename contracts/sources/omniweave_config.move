/// OmniWeave protocol configuration and admin controls.
/// Manages global settings: fee rate, fee recipient, and pause state.
/// AdminCap is a capability object — whoever holds it can mutate Config.
module omniweave::omniweave_config {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::event;

    // ─── Errors ───────────────────────────────────────────────────────────────

    /// Fee basis points exceed the allowed maximum (100 % = 10 000 bps).
    public const EFeeTooHigh: u64 = 0;
    /// The protocol is currently paused; no swaps are allowed.
    public const EProtocolPaused: u64 = 1;

    // ─── Constants ────────────────────────────────────────────────────────────

    /// Maximum fee: 1 % expressed in basis points.
    const MAX_FEE_BPS: u64 = 100;
    /// Default fee: 0.05 % = 5 bps.
    const DEFAULT_FEE_BPS: u64 = 5;

    // ─── One-time witness ─────────────────────────────────────────────────────

    /// OTW used only in `init` to bootstrap the package.
    public struct OMNIWEAVE_CONFIG has drop {}

    // ─── Capability ───────────────────────────────────────────────────────────

    /// Unforgeable token granting protocol-admin rights.
    /// Transferred to the deployer in `init`; can be transferred further.
    public struct AdminCap has key, store {
        id: UID,
    }

    // ─── Shared state ─────────────────────────────────────────────────────────

    /// Global protocol configuration.  Shared so any transaction can read it
    /// without owning it; only the holder of `AdminCap` may mutate it.
    public struct Config has key {
        id: UID,
        /// Fee charged per swap, in basis points (1 bps = 0.01 %).
        fee_bps: u64,
        /// Address that accumulated fees are sent to on withdrawal.
        fee_recipient: address,
        /// When `true`, all swap entry-points abort early.
        paused: bool,
    }

    // ─── Events ───────────────────────────────────────────────────────────────

    public struct FeeUpdated has copy, drop {
        old_fee_bps: u64,
        new_fee_bps: u64,
    }

    public struct FeeRecipientUpdated has copy, drop {
        old_recipient: address,
        new_recipient: address,
    }

    public struct ProtocolPaused has copy, drop {}
    public struct ProtocolUnpaused has copy, drop {}

    // ─── Initialization ───────────────────────────────────────────────────────

    /// Called once at publish time.
    /// Creates the `AdminCap` and the shared `Config`.
    fun init(_otw: OMNIWEAVE_CONFIG, ctx: &mut TxContext) {
        // Mint admin capability and give it to the deployer.
        let admin_cap = AdminCap { id: object::new(ctx) };
        transfer::transfer(admin_cap, tx_context::sender(ctx));

        // Publish the shared config with sensible defaults.
        let config = Config {
            id: object::new(ctx),
            fee_bps: DEFAULT_FEE_BPS,
            fee_recipient: tx_context::sender(ctx),
            paused: false,
        };
        transfer::share_object(config);
    }

    // ─── Admin mutators ───────────────────────────────────────────────────────

    /// Update the swap fee.  Maximum 1 % (100 bps).
    public fun set_fee_bps(
        _admin_cap: &AdminCap,
        config: &mut Config,
        new_fee_bps: u64,
    ) {
        assert!(new_fee_bps <= MAX_FEE_BPS, EFeeTooHigh);
        let old = config.fee_bps;
        config.fee_bps = new_fee_bps;
        event::emit(FeeUpdated { old_fee_bps: old, new_fee_bps });
    }

    /// Change the address that receives withdrawn fees.
    public fun set_fee_recipient(
        _admin_cap: &AdminCap,
        config: &mut Config,
        new_recipient: address,
    ) {
        let old = config.fee_recipient;
        config.fee_recipient = new_recipient;
        event::emit(FeeRecipientUpdated { old_recipient: old, new_recipient });
    }

    /// Pause the protocol.  All swap entry-points will abort until unpaused.
    public fun pause(_admin_cap: &AdminCap, config: &mut Config) {
        config.paused = true;
        event::emit(ProtocolPaused {});
    }

    /// Resume normal operation.
    public fun unpause(_admin_cap: &AdminCap, config: &mut Config) {
        config.paused = false;
        event::emit(ProtocolUnpaused {});
    }

    // ─── Public read accessors ────────────────────────────────────────────────

    public fun fee_bps(config: &Config): u64 { config.fee_bps }
    public fun fee_recipient(config: &Config): address { config.fee_recipient }
    public fun is_paused(config: &Config): bool { config.paused }

    /// Aborts with `EProtocolPaused` when the protocol is paused.
    /// Called by the router before processing any swap.
    public fun assert_not_paused(config: &Config) {
        assert!(!config.paused, EProtocolPaused);
    }

    // ─── Test helpers ─────────────────────────────────────────────────────────

    #[test_only]
    /// Invoke the module's init logic from test code (bypasses OTW requirement).
    public fun init_for_testing(ctx: &mut TxContext) {
        let admin_cap = AdminCap { id: object::new(ctx) };
        transfer::transfer(admin_cap, tx_context::sender(ctx));

        let config = Config {
            id: object::new(ctx),
            fee_bps: DEFAULT_FEE_BPS,
            fee_recipient: tx_context::sender(ctx),
            paused: false,
        };
        transfer::share_object(config);
    }
}
