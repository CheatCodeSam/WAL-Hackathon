/** biome-ignore-all lint/a11y/useMediaCaption: <explanation> */
"use client";

import {
	useCurrentAccount,
	useSignAndExecuteTransaction,
	useSuiClient,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { fromBase64 } from "@mysten/sui/utils";
import { FastForward, Pause, Play, Rewind, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useNetworkVariable } from "~/app/networkConfig";
import { useSeal } from "~/app/SealProvider";
import { Button } from "~/components/ui/button";
import { env } from "~/env";
import type { PodcastView } from "~/services/backend/podcast/lookupPodcast";
import { api } from "~/trpc/react";
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
	const { decrypt, ready, client, sessionKey, initializeSession } = useSeal();

	const audioRef = useRef<HTMLAudioElement>(null);
	const [isPlaying, setIsPlaying] = useState(false);
	const [audioUrl, setAudioUrl] = useState<string | null>(null);

	const {
		status,
		error,
		isOwner,
		isSubscribed,
		setIsOwner,
		setIsSubscribed,
		startDeleting,
		finishDeleting,
		failDeleting,
		startDownloading,
		finishDownloading,
	} = usePodcastPageStore();

	const isSubscribedQuery = api.channel.isAddressSubscribedToChannel.useQuery(
		{
			channelId: podcast.channel_id,
			userAddress: account?.address ?? "",
		},
		{ enabled: !!account?.address },
	);

	useEffect(() => {
		if (isSubscribedQuery.data) {
			setIsSubscribed(
				isSubscribedQuery.data.hasSubscription &&
					isSubscribedQuery.data.isActive,
			);
		}
	}, [isSubscribedQuery.data, setIsSubscribed]);

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

	// Clean up object URL when component unmounts or audioUrl changes
	useEffect(() => {
		return () => {
			if (audioUrl) {
				URL.revokeObjectURL(audioUrl);
			}
		};
	}, [audioUrl]);

	const handlePlayPause = async () => {
		if (!audioRef.current) return;

		if (isPlaying) {
			audioRef.current.pause();
		} else {
			// If we don't have the audio URL yet, we need to download and decrypt
			if (!audioUrl) {
				await handleDecryptAndPlay();
			} else {
				await audioRef.current.play();
			}
		}
	};

	const handleDecryptAndPlay = async () => {
		if (!ready || !client) {
			console.error("Seal client not initialized");
			return;
		}

		if (!account?.address) {
			console.error("Wallet not connected");
			return;
		}

		startDownloading();

		let activeSession = sessionKey;

		try {
			// Ensure session is initialized
			if (!activeSession) {
				console.log("Initializing session...");
				try {
					activeSession = await initializeSession(fundsuiPackageId);
				} catch (e) {
					console.error("Failed to initialize session:", e);
					finishDownloading();
					return;
				}
			}

			// 1. Fetch encrypted audio from Walrus
			const walrusUrl = `${env.NEXT_PUBLIC_WALRUS_AGGREGATOR}/v1/blobs/${podcast.source_file_uri}`;
			const response = await fetch(walrusUrl);

			if (!response.ok) {
				throw new Error(`Failed to fetch encrypted audio: ${response.status}`);
			}

			const encryptedData = fromBase64(await response.text());

			// 2. Create transaction for decryption authorization
			const tx = new Transaction();
			tx.setSender(account.address);

			if (isOwner) {
				tx.moveCall({
					target: `${fundsuiPackageId}::seal_policy::seal_approve_creator`,
					arguments: [
						tx.pure.vector("u8", podcast.nonce as unknown as number[]),
						tx.object(podcast.channel_id),
						tx.object(podcast.id),
					],
				});
			} else {
				tx.moveCall({
					target: `${fundsuiPackageId}::seal_policy::seal_approve_subscription`,
					arguments: [
						tx.pure.vector("u8", podcast.nonce as unknown as number[]),
						tx.object(podcast.channel_id),
						tx.object(podcast.id),
						tx.object.clock(),
					],
				});
			}

			console.log("authorized");

			// 3. Build transaction bytes (without executing)
			const txBytes = await tx.build({
				client: suiClient,
				onlyTransactionKind: true,
			});

			// 4. Decrypt the audio
			if (!activeSession) {
				throw new Error("Session key is missing");
			}

			const decryptedAudio = await client.decrypt({
				data: encryptedData,
				sessionKey: activeSession,
				txBytes,
				checkLEEncoding: false,
				checkShareConsistency: false,
			});

			// 5. Create Blob URL
			const fileType = podcast.file_type || "audio/mp3";
			const blob = new Blob([decryptedAudio as unknown as BlobPart], {
				type: fileType,
			});
			const url = window.URL.createObjectURL(blob);
			setAudioUrl(url);

			// Auto play
			setTimeout(() => {
				if (audioRef.current) {
					audioRef.current.play();
				}
			}, 100);
		} catch (error) {
			console.error("Decrypt failed:", error);
			alert("Failed to play podcast. Please try again.");
		} finally {
			finishDownloading();
		}
	};

	const handleSeek = (seconds: number) => {
		if (audioRef.current) {
			audioRef.current.currentTime = Math.min(
				Math.max(audioRef.current.currentTime + seconds, 0),
				audioRef.current.duration,
			);
		}
	};

	const handleRestart = () => {
		if (audioRef.current) {
			audioRef.current.currentTime = 0;
		}
	};

	return (
		<div className="min-h-screen bg-gray-50 pt-6 pb-12">
			<div className="container mx-auto max-w-3xl px-4">
				{/* Header Actions */}
				<div className="mb-6 flex items-center justify-between">
					<Link href={`/${podcast.owner}`}>
						<Button
							className="-ml-2 text-gray-600 hover:text-gray-900"
							variant="ghost"
						>
							← Back to Channel
						</Button>
					</Link>

					{isOwner && (
						<Button
							className="shadow-sm"
							disabled={status === "deleting"}
							onClick={handleDelete}
							size="sm"
							variant="destructive"
						>
							{status === "deleting" ? "Deleting..." : "Delete Podcast"}
						</Button>
					)}
				</div>

				{/* Error Alert */}
				{error && (
					<div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4 shadow-sm">
						<div className="flex items-center gap-2 font-medium text-red-800">
							<svg
								className="h-5 w-5"
								fill="none"
								stroke="currentColor"
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="2"
								viewBox="0 0 24 24"
								xmlns="http://www.w3.org/2000/svg"
							>
								<title>circle</title>
								<circle cx="12" cy="12" r="10" />
								<line x1="12" x2="12" y1="8" y2="12" />
								<line x1="12" x2="12.01" y1="16" y2="16" />
							</svg>
							Error
						</div>
						<p className="mt-1 text-red-700 text-sm">{error}</p>
					</div>
				)}

				{/* Main Content Card */}
				<div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-md">
					{/* Banner / Visual Area */}
					<div className="relative h-48 w-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
						<div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/10">
							{/* Play Button (Central) */}
							{isOwner || isSubscribed ? (
								<div className="flex items-center gap-4">
									<button
										className="group relative flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
										disabled={status === "downloading" || !ready}
										onClick={handlePlayPause}
										type="button"
									>
										{status === "downloading" ? (
											<div className="h-6 w-6 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
										) : isPlaying ? (
											<Pause className="h-6 w-6 fill-current text-indigo-600" />
										) : (
											<Play className="ml-1 h-6 w-6 fill-current text-indigo-600" />
										)}
									</button>

									{/* Controls - Visible when audio URL is present */}
									{audioUrl && (
										<div className="flex items-center gap-3">
											<button
												className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/30 active:scale-95"
												onClick={() => handleSeek(-15)}
												title="-15 seconds"
												type="button"
											>
												<Rewind className="h-5 w-5 fill-current" />
											</button>
											<button
												className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/30 active:scale-95"
												onClick={() => handleSeek(15)}
												title="+15 seconds"
												type="button"
											>
												<FastForward className="h-5 w-5 fill-current" />
											</button>
											<button
												className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/30 active:scale-95"
												onClick={handleRestart}
												title="Restart"
												type="button"
											>
												<RotateCcw className="h-4 w-4" />
											</button>
										</div>
									)}
								</div>
							) : (
								<div className="flex flex-col items-center gap-2 rounded-lg bg-black/40 px-6 py-3 text-white backdrop-blur-sm">
									<span className="font-medium">Subscribe to Listen</span>
								</div>
							)}
						</div>
					</div>

					{/* Hidden Audio Element */}
					<audio
						onEnded={() => setIsPlaying(false)}
						onError={(e) => console.error("Audio error:", e)}
						onPause={() => setIsPlaying(false)}
						onPlay={() => setIsPlaying(true)}
						ref={audioRef}
						src={audioUrl ?? undefined}
					/>

					{/* Content */}
					<div className="p-8">
						<div className="mb-6">
							<h1 className="mb-3 font-bold text-3xl text-gray-900 leading-tight">
								{podcast.title}
							</h1>
							<div className="flex flex-wrap items-center gap-4 text-gray-500 text-sm">
								<div className="flex items-center gap-1.5">
									<span className="font-medium text-gray-900">By</span>
									<span>{podcast.owner}</span>
								</div>
								<span className="text-gray-300">•</span>
								<span>{new Date(podcast.created_at).toLocaleDateString()}</span>
								<span className="text-gray-300">•</span>
								<span className="rounded bg-gray-100 px-2 py-0.5 font-semibold text-xs uppercase tracking-wider">
									{(podcast.file_type || "audio").split("/")[1] || "Audio"}
								</span>
							</div>
						</div>

						<div className="prose prose-slate max-w-none">
							<h3 className="mb-2 font-semibold text-gray-400 text-sm uppercase tracking-wider">
								About this episode
							</h3>
							<p className="whitespace-pre-wrap text-gray-700 leading-relaxed">
								{podcast.description}
							</p>
						</div>

						{/* Technical Details (collapsed/subtle) */}
						<div className="mt-12 border-gray-100 border-t pt-6">
							<details className="group">
								<summary className="flex cursor-pointer items-center font-medium text-gray-400 text-sm hover:text-gray-600">
									<span>Technical Details</span>
									<svg
										className="ml-2 h-4 w-4 transition-transform group-open:rotate-180"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<title>collapsed</title>
										<path
											d="M19 9l-7 7-7-7"
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
										/>
									</svg>
								</summary>
								<div className="mt-4 grid grid-cols-1 gap-4 text-gray-500 text-xs sm:grid-cols-2">
									<div>
										<span className="block font-medium text-gray-700">ID</span>
										<span className="break-all font-mono">{podcast.id}</span>
									</div>
									<div>
										<span className="block font-medium text-gray-700">
											Blob ID
										</span>
										<span className="break-all font-mono">
											{podcast.source_file_uri}
										</span>
									</div>
									<div>
										<span className="block font-medium text-gray-700">
											Nonce
										</span>
										<span className="break-all font-mono">{podcast.nonce}</span>
									</div>
								</div>
							</details>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
