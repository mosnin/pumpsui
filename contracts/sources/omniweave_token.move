/// OMNI — OmniWeave Governance & Fee-Sharing Token
///
/// Uses the Sui one-time-witness (OTW) pattern to create a fixed-supply coin.
/// The `TreasuryCap` is forwarded to the deployer so that distribution modules
/// (team vesting, ecosystem fund, rewards) can call `mint` under admin control.
///
/// Distribution plan (1 000 000 000 OMNI total):
///   40% — Community / staking rewards  (minted over time by rewards contract)
///   20% — Team                         (12-month cliff, 24-month linear vest)
///   20% — Ecosystem fund               (multisig-controlled)
///   15% — Initial liquidity            (direct mint on launch)
///    5% — Protocol treasury            (multisig-controlled)
module omniweave::omniweave_token {
    use sui::coin::{Self, Coin, TreasuryCap};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;

    // ─── One-time witness ─────────────────────────────────────────────────────

    /// The OTW struct — must have the same name as the module (all-caps), carry
    /// `drop`, and be used exactly once in `init`.
    public struct OMNI_TOKEN has drop {}

    // ─── Constants ────────────────────────────────────────────────────────────

    /// 1 000 000 000 OMNI with 9 decimal places (same precision as SUI).
    public const TOTAL_SUPPLY: u64 = 1_000_000_000_000_000_000;

    // ─── Initialization ───────────────────────────────────────────────────────

    /// Called automatically at publish time.
    /// Creates the `CoinMetadata` (frozen immediately, so it is immutable) and
    /// transfers the `TreasuryCap` to the deployer.
    fun init(witness: OMNI_TOKEN, ctx: &mut TxContext) {
        let (treasury_cap, metadata) = coin::create_currency(
            witness,
            9,                // decimals
            b"OMNI",          // symbol
            b"OmniWeave",     // name
            b"The governance and fee-sharing token of OmniWeave DEX aggregator",
            option::none(),   // icon URL — set later via governance
            ctx,
        );

        // Freeze metadata so symbol / name / decimals can never be changed.
        transfer::public_freeze_object(metadata);

        // Give the TreasuryCap to the deployer (AdminCap holder).
        // From here it is used by the team-vesting and rewards contracts to mint.
        transfer::public_transfer(treasury_cap, tx_context::sender(ctx));
    }

    // ─── Mint / Burn ──────────────────────────────────────────────────────────

    /// Mint `amount` base-units of OMNI and send them to `recipient`.
    /// Only callable by whoever holds the `TreasuryCap`.
    public fun mint(
        cap: &mut TreasuryCap<OMNI_TOKEN>,
        amount: u64,
        recipient: address,
        ctx: &mut TxContext,
    ) {
        let coin = coin::mint(cap, amount, ctx);
        transfer::public_transfer(coin, recipient);
    }

    /// Permanently destroy a `Coin<OMNI_TOKEN>`.
    /// Useful for buy-back-and-burn mechanics.
    public fun burn(cap: &mut TreasuryCap<OMNI_TOKEN>, coin: Coin<OMNI_TOKEN>) {
        coin::burn(cap, coin);
    }

    // ─── View helpers ─────────────────────────────────────────────────────────

    /// Current circulating supply.
    public fun total_supply(cap: &TreasuryCap<OMNI_TOKEN>): u64 {
        coin::total_supply(cap)
    }
}
