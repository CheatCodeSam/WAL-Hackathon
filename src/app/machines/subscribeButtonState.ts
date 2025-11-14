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
	userObjectId: string,
	channelId: string,
	durationInMonths: number,
	paymentInMist: bigint,
	frontendAddress: string,
	fundsuiPackageId: string,
	// biome-ignore lint/suspicious/noExplicitAny: type is too complicated.
	mutateAsync: any,
): Promise<Result<void, ChannelSubscribeError>> {
	const tx = new Transaction();
	// Split gas into a payment coin with the required amount in mist (1e-9 SUI units)
	const [paymentCoin] = tx.splitCoins(tx.gas, [paymentInMist]);

	// Move function signature:
	// public fun new(user: &mut User, channel: &Channel, duration_in_months: u8, frontend_address: address, mut payment: Coin<SUI>, ctx: &mut TxContext): ID
	tx.moveCall({
		target: `${fundsuiPackageId}::subscription::new`,
		arguments: [
			tx.object(userObjectId), // &mut User
			tx.object(channelId),    // &Channel
			tx.pure.u8(durationInMonths),
			tx.pure.address(frontendAddress),
			paymentCoin,
		],
	});

	try {
		await mutateAsync({ transaction: tx });
		return ok();
	} catch (error) {
		return err({ type: "TRANSACTION_ERROR", msg: `${error}` });
	}
}
