module fundsui::podcast;

use fundsui::channel::{
    Channel,
    authorize_address_for_channel,
    ChannelRegistry,
    upload_podcast_to_channel,
    remove_podcast_from_channel
};
use std::string::String;
use sui::clock::Clock;

#[error]
const EUnauthorizedAccess: vector<u8> = b"Unauthorized Access";

public struct Podcast has key {
    id: UID,
    source_file_uri: String,
    title: String,
    nonce: vector<u8>,
    channel_id: ID,
    description: String,
    created_at: u64,
}

public fun new(
    channel: &mut Channel,
    registry: &ChannelRegistry,
    title: String,
    nonce: vector<u8>,
    description: String,
    source_file_uri: String,
    clock: &Clock,
    ctx: &mut TxContext,
): ID {
    let sender = ctx.sender();
    assert!(authorize_address_for_channel(sender, registry, channel), EUnauthorizedAccess);

    let podcast = Podcast {
        id: object::new(ctx),
        source_file_uri,
        nonce,
        title,
        channel_id: object::id(channel),
        description,
        created_at: clock.timestamp_ms(),
    };

    let podcast_id = object::id(&podcast);

    upload_podcast_to_channel(channel, podcast_id);
    transfer::share_object(podcast);
    podcast_id
}

public fun delete_podcast(
    channel: &mut Channel,
    registry: &ChannelRegistry,
    podcast_id: ID,
    ctx: &mut TxContext,
) {
    let sender = ctx.sender();
    assert!(authorize_address_for_channel(sender, registry, channel), EUnauthorizedAccess);
    remove_podcast_from_channel(channel, podcast_id)
}

public fun get_nonce(podcast: &Podcast): vector<u8> {
    return podcast.nonce
}

public fun get_channel_id(podcast: &Podcast): ID {
    return podcast.channel_id
}
