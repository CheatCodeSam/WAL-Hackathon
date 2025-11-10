module podcast::channel;

use std::string::String;
use sui::dynamic_field as df;

#[error]
const EUnauthorizedAccess: vector<u8> = b"Unauthorized Access";

#[error]
const EChannelAlreadyExists: vector<u8> = b"Channel already exists for this address";

public struct Channel has key, store {
    id: UID,
    owner: address,
    display_name: String,
    tag_line: String,
    description: String,
    cover_photo_uri: String,
    profile_photo_uri: String,
    subscription_price_in_mist: u64, 
    max_subscription_duration_in_months: u8,
}

public struct ChannelRegistry has key {
    id: UID,
}

public struct ChannelCap has key, store {
    id: UID,
    channel: ID,
}

fun init(ctx: &mut TxContext) {
    let registry = ChannelRegistry {
        id: object::new(ctx),
    };
    transfer::share_object(registry);
}

public fun new(
    registry: &mut ChannelRegistry,
    display_name: String,
    tag_line: String,
    description: String,
    cover_photo_uri: String,
    profile_photo_uri: String,
    subscription_price_in_mist: u64,  
    max_subscription_duration_in_months: u8,
    ctx: &mut TxContext,
): ChannelCap {
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
        max_subscription_duration_in_months
    };

    let channel_id = object::id(&channel);

    let channel_cap = ChannelCap {
        id: object::new(ctx),
        channel: channel_id,
    };

    df::add(&mut registry.id, sender, channel_id);

    transfer::public_share_object(channel);

    channel_cap
}


public fun get_channel_id_for_address(
    registry: &ChannelRegistry,
    addr: address
): Option<ID> {
    if (df::exists_(&registry.id, addr)) {
        let channel_id = df::borrow<address, ID>(&registry.id, addr);
        option::some(*channel_id)
    } else {
        option::none()
    }
}

public fun update_channel(
    cap: &ChannelCap,
    channel: &mut Channel,
    display_name: String,
    tag_line: String,
    description: String,
    cover_photo_uri: String,
    profile_photo_uri: String,
    subscription_price_in_mist: u64,
    max_subscription_duration_in_months: u8,
) {
    assert!(object::id(channel) == cap.channel, EUnauthorizedAccess);
    
    channel.display_name = display_name;
    channel.tag_line = tag_line;
    channel.description = description;
    channel.cover_photo_uri = cover_photo_uri;
    channel.profile_photo_uri = profile_photo_uri;
    channel.subscription_price_in_mist = subscription_price_in_mist;
    channel.max_subscription_duration_in_months = max_subscription_duration_in_months;
}
