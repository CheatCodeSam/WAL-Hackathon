"use client";

import {
	useCurrentAccount,
	useSignAndExecuteTransaction,
	useSuiClient,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { useForm } from "@tanstack/react-form";
import { useEffect, useState } from "react";
import { uploadImage } from "~/services/walrus-utils";
import { useNetworkVariable } from "../networkConfig";
import { getUserDetails } from "~/services/api";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function CreateChannelPage() {
	const account = useCurrentAccount()!;
	const fundsuiPackageId = useNetworkVariable("fundsuiPackageId");
	const suiClient = useSuiClient();
	const { mutateAsync } = useSignAndExecuteTransaction();
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const rawReturnTo = searchParams?.get('returnTo') || null;
	const safeReturnTo = rawReturnTo && rawReturnTo.startsWith('/') && !rawReturnTo.startsWith('//') && !/^[a-zA-Z]+:/.test(rawReturnTo) && rawReturnTo.length <= 200 ? rawReturnTo : null;

	const [isUploading, setIsUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState<string>("");
	const [existingChannelId, setExistingChannelId] = useState<string | null>(null);

	const form = useForm({
		defaultValues: {
			displayName: "",
			tagline: "",
			description: "",
			profilePicture: null as File | null,
			coverPhoto: null as File | null,
			subscriptionPrice: "",
		},
		onSubmit: async ({ value }) => {
			try {
				// Ensure the user has an on-chain User object before proceeding
				if (!account?.address) {
					setUploadProgress("Connect your wallet to continue.");
					return;
				}
				setUploadProgress("Checking user profile...");
				const user = await getUserDetails(account.address);
				if (!user) {
					setUploadProgress("No user profile found. Redirecting to signup...");
					const returnTo = pathname || "/channel";
					router.replace(`/auth/signup?returnTo=${encodeURIComponent(returnTo)}`);
					return;
				}
				// Restrict multiple channels per user
				if (user.channel_id) {
					setUploadProgress("You already have a channel linked to this profile. Creating another is not allowed.");
					setExistingChannelId(user.channel_id);
					return;
				}

				setIsUploading(true);
				setUploadProgress("Uploading images to Walrus...");

				// Upload profile picture
				let profilePictureUri = "Testing";
				if (value.profilePicture) {
					setUploadProgress("Uploading profile picture...");
					const profileResult = await uploadImage(value.profilePicture, {
						maxSize: 5 * 1024 * 1024, // 5MB
						epochs: 10,
						deletable: false,
					});
					profilePictureUri = profileResult.blobId;
				}

				// Upload cover photo
				let coverPhotoUri = "Testing";
				if (value.coverPhoto) {
					setUploadProgress("Uploading cover photo...");
					const coverResult = await uploadImage(value.coverPhoto, {
						maxSize: 10 * 1024 * 1024, // 10MB
						epochs: 10,
						deletable: false,
					});
					coverPhotoUri = coverResult.blobId;
				}

				setUploadProgress("Creating channel on blockchain...");

				const tx = new Transaction();

				tx.moveCall({
					arguments: [
						tx.object(user.id),
						tx.pure.string(value.displayName),
						tx.pure.string(value.tagline),
						tx.pure.string(value.description),
						tx.pure.string(coverPhotoUri || ""),
						tx.pure.string(profilePictureUri || ""),
						tx.pure.u64(10000),
						tx.pure.u8(3),
					],
					target: `${fundsuiPackageId}::channel::new`,
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
									options: { showEffects: true, showObjectChanges: true },
								})
								.then(async (result) => {
									console.log(result);
									// Try to find the created Channel object from objectChanges
									let channelId: string | null = null;
									const changes = (result as any)?.objectChanges as Array<any> | undefined;
									if (Array.isArray(changes)) {
										for (const ch of changes) {
											if (ch.type === "created" && typeof ch.objectType === "string" && ch.objectType.includes("::channel::Channel")) {
												channelId = ch.objectId as string;
												break;
											}
										}
									}

									// Fallback: re-fetch user to read channel_id after mutation
									if (!channelId && account?.address) {
										try {
											const u = await getUserDetails(account.address);
											channelId = u?.channel_id ?? null;
										} catch {}
									}

									if (channelId) {
										// If we have an originating returnTo, prefer returning there
										if (safeReturnTo) {
											setUploadProgress("Channel created successfully! Redirecting...");
											router.replace(safeReturnTo);
											return;
										}
										setUploadProgress("Channel created successfully! Redirecting...");
										router.push(`/${channelId}`);
									} else {
										setUploadProgress("Channel created successfully! (Couldn’t resolve channel id automatically)");
									}
								});
						},
					},
				);
			} catch (error) {
				console.error("Error creating channel:", error);
				setUploadProgress(
					`Error: ${error instanceof Error ? error.message : "Failed to create channel"}`,
				);
			} finally {
				setIsUploading(false);
			}
		},
	});

	// On mount: if wallet connected but user doesn't exist, redirect to signup with returnTo
	// Keeps form flow snappy and avoids wasted uploads.
	// We retain the onSubmit guard as a safety net.
	// eslint-disable-next-line react-hooks/exhaustive-deps
	useEffect(() => {
		let cancelled = false;
		const check = async () => {
			if (!account?.address) return;
			try {
				const user = await getUserDetails(account.address);
				if (!cancelled && !user) {
					const returnTo = pathname || "/channel";
					router.replace(`/auth/signup?returnTo=${encodeURIComponent(returnTo)}`);
				}
				// If user has an existing channel, notify them to avoid confusion
				if (!cancelled && user?.channel_id) {
					setUploadProgress("You already have a channel linked to this profile.");
					setExistingChannelId(user.channel_id);
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
		<div className="mx-auto max-w-2xl p-6">
			<h1 className="mb-8 font-bold text-3xl">Create New Channel</h1>

			{existingChannelId && (
				<div className="mb-6 rounded-md border border-yellow-200 bg-yellow-50 p-4">
					<p className="text-yellow-800">
						You already have a channel linked to this profile. Creating another isn’t allowed.
					</p>
					<div className="mt-3">
						<Link
							className="inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
							href={`/${existingChannelId}`}
						>
							View my channel
						</Link>
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
									Selected: {field.state.value.name}
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
									Selected: {field.state.value.name}
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
								Subscription Price
							</label>
							<div className="relative">
								<span className="-translate-y-1/2 absolute top-1/2 left-4 text-gray-500">
									$
								</span>
								<input
									className="w-full rounded-md border border-gray-300 py-2 pr-4 pl-8 focus:border-transparent focus:ring-2 focus:ring-blue-500"
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

				{uploadProgress && (
					<div className="rounded-md border border-blue-200 bg-blue-50 p-4">
						<p className="text-blue-700 text-sm">{uploadProgress}</p>
					</div>
				)}

				<div className="pt-4">
					<button
						className="w-full rounded-md bg-blue-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
						disabled={isUploading || !!existingChannelId}
						type="submit"
					>
						{isUploading ? "Creating Channel..." : "Create Channel"}
					</button>
				</div>
			</form>
		</div>
	);
}
