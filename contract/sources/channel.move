module fundsui::channel;

use std::string::String;
use fundsui::user::User;

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

public struct ChannelCap has key, store {
    id: UID,
    channel: ID,
}

public fun channel_id(cap: &ChannelCap): ID {
    cap.channel
}

public(package) fun borrow_uid_mut(channel: &mut Channel): &mut UID {
    &mut channel.id
}

public(package) fun borrow_uid(channel: &Channel): &UID {
    &channel.id
}


public fun new(
    user: &mut User,
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

    assert!(!user.has_channel_cap(), EChannelAlreadyExists);

    let channel = Channel {
        id: object::new(ctx),
        owner: sender,
        display_name,
        tag_line,
        description,
        cover_photo_uri,
        profile_photo_uri,
        subscription_price_in_mist,
        max_subscription_duration_in_months,
    };

    let channel_id = object::id(&channel);

    let channel_cap = ChannelCap {
        id: object::new(ctx),
        channel: channel_id,
    };

    user.set_channel_cap(object::id(&channel_cap));

    transfer::public_share_object(channel);

    channel_cap
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

public fun get_max_subscription_duration_in_months(channel: &Channel): u8 {
    channel.max_subscription_duration_in_months
}

public fun get_subscription_price_in_mist(channel: &Channel): u64 {
    channel.subscription_price_in_mist
}

public fun get_channel_owner(channel: &Channel): address {
    channel.owner
}
