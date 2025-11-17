import { err, ok, type Result } from "neverthrow";
import { suiClient } from "~/server/sui";
import {
	type ChannelViewInterface,
	getChannelForAddress,
	getSuinsNameOrAddress,
} from "./lookupChannel";

export interface ChannelView {
	channelId: string;
	owner: string;
	displayName: string;
	tagLine: string;
	description: string;
	profilePhotoUri: string;
	subscriptionPriceInMist: number;
	maxSubscriptionDurationInWeeks: number;
}

export interface GetAllChannelsView {
	channels: ChannelViewInterface[];
	nextCursor: string | undefined;
	hasNextPage: boolean;
}

export type getAllChannelsError =
	| "FAILED_TO_FETCH_DYNAMIC_FIELDS"
	| "FAILED_TO_FETCH_CHANNEL_DETAILS";

export async function getAllChannels(
	parentId: string,
	cursor?: string,
): Promise<Result<GetAllChannelsView, getAllChannelsError>> {
	try {
		const channelIds = await suiClient.getDynamicFields({
			cursor: cursor,
			limit: 10,
			parentId: parentId,
		});

		const channels: ChannelViewInterface[] = [];

		for (const channelDf of channelIds.data) {
			const channelOwner = channelDf.name.value as string;
			const channel = await getChannelForAddress(channelOwner);

			if (channel.isErr()) {
				// Skip channels that fail to load instead of failing the entire request
				console.error(
					`Failed to load channel for owner ${channelOwner}:`,
					channel.error,
				);
				continue;
			}

			const retChannel = channel.value;

			retChannel.owner = await getSuinsNameOrAddress(channel.value.owner);

			channels.push(retChannel);
		}

		return ok({
			channels,
			nextCursor: channelIds.nextCursor ?? undefined,
			hasNextPage: channelIds.hasNextPage,
		});
	} catch (error) {
		console.error("Failed to fetch dynamic fields:", error);
		return err("FAILED_TO_FETCH_DYNAMIC_FIELDS");
	}
}
