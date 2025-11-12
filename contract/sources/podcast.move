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

public struct Podcast has drop, store {
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

    let podcast_id = object::new(ctx);
    let id_value = object::uid_to_inner(&podcast_id);

    let podcast = Podcast {
        source_file_uri,
        title,
        description,
        created_at: ctx.epoch_timestamp_ms(),
    };

    df::add(borrow_uid_mut(channel), id_value, podcast);

    object::delete(podcast_id);

    id_value
}

public fun get_podcast(channel: &Channel, podcast_id: ID): &Podcast {
    df::borrow(borrow_uid(channel), podcast_id)
}

public fun delete_podcast(cap: &ChannelCap, channel: &mut Channel, podcast_id: ID) {
    assert!(object::id(channel) == channel_id(cap), EUnauthorizedAccess);
    df::remove<_, Podcast>(borrow_uid_mut(channel), podcast_id);
}
