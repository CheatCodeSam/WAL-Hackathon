module fundsui::channel;

use std::string::String;
use sui::coin::{Self, Coin};
use sui::dynamic_field as df;
use sui::object_table;
use sui::sui::SUI;
use sui::table::{Self, Table};

// === Errors ===

#[error]
const EUnauthorizedAccess: vector<u8> = b"Unauthorized Access";

#[error]
const EChannelAlreadyExists: vector<u8> = b"Channel already exists for this address";

#[error]
const EPurchasingTooMuchTime: vector<u8> = b"Too much time purchased";

#[error]
const EPurchasingTooLittleTime: vector<u8> = b"Must purchase at least one week";

#[error]
const ESubscriptionStillActive: vector<u8> = b"Subscription still active";

// === Constants ===

const PLATFORM_ADDRESS: address = @platform_address;

const SMART_CONTRACT_PROVIDER_TAX_OUT_OF_100: u64 = 2;

const FRONTEND_PROVIDER_TAX_OUT_OF_100: u64 = 1;

const MS_PER_WEEK: u64 = 604_800_000;

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
    // User Address -> Subscription ID
    // We're using an object table here to incentivise users to delete their
    // expired subscriptions.
    subscribers: sui::object_table::ObjectTable<address, Subscription>,
    // Functionally, this works more like a Set then a table.
    // Podcast ID -> boolen (always true)
    published_podcasts: Table<ID, bool>,
}

public struct Subscription has key, store {
    id: UID,
    channel_id: ID,
    start_timestamp: u64,
    end_timestamp: u64,
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
        subscribers: object_table::new<address, Subscription>(ctx),
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

public fun subscribe(
    channel: &mut Channel,
    frontend_address: address,
    mut payment: Coin<SUI>,
    ctx: &mut TxContext,
): ID {
    let sender = ctx.sender();

    let payment_amount = coin::value(&payment);
    let weekly_price = channel.get_subscription_price_in_mist();

    let duration_ms = (payment_amount * MS_PER_WEEK) / weekly_price;

    assert!(duration_ms >= MS_PER_WEEK, EPurchasingTooLittleTime);

    tax_payments(payment_amount, &mut payment, frontend_address, ctx);

    transfer::public_transfer(payment, channel.get_channel_owner());

    let subscription_id: ID;
    let has_subscription = channel.subscribers.contains(sender);

    if (!has_subscription) {
        // New subscription
        let max_duration_ms =
            (channel.get_max_subscription_duration_in_weeks() as u64) * MS_PER_WEEK;
        assert!(duration_ms <= max_duration_ms, EPurchasingTooMuchTime);

        let subscription = Subscription {
            id: object::new(ctx),
            channel_id: object::id(channel),
            start_timestamp: ctx.epoch_timestamp_ms(),
            end_timestamp: ctx.epoch_timestamp_ms() + duration_ms,
        };
        subscription_id = object::id(&subscription);
        channel.subscribers.add(sender, subscription);
    } else {
        // Renewing existing subscription
        let subscription = channel.subscribers.borrow(sender);

        // If they still have a valid subscription, use that as the time to append to, otherwise, use now.
        let base_time = if (subscription.end_timestamp > ctx.epoch_timestamp_ms()) {
            subscription.end_timestamp
        } else {
            ctx.epoch_timestamp_ms()
        };

        let new_end_timestamp = base_time + duration_ms;
        let max_duration_ms =
            (channel.get_max_subscription_duration_in_weeks() as u64) * MS_PER_WEEK;
        assert!(
            new_end_timestamp - ctx.epoch_timestamp_ms() <= max_duration_ms,
            EPurchasingTooMuchTime,
        );

        subscription_id = object::id(subscription);

        let subscription_mut = channel.subscribers.borrow_mut(sender);
        subscription_mut.end_timestamp = new_end_timestamp;
    };

    subscription_id
}

public fun delete_expired_subscription(channel: &mut Channel, ctx: &mut TxContext) {
    let sender = ctx.sender();
    let subscription = channel.subscribers.remove(sender);
    assert!(ctx.epoch_timestamp_ms() > subscription.end_timestamp, ESubscriptionStillActive);
    let Subscription { id, channel_id: _, start_timestamp: _, end_timestamp: _ } = subscription;
    object::delete(id);
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

public fun is_address_subscribed(channel: &mut Channel, addr: address): bool {
    channel.subscribers.contains(addr)
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

// ===Private Functions===

fun tax_payments(
    payment_amount: u64,
    payment: &mut Coin<SUI>,
    frontend_address: address,
    ctx: &mut TxContext,
) {
    let platform_tax = (payment_amount * SMART_CONTRACT_PROVIDER_TAX_OUT_OF_100) / 100;
    let platform_coin = coin::split(payment, platform_tax, ctx);
    transfer::public_transfer(platform_coin, PLATFORM_ADDRESS);

    let frontend_tax = (payment_amount * FRONTEND_PROVIDER_TAX_OUT_OF_100) / 100;
    let frontend_coin = coin::split(payment, frontend_tax, ctx);
    transfer::public_transfer(frontend_coin, frontend_address);
}
