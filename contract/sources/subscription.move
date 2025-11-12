module fundsui::subscription;

use fundsui::channel::Channel;
use sui::coin::{Self, Coin};
use sui::sui::SUI;

const PLATFORM_ADDRESS: address = @platform_address;

const SMART_CONTRACT_PROVIDER_TAX_OUT_OF_100: u64 = 2;

const FRONTEND_PROVIDER_TAX_OUT_OF_100: u64 = 1;

const MS_PER_MONTH: u64 = 2_592_000_000;

#[error]
const EPurchasingTooManyMonths: vector<u8> = b"Too many months at a time purchased";

#[error]
const ESubscribingToSelf: vector<u8> = b"Attempting to Subscribe to Self";

#[error]
const ENotEnoughFundsProvided: vector<u8> = b"Not enough funds have been provided";

public struct Subscription has key, store {
    id: UID,
    channel_id: ID,
    start_timestamp: u64,
    end_timestamp: u64,
}

#[allow(lint(self_transfer))]
public fun new(
    channel: &Channel,
    duration_in_months: u8,
    frontend_address: address,
    mut payment: Coin<SUI>,
    ctx: &mut TxContext,
): Subscription {
    assert!(
        duration_in_months <= channel.get_max_subscription_duration_in_months(),
        EPurchasingTooManyMonths,
    );

    assert!(channel.get_channel_owner() != ctx.sender(), ESubscribingToSelf);
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

    let subscription = Subscription {
        id: object::new(ctx),
        channel_id: object::id(channel),
        start_timestamp: ctx.epoch_timestamp_ms(),
        end_timestamp: ctx.epoch_timestamp_ms() + calculate_duration_in_ms(duration_in_months),
    };
    subscription
}

fun calculate_duration_in_ms(months: u8): u64 {
    (months as u64) * MS_PER_MONTH
}

// refill
// add more months to subscription

// delete
// delete dead subscription object, only available if subscription is over
