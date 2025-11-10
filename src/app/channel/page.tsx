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
	const { mutateAsync } = useSignAndExecuteTransaction();

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
			//TODO upload cover photo uri and profile photo uri to walrus

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

			tx.transferObjects([channelCap], account.address);

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
							});
					},
				},
			);
		},
	});

	return (
		<div className="mx-auto max-w-2xl p-6">
			<h1 className="mb-8 font-bold text-3xl">Create New Channel</h1>

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

				<div className="pt-4">
					<button
						className="w-full rounded-md bg-blue-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-600"
						type="submit"
					>
						Create Channel
					</button>
				</div>
			</form>
		</div>
	);
}
