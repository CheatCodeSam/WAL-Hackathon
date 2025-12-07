module fundsui::channel;

use std::string::String;
use sui::clock::Clock;
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
    timestamp_created: u64,
}

public struct ChannelCap has key {
    id: UID,
    channel_id: ID,
}

public struct ChannelRegistry has key {
    id: UID,
    // Address to Channel ID
    registry: Table<address, ID>,
}

// === Public Functions ===

fun init(ctx: &mut TxContext) {
    let registry = ChannelRegistry {
        id: object::new(ctx),
        registry: table::new(ctx),
    };
    transfer::share_object(registry);
}

entry fun new(
    registry: &mut ChannelRegistry,
    display_name: String,
    tag_line: String,
    description: String,
    cover_photo_uri: String,
    profile_photo_uri: String,
    subscription_price_in_mist: u64,
    max_subscription_duration_in_weeks: u8,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let sender = ctx.sender();
    assert!(!registry.registry.contains(sender), EChannelAlreadyExists);

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
        timestamp_created: clock.timestamp_ms(),
    };

    let channel_id = object::id(&channel);

    let cap = ChannelCap { id: object::new(ctx), channel_id: channel_id };

    transfer::transfer(cap, sender);
}

fun is_channel_cap_authorized_for_channel(channel: &Channel, cap: &ChannelCap): bool {
    return object::id(channel) == cap.channel_id
}
