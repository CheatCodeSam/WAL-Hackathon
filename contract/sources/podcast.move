module fundsui::podcast;

use fundsui::channel::{Channel, ChannelCap, channel_id, borrow_uid_mut, borrow_uid};
use std::string::String;
use sui::dynamic_field as df;

#[error]
const EUnauthorizedAccess: vector<u8> = b"Unauthorized Access";

#[error]
const EPodcastNotFound: vector<u8> = b"Podcast not found";

#[error]
const EPodcastAlreadyDeleted: vector<u8> = b"Podcast already deleted";

public struct Podcast has key {
    id: UID,
    source_file_uri: String,
    title: String,
    description: String,
    created_at: u64,
}

public fun new(
    cap: &ChannelCap,
    channel: &mut Channel,
    title: String,
    description: String,
    source_file_uri: String,
    ctx: &mut TxContext,
): ID {
    assert!(object::id(channel) == channel_id(cap), EUnauthorizedAccess);

    let podcast = Podcast {
        id: object::new(ctx),
        source_file_uri,
        title,
        description,
        created_at: ctx.epoch_timestamp_ms(),
    };

    let podcast_id = object::id(&podcast);
    transfer::share_object(podcast);
    df::add(borrow_uid_mut(channel), podcast_id, podcast_id);

    podcast_id
}

public fun delete_podcast(cap: &ChannelCap, channel: &mut Channel, podcast_id: ID) {
    assert!(object::id(channel) == channel_id(cap), EUnauthorizedAccess);
    df::remove<_, ID>(borrow_uid_mut(channel), podcast_id);
}
