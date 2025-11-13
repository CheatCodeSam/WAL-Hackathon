"use client";

import {
	useCurrentAccount,
	useSuiClient,
} from "@mysten/dapp-kit";
import { useForm } from "@tanstack/react-form";
import { useState, useRef, useEffect } from "react";
import { useNetworkVariable } from "~/app/networkConfig";
import { useSealAudioPlayer } from "~/hooks/useSealAudioPlayer";
import { useSeal } from "~/app/SealProvider";

export default function DecryptPage() {
	const account = useCurrentAccount();
	const fundsuiPackageId = useNetworkVariable("fundsuiPackageId");
	const suiClient = useSuiClient();
	const { ready: sealReady } = useSeal();
	const { decryptAndPlayAudio, isDecrypting, error: decryptError } =
		useSealAudioPlayer();

	const [audioUrl, setAudioUrl] = useState<string | null>(null);
	const [isPlaying, setIsPlaying] = useState(false);
	const [decryptStatus, setDecryptStatus] = useState("");
	const audioRef = useRef<HTMLAudioElement>(null);

	const form = useForm({
		defaultValues: {
			blobId: "",
			nonce: "",
			channelId: "",
			podcastId: "",
			subscriptionId: "",
		},
		onSubmit: async ({ value }) => {
			if (!sealReady) {
				alert("Seal encryption is not ready. Please wait...");
				return;
			}

			if (!account) {
				alert("Please connect your wallet first");
				return;
			}

			try {
				setDecryptStatus("Fetching encrypted audio from Walrus...");

				const url = await decryptAndPlayAudio({
					blobId: value.blobId,
					nonce: value.nonce,
					channelId: value.channelId,
					podcastId: value.podcastId,
					subscriptionObjectId: value.subscriptionId,
				});

				setAudioUrl(url);
				setDecryptStatus("Decryption successful! Audio ready to play.");

				// Auto-play
				setTimeout(() => {
					if (audioRef.current) {
						audioRef.current
							.play()
							.catch((err) => console.error("Auto-play failed:", err));
					}
				}, 100);
			} catch (error) {
				console.error("Decryption error:", error);
				setDecryptStatus(
					`Decryption failed: ${error instanceof Error ? error.message : "Unknown error"}`,
				);
			}
		},
	});

	// Cleanup audio URL on unmount
	useEffect(() => {
		return () => {
			if (audioUrl) {
				URL.revokeObjectURL(audioUrl);
			}
		};
	}, [audioUrl]);

	const handlePlayPause = () => {
		if (!audioRef.current) return;

		if (isPlaying) {
			audioRef.current.pause();
		} else {
			audioRef.current.play();
		}
	};

	return (
		<div className="container mx-auto max-w-2xl py-8">
			<div className="mb-6">
				<h1 className="font-bold text-3xl">Decrypt & Play Podcast</h1>
				<p className="mt-2 text-gray-600">
					Test encrypted podcast decryption with Seal
				</p>
			</div>

			{/* Connection Status */}
			<div className="mb-6 rounded-lg border bg-white p-4 shadow-sm">
				<div className="flex items-center justify-between">
					<div>
						<h3 className="font-semibold text-sm">Connection Status</h3>
						<div className="mt-1 space-y-1 text-xs">
							<div className="flex items-center gap-2">
								<span
									className={`h-2 w-2 rounded-full ${account ? "bg-green-500" : "bg-red-500"}`}
								/>
								<span>
									Wallet: {account ? `Connected (${account.address.slice(0, 8)}...)` : "Not connected"}
								</span>
							</div>
							<div className="flex items-center gap-2">
								<span
									className={`h-2 w-2 rounded-full ${sealReady ? "bg-green-500" : "bg-yellow-500"}`}
								/>
								<span>Seal: {sealReady ? "Ready" : "Initializing..."}</span>
							</div>
						</div>
					</div>
					{!account && (
						<span className="text-red-600 text-xs">
							⚠️ Please connect wallet
						</span>
					)}
				</div>
			</div>

			<form
				className="space-y-6"
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
			>
				{/* Blob ID Field */}
				<form.Field name="blobId">
					{(field) => (
						<div>
							<label
								className="mb-2 block font-medium text-sm"
								htmlFor={field.name}
							>
								Blob ID
								<span className="ml-1 text-gray-500 text-xs">
									(Walrus blob ID of encrypted audio)
								</span>
							</label>
							<input
								className="w-full rounded-md border border-gray-300 px-4 py-2 font-mono text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500"
								id={field.name}
								onChange={(e) => field.handleChange(e.target.value)}
								placeholder="0xabc123..."
								type="text"
								value={field.state.value}
							/>
						</div>
					)}
				</form.Field>

				{/* Nonce Field */}
				<form.Field name="nonce">
					{(field) => (
						<div>
							<label
								className="mb-2 block font-medium text-sm"
								htmlFor={field.name}
							>
								Nonce
								<span className="ml-1 text-gray-500 text-xs">
									(Encryption nonce from podcast)
								</span>
							</label>
							<input
								className="w-full rounded-md border border-gray-300 px-4 py-2 font-mono text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500"
								id={field.name}
								onChange={(e) => field.handleChange(e.target.value)}
								placeholder="a1b2c3d4e5f6..."
								type="text"
								value={field.state.value}
							/>
						</div>
					)}
				</form.Field>

				{/* Channel ID Field */}
				<form.Field name="channelId">
					{(field) => (
						<div>
							<label
								className="mb-2 block font-medium text-sm"
								htmlFor={field.name}
							>
								Channel ID
								<span className="ml-1 text-gray-500 text-xs">
									(Channel object ID)
								</span>
							</label>
							<input
								className="w-full rounded-md border border-gray-300 px-4 py-2 font-mono text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500"
								id={field.name}
								onChange={(e) => field.handleChange(e.target.value)}
								placeholder="0x456..."
								type="text"
								value={field.state.value}
							/>
						</div>
					)}
				</form.Field>

				{/* Podcast ID Field */}
				<form.Field name="podcastId">
					{(field) => (
						<div>
							<label
								className="mb-2 block font-medium text-sm"
								htmlFor={field.name}
							>
								Podcast ID
								<span className="ml-1 text-gray-500 text-xs">
									(Podcast object ID)
								</span>
							</label>
							<input
								className="w-full rounded-md border border-gray-300 px-4 py-2 font-mono text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500"
								id={field.name}
								onChange={(e) => field.handleChange(e.target.value)}
								placeholder="0x789..."
								type="text"
								value={field.state.value}
							/>
						</div>
					)}
				</form.Field>

				{/* Subscription ID Field */}
				<form.Field name="subscriptionId">
					{(field) => (
						<div>
							<label
								className="mb-2 block font-medium text-sm"
								htmlFor={field.name}
							>
								Subscription ID
								<span className="ml-1 text-gray-500 text-xs">
									(Your subscription object ID)
								</span>
							</label>
							<input
								className="w-full rounded-md border border-gray-300 px-4 py-2 font-mono text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500"
								id={field.name}
								onChange={(e) => field.handleChange(e.target.value)}
								placeholder="0xdef..."
								type="text"
								value={field.state.value}
							/>
						</div>
					)}
				</form.Field>

				{/* Submit Button */}
				<button
					className="w-full rounded-md bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
					type="submit"
					disabled={isDecrypting || !sealReady || !account}
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
						"🔓 Decrypt & Play"
					)}
				</button>
			</form>

			{/* Status Messages */}
			{decryptStatus && (
				<div
					className={`mt-6 rounded-lg border p-4 ${
						decryptStatus.includes("failed")
							? "border-red-300 bg-red-50"
							: decryptStatus.includes("successful")
								? "border-green-300 bg-green-50"
								: "border-blue-300 bg-blue-50"
					}`}
				>
					<p
						className={`text-sm ${
							decryptStatus.includes("failed")
								? "text-red-800"
								: decryptStatus.includes("successful")
									? "text-green-800"
									: "text-blue-800"
						}`}
					>
						{decryptStatus}
					</p>
				</div>
			)}

			{/* Error Display */}
			{decryptError && (
				<div className="mt-6 rounded-lg border border-red-300 bg-red-50 p-4">
					<h3 className="font-semibold text-red-800 text-sm">
						Decryption Error
					</h3>
					<p className="mt-1 text-red-700 text-sm">{decryptError}</p>
					<div className="mt-3 space-y-1 text-xs text-red-600">
						<p>
							<strong>Common issues:</strong>
						</p>
						<ul className="ml-4 list-disc">
							<li>Subscription expired or invalid</li>
							<li>Subscription doesn't match this channel</li>
							<li>Incorrect podcast or channel ID</li>
							<li>Nonce doesn't match podcast</li>
						</ul>
					</div>
				</div>
			)}

			{/* Audio Player */}
			{audioUrl && (
				<div className="mt-6 rounded-lg border border-green-300 bg-white p-6 shadow-sm">
					<div className="mb-4 flex items-center justify-between">
						<h3 className="font-semibold text-green-800 text-lg">
							🎵 Decrypted Audio Ready
						</h3>
						<button
							onClick={handlePlayPause}
							className="rounded-full bg-green-600 p-3 text-white transition-colors hover:bg-green-700"
							type="button"
						>
							{isPlaying ? (
								// Pause icon
								<svg
									className="h-6 w-6"
									fill="currentColor"
									viewBox="0 0 24 24"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
								</svg>
							) : (
								// Play icon
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
						<p className="text-green-700 text-xs">
							✅ Audio successfully decrypted! You can now play it using the
							controls above.
						</p>
					</div>
				</div>
			)}

			{/* Help Section */}
			<div className="mt-8 rounded-lg border bg-gray-50 p-6">
				<h3 className="mb-3 font-semibold text-gray-900">
					ℹ️ How to use this page
				</h3>
				<ol className="ml-4 list-decimal space-y-2 text-gray-700 text-sm">
					<li>
						<strong>Connect your wallet</strong> - Make sure you're connected
						with the account that owns the subscription
					</li>
					<li>
						<strong>Get the Blob ID</strong> - From the podcast's
						source_file_blob_id field on-chain
					</li>
					<li>
						<strong>Get the Nonce</strong> - From the podcast's nouce field
						on-chain
					</li>
					<li>
						<strong>Get Channel & Podcast IDs</strong> - The object IDs from
						Sui blockchain
					</li>
					<li>
						<strong>Get Subscription ID</strong> - Your subscription object ID
						that you own
					</li>
					<li>
						<strong>Click Decrypt & Play</strong> - The system will verify your
						subscription and decrypt the audio
					</li>
				</ol>

				<div className="mt-4 rounded-md bg-blue-50 p-3">
					<p className="text-blue-800 text-xs">
						<strong>Security Note:</strong> The decryption process verifies
						your subscription on-chain before allowing access. If the
						subscription is expired or doesn't match the channel, decryption
						will fail.
					</p>
				</div>
			</div>

			{/* Example Values (for testing) */}
			<div className="mt-6 rounded-lg border bg-yellow-50 p-6">
				<h3 className="mb-3 font-semibold text-yellow-900">
					🧪 Example Format
				</h3>
				<div className="space-y-2 font-mono text-xs text-yellow-800">
					<div>
						<strong>Blob ID:</strong>{" "}
						0xabc123def456789abc123def456789abc123def456789abc123def456789abcd
					</div>
					<div>
						<strong>Nonce:</strong>{" "}
						a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2
					</div>
					<div>
						<strong>Channel ID:</strong>{" "}
						0x123456789abcdef123456789abcdef123456789abcdef123456789abcdef12
					</div>
					<div>
						<strong>Podcast ID:</strong>{" "}
						0xfedcba987654321fedcba987654321fedcba987654321fedcba987654321fed
					</div>
					<div>
						<strong>Subscription ID:</strong>{" "}
						0x555666777888999555666777888999555666777888999555666777888999555
					</div>
				</div>
			</div>
		</div>
	);
}
