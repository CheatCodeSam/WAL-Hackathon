import { env } from "~/env";
import { getObjectFromAddress } from "./graphql";

export interface UserDetails {
  id: string;
  username: string;
  channel_id: string | null;
  has_channel: boolean;
  subscriptions_bag_id?: string;
}

export async function getUserDetails(address: string): Promise<UserDetails | null> {
  const result = await getObjectFromAddress(
    address,
    `${env.NEXT_PUBLIC_CONTRACT_ADDRESS}::user::User`,
  );

  if (result.data.objects.nodes.length === 0) return null;

  const node = result.data.objects.nodes[0];
  const json = node.asMoveObject.contents.json as Record<string, any>;

  let channelId: string | null = null;
  const channelRaw = json.channel;
  if (typeof channelRaw === "string") channelId = channelRaw;
  else if (channelRaw && typeof channelRaw === "object") {
    if (typeof channelRaw.some === "string") channelId = channelRaw.some;
    else if (typeof channelRaw.Some === "string") channelId = channelRaw.Some;
  }

  const hasChannel = !!channelId;

  let subscriptionsBagId: string | undefined;
  const subs = json.subscriptions;
  if (subs && typeof subs === "object" && typeof subs.id === "string") {
    subscriptionsBagId = subs.id;
  }

  return {
    id: node.asMoveObject.address,
    username: json.username || "",
    channel_id: channelId,
    has_channel: hasChannel,
    subscriptions_bag_id: subscriptionsBagId,
  };
}
