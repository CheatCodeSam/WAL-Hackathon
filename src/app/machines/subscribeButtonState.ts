import { Transaction } from "@mysten/sui/transactions";
import { suiClient } from "~/server/sui";

async function checkSubscriptionStatus(
	userAddress: string,
	channelId: string,
): Promise<boolean> {
	return false;
}

export async function subscribeToChannel(
	userAddress: string,
	channelId: string,
	durationInMonths: number,
	frontendAddress: string,
	fundsuiPackageId: string,
	// biome-ignore lint/suspicious/noExplicitAny: type is too complicated.
	mutateAsync: any,
): Promise<void> {
	console.log(
		userAddress,
		channelId,
		durationInMonths,
		frontendAddress,
		fundsuiPackageId,
		mutateAsync,
	);
	const tx = new Transaction();
	const [paymentCoin] = tx.splitCoins(tx.gas, [90000]);

	const subscription = tx.moveCall({
		arguments: [
			tx.object(channelId),
			tx.pure.u8(durationInMonths),
			tx.pure.address(frontendAddress),
			paymentCoin,
		],
		target: `${fundsuiPackageId}::subscription::new`,
	});

	tx.transferObjects([subscription], userAddress);

	try {
		const result = await mutateAsync({
			transaction: tx,
		});
		console.log("Transaction successful:", result);
	} catch (error) {
		console.error("Transaction failed:", error);
	}
}
