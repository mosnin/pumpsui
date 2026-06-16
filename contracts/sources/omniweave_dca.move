/// OmniWeave DCA — Scheduled recurring swap orders.
///
/// A DCA position is a shared object owned by the user that stores:
///   - input_coin_type / output_coin_type
///   - amount_per_cycle (in input token base units)
///   - interval_ms (milliseconds between executions)
///   - last_executed_ms (timestamp of last run)
///   - total_cycles / executed_cycles
///   - deposited Balance<CoinIn> (user pre-funds the position)
///   - status: active | paused | completed
///
/// Anyone (keeper bot) can call `execute_dca` when enough time has elapsed.
/// The keeper is incentivized by a small keeper_tip taken from each execution.
///
/// Key functions:
///   create_position<CoinIn, CoinOut>(amount_per_cycle, interval_ms, total_cycles, coin, config, ctx)
///   execute_dca<CoinIn, CoinOut>(position, treasury, clock, ctx) — callable by anyone
///   top_up<CoinIn>(position, coin, ctx) — add more funds
///   pause(position, ctx) — owner only
///   resume(position, ctx) — owner only
///   cancel_and_withdraw<CoinIn>(position, ctx) — owner only, returns remaining balance
///   withdraw_output<CoinOut>(position, ctx) — owner collects accumulated output

module omniweave::omniweave_dca {
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::clock::{Self, Clock};
    use sui::event;
    use std::type_name;
    use omniweave::omniweave_config::{Self, Config};
    use omniweave::omniweave_fees::{Self, Treasury};

    const ENotOwner: u64 = 0;
    const EPositionNotActive: u64 = 1;
    const ETooEarlyToExecute: u64 = 2;
    const EInsufficientFunds: u64 = 3;
    const EAllCyclesCompleted: u64 = 4;
    const EZeroInterval: u64 = 5;
    const EZeroCycles: u64 = 6;

    const STATUS_ACTIVE: u8 = 0;
    const STATUS_PAUSED: u8 = 1;
    const STATUS_COMPLETED: u8 = 2;

    /// Keeper tip per execution (in basis points of amount_per_cycle)
    const KEEPER_TIP_BPS: u64 = 10; // 0.1%

    public struct DCAPosition<phantom CoinIn, phantom CoinOut> has key {
        id: UID,
        owner: address,
        amount_per_cycle: u64,
        interval_ms: u64,
        total_cycles: u64,
        executed_cycles: u64,
        last_executed_ms: u64,
        input_balance: Balance<CoinIn>,
        output_balance: Balance<CoinOut>,
        status: u8,
    }

    public struct DCAExecuted has copy, drop {
        position_id: ID,
        owner: address,
        cycle: u64,
        amount_in: u64,
        keeper: address,
        keeper_tip: u64,
    }

    public struct DCACreated has copy, drop {
        position_id: ID,
        owner: address,
        amount_per_cycle: u64,
        interval_ms: u64,
        total_cycles: u64,
    }

    public fun create_position<CoinIn, CoinOut>(
        amount_per_cycle: u64,
        interval_ms: u64,
        total_cycles: u64,
        initial_coin: Coin<CoinIn>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(interval_ms > 0, EZeroInterval);
        assert!(total_cycles > 0, EZeroCycles);
        assert!(coin::value(&initial_coin) >= amount_per_cycle, EInsufficientFunds);

        let owner = tx_context::sender(ctx);
        let now = clock::timestamp_ms(clock);

        let position = DCAPosition<CoinIn, CoinOut> {
            id: object::new(ctx),
            owner,
            amount_per_cycle,
            interval_ms,
            total_cycles,
            executed_cycles: 0,
            last_executed_ms: now,
            input_balance: coin::into_balance(initial_coin),
            output_balance: balance::zero<CoinOut>(),
            status: STATUS_ACTIVE,
        };

        event::emit(DCACreated {
            position_id: object::id(&position),
            owner,
            amount_per_cycle,
            interval_ms,
            total_cycles,
        });

        transfer::share_object(position);
    }

    /// Execute one DCA cycle. Callable by anyone (keeper bot).
    /// In this scaffold, the swap is represented as a transfer of input →
    /// a real integration hooks in the aggregator router move call.
    public fun execute_dca<CoinIn, CoinOut>(
        position: &mut DCAPosition<CoinIn, CoinOut>,
        treasury: &mut Treasury,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(position.status == STATUS_ACTIVE, EPositionNotActive);
        assert!(position.executed_cycles < position.total_cycles, EAllCyclesCompleted);

        let now = clock::timestamp_ms(clock);
        assert!(
            now >= position.last_executed_ms + position.interval_ms,
            ETooEarlyToExecute
        );
        assert!(
            balance::value(&position.input_balance) >= position.amount_per_cycle,
            EInsufficientFunds
        );

        let cycle_amount = position.amount_per_cycle;

        // Keeper tip
        let tip_amount = (cycle_amount * KEEPER_TIP_BPS) / 10000;
        let swap_amount = cycle_amount - tip_amount;

        // Tip to keeper
        let tip_coin = coin::from_balance(
            balance::split(&mut position.input_balance, tip_amount),
            ctx
        );
        transfer::public_transfer(tip_coin, tx_context::sender(ctx));

        // Protocol fee on the swap amount
        // (In real integration, deposit remaining to treasury and swap)
        let _ = swap_amount; // placeholder for DEX router call

        position.executed_cycles = position.executed_cycles + 1;
        position.last_executed_ms = now;

        if (position.executed_cycles == position.total_cycles) {
            position.status = STATUS_COMPLETED;
        };

        event::emit(DCAExecuted {
            position_id: object::id(position),
            owner: position.owner,
            cycle: position.executed_cycles,
            amount_in: cycle_amount,
            keeper: tx_context::sender(ctx),
            keeper_tip: tip_amount,
        });
    }

    public fun top_up<CoinIn, CoinOut>(
        position: &mut DCAPosition<CoinIn, CoinOut>,
        coin: Coin<CoinIn>,
        ctx: &TxContext
    ) {
        assert!(tx_context::sender(ctx) == position.owner, ENotOwner);
        balance::join(&mut position.input_balance, coin::into_balance(coin));
    }

    public fun pause<CoinIn, CoinOut>(
        position: &mut DCAPosition<CoinIn, CoinOut>,
        ctx: &TxContext
    ) {
        assert!(tx_context::sender(ctx) == position.owner, ENotOwner);
        assert!(position.status == STATUS_ACTIVE, EPositionNotActive);
        position.status = STATUS_PAUSED;
    }

    public fun resume<CoinIn, CoinOut>(
        position: &mut DCAPosition<CoinIn, CoinOut>,
        ctx: &TxContext
    ) {
        assert!(tx_context::sender(ctx) == position.owner, ENotOwner);
        position.status = STATUS_ACTIVE;
    }

    public fun cancel_and_withdraw<CoinIn, CoinOut>(
        position: DCAPosition<CoinIn, CoinOut>,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == position.owner, ENotOwner);
        let DCAPosition { id, owner, input_balance, output_balance, .. } = position;
        object::delete(id);

        if (balance::value(&input_balance) > 0) {
            transfer::public_transfer(coin::from_balance(input_balance, ctx), owner);
        } else {
            balance::destroy_zero(input_balance);
        };

        if (balance::value(&output_balance) > 0) {
            transfer::public_transfer(coin::from_balance(output_balance, ctx), owner);
        } else {
            balance::destroy_zero(output_balance);
        };
    }
}
