import { api } from "~/trpc/server";

interface PageProps {
	params: Promise<{
		channel: string;
	}>;
}

//TODO error handling, handle if we get a notfound error
export default async function Channel({ params }: PageProps) {
	const { channel: suiAddress } = await params;

	const channel = await api.channel.getChannelBySuiAddress({
		address: suiAddress,
	});

	const x = channel.channelName;

	return <div className="min-h-screen bg-gray-50">{x}</div>;
}
