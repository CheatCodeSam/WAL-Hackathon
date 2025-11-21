module fundsui::channel;

use std::string::String;
use sui::dynamic_field as df;
use sui::table::{Self, Table};

// === Errors ===

#[error]
const EUnauthorizedAccess: vector<u8> = b"Unauthorized Access";

#[error]
const EChannelAlreadyExists: vector<u8> = b"Channel already exists for this address";

// === Structs ===

public struct Channel has key {
    id: UID,
    owner: address,
    display_name: String,
    tag_line: String,
    description: String,
    cover_photo_uri: String,
    profile_photo_uri: String,
    subscription_price_in_mist: u64,
    max_subscription_duration_in_weeks: u8,
    // Functionally, this works more like a Set then a table.
    // Podcast ID -> boolean (always true)
    published_podcasts: Table<ID, bool>,
}

public struct ChannelRegistry has key {
    id: UID,
}

// === Public Functions ===

fun init(ctx: &mut TxContext) {
    let registry = ChannelRegistry {
        id: object::new(ctx),
    };
    transfer::share_object(registry);
}

#[test_only]
public fun init_for_testing(ctx: &mut TxContext) {
    init(ctx);
}

public fun new(
    registry: &mut ChannelRegistry,
    display_name: String,
    tag_line: String,
    description: String,
    cover_photo_uri: String,
    profile_photo_uri: String,
    subscription_price_in_mist: u64,
    max_subscription_duration_in_weeks: u8,
    ctx: &mut TxContext,
): ID {
    let sender = ctx.sender();

    assert!(!df::exists_(&registry.id, sender), EChannelAlreadyExists);

    let channel = Channel {
        id: object::new(ctx),
        owner: sender,
        display_name,
        tag_line,
        description,
        cover_photo_uri,
        profile_photo_uri,
        subscription_price_in_mist,
        max_subscription_duration_in_weeks,
        published_podcasts: table::new<ID, bool>(ctx),
    };

    let channel_id = object::id(&channel);

    df::add(&mut registry.id, sender, channel_id);

    transfer::share_object(channel);

    channel_id
}

public fun update_channel(
    registry: &ChannelRegistry,
    channel: &mut Channel,
    display_name: String,
    tag_line: String,
    description: String,
    cover_photo_uri: String,
    profile_photo_uri: String,
    subscription_price_in_mist: u64,
    max_subscription_duration_in_weeks: u8,
    ctx: &mut TxContext,
) {
    let sender = ctx.sender();
    assert!(authorize_address_for_channel(sender, registry, channel), EUnauthorizedAccess);

    channel.display_name = display_name;
    channel.tag_line = tag_line;
    channel.description = description;
    channel.cover_photo_uri = cover_photo_uri;
    channel.profile_photo_uri = profile_photo_uri;
    channel.subscription_price_in_mist = subscription_price_in_mist;
    channel.max_subscription_duration_in_weeks = max_subscription_duration_in_weeks;
}

// === View Functions ===

public fun get_channel_id_for_address(registry: &ChannelRegistry, addr: address): Option<ID> {
    if (df::exists_(&registry.id, addr)) {
        let channel_id = df::borrow<address, ID>(&registry.id, addr);
        option::some(*channel_id)
    } else {
        option::none()
    }
}

public fun get_max_subscription_duration_in_weeks(channel: &Channel): u8 {
    channel.max_subscription_duration_in_weeks
}

public fun get_subscription_price_in_mist(channel: &Channel): u64 {
    channel.subscription_price_in_mist
}

public fun get_channel_owner(channel: &Channel): address {
    channel.owner
}

public fun number_of_podcasts(channel: &Channel): u64 {
    return channel.published_podcasts.length()
}

// === Package Functions ===

public(package) fun authorize_address_for_channel(
    addr: address,
    registry: &ChannelRegistry,
    channel: &Channel,
): bool {
    let channel_id_option = get_channel_id_for_address(registry, addr);
    if (channel_id_option.is_some()) {
        let channel_id = channel_id_option.destroy_some();
        channel_id == object::id(channel)
    } else {
        false
    }
}

public(package) fun upload_podcast_to_channel(channel: &mut Channel, podcast_id: ID) {
    channel.published_podcasts.add(podcast_id, true);
}

public(package) fun remove_podcast_from_channel(channel: &mut Channel, podcast_id: ID) {
    channel.published_podcasts.remove((podcast_id));
}
