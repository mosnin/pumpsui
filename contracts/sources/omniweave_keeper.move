module omniweave::omniweave_keeper {
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::event;
    use omniweave::omniweave_config::AdminCap;

    // Keeper tip in basis points (10 bps = 0.1%)
    const KEEPER_TIP_BPS: u64 = 10;

    // Registered keeper profile (owned by keeper operator)
    public struct KeeperProfile has key {
        id: UID,
        owner: address,
        name: std::string::String,
        endpoint: std::string::String,   // keeper bot API endpoint
        total_executions: u64,
        total_earned_mist: u64,
        reputation_score: u64,           // 0-100, based on uptime
        registered_at: u64,
        is_active: bool,
    }

    // Shared registry of all keepers
    public struct KeeperRegistry has key {
        id: UID,
        total_keepers: u64,
        total_executions: u64,
    }

    public struct KeeperRegistered has copy, drop {
        profile_id: ID,
        owner: address,
        name: std::string::String,
    }

    public struct ExecutionRecorded has copy, drop {
        keeper: address,
        order_type: std::string::String,  // "dca" or "twap"
        order_id: ID,
        tip_earned_mist: u64,
    }

    fun init(ctx: &mut TxContext) {
        let registry = KeeperRegistry {
            id: object::new(ctx),
            total_keepers: 0,
            total_executions: 0,
        };
        transfer::share_object(registry);
    }

    public fun register(
        registry: &mut KeeperRegistry,
        name: std::string::String,
        endpoint: std::string::String,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext,
    ) {
        let profile = KeeperProfile {
            id: object::new(ctx),
            owner: tx_context::sender(ctx),
            name,
            endpoint,
            total_executions: 0,
            total_earned_mist: 0,
            reputation_score: 100,
            registered_at: sui::clock::timestamp_ms(clock),
            is_active: true,
        };
        registry.total_keepers = registry.total_keepers + 1;
        event::emit(KeeperRegistered {
            profile_id: object::id(&profile),
            owner: tx_context::sender(ctx),
            name: profile.name,
        });
        transfer::transfer(profile, tx_context::sender(ctx));
    }

    public fun total_keepers(registry: &KeeperRegistry): u64 { registry.total_keepers }
    public fun total_executions(registry: &KeeperRegistry): u64 { registry.total_executions }
    public fun keeper_tip_bps(): u64 { KEEPER_TIP_BPS }

    // Suppress unused import warning for AdminCap
    public fun admin_only(_: &AdminCap) {}
}
