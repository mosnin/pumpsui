module omniweave::omniweave_twap {
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::event;
    use sui::clock::{Self, Clock};
    use sui::sui::SUI;

    const ENotOwner: u64 = 0;
    const EOrderComplete: u64 = 1;
    const EIntervalNotReached: u64 = 2;
    const EZeroAmount: u64 = 3;

    const STATUS_ACTIVE: u8 = 0;
    const STATUS_COMPLETED: u8 = 1;
    const STATUS_CANCELLED: u8 = 2;

    // TWAP order: swap totalAmount of CoinIn to CoinOut over numChunks intervals
    public struct TWAPOrder<phantom CoinIn> has key {
        id: UID,
        owner: address,
        total_amount: u64,
        chunk_amount: u64,      // total_amount / num_chunks
        num_chunks: u64,
        chunks_executed: u64,
        interval_ms: u64,
        last_execution_ms: u64,
        min_price: u64,         // minimum acceptable price (0 = no limit)
        status: u8,
        balance: Balance<CoinIn>,
    }

    public struct TWAPExecuted has copy, drop {
        order_id: ID,
        chunk_index: u64,
        amount_in: u64,
    }

    public fun create_order<CoinIn>(
        coin_in: Coin<CoinIn>,
        num_chunks: u64,
        interval_ms: u64,
        min_price: u64,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let total = coin::value(&coin_in);
        assert!(total > 0, EZeroAmount);
        assert!(num_chunks > 0, EZeroAmount);

        let order = TWAPOrder<CoinIn> {
            id: object::new(ctx),
            owner: tx_context::sender(ctx),
            total_amount: total,
            chunk_amount: total / num_chunks,
            num_chunks,
            chunks_executed: 0,
            interval_ms,
            last_execution_ms: clock::timestamp_ms(clock),
            min_price,
            status: STATUS_ACTIVE,
            balance: coin::into_balance(coin_in),
        };

        transfer::share_object(order);
    }

    // Keeper calls this to execute the next chunk
    public fun execute_chunk<CoinIn>(
        order: &mut TWAPOrder<CoinIn>,
        clock: &Clock,
        ctx: &mut TxContext,
    ): Coin<CoinIn> {
        assert!(order.status == STATUS_ACTIVE, EOrderComplete);
        let now_ms = clock::timestamp_ms(clock);
        assert!(now_ms >= order.last_execution_ms + order.interval_ms, EIntervalNotReached);

        let chunk = if (order.chunks_executed == order.num_chunks - 1) {
            // Last chunk: take remaining balance
            balance::value(&order.balance)
        } else {
            order.chunk_amount
        };

        order.chunks_executed = order.chunks_executed + 1;
        order.last_execution_ms = now_ms;

        if (order.chunks_executed == order.num_chunks) {
            order.status = STATUS_COMPLETED;
        };

        event::emit(TWAPExecuted {
            order_id: object::id(order),
            chunk_index: order.chunks_executed,
            amount_in: chunk,
        });

        coin::from_balance(balance::split(&mut order.balance, chunk), ctx)
    }

    public fun cancel_order<CoinIn>(
        order: &mut TWAPOrder<CoinIn>,
        ctx: &mut TxContext,
    ): Coin<CoinIn> {
        assert!(tx_context::sender(ctx) == order.owner, ENotOwner);
        order.status = STATUS_CANCELLED;
        let remaining = balance::value(&order.balance);
        coin::from_balance(balance::split(&mut order.balance, remaining), ctx)
    }

    public fun is_ready(order: &TWAPOrder<SUI>, clock: &Clock): bool {
        order.status == STATUS_ACTIVE &&
        clock::timestamp_ms(clock) >= order.last_execution_ms + order.interval_ms
    }

    public fun chunks_remaining<CoinIn>(order: &TWAPOrder<CoinIn>): u64 {
        order.num_chunks - order.chunks_executed
    }
}
