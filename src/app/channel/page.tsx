"use client";

import {
	useCurrentAccount,
	useSignAndExecuteTransaction,
	useSuiClient,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { useForm } from "@tanstack/react-form";
import { useNetworkVariable } from "../networkConfig";

export default function CreateChannelPage() {
	const account = useCurrentAccount()!;
	const fundsuiPackageId = useNetworkVariable("fundsuiPackageId");
	const fundsuiRegistryId = useNetworkVariable("fundsuiChannelRegistry");
	const suiClient = useSuiClient();
	const { mutate: signAndExecute } = useSignAndExecuteTransaction();

	const form = useForm({
		defaultValues: {
			displayName: "",
			tagline: "",
			description: "",
			coverPhoto: null as File | null,
			subscriptionPrice: "",
		},
		onSubmit: async ({ value }) => {
			console.log("Form submitted with values:", value);
			console.log("Display Name:", value.displayName);
			console.log("Tagline:", value.tagline);
			console.log("Description:", value.description);
			console.log("Cover Photo:", value.coverPhoto);
			console.log("Subscription Price:", value.subscriptionPrice);
			console.log("Account", account);

			const tx = new Transaction();

			const channelCap = tx.moveCall({
				arguments: [
					tx.object(fundsuiRegistryId),
					tx.pure.string(value.displayName),
					tx.pure.string(value.tagline),
					tx.pure.string(value.description),
					tx.pure.string("cover_photo_uri"),
					tx.pure.string("profile_photo_uri"),
					tx.pure.u64(10000),
					tx.pure.u8(3),
				],
				target: `${fundsuiPackageId}::channel::new`,
			});

			// Transfer the ChannelCap to the sender
			tx.transferObjects([channelCap], account.address);

			signAndExecute(
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
								const objectId =
									result.effects?.created?.[0]?.reference?.objectId;
								console.log(result);
							});
					},
				},
			);
		},
	});

	return (
		<div className="max-w-2xl mx-auto p-6">
			<h1 className="text-3xl font-bold mb-8">Create New Channel</h1>

			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
				className="space-y-6"
			>
				{/* Display Name */}
				<form.Field
					name="displayName"
					children={(field) => (
						<div>
							<label
								htmlFor={field.name}
								className="mb-2 block font-medium text-sm"
							>
								Display Name
							</label>
							<input
								id={field.name}
								name={field.name}
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.value)}
								className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								placeholder="Enter your channel name"
							/>
						</div>
					)}
				/>

				{/* Tagline */}
				<form.Field
					name="tagline"
					children={(field) => (
						<div>
							<label
								htmlFor={field.name}
								className="block text-sm font-medium mb-2"
							>
								Tagline
							</label>
							<input
								id={field.name}
								name={field.name}
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.value)}
								className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								placeholder="A short catchy tagline"
							/>
						</div>
					)}
				/>

				{/* Description */}
				<form.Field
					name="description"
					children={(field) => (
						<div>
							<label
								htmlFor={field.name}
								className="block text-sm font-medium mb-2"
							>
								Description
							</label>
							<textarea
								id={field.name}
								name={field.name}
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.value)}
								rows={5}
								className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								placeholder="Describe your channel and what subscribers can expect"
							/>
						</div>
					)}
				/>

				{/* Cover Photo */}
				<form.Field
					name="coverPhoto"
					children={(field) => (
						<div>
							<label
								htmlFor={field.name}
								className="block text-sm font-medium mb-2"
							>
								Cover Photo
							</label>
							<input
								id={field.name}
								name={field.name}
								type="file"
								accept="image/*"
								onBlur={field.handleBlur}
								onChange={(e) => {
									const file = e.target.files?.[0] || null;
									field.handleChange(file);
								}}
								className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
							/>
							{field.state.value && (
								<p className="mt-2 text-sm text-gray-600">
									Selected: {field.state.value.name}
								</p>
							)}
						</div>
					)}
				/>

				{/* Subscription Price */}
				<form.Field
					name="subscriptionPrice"
					children={(field) => (
						<div>
							<label
								htmlFor={field.name}
								className="block text-sm font-medium mb-2"
							>
								Subscription Price
							</label>
							<div className="relative">
								<span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
									$
								</span>
								<input
									id={field.name}
									name={field.name}
									type="number"
									step="0.01"
									min="0"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									placeholder="0.00"
								/>
							</div>
						</div>
					)}
				/>

				{/* Submit Button */}
				<div className="pt-4">
					<button
						type="submit"
						className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-md transition-colors"
					>
						Create Channel
					</button>
				</div>
			</form>
		</div>
	);
}
