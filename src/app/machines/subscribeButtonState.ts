import { Transaction } from "@mysten/sui/transactions";
import { err, ok, type Result } from "neverthrow";
import { suiClient } from "~/server/sui";

export type ChannelSubscribeError = { type: "TRANSACTION_ERROR"; msg: string };

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
): Promise<Result<void, ChannelSubscribeError>> {
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
		await mutateAsync({
			transaction: tx,
		});
		return ok();
	} catch (error) {
		return err({ type: "TRANSACTION_ERROR", msg: `${error}` });
	}
}
