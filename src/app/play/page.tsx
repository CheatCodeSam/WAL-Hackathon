"use client";

import { useCurrentAccount } from "@mysten/dapp-kit";
import { useState, useRef, useEffect } from "react";
import { useNetworkVariable } from "~/app/networkConfig";
import { useSealAudioPlayer } from "~/hooks/useSealAudioPlayer";
import { useSeal } from "~/app/SealProvider";
import { api } from "~/trpc/react";

interface PodcastData {
	id: string;
	blobId: string;
	nonce: string;
	title: string;
	description: string;
	file_type: string;
	channelId: string;
}

export default function PlayPodcastPage() {
	const account = useCurrentAccount();
	const fundsuiPackageId = useNetworkVariable("fundsuiPackageId");
	const { ready: sealReady } = useSeal();
	const { decryptAndPlayAudio, isDecrypting, error: decryptError } =
		useSealAudioPlayer();

	const [podcastId, setPodcastId] = useState("");
	const [subscriptionId, setSubscriptionId] = useState("");
	const [podcast, setPodcast] = useState<PodcastData | null>(null);
	const [fetchError, setFetchError] = useState<string | null>(null);

	const [audioUrl, setAudioUrl] = useState<string | null>(null);
	const [isPlaying, setIsPlaying] = useState(false);
	const audioRef = useRef<HTMLAudioElement>(null);

	const podcastQuery = api.podcast.podcast.byId.useQuery(podcastId, {
		enabled: false,
	});

	// Fetch podcast data from blockchain
	const handleFetchPodcast = async () => {
		if (!podcastId) {
			alert("Please enter a podcast ID");
			return;
		}

		setFetchError(null);

		try {
			const result = await podcastQuery.refetch();

			if (result.data) {
				const podcastData: PodcastData = {
					id: podcastId,
					blobId: result.data.source_file_blob_id,
					nonce: result.data.nouce,
					title: result.data.title,
					description: result.data.description,
					file_type: result.data.file_type,
					channelId: "",
				};

				setPodcast(podcastData);
			} else {
				throw new Error("Podcast not found");
			}
		} catch (error) {
			console.error("Fetch error:", error);
			setFetchError(
				`Failed to fetch podcast: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	};

	// Decrypt and play
	const handlePlay = async () => {
		if (!podcast) {
			alert("Please fetch podcast data first");
			return;
		}

		if (!subscriptionId) {
			alert("Please enter your subscription ID");
			return;
		}

		if (!sealReady) {
			alert("Seal encryption is not ready. Please wait...");
			return;
		}

		if (!account) {
			alert("Please connect your wallet first");
			return;
		}

		try {
			const url = await decryptAndPlayAudio({
				blobId: podcast.blobId,
				nonce: podcast.nonce,
				channelId: podcast.channelId,
				podcastId: podcast.id,
				subscriptionObjectId: subscriptionId,
				file_type: podcast.file_type
			});

			setAudioUrl(url);

			// Auto-play
			setTimeout(() => {
				if (audioRef.current) {
					audioRef.current
						.play()
						.catch((err) => console.error("Auto-play failed:", err));
				}
			}, 100);
		} catch (error) {
			console.error("Playback error:", error);
		}
	};

	const handlePlayPause = () => {
		if (!audioRef.current) return;

		if (isPlaying) {
			audioRef.current.pause();
		} else {
			audioRef.current.play();
		}
	};

	// Cleanup
	useEffect(() => {
		return () => {
			if (audioUrl) {
				URL.revokeObjectURL(audioUrl);
			}
		};
	}, [audioUrl]);

	return (
		<div className="container mx-auto max-w-3xl py-8">
			<div className="mb-6">
				<h1 className="font-bold text-3xl">Play Encrypted Podcast</h1>
				<p className="mt-2 text-gray-600">
					Fetch podcast data from blockchain and play with your subscription
				</p>
			</div>

			{/* Connection Status */}
			<div className="mb-6 rounded-lg border bg-white p-4 shadow-sm">
				<div className="grid grid-cols-2 gap-4">
					<div>
						<div className="flex items-center gap-2 text-sm">
							<span
								className={`h-2 w-2 rounded-full ${account ? "bg-green-500" : "bg-red-500"}`}
							/>
							<span className="font-medium">Wallet:</span>
							<span className="text-gray-600">
								{account ? "Connected" : "Disconnected"}
							</span>
						</div>
					</div>
					<div>
						<div className="flex items-center gap-2 text-sm">
							<span
								className={`h-2 w-2 rounded-full ${sealReady ? "bg-green-500" : "bg-yellow-500"}`}
							/>
							<span className="font-medium">Seal:</span>
							<span className="text-gray-600">
								{sealReady ? "Ready" : "Initializing..."}
							</span>
						</div>
					</div>
				</div>
			</div>

			{/* Step 1: Fetch Podcast */}
			<div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
				<h2 className="mb-4 font-semibold text-xl">
					Step 1: Fetch Podcast Data
				</h2>

				<div className="space-y-4">
					<div>
						<label className="mb-2 block font-medium text-sm" htmlFor="podcastId">
							Podcast ID
						</label>
						<input
							id="podcastId"
							type="text"
							value={podcastId}
							onChange={(e) => setPodcastId(e.target.value)}
							placeholder="0x..."
							className="w-full rounded-md border border-gray-300 px-4 py-2 font-mono text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500"
						/>
					</div>

					<button
						onClick={handleFetchPodcast}
						disabled={podcastQuery.isFetching || !podcastId}
						className="w-full rounded-md bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
						type="button"
					>
						{podcastQuery.isFetching ? "Fetching..." : "Fetch Podcast"}
					</button>

					{fetchError && (
						<div className="rounded-md bg-red-50 p-3">
							<p className="text-red-800 text-sm">{fetchError}</p>
						</div>
					)}
				</div>
			</div>

			{/* Podcast Info */}
			{podcast && (
				<div className="mb-6 rounded-lg border border-green-300 bg-white p-6 shadow-sm">
					<h2 className="mb-4 font-semibold text-green-800 text-xl">
						✅ Podcast Data Loaded
					</h2>

					<div className="space-y-3">
						<div>
							<span className="font-medium text-sm">Title:</span>
							<p className="text-gray-700">{podcast.title}</p>
						</div>

						<div>
							<span className="font-medium text-sm">Description:</span>
							<p className="text-gray-600 text-sm">{podcast.description}</p>
						</div>

						<div>
							<span className="font-medium text-sm">Blob ID:</span>
							<p className="break-all font-mono text-gray-700 text-xs">
								{podcast.blobId}
							</p>
						</div>

						<div>
							<span className="font-medium text-sm">Nonce:</span>
							<p className="break-all font-mono text-gray-700 text-xs">
								{podcast.nonce}
							</p>
						</div>
					</div>
				</div>
			)}

			{/* Step 2: Enter Subscription & Play */}
			{podcast && (
				<div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
					<h2 className="mb-4 font-semibold text-xl">
						Step 2: Decrypt & Play
					</h2>

					<div className="space-y-4">
						<div>
							<label
								className="mb-2 block font-medium text-sm"
								htmlFor="channelId"
							>
								Channel ID
							</label>
							<input
								id="channelId"
								type="text"
								value={podcast.channelId}
								onChange={(e) =>
									setPodcast({ ...podcast, channelId: e.target.value })
								}
								placeholder="0x..."
								className="w-full rounded-md border border-gray-300 px-4 py-2 font-mono text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500"
							/>
						</div>

						<div>
							<label
								className="mb-2 block font-medium text-sm"
								htmlFor="subscriptionId"
							>
								Your Subscription ID
							</label>
							<input
								id="subscriptionId"
								type="text"
								value={subscriptionId}
								onChange={(e) => setSubscriptionId(e.target.value)}
								placeholder="0x..."
								className="w-full rounded-md border border-gray-300 px-4 py-2 font-mono text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500"
							/>
						</div>

						<button
							onClick={handlePlay}
							disabled={
								isDecrypting ||
								!sealReady ||
								!account ||
								!subscriptionId ||
								!podcast.channelId
							}
							className="w-full rounded-md bg-green-600 px-6 py-3 font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
							type="button"
						>
							{isDecrypting ? (
								<span className="flex items-center justify-center gap-2">
									<svg
										className="h-5 w-5 animate-spin"
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
									>
										<circle
											className="opacity-25"
											cx="12"
											cy="12"
											r="10"
											stroke="currentColor"
											strokeWidth="4"
										/>
										<path
											className="opacity-75"
											fill="currentColor"
											d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
										/>
									</svg>
									Decrypting...
								</span>
							) : (
								"🔓 Decrypt & Play Audio"
							)}
						</button>

						{decryptError && (
							<div className="rounded-md bg-red-50 p-3">
								<p className="font-semibold text-red-800 text-sm">Error:</p>
								<p className="mt-1 text-red-700 text-sm">{decryptError}</p>
							</div>
						)}
					</div>
				</div>
			)}

			{/* Audio Player */}
			{audioUrl && (
				<div className="mb-6 rounded-lg border border-green-400 bg-white p-6 shadow-lg">
					<div className="mb-4 flex items-center justify-between">
						<h2 className="font-semibold text-green-800 text-xl">
							🎵 Now Playing
						</h2>
						<button
							onClick={handlePlayPause}
							className="rounded-full bg-green-600 p-3 text-white transition-colors hover:bg-green-700"
							type="button"
						>
							{isPlaying ? (
								<svg
									className="h-6 w-6"
									fill="currentColor"
									viewBox="0 0 24 24"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
								</svg>
							) : (
								<svg
									className="h-6 w-6"
									fill="currentColor"
									viewBox="0 0 24 24"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path d="M8 5v14l11-7z" />
								</svg>
							)}
						</button>
					</div>

					{podcast && (
						<div className="mb-4">
							<h3 className="font-semibold text-gray-900">{podcast.title}</h3>
							<p className="text-gray-600 text-sm">{podcast.description}</p>
						</div>
					)}

					<audio
						ref={audioRef}
						src={audioUrl}
						onPlay={() => setIsPlaying(true)}
						onPause={() => setIsPlaying(false)}
						onEnded={() => setIsPlaying(false)}
						controls
						className="w-full"
					/>

					<div className="mt-4 rounded-md bg-green-50 p-3">
						<p className="text-green-800 text-xs">
							✅ Audio successfully decrypted and ready to play!
						</p>
					</div>
				</div>
			)}

			{/* Instructions */}
			<div className="rounded-lg border bg-gray-50 p-6">
				<h3 className="mb-3 font-semibold text-gray-900">📖 Instructions</h3>
				<ol className="ml-4 list-decimal space-y-2 text-gray-700 text-sm">
					<li>
						<strong>Connect your wallet</strong> if you haven't already
					</li>
					<li>
						<strong>Enter the Podcast ID</strong> and click "Fetch Podcast" to
						load the data from blockchain
					</li>
					<li>
						<strong>Enter the Channel ID</strong> that this podcast belongs to
					</li>
					<li>
						<strong>Enter your Subscription ID</strong> - This must be a valid,
						non-expired subscription for the channel
					</li>
					<li>
						<strong>Click "Decrypt & Play"</strong> - The system will verify
						your subscription on-chain and decrypt the audio
					</li>
				</ol>

				<div className="mt-4 rounded-md bg-blue-50 p-3">
					<p className="text-blue-800 text-xs">
						<strong>Note:</strong> This page demonstrates the full flow of
						fetching encrypted podcast data from Sui blockchain and decrypting
						it with Seal using on-chain subscription verification.
					</p>
				</div>
			</div>
		</div>
	);
}
