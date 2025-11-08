module podcast::subscribtion;

use podcast::channel::Channel;
use podcast::podcast::Podcast;
use sui::clock::Clock;

#[error]
const EInvalidSubscribtion: vector<u8> = b"Invalid Subscribtion";

#[error]
const ESubscribtionExhusted: vector<u8> = b"Subscribtion Exhusted";


public struct ChannelSub {
    channel: ID,
    expiry_date: u64, // in miliseconds
}


public fun free_channel_subscribe(channel: &Channel, clock: &Clock): ChannelSub {
    assert!(channel.is_free(), EInvalidSubscribtion);

    ChannelSub {
        channel: channel.id(),
        expiry_date: clock.timestamp_ms() + channel.subscrption_duration(),
    }
}


public fun channel_subscribe() {
    // Todo
}

// Handles a single podcast 
public fun seal_approve_free_podcast(podcast: &Podcast) {
    assert!(podcast.is_free(), EInvalidSubscribtion);
}

// Handle access to a channel content
public fun seal_approve_channel(channel: &Channel, channel_sub: &ChannelSub, clock: &Clock) {
    assert!(channel.id() == channel_sub.channel, EInvalidSubscribtion);
    assert!(channel_sub.expiry_date <= clock.timestamp_ms(), ESubscribtionExhusted);
}
