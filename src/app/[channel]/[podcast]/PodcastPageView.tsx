"use client";

import {
	useCurrentAccount,
	useSignAndExecuteTransaction,
	useSuiClient,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useNetworkVariable } from "~/app/networkConfig";
import { Button } from "~/components/ui/button";
import type { PodcastView } from "~/services/backend/podcast/lookupPodcast";
import { usePodcastPageStore } from "./store";

export interface PodcastPageViewProps {
	podcast: PodcastView;
}

export function PodcastPageView(props: PodcastPageViewProps) {
	const podcast = props.podcast;

	const account = useCurrentAccount();
	const router = useRouter();
	const fundsuiPackageId = useNetworkVariable("fundsuiPackageId");
	const fundsuiRegistryId = useNetworkVariable("fundsuiChannelRegistry");
	const suiClient = useSuiClient();
	const { mutateAsync } = useSignAndExecuteTransaction();

	const {
		status,
		error,
		isOwner,
		setIsOwner,
		startDeleting,
		finishDeleting,
		failDeleting,
	} = usePodcastPageStore();

	// Check if current account is the owner of the channel
	useEffect(() => {
		console.log(account?.address === podcast.owner_address);
		const ownerCheck = account?.address === podcast.owner_address;
		setIsOwner(ownerCheck);
	}, [account?.address, podcast.owner_address, setIsOwner]);

	const handleDelete = async () => {
		if (!account?.address || !isOwner) return;

		const confirmed = confirm(
			"Are you sure you want to delete this podcast? This action cannot be undone.",
		);
		if (!confirmed) return;

		try {
			startDeleting();

			const tx = new Transaction();

			tx.moveCall({
				arguments: [
					tx.object(podcast.channel_id),
					tx.object(fundsuiRegistryId),
					tx.pure.id(podcast.id),
				],
				target: `${fundsuiPackageId}::podcast::delete_podcast`,
			});

			await mutateAsync(
				{
					transaction: tx,
				},
				{
					onSuccess: (tx) => {
						suiClient
							.waitForTransaction({
								digest: tx.digest,
								options: { showEffects: true },
							})
							.then(async (result) => {
								console.log("Podcast deleted:", result);
								finishDeleting();
								// Redirect to channel page
								router.push("/channel");
							})
							.catch((err) => {
								const errorMessage =
									err instanceof Error ? err.message : "Unknown error";
								failDeleting(`Error waiting for transaction: ${errorMessage}`);
							});
					},
					onError: (err) => {
						const errorMessage =
							err instanceof Error ? err.message : "Unknown error";
						failDeleting(`Transaction rejected: ${errorMessage}`);
					},
				},
			);
		} catch (error) {
			console.error("Error deleting podcast:", error);
			const errorMessage =
				error instanceof Error ? error.message : "Failed to delete podcast";
			failDeleting(errorMessage);
		}
	};

	return (
		<div className="min-h-screen bg-gray-50 p-8">
			<div className="mx-auto max-w-4xl rounded-lg bg-white p-6 shadow-md">
				<div className="mb-6 flex items-center justify-between">
					<Button variant="outline" asChild>
						<Link href={`/${podcast.owner}`}>
							← Back to {podcast.owner}'s channel
						</Link>
					</Button>

					{isOwner && (
						<Button
							variant="destructive"
							onClick={handleDelete}
							disabled={status === "deleting"}
							type="button"
						>
							{status === "deleting" ? "Deleting..." : "Delete Podcast"}
						</Button>
					)}
				</div>

				<h1 className="mb-6 font-bold text-3xl">Podcast Details</h1>

				{error && (
					<div className="mb-4 rounded-md border border-red-200 bg-red-50 p-4">
						<p className="text-red-700 text-sm">{error}</p>
					</div>
				)}

				{status === "deleting" && (
					<div className="mb-4 rounded-md border border-blue-200 bg-blue-50 p-4">
						<p className="text-blue-700 text-sm">Deleting podcast...</p>
					</div>
				)}

				<div className="space-y-4">
					<div>
						<span className="font-semibold">Owner:</span>
						<p className="text-gray-700">{podcast.owner}</p>
					</div>

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
							{podcast.source_file_uri}
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

					<div className="border-gray-300 border-t pt-4 text-gray-600 text-xs">
						<p>Status: {status}</p>
						<p>Error: {error || "None"}</p>
						<p>Is Owner: {isOwner ? "Yes" : "No"}</p>
						<p>Current Wallet: {account?.address || "Not connected"}</p>
					</div>
				</div>
			</div>
		</div>
	);
}
