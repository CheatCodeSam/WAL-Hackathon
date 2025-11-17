"use client";

import {
	useCurrentAccount,
	useSignAndExecuteTransaction,
	useSuiClient,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { uploadImage } from "~/services/walrus-utils";
import { api } from "~/trpc/react";
import { useNetworkVariable } from "../../networkConfig";
import { useChannelEditPageStore } from "./store";

export default function EditChannelPage() {
	const account = useCurrentAccount();
	const router = useRouter();
	const fundsuiPackageId = useNetworkVariable("fundsuiPackageId");
	const fundsuiRegistryId = useNetworkVariable("fundsuiChannelRegistry");
	const suiClient = useSuiClient();
	const { mutateAsync } = useSignAndExecuteTransaction();

	const {
		status,
		error,
		uploadProgress,
		setNoWallet,
		startLoading,
		setLoaded,
		setNoChannel,
		setLoadError,
		startUpdating,
		finishUpdating,
		failUpdating,
		setUploadProgress,
	} = useChannelEditPageStore();

	const channelQuery = api.channel.getChannelByOwner.useQuery(
		account?.address ?? "",
		{
			enabled: !!account?.address,
			retry: false,
			refetchOnWindowFocus: false,
		},
	);

	const form = useForm({
		defaultValues: {
			displayName: "",
			tagline: "",
			description: "",
			profilePicture: null as File | null,
			coverPhoto: null as File | null,
			subscriptionPrice: "",
			maxSubscriptionDurationInWeeks: "",
		},
		onSubmit: async ({ value }) => {
			if (!account?.address || !channelQuery.data) return;

			try {
				startUpdating();

				let profilePictureUri = channelQuery.data.profilePhotoUri;
				if (value.profilePicture) {
					setUploadProgress("Uploading new profile picture to Walrus...");
					const profileResult = await uploadImage(value.profilePicture, {
						maxSize: 5 * 1024 * 1024, // 5MB
						epochs: 10,
						deletable: false,
					});
					profilePictureUri = profileResult.blobId;
				}

				let coverPhotoUri = channelQuery.data.coverPhotoUri;
				if (value.coverPhoto) {
					setUploadProgress("Uploading new cover photo to Walrus...");
					const coverResult = await uploadImage(value.coverPhoto, {
						maxSize: 10 * 1024 * 1024, // 10MB
						epochs: 10,
						deletable: false,
					});
					coverPhotoUri = coverResult.blobId;
				}

				setUploadProgress("Updating channel on blockchain...");

				const tx = new Transaction();

				const subscriptionPriceInMist = value.subscriptionPrice
					? Math.floor(
							Number.parseFloat(value.subscriptionPrice) * 1_000_000_000,
						)
					: channelQuery.data.subscriptionPriceInMist;

				const maxDuration = value.maxSubscriptionDurationInWeeks
					? Number.parseInt(value.maxSubscriptionDurationInWeeks)
					: channelQuery.data.maxSubscriptionDurationInWeeks;

				tx.moveCall({
					arguments: [
						tx.object(fundsuiRegistryId),
						tx.object(channelQuery.data.channelId),
						tx.pure.string(value.displayName || channelQuery.data.displayName),
						tx.pure.string(value.tagline || channelQuery.data.tagLine),
						tx.pure.string(value.description || channelQuery.data.description),
						tx.pure.string(coverPhotoUri),
						tx.pure.string(profilePictureUri),
						tx.pure.u64(subscriptionPriceInMist),
						tx.pure.u8(maxDuration),
					],
					target: `${fundsuiPackageId}::channel::update_channel`,
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
									console.log("Channel updated:", result);
									finishUpdating();
									// Redirect to the user's channel page
									router.push(`/${account.address}`);
								})
								.catch((err) => {
									const errorMessage =
										err instanceof Error ? err.message : "Unknown error";
									failUpdating(
										`Error waiting for transaction: ${errorMessage}`,
									);
								});
						},
						onError: (err) => {
							const errorMessage =
								err instanceof Error ? err.message : "Unknown error";
							failUpdating(`Transaction rejected: ${errorMessage}`);
						},
					},
				);
			} catch (error) {
				console.error("Error updating channel:", error);
				const errorMessage =
					error instanceof Error ? error.message : "Failed to update channel";
				failUpdating(errorMessage);
			}
		},
	});

	useEffect(() => {
		if (!account?.address) {
			setNoWallet();
			return;
		}

		if (channelQuery.isPending) {
			startLoading();
		} else if (channelQuery.isError) {
			setLoadError(
				channelQuery.error?.message || "Failed to load channel data",
			);
		} else if (channelQuery.isSuccess) {
			if (!channelQuery.data) {
				setNoChannel();
			} else {
				const channel = channelQuery.data;
				const priceInSui = channel.subscriptionPriceInMist / 1_000_000_000;

				form.setFieldValue("displayName", channel.displayName);
				form.setFieldValue("tagline", channel.tagLine);
				form.setFieldValue("description", channel.description);
				form.setFieldValue("subscriptionPrice", priceInSui.toString());
				form.setFieldValue(
					"maxSubscriptionDurationInWeeks",
					channel.maxSubscriptionDurationInWeeks.toString(),
				);
				setLoaded();
			}
		}
	}, [
		account?.address,
		channelQuery.isPending,
		channelQuery.isError,
		channelQuery.isSuccess,
		channelQuery.data,
		channelQuery.error,
		setNoWallet,
		startLoading,
		form.setFieldValue,
		setLoadError,
		setNoChannel,
		setLoaded,
	]);

	if (!account?.address) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-gray-50 p-8">
				<div className="mx-auto max-w-md rounded-lg bg-white p-6 text-center shadow-md">
					<h1 className="mb-4 font-bold text-2xl">Wallet Not Connected</h1>
					<p className="text-gray-600">
						Please install and connect your Sui wallet to edit your channel.
					</p>
				</div>
			</div>
		);
	}

	if (status === "loading") {
		return (
			<div className="flex min-h-screen items-center justify-center bg-gray-50 p-8">
				<div className="mx-auto max-w-md rounded-lg bg-white p-6 text-center shadow-md">
					<h1 className="mb-4 font-bold text-2xl">Loading...</h1>
					<p className="text-gray-600">Loading your channel information...</p>
				</div>
			</div>
		);
	}

	if (status === "error") {
		return (
			<div className="flex min-h-screen items-center justify-center bg-gray-50 p-8">
				<div className="mx-auto max-w-md rounded-lg bg-white p-6 text-center shadow-md">
					<h1 className="mb-4 font-bold text-2xl text-red-600">Error</h1>
					<p className="mb-4 text-gray-600">{error}</p>
					<button
						className="rounded-md bg-blue-500 px-6 py-2 font-semibold text-white transition-colors hover:bg-blue-600"
						onClick={() => channelQuery.refetch()}
						type="button"
					>
						Retry
					</button>
				</div>
			</div>
		);
	}

	if (status === "no_channel") {
		return (
			<div className="flex min-h-screen items-center justify-center bg-gray-50 p-8">
				<div className="mx-auto max-w-md rounded-lg bg-white p-6 text-center shadow-md">
					<h1 className="mb-4 font-bold text-2xl text-red-600">
						No Channel Found
					</h1>
					<p className="mb-4 text-gray-600">
						You need to create a channel before you can edit it.
					</p>
					<button
						className="rounded-md bg-blue-500 px-6 py-2 font-semibold text-white transition-colors hover:bg-blue-600"
						onClick={() => router.push("/channel")}
						type="button"
					>
						Go to Create Channel
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-2xl p-6">
			<h1 className="mb-8 font-bold text-3xl">Edit Channel</h1>

			<form
				className="space-y-6"
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
			>
				<form.Field name="displayName">
					{(field) => (
						<div>
							<label
								className="mb-2 block font-medium text-sm"
								htmlFor={field.name}
							>
								Display Name
							</label>
							<input
								className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
								id={field.name}
								name={field.name}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.value)}
								placeholder="Enter your channel name"
								value={field.state.value}
							/>
						</div>
					)}
				</form.Field>

				<form.Field name="tagline">
					{(field) => (
						<div>
							<label
								className="mb-2 block font-medium text-sm"
								htmlFor={field.name}
							>
								Tagline
							</label>
							<input
								className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
								id={field.name}
								name={field.name}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.value)}
								placeholder="A short catchy tagline"
								value={field.state.value}
							/>
						</div>
					)}
				</form.Field>

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
								name={field.name}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.value)}
								placeholder="Describe your channel and what subscribers can expect"
								rows={5}
								value={field.state.value}
							/>
						</div>
					)}
				</form.Field>

				<form.Field name="profilePicture">
					{(field) => (
						<div>
							<label
								className="mb-2 block font-medium text-sm"
								htmlFor={field.name}
							>
								Profile Picture
							</label>
							<p className="mb-2 text-gray-500 text-xs">
								Leave empty to keep current profile picture
							</p>
							<input
								accept="image/*"
								className="w-full rounded-md border border-gray-300 px-4 py-2 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:font-semibold file:text-blue-700 file:text-sm hover:file:bg-blue-100 focus:border-transparent focus:ring-2 focus:ring-blue-500"
								id={field.name}
								name={field.name}
								onBlur={field.handleBlur}
								onChange={(e) => {
									const file = e.target.files?.[0] || null;
									field.handleChange(file);
								}}
								type="file"
							/>
							{field.state.value && (
								<p className="mt-2 text-gray-600 text-sm">
									New file selected: {field.state.value.name}
								</p>
							)}
						</div>
					)}
				</form.Field>

				<form.Field name="coverPhoto">
					{(field) => (
						<div>
							<label
								className="mb-2 block font-medium text-sm"
								htmlFor={field.name}
							>
								Cover Photo
							</label>
							<p className="mb-2 text-gray-500 text-xs">
								Leave empty to keep current cover photo
							</p>
							<input
								accept="image/*"
								className="w-full rounded-md border border-gray-300 px-4 py-2 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:font-semibold file:text-blue-700 file:text-sm hover:file:bg-blue-100 focus:border-transparent focus:ring-2 focus:ring-blue-500"
								id={field.name}
								name={field.name}
								onBlur={field.handleBlur}
								onChange={(e) => {
									const file = e.target.files?.[0] || null;
									field.handleChange(file);
								}}
								type="file"
							/>
							{field.state.value && (
								<p className="mt-2 text-gray-600 text-sm">
									New file selected: {field.state.value.name}
								</p>
							)}
						</div>
					)}
				</form.Field>

				<form.Field name="subscriptionPrice">
					{(field) => (
						<div>
							<label
								className="mb-2 block font-medium text-sm"
								htmlFor={field.name}
							>
								Subscription Price (SUI per week)
							</label>
							<div className="relative">
								<span className="-translate-y-1/2 absolute top-1/2 left-4 text-gray-500">
									SUI
								</span>
								<input
									className="w-full rounded-md border border-gray-300 py-2 pr-4 pl-12 focus:border-transparent focus:ring-2 focus:ring-blue-500"
									id={field.name}
									min="0"
									name={field.name}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder="0.00"
									step="0.01"
									type="number"
									value={field.state.value}
								/>
							</div>
						</div>
					)}
				</form.Field>

				<form.Field name="maxSubscriptionDurationInWeeks">
					{(field) => (
						<div>
							<label
								className="mb-2 block font-medium text-sm"
								htmlFor={field.name}
							>
								Max Subscription Duration (weeks)
							</label>
							<input
								className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
								id={field.name}
								min="1"
								name={field.name}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.value)}
								placeholder="52"
								type="number"
								value={field.state.value}
							/>
						</div>
					)}
				</form.Field>

				{uploadProgress && (
					<div className="rounded-md border border-blue-200 bg-blue-50 p-4">
						<p className="text-blue-700 text-sm">{uploadProgress}</p>
					</div>
				)}

				{error && (
					<div className="rounded-md border border-red-200 bg-red-50 p-4">
						<p className="text-red-700 text-sm">{error}</p>
					</div>
				)}

				<div className="pt-4">
					<button
						className="w-full rounded-md bg-blue-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
						disabled={status === "updating"}
						type="submit"
					>
						{status === "updating" ? "Updating Channel..." : "Update Channel"}
					</button>
				</div>
			</form>
		</div>
	);
}
