module fundsui::podcast;

use fundsui::channel::{Channel, ChannelCap, channel_id, borrow_uid_mut, borrow_uid};
use std::string::String;
use sui::dynamic_field as df;

#[error]
const EUnauthorizedAccess: vector<u8> = b"Unauthorized Access";

// #[error]
// const EPodcastNotFound: vector<u8> = b"Podcast not found";

public struct Podcast has key, store {
    id: UID,
    source_file_blob_id: String,
    title: String,
    description: String,
    nouce: String,
    created_at: u64,
}

public fun new(
    cap: &ChannelCap,
    channel: &mut Channel,
    title: String,
    description: String,
    source_file_blob_id: String,
    nouce: String, // for encryption
    ctx: &mut TxContext,
): ID {
    assert!(object::id(channel) == channel_id(cap), EUnauthorizedAccess);

    let podcast = Podcast {
        id: object::new(ctx),
        source_file_blob_id,
        title,
        nouce,
        description,
        created_at: ctx.epoch_timestamp_ms(),
    };

    let podcast_id = object::id(&podcast);

    df::add(borrow_uid_mut(channel), podcast_id, podcast);

    podcast_id
}

public fun get_podcast(channel: &Channel, podcast_id: ID): &Podcast {
    df::borrow(borrow_uid(channel), podcast_id)
}

public fun nouce(podcast: &Podcast): String {
    podcast.nouce
}

public fun delete_podcast(cap: &ChannelCap, channel: &mut Channel, podcast_id: ID) {
    assert!(object::id(channel) == channel_id(cap), EUnauthorizedAccess);
    let podcast = df::remove<_, Podcast>(borrow_uid_mut(channel), podcast_id);

    let Podcast { id, ..} = podcast;

    id.delete();
}
