import { redirect } from "next/navigation";
import { lookupChannel } from "~/services/backend/channel/lookupChannel";
import { ChannelPageView } from "./ChannelPageView";

interface PageProps {
	params: Promise<{
		channel: string;
	}>;
}

export default async function Channel({ params }: PageProps) {
	const { channel: suiAddress } = await params;

	const channel = await lookupChannel(suiAddress);

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

	return <ChannelPageView channel={channelData} />;
}
