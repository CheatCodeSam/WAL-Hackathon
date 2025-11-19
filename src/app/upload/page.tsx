"use client";

import {
	useCurrentAccount,
	useSignAndExecuteTransaction,
	useSuiClient,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { fromHex } from "@mysten/sui/utils";
import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useNetworkVariable } from "~/app/networkConfig";
import { useSeal } from "~/app/SealProvider";
import { formatFileSize, uploadEncryptedAudio } from "~/services/walrus-utils";
import { api } from "~/trpc/react";
import { useUploadPageStore } from "./store";

export default function Upload() {
	const account = useCurrentAccount();
	const router = useRouter();
	const fundsuiPackageId = useNetworkVariable("fundsuiPackageId");
	const fundsuiRegistryId = useNetworkVariable("fundsuiChannelRegistry");
	const suiClient = useSuiClient();
	const { mutateAsync } = useSignAndExecuteTransaction();
	const { encrypt, ready: sealReady } = useSeal();

	const {
		status,
		error,
		uploadProgress,
		redirectUrl,
		canSubmit,
		startLoadingChannel,
		setChannelReady,
		setNoChannel,
		setLoadingError,
		startUploading,
		updateProgress,
		rejectTransaction,
		finishUpload,
		failUpload,
	} = useUploadPageStore();

	const channelQuery = api.channel.getChannelByOwner.useQuery(
		account?.address || "",
		{ enabled: !!account?.address },
	);

	// Handle channel loading
	useEffect(() => {
		if (!account?.address) {
			return;
		}

		if (channelQuery.isLoading) {
			startLoadingChannel();
		} else if (channelQuery.isError) {
			setLoadingError(channelQuery.error?.message ?? "Failed to load channel");
		} else if (channelQuery.data === null) {
			setNoChannel();
		} else if (channelQuery.data) {
			setChannelReady();
		}
	}, [
		account?.address,
		channelQuery.isLoading,
		channelQuery.isError,
		channelQuery.error,
		channelQuery.data,
		startLoadingChannel,
		setChannelReady,
		setNoChannel,
		setLoadingError,
	]);

	// Redirect to 404 if no channel
	useEffect(() => {
		if (status === "no_channel") {
			router.push("/404");
		}
	}, [status, router]);

	// Redirect to podcast page on success
	useEffect(() => {
		if (status === "success" && redirectUrl) {
			router.push(redirectUrl);
		}
	}, [status, redirectUrl, router]);

	const form = useForm({
		defaultValues: {
			channel: channelQuery.data?.channelId ?? "",
			title: "",
			description: "",
			sourceFile: null as File | null,
		},
		onSubmit: async ({ value }) => {
			if (!canSubmit()) {
				return;
			}

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
				startUploading("Encrypting audio file...");

				// Encrypt and upload audio file to Walrus
				const audioUploadResult = await uploadEncryptedAudio(
					value.sourceFile,
					value.channel, // channel ID
					fundsuiPackageId,
					encrypt,
					{
						epochs: 10,
						deletable: false,
					},
				);

				updateProgress("Creating podcast on blockchain...");

				const sealKeyIdBytes = fromHex(audioUploadResult.nonce);

				const tx = new Transaction();

				const id_value = tx.moveCall({
					arguments: [
						tx.object(value.channel),
						tx.object(fundsuiRegistryId),
						tx.pure.string(value.title),
						tx.pure.vector("u8", sealKeyIdBytes),
						tx.pure.string(value.description),
						tx.pure.string(audioUploadResult.blobId),
					],
					target: `${fundsuiPackageId}::podcast::new`,
				});

				console.log(id_value);

				await mutateAsync(
					{
						transaction: tx,
					},
					{
						onSuccess: (tx) => {
							suiClient
								.waitForTransaction({
									digest: tx.digest,
									options: { showEffects: true, showObjectChanges: true },
								})
								.then(async (result) => {
									console.log(result);

									// Extract the podcast ID from the transaction result
									const podcastObject = result.objectChanges?.find(
										(change) =>
											change.type === "created" &&
											change.objectType.includes("::podcast::Podcast"),
									);

									if (podcastObject && podcastObject.type === "created") {
										finishUpload(value.channel, podcastObject.objectId);
									} else {
										failUpload("Failed to get podcast ID from transaction");
									}
								})
								.catch((error) => {
									console.error("Transaction wait error:", error);
									failUpload(
										error instanceof Error
											? error.message
											: "Transaction failed",
									);
								});
						},
						onError: (error) => {
							console.error("Transaction error:", error);
							// Check if user rejected the transaction
							if (
								error.message?.includes("rejected") ||
								error.message?.includes("User rejected")
							) {
								rejectTransaction("Transaction rejected by user");
							} else {
								failUpload(error.message ?? "Transaction failed");
							}
						},
					},
				);
			} catch (error) {
				console.error("Upload error:", error);
				failUpload(error instanceof Error ? error.message : "Unknown error");
			}
		},
	});

	// Update channel field when channel data loads
	useEffect(() => {
		if (channelQuery.data?.channelId) {
			form.setFieldValue("channel", channelQuery.data.channelId);
		}
	}, [channelQuery.data, form.setFieldValue]);

	// Show loading state
	if (status === "loading_channel") {
		return (
			<div className="container mx-auto max-w-2xl py-8">
				<h1 className="mb-6 font-bold text-3xl">Upload Podcast</h1>
				<div className="text-center py-12">
					<p className="text-gray-600">Loading channel information...</p>
				</div>
			</div>
		);
	}

	const isSubmitting = status === "uploading";
	const isRejected = status === "transaction_rejected";

	return (
		<div className="container mx-auto max-w-2xl py-8">
			<h1 className="mb-6 font-bold text-3xl">Upload Podcast</h1>

			{error && (
				<div
					className={`mb-4 rounded-md p-4 ${isRejected ? "bg-red-50 text-red-800" : "bg-yellow-50 text-yellow-800"}`}
				>
					{error}
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
				{/* Channel ID Field */}
				<form.Field name="channel">
					{(field) => (
						<div>
							<label
								className="mb-2 block font-medium text-sm"
								htmlFor={field.name}
							>
								Channel ID
							</label>
							<input
								className="w-full rounded-md border border-gray-300 bg-gray-100 px-4 py-2 cursor-not-allowed"
								id={field.name}
								onChange={(e) => field.handleChange(e.target.value)}
								placeholder="Enter channel ID"
								type="text"
								value={field.state.value}
								disabled
							/>
						</div>
					)}
				</form.Field>

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
					className={`w-full rounded-md px-6 py-3 font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
						isRejected
							? "bg-red-600 hover:bg-red-700"
							: "bg-blue-600 hover:bg-blue-700"
					}`}
					type="submit"
					disabled={!canSubmit() || isSubmitting}
				>
					{isSubmitting
						? uploadProgress
						: isRejected
							? "Try Again"
							: "Create Podcast"}
				</button>
			</form>
		</div>
	);
}
