import { err, ok, type Result } from "neverthrow";
import { suiClient } from "~/server/sui";
import {
	getAddressFromChannelId,
	type getAddressFromChannelIdErrors,
	type LookupSuinsError,
	lookupSuinsName,
} from "../channel/lookupChannel";

export type LookUpPodcastError =
	| "MALFORMED_SUI_ADDRESS"
	| "PODCAST_NOT_FOUND_FOR_ADDRESS";

export interface PodcastViewInterface {
	id: string;
	title: string;
	description: string;
	file_type: string;
	source_file_uri: string;
	channel_id: string;
	nonce: string;
	created_at: number;
}

export interface PodcastView {
	id: string;
	title: string;
	description: string;
	file_type: string;
	source_file_uri: string;
	channel_id: string;
	nonce: string;
	owner: string;
	created_at: number;
}

const SUI_ADDRESS_REGEX = /^0[xX][a-fA-F0-9]{64}$/;

export async function lookupPodcast(
	podcastAddress: string,
): Promise<Result<PodcastViewInterface, LookUpPodcastError>> {
	if (!SUI_ADDRESS_REGEX.test(podcastAddress))
		return err("MALFORMED_SUI_ADDRESS");

	const podcastObject = await suiClient.getObject({
		id: podcastAddress,
		options: { showContent: true },
	});

	if (podcastObject.data?.content?.dataType === "moveObject") {
		// biome-ignore lint/suspicious/noExplicitAny: If we get a object we know it has fields
		const fields = podcastObject.data.content.fields as any;

		const podcastView: PodcastViewInterface = {
			title: fields.title,
			description: fields.description,
			file_type: fields.filetype,
			source_file_uri: fields.source_file_uri,
			channel_id: fields.channel_id,
			nonce: fields.nonce,
			created_at: Number(fields.created_at),
			id: podcastAddress,
		};

		return ok(podcastView);
	}

	return err("MALFORMED_SUI_ADDRESS");
}

export async function lookupPodcastWithOwner(
	podcastAddress: string,
): Promise<Result<PodcastView, string>> {
	const podcast = await lookupPodcast(podcastAddress);
	if (podcast.isErr()) return err(podcast.error);
	const owner = await getAddressFromChannelId(podcast.value.channel_id);
	if (owner.isErr()) return err(owner.error);
	const suinsName = await lookupSuinsName(owner.value);
	if (suinsName.isErr()) return err(suinsName.error);
	let ownerName: string;
	if (suinsName.value) ownerName = suinsName.value;
	else ownerName = owner.value;
	return ok({
		...podcast.value,
		owner: ownerName,
	});
}
