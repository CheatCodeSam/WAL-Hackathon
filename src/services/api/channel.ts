import { env } from "~/env";
import { getObjectFromAddress, getObjectById, getSharedObjectsByType } from "./graphql";
import { getUserDetails } from "./user";
import { channel } from "diagnostics_channel";

export interface Channel {
  id: string;
  name: string;
  description: string;
  cover_image_uri: string;
  profile_image_uri: string;
  subscription_price_in_mist: string;
  max_subscription_duration_in_months: number;
  tag_line?: string;
}

export async function getChannelId(address: string) {
  const result = await getObjectFromAddress(
    address,
    `${env.NEXT_PUBLIC_CONTRACT_ADDRESS}::channel::ChannelCap`,
  );

  if (result.data.objects.nodes.length === 0) return null;

  const node = result.data.objects.nodes[0];
  const channelCapId = node.asMoveObject.address;
  const channelId = node.asMoveObject.contents.json.channel;
  return { channelCapId, channelId };
}

export async function getChannelDetails(channelId: string) {
  const result = await getObjectById(channelId);
  const json = result.asMoveObject.contents.json;
  return {
    id: result.asMoveObject.address,
    name: json.display_name,
    description: json.description,
    tag_line: json.tag_line,
    cover_image_uri: json.cover_photo_uri,
    profile_image_uri: json.profile_photo_uri,
    subscription_price_in_mist: json.subscription_price_in_mist,
    max_subscription_duration_in_months: json.max_subscription_duration_in_months,
  } as Channel;
}

export async function getChannelDetailsByAddress(address: string): Promise<Channel | null> {
  const user = await getUserDetails(address);
  if (!user?.channel_id) return null;

  try {
    const channel = await getChannelDetails(user.channel_id);
    return channel ?? null;
  } catch {
    return null;
  }
}

export async function getAllChannels() {
  const result = await getSharedObjectsByType(
    `${env.NEXT_PUBLIC_CONTRACT_ADDRESS}::channel::Channel`,
  );

  return result.data.objects.nodes.map((node: any) => {
    const channel = node.asMoveObject.contents.json;
    return {
      id: node.asMoveObject.address,
      name: channel.name || "",
      description: channel.description || "",
      cover_image_uri: channel.cover_photo_uri || "",
      profile_image_uri: channel.profile_photo_uri || "",
      subscription_price_in_mist: channel.subscription_price_in_mist || "",
      max_subscription_duration_in_months: channel.max_subscription_duration_in_months || "",
    } as Channel;
  });
}
