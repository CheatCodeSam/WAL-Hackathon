import { redirect } from "next/navigation";
import { getAddressFromChannelId } from "~/services/backend/channel/lookupChannel";
import {
	lookupPodcast,
	lookupPodcastWithOwner,
} from "~/services/backend/podcast/lookupPodcast";
import { PodcastPageView } from "./PodcastPageView";

interface PageProps {
	params: Promise<{
		channel: string;
		podcast: string;
	}>;
}

export default async function Podcast({ params }: PageProps) {
	const { podcast: suiAddress } = await params;

	const podcast = await lookupPodcastWithOwner(suiAddress);

	if (podcast.isErr()) {
		const error = podcast.error;

		switch (error) {
			case "PODCAST_NOT_FOUND_FOR_ADDRESS":
			case "MALFORMED_SUI_ADDRESS":
				redirect("/404");
		}
	} else {
		const podcastData = podcast.value;
		return <PodcastPageView podcast={podcastData} />;
	}
}
