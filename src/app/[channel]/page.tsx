import { redirect } from "next/navigation";
import { lookupChannel } from "./lookupAddress";

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

	return (
		<div className="min-h-screen bg-gray-50 p-8">
			<div className="mx-auto max-w-4xl rounded-lg bg-white p-6 shadow-md">
				<h1 className="mb-6 font-bold text-3xl">Channel Details</h1>

				<div className="space-y-4">
					<div>
						<span className="font-semibold">Owner:</span>
						<p className="break-all font-mono text-gray-700 text-sm">
							{channelData.owner}
						</p>
					</div>

					<div>
						<span className="font-semibold">Display Name:</span>
						<p className="text-gray-700">{channelData.displayName}</p>
					</div>

					<div>
						<span className="font-semibold">Tag Line:</span>
						<p className="text-gray-700">{channelData.tagLine}</p>
					</div>

					<div>
						<span className="font-semibold">Description:</span>
						<p className="text-gray-700">{channelData.description}</p>
					</div>

					<div>
						<span className="font-semibold">Cover Photo URI:</span>
						<p className="break-all text-gray-700">
							{channelData.coverPhotoUri}
						</p>
					</div>

					<div>
						<span className="font-semibold">Profile Photo URI:</span>
						<p className="break-all text-gray-700">
							{channelData.profilePhotoUri}
						</p>
					</div>

					<div>
						<span className="font-semibold">Subscription Price (in MIST):</span>
						<p className="text-gray-700">
							{channelData.subscriptionPriceInMist}
						</p>
					</div>

					<div>
						<span className="font-semibold">
							Max Subscription Duration (months):
						</span>
						<p className="text-gray-700">
							{channelData.maxSubscriptionDurationInMonths}
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
