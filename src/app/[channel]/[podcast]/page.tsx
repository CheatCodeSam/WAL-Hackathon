import { redirect } from "next/navigation";
import { lookupPodcastWithOwner } from "~/services/backend/podcast/lookupPodcast";
import { PodcastPageView } from "./PodcastPageView";

interface PageProps {
	params: Promise<{
		channel: string;
		podcast: string;
	}>;
}

export const dynamic = "force-dynamic";

export default async function Podcast({ params }: PageProps) {
	const { channel: channelParam, podcast: podcastId } = await params;

	const podcast = await lookupPodcastWithOwner(podcastId);

	if (podcast.isErr()) {
		redirect("/404");
	}

	const podcastData = podcast.value;

	// Check if the channel param matches the podcast owner
	// channelParam could be either the SuiNS name or the address
	const isValidChannel =
		channelParam === podcastData.owner ||
		channelParam === podcastData.owner_address;

	if (!isValidChannel) {
		// Channel param doesn't match the owner at all - redirect to 404
		redirect("/404");
	}

	// If they used the address but there's a SuiNS name, redirect to the SuiNS name URL
	if (
		channelParam === podcastData.owner_address &&
		podcastData.owner !== podcastData.owner_address
	) {
		// They have a SuiNS name, redirect to use it
		redirect(`/${podcastData.owner}/${podcastId}`);
	}

	return <PodcastPageView podcast={podcastData} />;
}
