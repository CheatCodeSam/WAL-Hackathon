#[test_only]
module fundsui::channel_tests;

use fundsui::channel::{Self, ChannelRegistry, EChannelAlreadyExists};
use std::string;
use sui::test_scenario;

#[test]
#[expected_failure(abort_code = EChannelAlreadyExists)]
fun test_cannot_create_duplicate_channel() {
    let mut scenario = test_scenario::begin(@0xA);

    {
        channel::init_for_testing(scenario.ctx());
    };

    scenario.next_tx(@0xA);
    {
        let mut registry = scenario.take_shared<ChannelRegistry>();

        channel::new(
            &mut registry,
            string::utf8(b"Test Channel"),
            string::utf8(b"Test Tagline"),
            string::utf8(b"Test Description"),
            string::utf8(b"https://example.com/cover.jpg"),
            string::utf8(b"https://example.com/profile.jpg"),
            1000000,
            8,
            scenario.ctx(),
        );

        test_scenario::return_shared(registry);
    };

    scenario.next_tx(@0xA);
    {
        let mut registry = scenario.take_shared<ChannelRegistry>();

        channel::new(
            &mut registry,
            string::utf8(b"Second Channel"),
            string::utf8(b"Second Tagline"),
            string::utf8(b"Second Description"),
            string::utf8(b"https://example.com/cover2.jpg"),
            string::utf8(b"https://example.com/profile2.jpg"),
            2000000,
            26,
            scenario.ctx(),
        );

        test_scenario::return_shared(registry);
    };

    scenario.end();
}
