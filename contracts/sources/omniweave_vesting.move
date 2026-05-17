module omniweave::omniweave_vesting {
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::event;
    use sui::clock::{Self, Clock};
    use omniweave::omniweave_token::OMNI_TOKEN;
    use omniweave::omniweave_config::AdminCap;

    const ENotBeneficiary: u64 = 0;
    const ENothingToVest: u64 = 1;
    const ECliffNotReached: u64 = 2;

    public struct VestingSchedule has key {
        id: UID,
        beneficiary: address,
        total_amount: u64,
        claimed_amount: u64,
        start_ms: u64,
        cliff_ms: u64,    // Must wait cliff before any tokens vest
        duration_ms: u64, // Total vesting duration after cliff
        balance: Balance<OMNI_TOKEN>,
    }

    public struct TokensClaimed has copy, drop {
        schedule_id: ID,
        beneficiary: address,
        amount: u64,
        remaining: u64,
    }

    // Admin creates a vesting schedule for a beneficiary
    public fun create_schedule(
        _cap: &AdminCap,
        beneficiary: address,
        coin_in: Coin<OMNI_TOKEN>,
        cliff_duration_ms: u64,
        vesting_duration_ms: u64,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let total = coin::value(&coin_in);
        let now_ms = clock::timestamp_ms(clock);

        let schedule = VestingSchedule {
            id: object::new(ctx),
            beneficiary,
            total_amount: total,
            claimed_amount: 0,
            start_ms: now_ms,
            cliff_ms: now_ms + cliff_duration_ms,
            duration_ms: vesting_duration_ms,
            balance: coin::into_balance(coin_in),
        };

        transfer::transfer(schedule, beneficiary);
    }

    // Beneficiary claims vested tokens
    public fun claim(
        schedule: &mut VestingSchedule,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let sender = tx_context::sender(ctx);
        assert!(sender == schedule.beneficiary, ENotBeneficiary);

        let now_ms = clock::timestamp_ms(clock);
        assert!(now_ms >= schedule.cliff_ms, ECliffNotReached);

        let vested = compute_vested(schedule, now_ms);
        let claimable = vested - schedule.claimed_amount;
        assert!(claimable > 0, ENothingToVest);

        schedule.claimed_amount = schedule.claimed_amount + claimable;
        let coin_out = coin::from_balance(balance::split(&mut schedule.balance, claimable), ctx);

        event::emit(TokensClaimed {
            schedule_id: object::id(schedule),
            beneficiary: sender,
            amount: claimable,
            remaining: schedule.total_amount - schedule.claimed_amount,
        });

        transfer::public_transfer(coin_out, sender);
    }

    // Compute how many tokens have vested so far
    fun compute_vested(schedule: &VestingSchedule, now_ms: u64): u64 {
        if (now_ms < schedule.cliff_ms) return 0;
        let elapsed = now_ms - schedule.start_ms;
        if (elapsed >= schedule.duration_ms) return schedule.total_amount;
        (schedule.total_amount * elapsed) / schedule.duration_ms
    }

    public fun vested_amount(schedule: &VestingSchedule, clock: &Clock): u64 {
        compute_vested(schedule, clock::timestamp_ms(clock))
    }

    public fun claimable_amount(schedule: &VestingSchedule, clock: &Clock): u64 {
        let vested = compute_vested(schedule, clock::timestamp_ms(clock));
        if (vested > schedule.claimed_amount) vested - schedule.claimed_amount else 0
    }
}
