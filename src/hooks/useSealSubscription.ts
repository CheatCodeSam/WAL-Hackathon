"use client";

import { useSeal } from "~/app/SealProvider";
import { Transaction } from "@mysten/sui/transactions";
import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import { useState } from "react";

export type EncryptedContent = {
	encryptedData: Uint8Array;
	nouce: string;
};

export const useSealSubscription = (packageId: string) => {
	const { encrypt, decrypt, initializeSession, sessionKey } = useSeal();
	const currentAccount = useCurrentAccount();
	const suiClient = useSuiClient();
	const [isLoading, setIsLoading] = useState(false);

	/**
	 * Encrypt content that requires a subscription to access
	 */
	const encryptSubscribedContent = async (
		content: string | Uint8Array,
		nouce: string,
		threshold = 2,
	): Promise<EncryptedContent> => {
		setIsLoading(true);
		try {

			const { encryptedObject } = await encrypt(content, {
				identity: nouce,
				threshold,
			});

			return {
				encryptedData: encryptedObject,
        nouce,
			};
		} finally {
			setIsLoading(false);
		}
	};

	/**
	 * Decrypt content by verifying subscription access
	 */
	const decryptSubscribedContent = async (
		encryptedData: Uint8Array,
		subscriptionObjectId: string,
    podcastId: string,
		nouce: string,
    channelId: string,
	): Promise<Uint8Array> => {
		if (!currentAccount?.address) {
			throw new Error("Wallet not connected");
		}

		if (!sessionKey) {
			throw new Error("Session not initialized. Call initializeSession first.");
		}

		setIsLoading(true);
		try {
			// Create transaction to verify subscription access
			const tx = new Transaction();

			// Call seal_approve_channel_access to verify subscription
			tx.moveCall({
				target: `${packageId}::subscription::seal_approve_channel_access`,
				arguments: [
					tx.pure.vector("u8", Array.from(new TextEncoder().encode(nouce))),
          tx.pure.id(podcastId),
					tx.object(subscriptionObjectId),
					tx.object(channelId),
				],
			});

			// Build transaction bytes
			const txBytes = await tx.build({
				client: suiClient,
				onlyTransactionKind: true,
			});

			// Decrypt using Seal
			const decryptedData = await decrypt(encryptedData, {
				txBytes,
			});

			return decryptedData;
		} finally {
			setIsLoading(false);
		}
	};

	/**
	 * Check if a subscription is valid (helper function)
	 */
	const verifySubscriptionAccess = async (
		subscriptionObjectId: string,
    podcastId: string,
    nouce: string,
		channelId: string,
	): Promise<boolean> => {
		if (!currentAccount?.address) {
			return false;
		}

		try {
			const tx = new Transaction();

			tx.moveCall({
				target: `${packageId}::subscription::seal_approve_channel_access`,
				arguments: [
					tx.pure.vector("u8", Array.from(new TextEncoder().encode(nouce))),
          tx.pure.id(podcastId),
					tx.object(subscriptionObjectId),
					tx.pure.id(channelId),
				],
			});

			// Dry run the transaction to check if it would succeed
			const result = await suiClient.dryRunTransactionBlock({
				transactionBlock: await tx.build({ client: suiClient }),
			});

			return result.effects.status.status === "success";
		} catch (error) {
			console.error("Subscription verification failed:", error);
			return false;
		}
	};

	return {
		encryptSubscribedContent,
		decryptSubscribedContent,
		verifySubscriptionAccess,
		isLoading,
		sessionKey,
	};
};
