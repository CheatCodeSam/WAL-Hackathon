import { Transaction } from "@mysten/sui/transactions";
import { err, ok, type Result } from "neverthrow";

export type ChannelSubscribeError = { type: "TRANSACTION_ERROR"; msg: string };

export async function subscribeToChannel(
	channelId: string,
	frontendAddress: string,
	fundsuiPackageId: string,
	// biome-ignore lint/suspicious/noExplicitAny: type is too complicated.
	mutateAsync: any,
): Promise<Result<void, ChannelSubscribeError>> {
	const tx = new Transaction();
	const [paymentCoin] = tx.splitCoins(tx.gas, [20000]);

	tx.moveCall({
		arguments: [
			tx.object(channelId),
			tx.pure.address(frontendAddress),
			paymentCoin,
		],
		target: `${fundsuiPackageId}::channel::subscribe`,
	});

	try {
		await mutateAsync({
			transaction: tx,
		});
		return ok();
	} catch (error) {
		console.log("error");
		return err({ type: "TRANSACTION_ERROR", msg: `${error}` });
	}
}
