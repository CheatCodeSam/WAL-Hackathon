module podcast::channel;

use podcast::podcast::Podcast;
use std::string::String;
use sui::dynamic_field as df;

// ==== Errors ====
#[error]
const EUnauthorizedAccess: vector<u8> = b"Unauthorized Access";

#[error]
const EPodcastAlreadyPublished: vector<u8> = b"Podcast already published";

#[error]
const EPodcastDoesNotExist: vector<u8> = b"Podcast does not exist";

#[error]
const EPodcastIsNotPublished: vector<u8> = b"podcast is not published";

public struct Channel has key, store {
    id: UID,
    username: String,
    bio: String,
    cover_photo: String, // URL
    profile_photo: String, // URL
    number_of_podcasts: u64,
    number_of_listens: u64,
    subscrption_price: u64, // 0 means free
    subscrption_duration: u64, // in milliseconds
}

// ==== Caps ====
public struct ChannelCap has key, store {
    id: UID,
    channel: ID, // ID of the creator object it controls
}

public fun new(
    username: String,
    bio: String,
    cover_photo: String,
    profile_photo: String,
    ctx: &mut TxContext,
): ChannelCap {
    let channel = Channel {
        id: object::new(ctx),
        username,
        bio,
        cover_photo,
        profile_photo,
        number_of_podcasts: 0,
        number_of_listens: 0,
        subscrption_price: 0,
        subscrption_duration: 1000 * 60 * 60 * 24 * 30, // 30 days
    };

    let channel_cap = ChannelCap {
        id: object::new(ctx),
        channel: object::id(&channel),
    };

    transfer::public_share_object(channel);

    channel_cap
}

// ==== Setter Funtions ====
public fun set_username(channel: &mut Channel, channel_cap: &ChannelCap, new_username: String) {
    assert!(channel.id() == channel_cap.channel, EUnauthorizedAccess);

    channel.username = new_username;
}

public fun set_bio(channel: &mut Channel, channel_cap: &ChannelCap, new_bio: String) {
    assert!(channel.id() == channel_cap.channel, EUnauthorizedAccess);

    channel.bio = new_bio;
}

public fun set_cover_photo(
    channel: &mut Channel,
    channel_cap: &ChannelCap,
    new_cover_photo: String,
) {
    assert!(channel.id() == channel_cap.channel, EUnauthorizedAccess);

    channel.cover_photo = new_cover_photo;
}

public fun set_profile_photo(
    channel: &mut Channel,
    channel_cap: &ChannelCap,
    new_profile_photo: String,
) {
    assert!(channel.id() == channel_cap.channel, EUnauthorizedAccess);

    channel.profile_photo = new_profile_photo;
}

public fun set_subscrption_price(
    channel: &mut Channel,
    channel_cap: &ChannelCap,
    new_subscrption_price: u64,
) {
    assert!(channel.id() == channel_cap.channel, EUnauthorizedAccess);

    channel.subscrption_price = new_subscrption_price;
}

public fun set_subscrption_duration(
    channel: &mut Channel,
    channel_cap: &ChannelCap,
    new_subscrption_duration: u64,
) {
    assert!(channel.id() == channel_cap.channel, EUnauthorizedAccess);

    channel.subscrption_duration = new_subscrption_duration;
}

public(package) fun increment_number_of_podcasts(channel: &mut Channel) {
    let num_of_podcasts = channel.number_of_podcasts;

    channel.number_of_podcasts = num_of_podcasts + 1;
}

public(package) fun decrement_number_of_podcasts(channel: &mut Channel) {
    let num_of_podcasts = channel.number_of_podcasts;

    if (num_of_podcasts > 0) {
        channel.number_of_podcasts = num_of_podcasts - 1;
    };
}

public(package) fun increment_number_of_listens(channel: &mut Channel) {
    let num_of_listens = channel.number_of_listens;

    channel.number_of_listens = num_of_listens + 1;
}

// ==== Getter Functions ====
public fun id(channel: &Channel): ID {
    object::id(channel)
}

public fun channel(channel_cap: &ChannelCap): ID {
    channel_cap.channel
}

public fun subscrption_duration(channel: &Channel): u64 {
    channel.subscrption_duration
}

public fun is_free(channel: &Channel): bool {
    channel.subscrption_price == 0
}

// ===== Podcast Management =====
public fun add_episode(
    channel: &mut Channel,
    podcast_id: ID,
    name: String,
    duration: u64,
    blob_id: String,
    file_type: String,
    channel_cap: &ChannelCap,
) {
    assert!(channel.id() == channel_cap.channel(), EUnauthorizedAccess);
    assert!(df::exists_(&channel.id, podcast_id), EPodcastDoesNotExist);

    let podcast: &mut Podcast = df::borrow_mut(&mut channel.id, podcast_id);

    podcast.add(name, duration, blob_id, file_type);
}

public fun remove_episode(channel: &mut Channel, podcast_id: ID, blob_id: String, channel_cap: &ChannelCap) {
    assert!(channel.id() == channel_cap.channel(), EUnauthorizedAccess);
    assert!(df::exists_(&channel.id, podcast_id), EPodcastDoesNotExist);

    let podcast: &mut Podcast = df::borrow_mut(&mut channel.id, podcast_id);

    podcast.remove(blob_id);
}

public fun destroy(channel: &mut Channel, podcast_id: ID, channel_cap: &ChannelCap) {
    assert!(channel.id() == channel_cap.channel(), EUnauthorizedAccess);
    assert!(df::exists_(&channel.id, podcast_id), EPodcastDoesNotExist);

    let podcast: Podcast = df::remove(&mut channel.id, podcast_id);

    podcast.destroy();
}

// Publish podcast to channel
public fun publish_podcast(podcast: Podcast, channel: &mut Channel, channel_cap: &ChannelCap) {
    assert!(channel.id() == channel_cap.channel, EUnauthorizedAccess);
    assert!(df::exists_(&channel.id, podcast.id()), EPodcastAlreadyPublished);

    df::add(
        &mut channel.id,
        podcast.id(),
        podcast,
    );

    channel.increment_number_of_podcasts();

    // Todo: emit PodcastPublished
}

// Unpublish podcast from channel
public fun unpublish_podcast(
    podcast_id: ID,
    channel: &mut Channel,
    channel_cap: &ChannelCap,
): Podcast {
    assert!(channel.id() == channel_cap.channel, EUnauthorizedAccess);
    assert!(df::exists_(&channel.id, podcast_id), EPodcastIsNotPublished);

    let podcast = df::remove(
        &mut channel.id,
        podcast_id,
    );

    channel.decrement_number_of_podcasts();
    podcast

    // Todo: emit PodcastPublished
}
