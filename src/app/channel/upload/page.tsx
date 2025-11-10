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
			<h1 className="text-3xl font-bold mb-6">Upload Podcast</h1>

			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
				className="space-y-6"
			>
				{/* Title Field */}
				<form.Field name="title">
					{(field) => (
						<div>
							<label
								htmlFor={field.name}
								className="block text-sm font-medium mb-2"
							>
								Podcast Title
							</label>
							<input
								id={field.name}
								type="text"
								value={field.state.value}
								onChange={(e) => field.handleChange(e.target.value)}
								className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								placeholder="Enter podcast title"
							/>
						</div>
					)}
				</form.Field>

				{/* Description Field */}
				<form.Field name="description">
					{(field) => (
						<div>
							<label
								htmlFor={field.name}
								className="block text-sm font-medium mb-2"
							>
								Description
							</label>
							<textarea
								id={field.name}
								value={field.state.value}
								onChange={(e) => field.handleChange(e.target.value)}
								rows={5}
								className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								placeholder="Enter podcast description"
							/>
						</div>
					)}
				</form.Field>

				{/* Source File Upload */}
				<form.Field name="sourceFile">
					{(field) => (
						<div>
							<label
								htmlFor={field.name}
								className="block text-sm font-medium mb-2"
							>
								Audio File
							</label>
							<div className="flex flex-col gap-2">
								<input
									id={field.name}
									type="file"
									accept="audio/*"
									onChange={(e) => {
										const file = e.target.files?.[0] || null;
										field.handleChange(file);
									}}
									className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
								/>
								{field.state.value && (
									<div className="text-sm text-gray-600">
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
					type="submit"
					className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 transition-colors font-medium"
				>
					Create Podcast
				</button>
			</form>
		</div>
	);
}
