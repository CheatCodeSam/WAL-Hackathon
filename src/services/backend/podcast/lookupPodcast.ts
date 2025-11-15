import { err, ok, type Result } from "neverthrow";
import { suiClient } from "~/server/sui";

export type LookUpPodcastError =
	| "MALFORMED_SUI_ADDRESS"
	| "PODCAST_NOT_FOUND_FOR_ADDRESS";

export interface PodcastViewInterface {
	id: string;
	title: string;
	description: string;
	file_type: string;
	source_file_blob_id: string;
	nonce: string;
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
			source_file_blob_id: fields.source_file_blob_id,
			nonce: fields.nonce,
			created_at: Number(fields.created_at),
			id: podcastAddress,
		};

		return ok(podcastView);
	}

	return err("MALFORMED_SUI_ADDRESS");
}
