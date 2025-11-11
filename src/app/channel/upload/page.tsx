"use client";

import { useForm } from "@tanstack/react-form";

export default function Upload() {
	const form = useForm({
		defaultValues: {
			title: "",
			description: "",
			sourceFile: null as File | null,
		},
		onSubmit: async ({ value }) => {
			console.log("Form submitted with values:", {
				title: value.title,
				description: value.description,
				sourceFile: value.sourceFile
					? {
							name: value.sourceFile.name,
							size: value.sourceFile.size,
							type: value.sourceFile.type,
						}
					: null,
			});
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
										{(field.state.value.size / 1024 / 1024).toFixed(2)} MB)
									</div>
								)}
							</div>
						</div>
					)}
				</form.Field>

				{/* Submit Button */}
				<button
					className="w-full rounded-md bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700"
					type="submit"
				>
					Create Podcast
				</button>
			</form>
		</div>
	);
}
