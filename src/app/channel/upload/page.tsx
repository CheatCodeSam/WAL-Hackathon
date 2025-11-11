"use client";

import {
	useCurrentAccount,
	useSignAndExecuteTransaction,
	useSuiClient,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { useNetworkVariable } from "~/app/networkConfig";
import { uploadAudio, formatFileSize } from "~/services/walrus-utils";

export default function Upload() {
	const account = useCurrentAccount()!;
	const fundsuiPackageId = useNetworkVariable("fundsuiPackageId");
	const suiClient = useSuiClient();
	const { mutateAsync } = useSignAndExecuteTransaction();
	const [isUploading, setIsUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState("");

	const form = useForm({
		defaultValues: {
			cap: "",
			channel: "",
			title: "",
			description: "",
			sourceFile: null as File | null,
		},
		onSubmit: async ({ value }) => {
			if (!value.sourceFile) {
				alert("Please select an audio file");
				return;
			}

			try {
				// setIsUploading(true);
				// setUploadProgress("Uploading audio to Walrus...");

				// // Upload audio file to Walrus
				// const audioUploadResult = await uploadAudio(value.sourceFile, {
				// 	epochs: 10,
				// 	deletable: false,
				// });

				// setUploadProgress("Creating podcast on blockchain...");

				const tx = new Transaction();

				const id_value = tx.moveCall({
					arguments: [
						tx.object(value.cap),
						tx.object(value.channel),
						tx.pure.string(value.title),
						tx.pure.string(value.description),
						tx.pure.string("audioUploadResult.blobId"),
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
									options: { showEffects: true },
								})
								.then(async (result) => {
									console.log(result);
									setUploadProgress("Podcast created successfully!");
									setTimeout(() => {
										setIsUploading(false);
										setUploadProgress("");
									}, 2000);
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

	return (
		<div className="container mx-auto max-w-2xl py-8">
			<h1 className="mb-6 font-bold text-3xl">Upload Podcast</h1>

			<form
				className="space-y-6"
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
			>
				{/* Cap Field */}
				<form.Field name="cap">
					{(field) => (
						<div>
							<label
								className="mb-2 block font-medium text-sm"
								htmlFor={field.name}
							>
								Cap
							</label>
							<input
								className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
								id={field.name}
								onChange={(e) => field.handleChange(e.target.value)}
								placeholder="Enter cap"
								type="text"
								value={field.state.value}
							/>
						</div>
					)}
				</form.Field>

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
								className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
								id={field.name}
								onChange={(e) => field.handleChange(e.target.value)}
								placeholder="Enter channel ID"
								type="text"
								value={field.state.value}
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
					className="w-full rounded-md bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
					type="submit"
					disabled={isUploading}
				>
					{isUploading ? uploadProgress : "Create Podcast"}
				</button>
			</form>
		</div>
	);
}
