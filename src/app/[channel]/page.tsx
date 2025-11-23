import { redirect } from "next/navigation";
import {
	getPublishedPodcasts,
	lookupChannel,
} from "~/services/backend/channel/lookupChannel";
import { lookupSuinsName } from "~/services/backend/suins/lookupSuins";
import { ChannelPageView } from "./ChannelPageView";

interface PageProps {
	params: Promise<{
		channel: string;
	}>;
}

export const dynamic = "force-dynamic";

export default async function Channel({ params }: PageProps) {
	const { channel: channelParam } = await params;
	const suiNsName = await lookupSuinsName(channelParam);

	if (suiNsName.isOk()) {
		if (suiNsName.value) {
			redirect(`/${suiNsName.value}`);
		}
	}

	const channel = await lookupChannel(channelParam);

	if (channel.isErr()) {
		const error = channel.error;

		switch (error) {
			case "CANNOT_FIND_SUINS_NAME":
			case "CHANNEL_NOT_FOUND_FOR_ADDRESS":
			case "MALFORMED_SUI_ADDRESS":
				redirect("/404");
		}
	}

	const channelData = channel.value;

	const podcasts = await getPublishedPodcasts(channelData.podcastsTable);

	if (podcasts.isErr()) {
		redirect("/404");
	}

	const podcastData = podcasts.value;

	// Sort podcasts by createdAt in descending order (newest first)
	const sortedPodcasts = podcastData.sort((a, b) => {
		return Number(b.createdAt) - Number(a.createdAt);
	});

	// Pass the channelParam (which could be SuiNS name or address) to the view
	// This is used for constructing proper podcast URLs
	return (
		<ChannelPageView
			channel={channelData}
			channelIdentifier={channelParam}
			podcasts={sortedPodcasts}
		/>
	);
}
