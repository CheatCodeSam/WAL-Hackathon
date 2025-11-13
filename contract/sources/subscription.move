module fundsui::subscription;

use fundsui::channel::{Channel, ChannelCap};
use fundsui::podcast::get_podcast;
use fundsui::user::User;
use std::string::String;
use sui::coin::{Self, Coin};
use sui::dynamic_field as df;
use sui::sui::SUI;

const PLATFORM_ADDRESS: address = @platform_address;

const SMART_CONTRACT_PROVIDER_TAX_OUT_OF_100: u64 = 2;

const FRONTEND_PROVIDER_TAX_OUT_OF_100: u64 = 1;

#[error]
const EPurchasingTooManyMonths: vector<u8> = b"Too many months at a time purchased";

#[error]
const ENotEnoughFundsProvided: vector<u8> = b"Not enough funds have been provided";

#[error]
const ESubscriptionExpired: vector<u8> = b"Subscription has expired";

#[error]
const ESubscriptionAlreadyExists: vector<u8> = b"Subscription already exists";

#[error]
const EInvalidChannel: vector<u8> = b"Subscription is not for this channel";

#[error]
const EPodcastNotFound: vector<u8> = b"Podcast not found";

#[error]
const EInvalidNonce: vector<u8> = b"Invalid nonce - access denied";

#[error]
const ESubscriptionNotExpired: vector<u8> = b"Subscription has NOT expired";

public struct Subscription has key, store {
    id: UID,
    channel_id: ID,
    start_timestamp: u64,
    end_timestamp: u64,
}

// Seal access control: Check if subscription is active
entry fun seal_approve_subscription(
    id: vector<u8>,
    blob_id: String,
    subscription: &Subscription,
    channel: &Channel,
    ctx: &TxContext,
) {
    let current_time = ctx.epoch_timestamp_ms();

    // Check if subscription is still valid
    assert!(current_time <= subscription.end_timestamp, ESubscriptionExpired);
    assert!(subscription.channel_id == object::id(channel), EInvalidChannel);
    assert!(df::exists_(channel.borrow_uid(), blob_id), EPodcastNotFound);

    let podcast = get_podcast(channel, blob_id);
    assert!(podcast.nouce() == id.to_string());
}

// Seal access control: Check if user owns the channel
entry fun seal_approve_channel_access(
    id: vector<u8>,
    blob_id: String,
    channel: &Channel,
    channel_cap: &ChannelCap,
) {
    // Check if subscription is still valid
    assert!(channel_cap.channel_id() == object::id(channel), EInvalidChannel);
    assert!(df::exists_(channel.borrow_uid(), blob_id), EPodcastNotFound);

    let podcast = get_podcast(channel, blob_id);
    assert!(podcast.nouce() == id.to_string(), EInvalidNonce);
}

#[allow(lint(self_transfer))]
public fun new(
    user: &mut User,
    channel: &Channel,
    duration_in_months: u8,
    frontend_address: address,
    mut payment: Coin<SUI>,
    ctx: &mut TxContext,
): Subscription {
    let channel_id = object::id(channel);

    assert!(!user.has_subscription(channel_id), ESubscriptionAlreadyExists);
    assert!(
        duration_in_months <= channel.get_max_subscription_duration_in_months(),
        EPurchasingTooManyMonths,
    );

    let required_amount = channel.get_subscription_price_in_mist() * (duration_in_months as u64);

    assert!(coin::value(&payment) >= required_amount, ENotEnoughFundsProvided);

    let mut payment_coin = coin::split(&mut payment, required_amount, ctx);

    let platform_tax = (required_amount * SMART_CONTRACT_PROVIDER_TAX_OUT_OF_100) / 100;
    let platform_coin = coin::split(&mut payment_coin, platform_tax, ctx);
    transfer::public_transfer(platform_coin, PLATFORM_ADDRESS);

    let frontend_tax = (required_amount * FRONTEND_PROVIDER_TAX_OUT_OF_100) / 100;
    let frontend_coin = coin::split(&mut payment_coin, frontend_tax, ctx);
    transfer::public_transfer(frontend_coin, frontend_address);

    transfer::public_transfer(payment_coin, channel.get_channel_owner());

    if (coin::value(&payment) > 0) {
        transfer::public_transfer(payment, ctx.sender());
    } else {
        coin::destroy_zero(payment);
    };

    let start_time = ctx.epoch_timestamp_ms();
    let duration_in_ms = (duration_in_months as u64) * 30 * 24 * 60 * 60 * 1000; // Approximate month in milliseconds

    let subscription = Subscription {
        id: object::new(ctx),
        channel_id: object::id(channel),
        start_timestamp: start_time,
        end_timestamp: start_time + duration_in_ms,
    };

    user.add_subscription(object::id(channel), object::id(&subscription));
    subscription
}

// refill
// add more months to subscription
#[allow(lint(self_transfer))]
public fun refill(
    subscription: &mut Subscription,
    channel: &Channel,
    duration_in_months: u8,
    frontend_address: address,
    mut payment: Coin<SUI>,
    ctx: &mut TxContext,
) {
    let channel_id = object::id(channel);
    assert!(subscription.channel_id == channel_id, EInvalidChannel);
    assert!(
        duration_in_months <= channel.get_max_subscription_duration_in_months(),
        EPurchasingTooManyMonths,
    );

    let required_amount = channel.get_subscription_price_in_mist() * (duration_in_months as u64);
    assert!(coin::value(&payment) >= required_amount, ENotEnoughFundsProvided);

    let mut payment_coin = coin::split(&mut payment, required_amount, ctx);

    let platform_tax = (required_amount * SMART_CONTRACT_PROVIDER_TAX_OUT_OF_100) / 100;
    let platform_coin = coin::split(&mut payment_coin, platform_tax, ctx);
    transfer::public_transfer(platform_coin, PLATFORM_ADDRESS);

    let frontend_tax = (required_amount * FRONTEND_PROVIDER_TAX_OUT_OF_100) / 100;
    let frontend_coin = coin::split(&mut payment_coin, frontend_tax, ctx);
    transfer::public_transfer(frontend_coin, frontend_address);

    transfer::public_transfer(payment_coin, channel.get_channel_owner());

    if (coin::value(&payment) > 0) {
        transfer::public_transfer(payment, ctx.sender());
    } else {
        coin::destroy_zero(payment);
    };

    let now = ctx.epoch_timestamp_ms();
    let duration_in_ms = (duration_in_months as u64) * 30 * 24 * 60 * 60 * 1000;

    if (now > subscription.end_timestamp) {
        subscription.start_timestamp = now;
        subscription.end_timestamp = now + duration_in_ms;
    } else {
        subscription.end_timestamp = subscription.end_timestamp + duration_in_ms;
    }
}

public fun delete(subscription: Subscription, user: &mut User, channel: &Channel, ctx: &TxContext) {
    let channel_id = object::id(channel);
    assert!(subscription.channel_id == channel_id, EInvalidChannel);

    let now = ctx.epoch_timestamp_ms();
    // Ensure the subscription has already expired
    assert!(now > subscription.end_timestamp, ESubscriptionNotExpired);

    // remove subscription reference from user
    user.remove_subscription(channel_id);

    let Subscription {id, .. } = subscription;

    id.delete();
}
