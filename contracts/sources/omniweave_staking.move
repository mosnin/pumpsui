/// OmniWeave Staking — Lock OMNI to earn protocol fees, fee discounts, and voting power.
///
/// Design overview
/// ───────────────
/// • A single shared `StakingPool` object holds the aggregate OMNI balance.
/// • Each user receives an owned `StakePosition` object returned by `stake`.
/// • Lock periods boost voting power via `lock_multiplier_bps` (10 000 = 1×).
/// • Fee discount tiers mirror the points-tier system (Silver/Gold/Diamond).
/// • Reward accounting is simplified: the pool tracks `accumulated_rewards_per_token`
///   (scaled ×1e12) so future reward-distribution calls can be added without
///   changing the position struct.
module omniweave::omniweave_staking {
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::event;
    use sui::clock::{Self, Clock};
    use omniweave::omniweave_token::OMNI_TOKEN;

    // ─── Errors ───────────────────────────────────────────────────────────────

    const EInsufficientStake: u64 = 0;
    const EStillLocked: u64       = 1;
    const EZeroAmount: u64        = 2;

    // ─── Lock-period constants (milliseconds) ─────────────────────────────────

    /// No lock — 1× voting power multiplier (10 000 bps).
    const LOCK_NONE_MS: u64        = 0;
    /// 3-month lock — 1.5× multiplier (15 000 bps).
    const LOCK_3_MONTHS_MS: u64   = 7_776_000_000;
    /// 6-month lock — 2× multiplier (20 000 bps).
    const LOCK_6_MONTHS_MS: u64   = 15_552_000_000;
    /// 12-month lock — 3× multiplier (30 000 bps).
    const LOCK_12_MONTHS_MS: u64  = 31_104_000_000;

    // ─── Tier thresholds (OMNI base-units, 9 decimals) ───────────────────────

    /// Silver: 1 000 OMNI
    const TIER_SILVER_THRESHOLD: u64  = 1_000_000_000_000;
    /// Gold: 10 000 OMNI
    const TIER_GOLD_THRESHOLD: u64    = 10_000_000_000_000;
    /// Diamond: 100 000 OMNI
    const TIER_DIAMOND_THRESHOLD: u64 = 100_000_000_000_000;

    // ─── Shared pool ─────────────────────────────────────────────────────────

    /// Global staking pool — shared so any transaction can read/mutate it.
    public struct StakingPool has key {
        id: UID,
        /// Aggregate OMNI currently locked across all positions.
        total_staked: Balance<OMNI_TOKEN>,
        /// Head-count of open positions.
        total_stakers: u64,
        /// Monotonically increasing counter incremented on each reward distribution.
        reward_epoch: u64,
        /// Cumulative reward units per staked token, scaled by 1e12.
        /// Used to compute each position's pending reward without iteration.
        accumulated_rewards_per_token: u64,
    }

    // ─── Per-user position (owned object) ────────────────────────────────────

    /// Represents a single user's staking position.
    /// Owned by the staker; passed into `unstake` to redeem.
    public struct StakePosition has key {
        id: UID,
        /// The address that staked — receives the coin on unstake.
        owner: address,
        /// Raw OMNI base-units locked in this position.
        staked_amount: u64,
        /// Unix timestamp (ms) after which the position can be unstaked.
        locked_until_ms: u64,
        /// Voting-power multiplier in basis points (10 000 = 1×).
        lock_multiplier_bps: u64,
        /// Snapshot of `accumulated_rewards_per_token` at last claim.
        reward_debt: u64,
        /// Pending rewards not yet claimed.
        accumulated_rewards: u64,
        /// Timestamp when the position was opened (ms).
        staked_at_ms: u64,
    }

    // ─── Events ───────────────────────────────────────────────────────────────

    public struct Staked has copy, drop {
        position_id: ID,
        owner: address,
        amount: u64,
        locked_until_ms: u64,
    }

    public struct Unstaked has copy, drop {
        position_id: ID,
        owner: address,
        amount: u64,
    }

    // ─── Initialization ───────────────────────────────────────────────────────

    /// Creates the shared `StakingPool`.  Called automatically at publish time.
    fun init(ctx: &mut TxContext) {
        let pool = StakingPool {
            id: object::new(ctx),
            total_staked: balance::zero(),
            total_stakers: 0,
            reward_epoch: 0,
            accumulated_rewards_per_token: 0,
        };
        transfer::share_object(pool);
    }

    // ─── Core operations ──────────────────────────────────────────────────────

    /// Stake `coin_in` OMNI with an optional lock period.
    ///
    /// `lock_period_ms` should be one of the `LOCK_*_MS` constants above.
    /// Any value in (LOCK_3_MONTHS_MS, LOCK_6_MONTHS_MS] gets the 2× multiplier;
    /// anything above gets the 3× multiplier.  Zero = no lock.
    public fun stake(
        pool: &mut StakingPool,
        coin_in: Coin<OMNI_TOKEN>,
        lock_period_ms: u64,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let amount = coin::value(&coin_in);
        assert!(amount > 0, EZeroAmount);

        let now_ms = clock::timestamp_ms(clock);
        let locked_until_ms = now_ms + lock_period_ms;

        // Determine multiplier based on requested lock duration.
        let multiplier = if (lock_period_ms == LOCK_NONE_MS) { 10_000 }
            else if (lock_period_ms <= LOCK_3_MONTHS_MS)  { 15_000 }
            else if (lock_period_ms <= LOCK_6_MONTHS_MS)  { 20_000 }
            else                                           { 30_000 };

        balance::join(&mut pool.total_staked, coin::into_balance(coin_in));
        pool.total_stakers = pool.total_stakers + 1;

        let position = StakePosition {
            id: object::new(ctx),
            owner: tx_context::sender(ctx),
            staked_amount: amount,
            locked_until_ms,
            lock_multiplier_bps: multiplier,
            reward_debt: pool.accumulated_rewards_per_token,
            accumulated_rewards: 0,
            staked_at_ms: now_ms,
        };

        event::emit(Staked {
            position_id: object::id(&position),
            owner: tx_context::sender(ctx),
            amount,
            locked_until_ms,
        });

        transfer::transfer(position, tx_context::sender(ctx));
    }

    /// Unstake and return the original OMNI after the lock has expired.
    ///
    /// The `StakePosition` object is consumed (deleted) here.
    public fun unstake(
        pool: &mut StakingPool,
        position: StakePosition,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let now_ms = clock::timestamp_ms(clock);
        assert!(now_ms >= position.locked_until_ms, EStillLocked);

        let amount = position.staked_amount;
        let owner  = position.owner;

        // Capture the position ID before destructuring.
        let pos_id = object::id(&position);

        let StakePosition {
            id,
            owner: _,
            staked_amount: _,
            locked_until_ms: _,
            lock_multiplier_bps: _,
            reward_debt: _,
            accumulated_rewards: _,
            staked_at_ms: _,
        } = position;
        object::delete(id);

        pool.total_stakers = pool.total_stakers - 1;
        let coin_out = coin::from_balance(balance::split(&mut pool.total_staked, amount), ctx);

        event::emit(Unstaked { position_id: pos_id, owner, amount });

        transfer::public_transfer(coin_out, owner);
    }

    // ─── View helpers ─────────────────────────────────────────────────────────

    /// Returns the fee discount in basis points that this staker earns on swaps.
    /// Mirrors the tier thresholds from the points system:
    ///   Diamond ≥ 100 000 OMNI → 25 bps discount
    ///   Gold    ≥  10 000 OMNI → 20 bps discount
    ///   Silver  ≥   1 000 OMNI → 10 bps discount
    ///   Bronze  (any)          →  0 bps discount
    public fun get_fee_discount_bps(position: &StakePosition): u64 {
        if (position.staked_amount >= TIER_DIAMOND_THRESHOLD)     { 25 }
        else if (position.staked_amount >= TIER_GOLD_THRESHOLD)   { 20 }
        else if (position.staked_amount >= TIER_SILVER_THRESHOLD) { 10 }
        else                                                       { 0  }
    }

    /// Voting power = staked_amount × lock_multiplier, normalised to 1× = 1 OMNI unit.
    public fun voting_power(position: &StakePosition): u64 {
        (position.staked_amount * position.lock_multiplier_bps) / 10_000
    }

    /// Total OMNI currently held in the pool.
    public fun total_staked(pool: &StakingPool): u64 {
        balance::value(&pool.total_staked)
    }

    /// Number of open staking positions.
    public fun total_stakers(pool: &StakingPool): u64 {
        pool.total_stakers
    }

    /// How much OMNI is locked in a specific position.
    public fun staked_amount(position: &StakePosition): u64 {
        position.staked_amount
    }

    /// Unlock timestamp for a position (ms).
    public fun locked_until_ms(position: &StakePosition): u64 {
        position.locked_until_ms
    }

    /// Lock multiplier for a position (in bps, 10 000 = 1×).
    public fun lock_multiplier_bps(position: &StakePosition): u64 {
        position.lock_multiplier_bps
    }

    /// Owner address of a position.
    public fun position_owner(position: &StakePosition): address {
        position.owner
    }

    // ─── Test helpers ─────────────────────────────────────────────────────────

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        let pool = StakingPool {
            id: object::new(ctx),
            total_staked: balance::zero(),
            total_stakers: 0,
            reward_epoch: 0,
            accumulated_rewards_per_token: 0,
        };
        transfer::share_object(pool);
    }
}
