module fundsui::user;

// use std::string::String;
use sui::bag::{Self, Bag};
use sui::dynamic_field as df;
use std::string::String;

#[error]
const EUserAlreadyExists: vector<u8> = b"user already exists for this address";

#[error]
const EChannelCapAlreadySet: vector<u8> = b"channel cap already set";

#[error]
const ESubscriptionAlreadyExists: vector<u8> = b"subscription already exists";

#[error]
const ESubscriptionNotFound: vector<u8> = b"subscription not found";

#[error]
const EChannelNotFound: vector<u8> = b"channel not set";

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
  username: String,
  channel: option::Option<ID>,
  subscriptions: Bag,
}

public fun new(
  registry: &mut UserRegistry,
  username: String,
  ctx: &mut TxContext,
): ID {
  let sender = ctx.sender();

  assert!(!df::exists_(&registry.id, sender), EUserAlreadyExists);

  let user = User {
    id: object::new(ctx),
    username,
    channel: option::none<ID>(),
    subscriptions: bag::new(ctx),
  };

  let user_id = object::id(&user);

  df::add(&mut registry.id, sender, object::id(&user));

  transfer::transfer(user, ctx.sender());

  user_id
}


public(package) fun set_channel(user: &mut User, channel: ID) {
  assert!(option::is_none<ID>(&user.channel), EChannelCapAlreadySet);
  user.channel = option::some<ID>(channel);
}

public fun get_channel(user: &User): &ID {
  assert!(option::is_some<ID>(&user.channel), EChannelNotFound);
  option::borrow<ID>(&user.channel)
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

public fun has_channel(user: &User): bool {
  option::is_some<ID>(&user.channel)
}