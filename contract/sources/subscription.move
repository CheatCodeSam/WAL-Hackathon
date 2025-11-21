module fundsui::subscription;

use fundsui::channel::Channel;
use sui::clock::Clock;
use sui::coin::{Self, Coin};
use sui::sui::SUI;

#[error]
const EPurchasingTooMuchTime: vector<u8> = b"Too much time purchased";

#[error]
const EPurchasingTooLittleTime: vector<u8> = b"Must purchase at least one week";

#[error]
const ESubscriptionStillActive: vector<u8> = b"Subscription still active";

#[error]
const ERenewingSubscriptionToWrongChannel: vector<u8> =
    b"Attempting to renew subscription to wrong channel";

const PLATFORM_ADDRESS: address = @platform_address;

const SMART_CONTRACT_PROVIDER_TAX_OUT_OF_100: u64 = 2;

const FRONTEND_PROVIDER_TAX_OUT_OF_100: u64 = 1;

const MS_PER_WEEK: u64 = 604_800_000;

public struct Subscription has key, store {
    id: UID,
    channel_id: ID,
    start_timestamp: u64,
    expiration_timestamp: u64,
}

public fun subscribe(
    channel: &Channel,
    frontend_address: address,
    mut payment: Coin<SUI>,
    clock: &Clock,
    ctx: &mut TxContext,
): Subscription {
    let channel_id = object::id(channel);

    let payment_amount = coin::value(&payment);
    let weekly_price = channel.get_subscription_price_in_mist();

    let now = clock.timestamp_ms();

    let max_duration_ms = (channel.get_max_subscription_duration_in_weeks() as u64) * MS_PER_WEEK;
    let duration_ms = (payment_amount * MS_PER_WEEK) / weekly_price;

    assert!(duration_ms >= MS_PER_WEEK, EPurchasingTooLittleTime);
    assert!(duration_ms <= max_duration_ms, EPurchasingTooMuchTime);

    tax_payments(payment_amount, &mut payment, frontend_address, ctx);

    transfer::public_transfer(payment, channel.get_channel_owner());

    let subscription = Subscription {
        id: object::new(ctx),
        channel_id,
        start_timestamp: now,
        expiration_timestamp: now + duration_ms,
    };
    subscription
}

public fun renew(
    subscription: &mut Subscription,
    channel: &Channel,
    frontend_address: address,
    mut payment: Coin<SUI>,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let channel_id = object::id(channel);

    assert!(subscription.channel_id == channel_id, ERenewingSubscriptionToWrongChannel);

    let payment_amount = coin::value(&payment);
    let weekly_price = channel.get_subscription_price_in_mist();

    let now = clock.timestamp_ms();

    let max_duration_ms = (channel.get_max_subscription_duration_in_weeks() as u64) * MS_PER_WEEK;
    let duration_ms = (payment_amount * MS_PER_WEEK) / weekly_price;

    assert!(duration_ms >= MS_PER_WEEK, EPurchasingTooLittleTime);

    tax_payments(payment_amount, &mut payment, frontend_address, ctx);

    transfer::public_transfer(payment, channel.get_channel_owner());

    let base_time = if (subscription.expiration_timestamp > now) {
        subscription.expiration_timestamp
    } else {
        now
    };

    let new_end_timestamp = base_time + duration_ms;

    assert!(new_end_timestamp - now <= max_duration_ms, EPurchasingTooMuchTime);

    subscription.expiration_timestamp = new_end_timestamp;
}

public fun destroy(subscription: Subscription, clock: &Clock) {
    assert!(!subscription.is_active(clock), ESubscriptionStillActive);
    let Subscription { id, channel_id: _, start_timestamp: _, expiration_timestamp: _ } =
        subscription;
    object::delete(id);
}

public fun is_active(subscription: &Subscription, clock: &Clock): bool {
    clock.timestamp_ms() < subscription.expiration_timestamp
}

public fun get_channel_id(subscription: &Subscription): ID {
    subscription.channel_id
}

public fun get_expiration_timestamp(subscription: &Subscription): u64 {
    subscription.expiration_timestamp
}

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
