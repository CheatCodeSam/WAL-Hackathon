"use client";

import {
	useCurrentAccount,
	useSignAndExecuteTransaction,
	useSuiClient,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { useForm } from "@tanstack/react-form";
import { env } from "~/env";
import { useNetworkVariable } from "../networkConfig";

export default function SubscribeTemporaryPage() {
	const account = useCurrentAccount()!;
	const fundsuiPackageId = useNetworkVariable("fundsuiPackageId");
	const fundsuiRegistryId = useNetworkVariable("fundsuiChannelRegistry");
	const suiClient = useSuiClient();
	const { mutateAsync } = useSignAndExecuteTransaction();

	const form = useForm({
		defaultValues: {
			channel_id: "",
			duration_in_months: 0,
			frontend_address: env.NEXT_PUBLIC_CLIENT_ADDRESS,
		},
		onSubmit: async ({ value }) => {
			console.log("Form values:", value);

			const tx = new Transaction();

			const [paymentCoin] = tx.splitCoins(tx.gas, [90000]);

			const subscription = tx.moveCall({
				arguments: [
					tx.object(value.channel_id),
					tx.pure.u8(value.duration_in_months),
					tx.pure.address(value.frontend_address),
					paymentCoin,
				],
				target: `${fundsuiPackageId}::subscription::new`,
			});

			// Transfer the subscription object to the user
			tx.transferObjects([subscription], account.address);

			try {
				const result = await mutateAsync({
					transaction: tx,
				});
				console.log("Transaction successful:", result);
			} catch (error) {
				console.error("Transaction failed:", error);
			}
		},
	});

	return (
		<div className="container mx-auto max-w-md p-8">
			<h1 className="mb-6 font-bold text-2xl">Subscribe</h1>
			<form
				className="space-y-4"
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
			>
				<form.Field name="channel_id">
					{(field) => (
						<div>
							<label className="mb-2 block font-medium" htmlFor="channel_id">
								Channel ID
							</label>
							<input
								className="w-full rounded border border-gray-300 px-3 py-2"
								id="channel_id"
								onChange={(e) => field.handleChange(e.target.value)}
								placeholder="Enter channel object ID"
								type="text"
								value={field.state.value}
							/>
						</div>
					)}
				</form.Field>

				<form.Field name="duration_in_months">
					{(field) => (
						<div>
							<label
								className="mb-2 block font-medium"
								htmlFor="duration_in_months"
							>
								Duration (months)
							</label>
							<input
								className="w-full rounded border border-gray-300 px-3 py-2"
								id="duration_in_months"
								onChange={(e) => field.handleChange(Number(e.target.value))}
								placeholder="Enter duration in months"
								type="number"
								value={field.state.value}
							/>
						</div>
					)}
				</form.Field>

				<form.Field name="frontend_address">
					{(field) => (
						<div>
							<label
								className="mb-2 block font-medium"
								htmlFor="frontend_address"
							>
								Frontend Address
							</label>
							<input
								className="w-full rounded border border-gray-300 bg-gray-100 px-3 py-2 text-gray-600"
								disabled
								id="frontend_address"
								type="text"
								value={field.state.value}
							/>
						</div>
					)}
				</form.Field>

				<button
					className="w-full rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
					type="submit"
				>
					Submit
				</button>
			</form>
		</div>
	);
}
