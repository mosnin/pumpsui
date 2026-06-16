/// OmniWeave router unit tests.
///
/// Tests exercise the fee/config/treasury modules using `test_scenario`.
/// Because `dispatch_to_dex` is a stub that returns zero-value output coins,
/// we set `min_amount_out = 0` to avoid triggering the slippage check.
///
/// Test coverage:
///   T1  config_defaults           – AdminCap minted; Config defaults correct.
///   T2  set_fee_bps               – Admin can update fee; clamped at MAX.
///   T3  set_fee_recipient         – Admin can update recipient.
///   T4  pause_unpause             – Pause/unpause toggling works.
///   T5  swap_exact_in_fee         – Fee deducted correctly; Treasury updated.
///   T6  swap_exact_in_paused      – Swap aborts when paused.
///   T7  swap_exact_in_zero_input  – Swap aborts on zero-value coin.
///   T8  split_route_portions_sum  – Split-route validates bps sum.
///   T9  treasury_withdraw         – Admin can withdraw accumulated fees.
#[test_only]
module omniweave::router_tests {
    use sui::test_scenario::{Self as ts, Scenario};
    use sui::coin::{Self, Coin};
    use sui::clock;
    use omniweave::omniweave_config::{Self, AdminCap, Config};
    use omniweave::omniweave_fees::{Self, Treasury};
    use omniweave::omniweave_router;
    use omniweave::omniweave_quoter;

    // ─── Fake coin types for testing ──────────────────────────────────────────

    public struct FAKE_USDC has drop {}
    public struct FAKE_SUI  has drop {}

    // ─── Addresses ────────────────────────────────────────────────────────────

    const ADMIN: address   = @0xAD;
    const USER: address    = @0x42;
    const RECIPIENT: address = @0x99;

    // ─── Helpers ──────────────────────────────────────────────────────────────

    /// Initialise a fresh scenario: publish the config and router modules.
    fun setup(): Scenario {
        let mut scenario = ts::begin(ADMIN);
        // The real `init` functions are called automatically via test_scenario
        // when we call `ts::next_tx`.  We must trigger them by simulating the
        // publish transaction.
        {
            let ctx = ts::ctx(&mut scenario);
            // Manually invoke init logic (test_only allowed).
            omniweave_config::init_for_testing(ctx);
            omniweave_fees::create_treasury(ctx);
        };
        scenario
    }

    // ─── T1: Config defaults ──────────────────────────────────────────────────

    #[test]
    fun test_config_defaults() {
        let mut s = setup();
        ts::next_tx(&mut s, ADMIN);
        {
            let config = ts::take_shared<Config>(&s);
            assert!(omniweave_config::fee_bps(&config) == 5, 0);
            assert!(omniweave_config::fee_recipient(&config) == ADMIN, 1);
            assert!(!omniweave_config::is_paused(&config), 2);
            ts::return_shared(config);
        };
        ts::end(s);
    }

    // ─── T2: set_fee_bps ──────────────────────────────────────────────────────

    #[test]
    fun test_set_fee_bps() {
        let mut s = setup();
        ts::next_tx(&mut s, ADMIN);
        {
            let cap = ts::take_from_sender<AdminCap>(&s);
            let mut config = ts::take_shared<Config>(&s);

            omniweave_config::set_fee_bps(&cap, &mut config, 20);
            assert!(omniweave_config::fee_bps(&config) == 20, 0);

            ts::return_to_sender(&s, cap);
            ts::return_shared(config);
        };
        ts::end(s);
    }

    #[test]
    #[expected_failure(abort_code = omniweave_config::EFeeTooHigh)]
    fun test_set_fee_bps_too_high() {
        let mut s = setup();
        ts::next_tx(&mut s, ADMIN);
        {
            let cap = ts::take_from_sender<AdminCap>(&s);
            let mut config = ts::take_shared<Config>(&s);
            // 101 bps > MAX_FEE_BPS (100) — should abort.
            omniweave_config::set_fee_bps(&cap, &mut config, 101);
            ts::return_to_sender(&s, cap);
            ts::return_shared(config);
        };
        ts::end(s);
    }

    // ─── T3: set_fee_recipient ────────────────────────────────────────────────

    #[test]
    fun test_set_fee_recipient() {
        let mut s = setup();
        ts::next_tx(&mut s, ADMIN);
        {
            let cap = ts::take_from_sender<AdminCap>(&s);
            let mut config = ts::take_shared<Config>(&s);

            omniweave_config::set_fee_recipient(&cap, &mut config, RECIPIENT);
            assert!(omniweave_config::fee_recipient(&config) == RECIPIENT, 0);

            ts::return_to_sender(&s, cap);
            ts::return_shared(config);
        };
        ts::end(s);
    }

    // ─── T4: pause / unpause ──────────────────────────────────────────────────

    #[test]
    fun test_pause_unpause() {
        let mut s = setup();
        ts::next_tx(&mut s, ADMIN);
        {
            let cap = ts::take_from_sender<AdminCap>(&s);
            let mut config = ts::take_shared<Config>(&s);

            assert!(!omniweave_config::is_paused(&config), 0);
            omniweave_config::pause(&cap, &mut config);
            assert!(omniweave_config::is_paused(&config), 1);
            omniweave_config::unpause(&cap, &mut config);
            assert!(!omniweave_config::is_paused(&config), 2);

            ts::return_to_sender(&s, cap);
            ts::return_shared(config);
        };
        ts::end(s);
    }

    // ─── T5: swap_exact_in – fee deducted ────────────────────────────────────

    #[test]
    fun test_swap_exact_in_fee() {
        let mut s = setup();
        // Create a clock object for deadline checks.
        ts::next_tx(&mut s, ADMIN);
        let clock = clock::create_for_testing(ts::ctx(&mut s));

        ts::next_tx(&mut s, USER);
        {
            let config   = ts::take_shared<Config>(&s);
            let mut treasury = ts::take_shared<Treasury>(&s);

            // Mint 10 000 units of FAKE_USDC for the user.
            let coin_in = coin::mint_for_testing<FAKE_USDC>(10_000, ts::ctx(&mut s));

            // Expected fee: 10_000 * 5 / 10_000 = 5 units.
            let _coin_out = omniweave_router::swap_exact_in<FAKE_USDC, FAKE_SUI>(
                &config,
                &mut treasury,
                coin_in,
                0,          // min_amount_out = 0 (stub returns zero coin)
                0,          // dex_id = Cetus
                vector[],   // route_data
                0,          // deadline = 0 (no expiry)
                &clock,
                ts::ctx(&mut s),
            );

            // Treasury should have 5 FAKE_USDC.
            assert!(omniweave_fees::balance_of<FAKE_USDC>(&treasury) == 5, 0);

            ts::return_shared(config);
            ts::return_shared(treasury);
        };
        clock::destroy_for_testing(clock);
        ts::end(s);
    }

    // ─── T6: swap aborts when paused ─────────────────────────────────────────

    #[test]
    #[expected_failure(abort_code = omniweave_config::EProtocolPaused)]
    fun test_swap_exact_in_paused() {
        let mut s = setup();
        ts::next_tx(&mut s, ADMIN);
        let clock = clock::create_for_testing(ts::ctx(&mut s));

        // Admin pauses.
        ts::next_tx(&mut s, ADMIN);
        {
            let cap = ts::take_from_sender<AdminCap>(&s);
            let mut config = ts::take_shared<Config>(&s);
            omniweave_config::pause(&cap, &mut config);
            ts::return_to_sender(&s, cap);
            ts::return_shared(config);
        };

        // User tries to swap — should fail.
        ts::next_tx(&mut s, USER);
        {
            let config       = ts::take_shared<Config>(&s);
            let mut treasury = ts::take_shared<Treasury>(&s);

            let coin_in = coin::mint_for_testing<FAKE_USDC>(1_000, ts::ctx(&mut s));
            let _out = omniweave_router::swap_exact_in<FAKE_USDC, FAKE_SUI>(
                &config, &mut treasury, coin_in, 0, 0, vector[], 0, &clock, ts::ctx(&mut s),
            );

            ts::return_shared(config);
            ts::return_shared(treasury);
        };
        clock::destroy_for_testing(clock);
        ts::end(s);
    }

    // ─── T7: swap aborts on zero-value input ──────────────────────────────────

    #[test]
    #[expected_failure(abort_code = omniweave_router::EZeroInput)]
    fun test_swap_exact_in_zero_input() {
        let mut s = setup();
        ts::next_tx(&mut s, ADMIN);
        let clock = clock::create_for_testing(ts::ctx(&mut s));

        ts::next_tx(&mut s, USER);
        {
            let config       = ts::take_shared<Config>(&s);
            let mut treasury = ts::take_shared<Treasury>(&s);

            let coin_in = coin::zero<FAKE_USDC>(ts::ctx(&mut s));
            let _out = omniweave_router::swap_exact_in<FAKE_USDC, FAKE_SUI>(
                &config, &mut treasury, coin_in, 0, 0, vector[], 0, &clock, ts::ctx(&mut s),
            );

            ts::return_shared(config);
            ts::return_shared(treasury);
        };
        clock::destroy_for_testing(clock);
        ts::end(s);
    }

    // ─── T8: split route – invalid bps sum ────────────────────────────────────

    #[test]
    #[expected_failure(abort_code = omniweave_router::EInvalidSplitSum)]
    fun test_split_route_bad_bps_sum() {
        let mut s = setup();
        ts::next_tx(&mut s, ADMIN);
        let clock = clock::create_for_testing(ts::ctx(&mut s));

        ts::next_tx(&mut s, USER);
        {
            let config       = ts::take_shared<Config>(&s);
            let mut treasury = ts::take_shared<Treasury>(&s);

            // Two routes summing to 9 000, not 10 000 — should abort.
            let routes = vector[
                omniweave_quoter::new_split_route(0, 5_000, vector[]),
                omniweave_quoter::new_split_route(1, 4_000, vector[]),
            ];
            let coin_in = coin::mint_for_testing<FAKE_USDC>(10_000, ts::ctx(&mut s));
            let _out = omniweave_router::swap_split_route<FAKE_USDC, FAKE_SUI>(
                &config, &mut treasury, coin_in, 0, routes, 0, &clock, ts::ctx(&mut s),
            );

            ts::return_shared(config);
            ts::return_shared(treasury);
        };
        clock::destroy_for_testing(clock);
        ts::end(s);
    }

    // ─── T9: treasury withdrawal ──────────────────────────────────────────────

    #[test]
    fun test_treasury_withdraw() {
        let mut s = setup();
        ts::next_tx(&mut s, ADMIN);
        let clock = clock::create_for_testing(ts::ctx(&mut s));

        // First generate some fees via a swap.
        ts::next_tx(&mut s, USER);
        {
            let config       = ts::take_shared<Config>(&s);
            let mut treasury = ts::take_shared<Treasury>(&s);
            let coin_in      = coin::mint_for_testing<FAKE_USDC>(10_000, ts::ctx(&mut s));

            let _out = omniweave_router::swap_exact_in<FAKE_USDC, FAKE_SUI>(
                &config, &mut treasury, coin_in, 0, 0, vector[], 0, &clock, ts::ctx(&mut s),
            );

            ts::return_shared(config);
            ts::return_shared(treasury);
        };

        // Admin withdraws the 5-unit fee.
        ts::next_tx(&mut s, ADMIN);
        {
            let cap          = ts::take_from_sender<AdminCap>(&s);
            let mut treasury = ts::take_shared<Treasury>(&s);

            assert!(omniweave_fees::balance_of<FAKE_USDC>(&treasury) == 5, 0);

            omniweave_fees::withdraw_fees<FAKE_USDC>(
                &mut treasury,
                &cap,
                5,
                RECIPIENT,
                ts::ctx(&mut s),
            );

            assert!(omniweave_fees::balance_of<FAKE_USDC>(&treasury) == 0, 1);

            ts::return_to_sender(&s, cap);
            ts::return_shared(treasury);
        };

        // Verify RECIPIENT received the coin.
        ts::next_tx(&mut s, RECIPIENT);
        {
            let received = ts::take_from_sender<Coin<FAKE_USDC>>(&s);
            assert!(coin::value(&received) == 5, 0);
            ts::return_to_sender(&s, received);
        };

        clock::destroy_for_testing(clock);
        ts::end(s);
    }
}
