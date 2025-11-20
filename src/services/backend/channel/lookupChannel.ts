import { Transaction } from "@mysten/sui/transactions";
import { err, ok, type Result } from "neverthrow";
import { env } from "~/env";
import { suiClient } from "~/server/sui";
import {
	type ResolveSuinsOrGetAddressError,
	resolveSuinsOrGetAddress,
} from "../suins/lookupSuins";

export interface PodcastChannelViewInterface {
	id: string;
	title: string;
	description: string;
	sourceFileUri: string;
	nonce: string;
	createdAt: string;
}

export interface ChannelViewInterface {
	channelId: string;
	owner: string;
	displayName: string;
	tagLine: string;
	description: string;
	coverPhotoUri: string;
	profilePhotoUri: string;
	subscriptionPriceInMist: number;
	maxSubscriptionDurationInWeeks: number;
	podcastsTable: string;
	subscribersTable: string;
	numberOfPodcasts: number;
	numberOfSubscribers: number;
}

export type LookUpChannelError =
	| ResolveSuinsOrGetAddressError
	| GetChannelForAddressError;

export async function lookupChannel(
	addressOrSuins: string,
): Promise<Result<ChannelViewInterface, LookUpChannelError>> {
	const resolvedAddress = await resolveSuinsOrGetAddress(addressOrSuins);

	if (resolvedAddress.isErr()) return err(resolvedAddress.error);

	const channelResult = await getChannelForAddress(resolvedAddress.value);
	if (channelResult.isErr()) return err(channelResult.error);

	return ok(channelResult.value);
}

export type GetChannelForAddressError = "CHANNEL_NOT_FOUND_FOR_ADDRESS";

export async function getChannelForAddress(
	address: string,
): Promise<Result<ChannelViewInterface, GetChannelForAddressError>> {
	const tx = new Transaction();
	tx.moveCall({
		target: `${env.NEXT_PUBLIC_CONTRACT_ADDRESS}::channel::get_channel_id_for_address`,
		arguments: [
			tx.object(env.NEXT_PUBLIC_CHANNEL_REGISTRY),
			tx.pure.address(address),
		],
	});

	const result = await suiClient.devInspectTransactionBlock({
		sender: address,
		transactionBlock: tx,
	});

	if (result.results?.[0]?.returnValues) {
		const returnValue = result.results[0].returnValues[0];
		if (returnValue && returnValue[0].length > 1) {
			const channelIdBytes = returnValue[0].slice(1);
			const channelId = `0x${Buffer.from(channelIdBytes).toString("hex")}`;

			const channelObject = await suiClient.getObject({
				id: channelId,
				options: { showContent: true },
			});

			if (channelObject.data?.content?.dataType === "moveObject") {
				// biome-ignore lint/suspicious/noExplicitAny: If we get a object we know it has fields
				const fields = channelObject.data.content.fields as any;

				const channelView: ChannelViewInterface = {
					channelId: channelId,
					owner: fields.owner,
					displayName: fields.display_name,
					tagLine: fields.tag_line,
					description: fields.description,
					coverPhotoUri: fields.cover_photo_uri,
					profilePhotoUri: fields.profile_photo_uri,
					subscriptionPriceInMist: Number(fields.subscription_price_in_mist),
					maxSubscriptionDurationInWeeks: Number(
						fields.max_subscription_duration_in_weeks,
					),
					podcastsTable: fields.published_podcasts.fields.id.id,
					subscribersTable: fields.subscribers.fields.id.id,
					numberOfPodcasts: Number(fields.published_podcasts.fields.size),
					numberOfSubscribers: Number(fields.subscribers.fields.size),
				};

				return ok(channelView);
			}
		}
	}

	return err("CHANNEL_NOT_FOUND_FOR_ADDRESS");
}

export type GetPublishedPodcastsError =
	| "FAILED_TO_FETCH_DYNAMIC_FIELDS"
	| "PODCAST_OBJECT_NOT_FOUND";

export async function getPublishedPodcasts(
	publishedPodcastsTableId: string,
): Promise<Result<PodcastChannelViewInterface[], GetPublishedPodcastsError>> {
	try {
		const publishedPodcasts = await suiClient.getDynamicFields({
			parentId: publishedPodcastsTableId,
		});

		if (!publishedPodcasts.data) {
			return err("FAILED_TO_FETCH_DYNAMIC_FIELDS");
		}

		const podcasts: PodcastChannelViewInterface[] = [];
		const resultData = publishedPodcasts.data;

		for (const d of resultData) {
			const podcastId = d.name.value as string;

			const podcastObject = await suiClient.getObject({
				id: podcastId,
				options: { showContent: true },
			});

			if (podcastObject.data?.content?.dataType === "moveObject") {
				// biome-ignore lint/suspicious/noExplicitAny: If we get a object we know it has fields
				const fields = podcastObject.data.content.fields as any;

				podcasts.push({
					id: fields.id.id,
					title: fields.title,
					description: fields.description,
					sourceFileUri: fields.source_file_uri,
					nonce: fields.nonce,
					createdAt: fields.created_at,
				});
			} else {
				return err("PODCAST_OBJECT_NOT_FOUND");
			}
		}

		return ok(podcasts);
	} catch (_error) {
		return err("FAILED_TO_FETCH_DYNAMIC_FIELDS");
	}
}

export type getAddressFromChannelIdErrors = "OWNER_NOT_FOUND";

export async function getAddressFromChannelId(
	channelId: string,
): Promise<Result<string, getAddressFromChannelIdErrors>> {
	const object = (await suiClient.getObject({
		id: channelId,
		options: { showContent: true },
		// biome-ignore lint/suspicious/noExplicitAny: Complicated return type
	})) as any;

	const owner = object.data?.content?.fields?.owner;
	if (owner) {
		return ok(owner);
	}
	return err("OWNER_NOT_FOUND");
}
