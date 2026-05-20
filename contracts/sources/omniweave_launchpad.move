module omniweave::omniweave_launchpad {
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::event;
    use sui::clock::{Self, Clock};
    use sui::sui::SUI;
    use omniweave::omniweave_config::AdminCap;

    const ENotStarted: u64 = 0;
    const EEnded: u64 = 1;
    const ECapReached: u64 = 2;
    const ENotWhitelisted: u64 = 3;
    const EAlreadyClaimed: u64 = 4;
    const EMinNotReached: u64 = 5;

    // Platform fee: 2% of raise goes to OmniWeave treasury
    const PLATFORM_FEE_BPS: u64 = 200;

    public struct LaunchPool has key {
        id: UID,
        // Token being launched
        token_type_name: std::string::String,
        // Project info
        project_name: std::string::String,
        description: std::string::String,
        website: std::string::String,
        // Sale parameters
        total_tokens_for_sale: u64,
        price_per_token_mist: u64,   // price in SUI MIST
        soft_cap_mist: u64,          // minimum raise to succeed
        hard_cap_mist: u64,          // maximum raise
        min_contribution_mist: u64,
        max_contribution_mist: u64,
        // Timing
        start_ms: u64,
        end_ms: u64,
        // State
        total_raised_mist: u64,
        total_contributors: u64,
        status: u8,                  // 0=pending, 1=active, 2=success, 3=failed
        // Whitelist: addresses of OMNI stakers (set by admin off-chain)
        whitelist_enabled: bool,
        raised_balance: Balance<SUI>,
        // Creator
        creator: address,
    }

    // Per-contributor receipt (owned object)
    public struct Contribution has key {
        id: UID,
        pool_id: ID,
        contributor: address,
        amount_mist: u64,
        claimed: bool,
    }

    public struct ContributionMade has copy, drop {
        pool_id: ID,
        contributor: address,
        amount_mist: u64,
        total_raised: u64,
    }

    // Admin creates a launch pool
    public fun create_pool(
        _cap: &AdminCap,
        project_name: std::string::String,
        description: std::string::String,
        website: std::string::String,
        total_tokens_for_sale: u64,
        price_per_token_mist: u64,
        soft_cap_mist: u64,
        hard_cap_mist: u64,
        min_contribution_mist: u64,
        max_contribution_mist: u64,
        start_ms: u64,
        end_ms: u64,
        creator: address,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let pool = LaunchPool {
            id: object::new(ctx),
            token_type_name: project_name,
            project_name,
            description,
            website,
            total_tokens_for_sale,
            price_per_token_mist,
            soft_cap_mist,
            hard_cap_mist,
            min_contribution_mist,
            max_contribution_mist,
            start_ms,
            end_ms,
            total_raised_mist: 0,
            total_contributors: 0,
            status: 0,
            whitelist_enabled: false,
            raised_balance: balance::zero(),
            creator,
        };
        transfer::share_object(pool);
    }

    // User contributes SUI to a launch
    public fun contribute(
        pool: &mut LaunchPool,
        payment: Coin<SUI>,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let now = clock::timestamp_ms(clock);
        assert!(now >= pool.start_ms, ENotStarted);
        assert!(now <= pool.end_ms, EEnded);

        let amount = coin::value(&payment);
        assert!(pool.total_raised_mist + amount <= pool.hard_cap_mist, ECapReached);
        assert!(amount >= pool.min_contribution_mist, EMinNotReached);

        pool.total_raised_mist = pool.total_raised_mist + amount;
        pool.total_contributors = pool.total_contributors + 1;
        balance::join(&mut pool.raised_balance, coin::into_balance(payment));

        let contribution = Contribution {
            id: object::new(ctx),
            pool_id: object::id(pool),
            contributor: tx_context::sender(ctx),
            amount_mist: amount,
            claimed: false,
        };

        event::emit(ContributionMade {
            pool_id: object::id(pool),
            contributor: tx_context::sender(ctx),
            amount_mist: amount,
            total_raised: pool.total_raised_mist,
        });

        transfer::transfer(contribution, tx_context::sender(ctx));
    }

    // View helpers
    public fun total_raised(pool: &LaunchPool): u64 { pool.total_raised_mist }
    public fun hard_cap(pool: &LaunchPool): u64 { pool.hard_cap_mist }
    public fun fill_percent(pool: &LaunchPool): u64 {
        if (pool.hard_cap_mist == 0) return 0;
        (pool.total_raised_mist * 100) / pool.hard_cap_mist
    }
}
