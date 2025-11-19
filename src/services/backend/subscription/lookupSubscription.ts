import type { SuiClient } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { env } from "~/env";

export interface SubscriptionStatus {
	hasSubscription: boolean;
	isActive: boolean;
}

export async function hasSubscription(
	suiClient: SuiClient,
	userAddress: string,
	channelId: string,
): Promise<boolean> {
	const tx = new Transaction();
	tx.moveCall({
		arguments: [tx.object(channelId), tx.pure.address(userAddress)],
		target: `${env.NEXT_PUBLIC_CONTRACT_ADDRESS}::channel::is_address_subscribed`,
	});

	const result = await suiClient.devInspectTransactionBlock({
		sender: userAddress,
		transactionBlock: tx,
	});

	return result.results?.[0]?.returnValues?.at(0)?.[0]?.[0] === 1;
}

export async function isSubscriptionActive(
	suiClient: SuiClient,
	userAddress: string,
	channelId: string,
): Promise<boolean> {
	const tx = new Transaction();
	tx.moveCall({
		arguments: [
			tx.object(channelId),
			tx.pure.address(userAddress),
			tx.object.clock(),
		],
		target: `${env.NEXT_PUBLIC_CONTRACT_ADDRESS}::channel::is_address_subscription_active`,
	});

	const result = await suiClient.devInspectTransactionBlock({
		sender: userAddress,
		transactionBlock: tx,
	});

	return result.results?.[0]?.returnValues?.at(0)?.[0]?.[0] === 1;
}

export async function isAddressSubscribedToChannel(
	suiClient: SuiClient,
	userAddress: string,
	channelId: string,
): Promise<SubscriptionStatus> {
	const hasSubscriptionResult = await hasSubscription(
		suiClient,
		userAddress,
		channelId,
	);

	if (!hasSubscriptionResult) {
		return {
			hasSubscription: false,
			isActive: false,
		};
	}

	const isActive = await isSubscriptionActive(
		suiClient,
		userAddress,
		channelId,
	);

	return {
		hasSubscription: true,
		isActive,
	};
}
