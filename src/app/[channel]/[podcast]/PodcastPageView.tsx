"use client";

import {
	useCurrentAccount,
	useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";
import { useNetworkVariable } from "~/app/networkConfig";
import type { PodcastViewInterface } from "~/services/backend/podcast/lookupPodcast";

export interface PodcastPageViewProps {
	podcast: PodcastViewInterface;
}

export function PodcastPageView(props: PodcastPageViewProps) {
	const podcast = props.podcast;

	const account = useCurrentAccount();
	const fundsuiPackageId = useNetworkVariable("fundsuiPackageId");
	const hostingClientAddress = useNetworkVariable("hostingClientAddress");
	const { mutateAsync } = useSignAndExecuteTransaction();

	return (
		<div className="min-h-screen bg-gray-50 p-8">
			<div className="mx-auto max-w-4xl rounded-lg bg-white p-6 shadow-md">
				<h1 className="mb-6 font-bold text-3xl">Podcast Details</h1>

				<div className="space-y-4">
					<div>
						<span className="font-semibold">Title:</span>
						<p className="text-gray-700">{podcast.title}</p>
					</div>

					<div>
						<span className="font-semibold">Description:</span>
						<p className="text-gray-700">{podcast.description}</p>
					</div>

					<div>
						<span className="font-semibold">File Type:</span>
						<p className="text-gray-700">{podcast.file_type}</p>
					</div>

					<div>
						<span className="font-semibold">Source File Blob ID:</span>
						<p className="break-all font-mono text-gray-700 text-sm">
							{podcast.source_file_blob_id}
						</p>
					</div>

					<div>
						<span className="font-semibold">Nonce:</span>
						<p className="break-all font-mono text-gray-700 text-sm">
							{podcast.nonce}
						</p>
					</div>

					<div>
						<span className="font-semibold">Created At:</span>
						<p className="text-gray-700">
							{new Date(podcast.created_at).toLocaleString()}
						</p>
					</div>

					<div>
						<span className="font-semibold">Podcast ID:</span>
						<p className="break-all font-mono text-gray-700 text-sm">
							{podcast.id}
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
