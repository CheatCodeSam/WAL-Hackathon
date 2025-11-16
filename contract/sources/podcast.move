module fundsui::podcast;

use fundsui::channel::{
    Channel,
    authorize_address_for_channel,
    ChannelRegistry,
    upload_podcast_to_channel,
    remove_podcast_from_channel
};
use std::string::String;

#[error]
const EUnauthorizedAccess: vector<u8> = b"Unauthorized Access";

public struct Podcast has key {
    id: UID,
    source_file_uri: String,
    title: String,
    nonce: String,
    channel_id: ID,
    description: String,
    created_at: u64,
}

public fun new(
    channel: &mut Channel,
    registry: &ChannelRegistry,
    title: String,
    nonce: String,
    description: String,
    source_file_uri: String,
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
        created_at: ctx.epoch_timestamp_ms(),
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
