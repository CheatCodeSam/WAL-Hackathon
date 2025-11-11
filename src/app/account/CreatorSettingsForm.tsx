"use client";

import { useForm } from "@tanstack/react-form";
import { useState } from "react";

interface CreatorSettings {
	bio: string;
	coverPhoto: string;
	price: number;
	maxDuration: number;
}

interface CreatorSettingsFormProps {
	initialValues?: Partial<CreatorSettings>;
	onSubmit: (values: CreatorSettings) => void | Promise<void>;
	onCoverPhotoUpload?: (file: File) => Promise<string>;
	isSubmitting?: boolean;
}

export default function CreatorSettingsForm({
	initialValues,
	onSubmit,
	onCoverPhotoUpload,
	isSubmitting = false,
}: CreatorSettingsFormProps) {
	const [isUploading, setIsUploading] = useState(false);
	const [uploadError, setUploadError] = useState<string | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);

	const form = useForm({
		defaultValues: {
			bio: initialValues?.bio ?? "",
			coverPhoto: initialValues?.coverPhoto ?? "",
			price: initialValues?.price ?? 0,
			maxDuration: initialValues?.maxDuration ?? 30,
		},
		onSubmit: async ({ value }) => {
			await onSubmit(value);
		},
	});

	const handleCoverPhotoUpload = async (
		e: React.ChangeEvent<HTMLInputElement>,
	) => {
		const file = e.target.files?.[0];
		if (!file) return;

		// Validate file type
		if (!file.type.startsWith("image/")) {
			setUploadError("Please select an image file");
			return;
		}

		// Validate file size (10MB limit)
		if (file.size > 10 * 1024 * 1024) {
			setUploadError("Image must be less than 10MB");
			return;
		}

		// Create local preview immediately for better UX
		const localPreview = URL.createObjectURL(file);
		setPreviewUrl(localPreview);
		setUploadError(null);

		if (onCoverPhotoUpload) {
			setIsUploading(true);
			try {
				// Upload to Walrus and get the URL
				const walrusUrl = await onCoverPhotoUpload(file);
				form.setFieldValue("coverPhoto", walrusUrl);
				// Clean up local preview since we have the Walrus URL
				URL.revokeObjectURL(localPreview);
				setPreviewUrl(null);
			} catch (error) {
				console.error("Upload error:", error);
				setUploadError(
					error instanceof Error ? error.message : "Failed to upload image",
				);
				// Keep the local preview on error
			} finally {
				setIsUploading(false);
			}
		} else {
			// Fallback: just use local preview if no upload handler
			form.setFieldValue("coverPhoto", localPreview);
			setPreviewUrl(null);
		}
	};

	const handleRemoveCoverPhoto = () => {
		// Clean up any blob URLs to prevent memory leaks
		if (previewUrl) {
			URL.revokeObjectURL(previewUrl);
			setPreviewUrl(null);
		}
		const currentUrl = form.state.values.coverPhoto;
		if (currentUrl && currentUrl.startsWith("blob:")) {
			URL.revokeObjectURL(currentUrl);
		}
		form.setFieldValue("coverPhoto", "");
		setUploadError(null);
	};

	// Get the display URL (prefer Walrus URL, fallback to preview)
	const getDisplayUrl = () => {
		if (form.state.values.coverPhoto) {
			return form.state.values.coverPhoto;
		}
		return previewUrl;
	};

	return (
		<div className="mx-auto max-w-2xl p-6">
			<h2 className="mb-6 font-bold text-2xl">Creator Settings</h2>

			<form
				className="space-y-6"
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
			>
				{/* Bio Field */}
				<form.Field name="bio">
					{(field) => (
						<div>
							<label
								className="mb-1 block font-medium text-gray-700 text-sm"
								htmlFor="bio"
							>
								Bio
							</label>
							<textarea
								className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
								id="bio"
								name={field.name}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.value)}
								placeholder="Tell your audience about yourself..."
								rows={4}
								value={field.state.value}
							/>
						</div>
					)}
				</form.Field>

				{/* Cover Photo Field */}
				<form.Field name="coverPhoto">
					{(field) => {
						const displayUrl = getDisplayUrl();
						const hasImage = displayUrl || previewUrl;

						return (
							<div>
								<label
									className="mb-1 block font-medium text-gray-700 text-sm"
									htmlFor="coverPhoto"
								>
									Cover Photo
								</label>
								{uploadError && (
									<div className="mb-2 rounded-md border border-red-200 bg-red-50 p-2 text-red-600 text-sm">
										{uploadError}
									</div>
								)}
								<div className="mt-1">
									{hasImage ? (
										<div className="relative">
											<img
												alt="Cover preview"
												className="h-48 w-full rounded-md object-cover"
												onError={(e) => {
													console.error("Image failed to load");
													e.currentTarget.src =
														"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23ddd' width='100' height='100'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999'%3EError%3C/text%3E%3C/svg%3E";
												}}
												src={displayUrl || ""}
											/>
											{isUploading && (
												<div className="absolute inset-0 flex items-center justify-center rounded-md bg-black bg-opacity-50">
													<div className="font-medium text-sm text-white">
														Uploading to Walrus...
													</div>
												</div>
											)}
											<button
												className="absolute top-2 right-2 rounded bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
												disabled={isUploading}
												onClick={handleRemoveCoverPhoto}
												type="button"
											>
												Remove
											</button>
											{field.state.value &&
												!field.state.value.startsWith("blob:") && (
													<div className="absolute bottom-2 left-2 rounded bg-green-500 px-2 py-1 text-white text-xs">
														Stored on Walrus
													</div>
												)}
										</div>
									) : (
										<div className="flex h-48 w-full items-center justify-center rounded-md border-2 border-gray-300 border-dashed bg-gray-100">
											<label
												className={`cursor-pointer text-blue-500 hover:text-blue-600 ${
													isUploading ? "cursor-not-allowed opacity-50" : ""
												}`}
												htmlFor="coverPhotoInput"
											>
												{isUploading ? "Uploading..." : "Upload Cover Photo"}
											</label>
											<input
												accept="image/*"
												className="hidden"
												disabled={isUploading}
												id="coverPhotoInput"
												onChange={handleCoverPhotoUpload}
												type="file"
											/>
										</div>
									)}
								</div>
								{!hasImage && (
									<p className="mt-1 text-gray-500 text-sm">
										Recommended size: 1200x400px (max 10MB)
										{onCoverPhotoUpload && " • Uploads to Walrus storage"}
									</p>
								)}
								{hasImage && isUploading && (
									<p className="mt-1 text-blue-600 text-sm">
										Uploading to decentralized storage...
									</p>
								)}
							</div>
						);
					}}
				</form.Field>

				{/* Price Field */}
				<form.Field name="price">
					{(field) => (
						<div>
							<label
								className="mb-1 block font-medium text-gray-700 text-sm"
								htmlFor="price"
							>
								Price (USD)
							</label>
							<div className="relative mt-1 rounded-md shadow-sm">
								<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
									<span className="text-gray-500 sm:text-sm">$</span>
								</div>
								<input
									className="block w-full rounded-md border border-gray-300 py-2 pr-3 pl-7 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
									id="price"
									min="0"
									name={field.name}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(Number(e.target.value))}
									placeholder="0.00"
									step="0.01"
									type="number"
									value={field.state.value}
								/>
							</div>
						</div>
					)}
				</form.Field>

				{/* Max Duration Field */}
				<form.Field name="maxDuration">
					{(field) => (
						<div>
							<label
								className="mb-1 block font-medium text-gray-700 text-sm"
								htmlFor="maxDuration"
							>
								Max Duration (minutes)
							</label>
							<input
								className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
								id="maxDuration"
								min="1"
								name={field.name}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(Number(e.target.value))}
								placeholder="30"
								step="1"
								type="number"
								value={field.state.value}
							/>
							<p className="mt-1 text-gray-500 text-sm">
								Maximum duration for content in minutes
							</p>
						</div>
					)}
				</form.Field>

				{/* Submit Button */}
				<div className="flex justify-end">
					<button
						className="rounded-md bg-blue-500 px-6 py-2 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
						disabled={isSubmitting || isUploading}
						type="submit"
					>
						{isSubmitting
							? "Saving..."
							: isUploading
								? "Uploading..."
								: "Save Changes"}
					</button>
				</div>
			</form>
		</div>
	);
}
