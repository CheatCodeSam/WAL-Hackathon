import { suiClient } from "~/server/sui";
import { getAllChannels } from "./getAllChannels";
import {
	getPublishedPodcasts,
	type PodcastChannelViewInterface,
} from "./lookupChannel";
import { env } from "~/env";
import { err, ok, type Result } from "neverthrow";
import type { ChannelViewInterface } from "./lookupChannel";

export interface FeedItem extends PodcastChannelViewInterface {
	channelName: string;
	channelOwner: string;
	channelProfilePhotoUri: string;
}

export type GetFeedError =
	| "FAILED_TO_FETCH_CHANNELS"
	| "FAILED_TO_FETCH_SUBSCRIPTIONS";

export interface GetFeedResponse {
	feed: FeedItem[];
	subscriptionCount: number;
}

export async function getFeedForAddress(
	userAddress: string,
): Promise<Result<GetFeedResponse, GetFeedError>> {
	// 1. Get all channels
	const channelsResult = await getAllChannels(env.NEXT_PUBLIC_CHANNEL_REGISTRY);

	if (channelsResult.isErr()) {
		return err("FAILED_TO_FETCH_CHANNELS");
	}

	const channels = channelsResult.value.channels;

	// 2. Filter channels where user is subscribed
	const subscribedChannels: ChannelViewInterface[] = [];

	// We can run these in parallel
	await Promise.all(
		channels.map(async (channel) => {
			try {
				// Check if user has a subscription in the channel's subscribers table
				const subscriptionDf = await suiClient.getDynamicFieldObject({
					parentId: channel.subscribersTable,
					name: {
						type: "address",
						value: userAddress,
					},
				});

				if (subscriptionDf.data?.content?.dataType === "moveObject") {
					// biome-ignore lint/suspicious/noExplicitAny: Struct field access
					const fields = subscriptionDf.data.content.fields as any;

					// Check if subscription is active
					// end_timestamp is in milliseconds
					const endTimestamp = Number(fields.end_timestamp);
					const now = Date.now();

					if (endTimestamp > now) {
						subscribedChannels.push(channel);
					}
				}
			} catch (e) {
				// If the dynamic field doesn't exist (user not subscribed), it throws or returns error
				// We just ignore errors here as it likely means not subscribed
			}
		}),
	);

	// 3. Fetch podcasts for subscribed channels
	const feedItems: FeedItem[] = [];

	await Promise.all(
		subscribedChannels.map(async (channel) => {
			const podcastsResult = await getPublishedPodcasts(channel.podcastsTable);

			if (podcastsResult.isOk()) {
				const podcasts = podcastsResult.value;
				for (const podcast of podcasts) {
					feedItems.push({
						...podcast,
						channelName: channel.displayName,
						channelOwner: channel.owner,
						channelProfilePhotoUri: channel.profilePhotoUri,
					});
				}
			}
		}),
	);

	// 4. Sort by creation date (descending)
	// createdAt is likely a string or number. In lookupChannel it's mapped from fields.created_at
	// Let's assume it's a timestamp number or convertible string
	feedItems.sort((a, b) => {
		const dateA = Number(a.createdAt);
		const dateB = Number(b.createdAt);
		return dateB - dateA;
	});

	return ok({
		feed: feedItems,
		subscriptionCount: subscribedChannels.length,
	});
}
