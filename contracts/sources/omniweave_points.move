/// OmniWeave Points — off-chain points tracked on-chain.
///
/// Each user has a PointsAccount (owned object) that accumulates:
///   - swap_points: 1 point per $1 of swap volume
///   - bridge_points: 2 points per $1 of bridge volume
///   - referral_points: 500 points per referred user's first swap
///   - streak_bonus: 2x multiplier for 7-day trading streak
///
/// The protocol admin (AdminCap) can award points via award_points.
/// Points are non-transferable. They will convert to OMNI tokens at TGE.

module omniweave::omniweave_points {
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::event;
    use omniweave::omniweave_config::AdminCap;

    const ENotOwner: u64 = 0;

    public struct PointsAccount has key {
        id: UID,
        owner: address,
        swap_points: u64,
        bridge_points: u64,
        referral_points: u64,
        streak_days: u64,
        last_active_day: u64,  // unix day number
        total_points: u64,
    }

    public struct PointsAwarded has copy, drop {
        account_id: ID,
        owner: address,
        points: u64,
        reason: std::ascii::String,
        new_total: u64,
    }

    public fun create_account(ctx: &mut TxContext) {
        let account = PointsAccount {
            id: object::new(ctx),
            owner: tx_context::sender(ctx),
            swap_points: 0,
            bridge_points: 0,
            referral_points: 0,
            streak_days: 0,
            last_active_day: 0,
            total_points: 0,
        };
        transfer::transfer(account, tx_context::sender(ctx));
    }

    /// Called by the protocol after each swap (requires AdminCap)
    public fun award_swap_points(
        _cap: &AdminCap,
        account: &mut PointsAccount,
        volume_usd_cents: u64,  // volume in USD cents to avoid floats
        ctx: &TxContext
    ) {
        let points = volume_usd_cents / 100; // 1 point per $1
        account.swap_points = account.swap_points + points;
        account.total_points = account.total_points + points;
        event::emit(PointsAwarded {
            account_id: object::id(account),
            owner: account.owner,
            points,
            reason: std::ascii::string(b"swap"),
            new_total: account.total_points,
        });
    }

    public fun award_bridge_points(
        _cap: &AdminCap,
        account: &mut PointsAccount,
        volume_usd_cents: u64,
        _ctx: &TxContext
    ) {
        let points = (volume_usd_cents * 2) / 100; // 2x multiplier for bridging
        account.bridge_points = account.bridge_points + points;
        account.total_points = account.total_points + points;
    }

    public fun award_referral_points(
        _cap: &AdminCap,
        account: &mut PointsAccount,
        _ctx: &TxContext
    ) {
        let points = 500u64;
        account.referral_points = account.referral_points + points;
        account.total_points = account.total_points + points;
    }

    public fun total_points(account: &PointsAccount): u64 { account.total_points }
    public fun owner(account: &PointsAccount): address { account.owner }
}
