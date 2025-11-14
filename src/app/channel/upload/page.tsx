"use client";

import {
	useCurrentAccount,
	useSignAndExecuteTransaction,
	useSuiClient,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { useForm } from "@tanstack/react-form";
import { useEffect, useRef, useState } from "react";
import { useNetworkVariable } from "~/app/networkConfig";
import {
	uploadEncryptedAudio,
	formatFileSize,
} from "~/services/walrus-utils";
import { useSeal } from "~/app/SealProvider";
import { getUserDetails } from "~/services/api";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

export default function Upload() {
	const account = useCurrentAccount()!;
	const fundsuiPackageId = useNetworkVariable("fundsuiPackageId");
	const suiClient = useSuiClient();
	const { mutateAsync } = useSignAndExecuteTransaction();
	const { encrypt, ready: sealReady } = useSeal();
	const router = useRouter();
	const pathname = usePathname();
	const [isUploading, setIsUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState("");
	const [missingChannel, setMissingChannel] = useState(false);
	const [pendingRedirect, setPendingRedirect] = useState(false);
	const [redirectCountdown, setRedirectCountdown] = useState(5);
	const [redirectTarget, setRedirectTarget] = useState<string | null>(null);
	const redirectIntervalRef = useRef<any>(null);
	const redirectTimeoutRef = useRef<any>(null);

	const form = useForm({
		defaultValues: {
			title: "",
			description: "",
			sourceFile: null as File | null,
		},
		onSubmit: async ({ value }) => {
			if (!value.sourceFile) {
				alert("Please select an audio file");
				return;
			}

			const file = value.sourceFile;

			// MIME type from the File object
			const mimeType = file.type || "";

			// Extension fallback
			const extension = file.name.split(".").pop()?.toLowerCase() ?? "";

			// Quick audio check
			const audioExtensions = ["mp3", "wav", "m4a", "ogg", "flac", "aac"];
			const isAudio =
				mimeType.startsWith("audio/") || audioExtensions.includes(extension);

			if (!isAudio) {
				alert("Selected file is not a supported audio file.");
				return;
			}

			if (!sealReady) {
				alert("Seal encryption is not ready. Please wait...");
				return;
			}

			try {
				setIsUploading(true);
				// Ensure user exists and has a channel
				if (!account?.address) {
					setUploadProgress("Connect your wallet to continue.");
					setIsUploading(false);
					return;
				}
				setUploadProgress("Checking user profile...");
				const user = await getUserDetails(account.address);
				if (!user) {
					const returnTo = pathname || "/channel/upload";
					setUploadProgress("No user profile found. Redirecting to signup...");
					router.replace(`/auth/signup?returnTo=${encodeURIComponent(returnTo)}`);
					setIsUploading(false);
					return;
				}
				if (!user.channel_id) {
					setUploadProgress("No channel found for this profile. Create a channel first.");
					setMissingChannel(true);
					setIsUploading(false);
					return;
				}

				setUploadProgress("Encrypting audio file...");

				// Encrypt and upload audio file to Walrus
				const audioUploadResult = await uploadEncryptedAudio(
					value.sourceFile,
					user.channel_id,
					fundsuiPackageId,
					encrypt,
					{
						epochs: 10,
						deletable: false,
					},
				);

				setUploadProgress("Creating podcast on blockchain...");

				const tx = new Transaction();

				tx.moveCall({
					target: `${fundsuiPackageId}::podcast::new`,
					arguments: [
						// user & channel objects per Move signature
						tx.object(user.id),
						tx.object(user.channel_id),
						tx.pure.string(value.title),
						tx.pure.string(value.description),
						tx.pure.string(audioUploadResult.blobId),
						tx.pure.string(mimeType),
						tx.pure.string(audioUploadResult.nonce),
					],
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
									console.log(result);
									// Prepare banner + auto-redirect to the creator's channel page
									const channelId = user.channel_id;
									if (channelId) {
										setUploadProgress("Podcast created successfully! Redirecting to your channel...");
										setPendingRedirect(true);
										setRedirectCountdown(5);
										setRedirectTarget(`/${channelId}`);
										// start countdown and redirect
										redirectIntervalRef.current = setInterval(() => {
											setRedirectCountdown((s) => (s > 0 ? s - 1 : 0));
										}, 1000);
										redirectTimeoutRef.current = setTimeout(() => {
											router.push(`/${channelId}`);
										}, 5000);
									} else {
										// Fallback if channel id missing unexpectedly
										setUploadProgress("Podcast created successfully!");
									}
								});
						},
					},
				);
			} catch (error) {
				console.error("Upload error:", error);
				alert(`Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`);
				setIsUploading(false);
				setUploadProgress("");
			}
		},
	});

	// Cleanup timers on unmount
	useEffect(() => {
		return () => {
			if (redirectIntervalRef.current) clearInterval(redirectIntervalRef.current);
			if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current);
		};
	}, []);

	const stayHere = () => {
		if (redirectIntervalRef.current) clearInterval(redirectIntervalRef.current);
		if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current);
		setPendingRedirect(false);
		setRedirectTarget(null);
		setRedirectCountdown(5);
	};

	// On mount: ensure the user is signed up; else redirect to signup with returnTo
	useEffect(() => {
		let cancelled = false;
		const check = async () => {
			if (!account?.address) return;
			try {
				const user = await getUserDetails(account.address);
				if (!cancelled && !user) {
					const returnTo = pathname || "/channel/upload";
					setUploadProgress("No user profile found. Redirecting to signup...");
					setTimeout(() => {
						router.replace(`/auth/signup?returnTo=${encodeURIComponent(returnTo)}`);
					}, 100);
				}
				if (!cancelled && user && !user.channel_id) {
					setUploadProgress("No channel found for this profile. Create a channel first.");
					setMissingChannel(true);
				}
			} catch {
				// ignore and allow user to try flow
			}
		};
		check();
		return () => {
			cancelled = true;
		};
	}, [account?.address, pathname, router]);

	return (
		<div className="container mx-auto max-w-2xl py-8">
			<h1 className="mb-6 font-bold text-3xl">Upload Podcast</h1>

			{uploadProgress && (
				<div className="mb-4 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
					{uploadProgress}
				</div>
			)}

			{missingChannel && (
				<div className="mb-4 flex items-center justify-between rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
					<div>You need to create a channel before uploading podcasts.</div>
					<Link
						className="rounded-md bg-blue-600 px-3 py-1 text-white hover:bg-blue-700"
						href={`/channel?returnTo=${encodeURIComponent(pathname || "/channel/upload")}`}
					>
						Create channel
					</Link>
				</div>
			)}

			{pendingRedirect && redirectTarget && (
				<div className="mb-4 flex items-center justify-between rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
					<div>
						Redirecting to your channel in {redirectCountdown}s.
					</div>
					<div className="space-x-2">
						<button
							type="button"
							onClick={() => router.push(redirectTarget)}
							className="rounded-md bg-green-600 px-3 py-1 text-white hover:bg-green-700"
						>
							Go now
						</button>
						<button
							type="button"
							onClick={stayHere}
							className="rounded-md border px-3 py-1 hover:bg-white/60"
						>
							Stay here
						</button>
					</div>
				</div>
			)}

			<form
				className="space-y-6"
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
			>
				{/* Channel derived from user details; no manual inputs needed */}

				{/* Title Field */}
				<form.Field name="title">
					{(field) => (
						<div>
							<label
								className="mb-2 block font-medium text-sm"
								htmlFor={field.name}
							>
								Podcast Title
							</label>
							<input
								className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
								id={field.name}
								onChange={(e) => field.handleChange(e.target.value)}
								placeholder="Enter podcast title"
								type="text"
								value={field.state.value}
							/>
						</div>
					)}
				</form.Field>

				{/* Description Field */}
				<form.Field name="description">
					{(field) => (
						<div>
							<label
								className="mb-2 block font-medium text-sm"
								htmlFor={field.name}
							>
								Description
							</label>
							<textarea
								className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
								id={field.name}
								onChange={(e) => field.handleChange(e.target.value)}
								placeholder="Enter podcast description"
								rows={5}
								value={field.state.value}
							/>
						</div>
					)}
				</form.Field>

				{/* Source File Upload */}
				<form.Field name="sourceFile">
					{(field) => (
						<div>
							<label
								className="mb-2 block font-medium text-sm"
								htmlFor={field.name}
							>
								Audio File
							</label>
							<div className="flex flex-col gap-2">
								<input
									accept="audio/*"
									className="w-full rounded-md border border-gray-300 px-4 py-2 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:font-semibold file:text-blue-700 file:text-sm hover:file:bg-blue-100 focus:border-transparent focus:ring-2 focus:ring-blue-500"
									id={field.name}
									onChange={(e) => {
										const file = e.target.files?.[0] || null;
										field.handleChange(file);
									}}
									type="file"
								/>
								{field.state.value && (
									<div className="text-gray-600 text-sm">
										Selected: {field.state.value.name} (
										{formatFileSize(field.state.value.size)})
									</div>
								)}
							</div>
						</div>
					)}
				</form.Field>

				{/* Submit Button */}
				<button
					className="w-full rounded-md bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
					type="submit"
					disabled={isUploading || missingChannel}
				>
					{isUploading ? uploadProgress : "Create Podcast"}
				</button>
			</form>
		</div>
	);
}
