import { redirect } from "next/navigation";
import { env } from "~/env";
import { getAllChannels } from "~/services/backend/channel/getAllChannels";
import ExplorePageView from "./ExplorePageView";

export default async function Explore() {
	const channels = await getAllChannels(env.NEXT_PUBLIC_CHANNEL_REGISTRY);

	if (channels.isErr()) redirect("/404");

	return <ExplorePageView channels={channels.value.channels} />;
}
