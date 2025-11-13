module fundsui::user;

// use std::string::String;
use sui::bag::{Self, Bag};
use sui::dynamic_field as df;

#[error]
const EUserAlreadyExists: vector<u8> = b"user already exists for this address";

#[error]
const EChannelCapAlreadySet: vector<u8> = b"channel cap already set";

#[error]
const ESubscriptionAlreadyExists: vector<u8> = b"subscription already exists";

#[error]
const ESubscriptionNotFound: vector<u8> = b"subscription not found";

public struct UserRegistry has key {
  id: UID
}

fun init(ctx: &mut TxContext) {
    let registry = UserRegistry {
        id: object::new(ctx),
    };
    transfer::share_object(registry);
}

public struct User has key {
  id: UID,
  channel_cap: option::Option<ID>,
  subscriptions: Bag,
}

public fun new(
  registry: &mut UserRegistry,
  ctx: &mut TxContext,
): User {
  let sender = ctx.sender();

  assert!(!df::exists_(&registry.id, sender), EUserAlreadyExists);

  let user = User {
    id: object::new(ctx),
    channel_cap: option::none<ID>(),
    subscriptions: bag::new(ctx),
  };

  df::add(&mut registry.id, sender, object::id(&user));

  user
}


public(package) fun set_channel_cap(user: &mut User, cap_id: ID) {
  assert!(option::is_none<ID>(&user.channel_cap), EChannelCapAlreadySet);
  user.channel_cap = option::some<ID>(cap_id);
}

public fun add_subscription(user: &mut User, channelId: ID, subscriptionId: ID) {
  assert!(!bag::contains(&user.subscriptions, channelId), ESubscriptionAlreadyExists);
  bag::add(&mut user.subscriptions, channelId, subscriptionId);
}


public fun remove_subscription(user: &mut User, channelId: ID): ID {
  assert!(bag::contains(&user.subscriptions, channelId), ESubscriptionNotFound);
  bag::remove(&mut user.subscriptions, channelId)
}

public fun has_subscription(user: &User, channelId: ID): bool {
  bag::contains(&user.subscriptions, channelId)
}

public fun has_channel_cap(user: &User): bool {
  option::is_some<ID>(&user.channel_cap)
}