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
				setUploadError(error instanceof Error ? error.message : "Failed to upload image");
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
		<div className="max-w-2xl mx-auto p-6">
			<h2 className="text-2xl font-bold mb-6">Creator Settings</h2>

			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
				className="space-y-6"
			>
				{/* Bio Field */}
				<form.Field name="bio">
					{(field) => (
						<div>
							<label
								htmlFor="bio"
								className="block text-sm font-medium text-gray-700 mb-1"
							>
								Bio
							</label>
							<textarea
								id="bio"
								name={field.name}
								value={field.state.value}
								onChange={(e) => field.handleChange(e.target.value)}
								onBlur={field.handleBlur}
								rows={4}
								className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
								placeholder="Tell your audience about yourself..."
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
									htmlFor="coverPhoto"
									className="block text-sm font-medium text-gray-700 mb-1"
								>
									Cover Photo
								</label>
								{uploadError && (
									<div className="mb-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
										{uploadError}
									</div>
								)}
								<div className="mt-1">
									{hasImage ? (
										<div className="relative">
											<img
												src={displayUrl || ""}
												alt="Cover preview"
												className="h-48 w-full object-cover rounded-md"
												onError={(e) => {
													console.error("Image failed to load");
													e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23ddd' width='100' height='100'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999'%3EError%3C/text%3E%3C/svg%3E";
												}}
											/>
											{isUploading && (
												<div className="absolute inset-0 bg-black bg-opacity-50 rounded-md flex items-center justify-center">
													<div className="text-white text-sm font-medium">
														Uploading to Walrus...
													</div>
												</div>
											)}
											<button
												type="button"
												onClick={handleRemoveCoverPhoto}
												disabled={isUploading}
												className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
											>
												Remove
											</button>
											{field.state.value && !field.state.value.startsWith("blob:") && (
												<div className="absolute bottom-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs">
													Stored on Walrus
												</div>
											)}
										</div>
									) : (
										<div className="h-48 w-full bg-gray-100 rounded-md flex items-center justify-center border-2 border-dashed border-gray-300">
											<label
												htmlFor="coverPhotoInput"
												className={`cursor-pointer text-blue-500 hover:text-blue-600 ${
													isUploading ? "opacity-50 cursor-not-allowed" : ""
												}`}
											>
												{isUploading ? "Uploading..." : "Upload Cover Photo"}
											</label>
											<input
												id="coverPhotoInput"
												type="file"
												accept="image/*"
												className="hidden"
												onChange={handleCoverPhotoUpload}
												disabled={isUploading}
											/>
										</div>
									)}
								</div>
								{!hasImage && (
									<p className="mt-1 text-sm text-gray-500">
										Recommended size: 1200x400px (max 10MB)
										{onCoverPhotoUpload && " • Uploads to Walrus storage"}
									</p>
								)}
								{hasImage && isUploading && (
									<p className="mt-1 text-sm text-blue-600">
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
								htmlFor="price"
								className="block text-sm font-medium text-gray-700 mb-1"
							>
								Price (USD)
							</label>
							<div className="relative mt-1 rounded-md shadow-sm">
								<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
									<span className="text-gray-500 sm:text-sm">$</span>
								</div>
								<input
									id="price"
									type="number"
									name={field.name}
									value={field.state.value}
									onChange={(e) => field.handleChange(Number(e.target.value))}
									onBlur={field.handleBlur}
									min="0"
									step="0.01"
									className="block w-full rounded-md border border-gray-300 pl-7 pr-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
									placeholder="0.00"
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
								htmlFor="maxDuration"
								className="block text-sm font-medium text-gray-700 mb-1"
							>
								Max Duration (minutes)
							</label>
							<input
								id="maxDuration"
								type="number"
								name={field.name}
								value={field.state.value}
								onChange={(e) => field.handleChange(Number(e.target.value))}
								onBlur={field.handleBlur}
								min="1"
								step="1"
								className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
								placeholder="30"
							/>
							<p className="mt-1 text-sm text-gray-500">
								Maximum duration for content in minutes
							</p>
						</div>
					)}
				</form.Field>

				{/* Submit Button */}
				<div className="flex justify-end">
					<button
						type="submit"
						disabled={isSubmitting || isUploading}
						className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{isSubmitting ? "Saving..." : isUploading ? "Uploading..." : "Save Changes"}
					</button>
				</div>
			</form>
		</div>
	);
}
