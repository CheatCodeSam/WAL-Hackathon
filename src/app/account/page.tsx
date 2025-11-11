"use client";

import { useState } from "react";
import { uploadToWalrus } from "~/services/walrus";
import CreatorSettingsForm from "./CreatorSettingsForm";

export default function Account() {
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async (values: {
		bio: string;
		coverPhoto: string;
		price: number;
		maxDuration: number;
	}) => {
		setIsSubmitting(true);
		try {
			console.log("Form values:", values);
			// TODO: Call your API or tRPC mutation here
			// The coverPhoto field now contains the Walrus URL
			// You can save this URL to your database
		} catch (error) {
			console.error("Error submitting form:", error);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleCoverPhotoUpload = async (file: File): Promise<string> => {
		try {
			// Upload to Walrus with 5 epochs (default) and deletable flag
			const result = await uploadToWalrus(file, {
				epochs: 5,
				deletable: true,
			});

			console.log("Uploaded to Walrus:", result);

			// Return the access URL
			return result.url;
		} catch (error) {
			console.error("Error uploading to Walrus:", error);
			throw new Error("Failed to upload image to Walrus storage");
		}
	};

	return (
		<div className="container mx-auto py-8">
			<CreatorSettingsForm
				initialValues={{
					bio: "",
					coverPhoto: "",
					price: 0,
					maxDuration: 30,
				}}
				isSubmitting={isSubmitting}
				onCoverPhotoUpload={handleCoverPhotoUpload}
				onSubmit={handleSubmit}
			/>
		</div>
	);
}
