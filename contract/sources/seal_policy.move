module fundsui::seal_policy;

use fundsui::channel::Channel;
use fundsui::podcast::Podcast;
use fundsui::subscription::Subscription;
use sui::clock::Clock;

const EAccessDenied: u64 = 1;

entry fun seal_approve_subscription(
    id: vector<u8>,
    subscription: &Subscription,
    podcast: &Podcast,
    clock: &Clock,
) {
    let nonce = podcast.get_nonce();
    assert!(id == nonce, EAccessDenied);

    assert!(subscription.get_channel_id() == podcast.get_channel_id(), EAccessDenied);

    assert!(subscription.is_active(clock));
}

entry fun seal_approve_creator(
    id: vector<u8>,
    channel: &Channel,
    podcast: &Podcast,
    ctx: &TxContext,
) {
    let nonce = podcast.get_nonce();
    assert!(id == nonce, EAccessDenied);

    let channel_id = podcast.get_channel_id();
    assert!(channel_id == object::id(channel), EAccessDenied);

    let sender = ctx.sender();
    assert!(sender == channel.get_channel_owner())
}
