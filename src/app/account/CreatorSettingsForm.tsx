"use client";

import { useForm } from "@tanstack/react-form";

interface CreatorSettings {
	bio: string;
	coverPhoto: string;
	price: number;
	maxDuration: number;
}

interface CreatorSettingsFormProps {
	initialValues?: Partial<CreatorSettings>;
	onSubmit: (values: CreatorSettings) => void | Promise<void>;
	isSubmitting?: boolean;
}

export default function CreatorSettingsForm({
	initialValues,
	onSubmit,
	isSubmitting = false,
}: CreatorSettingsFormProps) {
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

	const handleCoverPhotoUpload = (
		e: React.ChangeEvent<HTMLInputElement>,
		field: typeof form.state.values.coverPhoto,
	) => {
		const file = e.target.files?.[0];
		if (file) {
			// Create a URL for preview
			const url = URL.createObjectURL(file);
			form.setFieldValue("coverPhoto", url);

			// You can also handle the actual upload here
			// uploadFile(file).then(url => form.setFieldValue("coverPhoto", url));
		}
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
					{(field) => (
						<div>
							<label
								htmlFor="coverPhoto"
								className="block text-sm font-medium text-gray-700 mb-1"
							>
								Cover Photo
							</label>
							<div className="mt-1">
								{field.state.value ? (
									<div className="relative">
										<img
											src={field.state.value}
											alt="Cover preview"
											className="h-48 w-full object-cover rounded-md"
										/>
										<button
											type="button"
											onClick={() => field.handleChange("")}
											className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
										>
											Remove
										</button>
									</div>
								) : (
									<div className="h-48 w-full bg-gray-100 rounded-md flex items-center justify-center border-2 border-dashed border-gray-300">
										<label
											htmlFor="coverPhotoInput"
											className="cursor-pointer text-blue-500 hover:text-blue-600"
										>
											Upload Cover Photo
										</label>
										<input
											id="coverPhotoInput"
											type="file"
											accept="image/*"
											className="hidden"
											onChange={(e) =>
												handleCoverPhotoUpload(e, field.state.value)
											}
										/>
									</div>
								)}
							</div>
							{!field.state.value && (
								<p className="mt-1 text-sm text-gray-500">
									Recommended size: 1200x400px
								</p>
							)}
						</div>
					)}
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
						disabled={isSubmitting}
						className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{isSubmitting ? "Saving..." : "Save Changes"}
					</button>
				</div>
			</form>
		</div>
	);
}
