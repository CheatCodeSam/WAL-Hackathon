import { EncryptedObject } from "@mysten/seal";

/**
 * Utility functions for working with Seal encrypted data
 */

/**
 * Convert encrypted bytes to base64 for storage/transmission
 */
export function encryptedToBase64(encrypted: Uint8Array): string {
	return Buffer.from(encrypted).toString("base64");
}

/**
 * Convert base64 back to encrypted bytes
 */
export function base64ToEncrypted(base64: string): Uint8Array {
	return Uint8Array.from(Buffer.from(base64, "base64"));
}

/**
 * Parse encrypted object to get metadata
 */
export function parseEncryptedObject(encrypted: Uint8Array) {
	try {
		const obj = EncryptedObject.parse(encrypted);
		return {
			id: obj.id,
			packageId: obj.packageId,
			threshold: obj.threshold,
			services: obj.services,
		};
	} catch (error) {
		console.error("Failed to parse encrypted object:", error);
		return null;
	}
}

/**
 * Store encrypted content with metadata
 */
export interface StoredEncryptedContent {
	encryptedData: string; // base64
	identity: string;
	channelId: string;
	createdAt: number;
	metadata?: {
		title?: string;
		description?: string;
		contentType?: string;
		size?: number;
	};
}

/**
 * Prepare encrypted content for storage
 */
export function prepareForStorage(
	encryptedData: Uint8Array,
	identity: string,
	channelId: string,
	metadata?: StoredEncryptedContent["metadata"],
): StoredEncryptedContent {
	return {
		encryptedData: encryptedToBase64(encryptedData),
		identity,
		channelId,
		createdAt: Date.now(),
		metadata,
	};
}

/**
 * Generate identity string for channel content
 */
export function generateChannelIdentity(channelId: string): string {
	return `channel_${channelId}`;
}

/**
 * Generate identity string for podcast episode
 */
export function generatePodcastIdentity(
	channelId: string,
	episodeId: string,
): string {
	return `channel_${channelId}_episode_${episodeId}`;
}

/**
 * Convert text to Uint8Array
 */
export function textToBytes(text: string): Uint8Array {
	return new TextEncoder().encode(text);
}

/**
 * Convert Uint8Array to text
 */
export function bytesToText(bytes: Uint8Array): string {
	return new TextDecoder().decode(bytes);
}

/**
 * Calculate approximate encrypted size
 * (useful for planning storage)
 */
export function estimateEncryptedSize(originalSize: number): number {
	// Seal adds overhead for encryption metadata
	// This is an approximation
	return originalSize + 500; // ~500 bytes overhead
}

/**
 * Validate subscription object ID format
 */
export function isValidObjectId(objectId: string): boolean {
	return /^0x[a-fA-F0-9]{64}$/.test(objectId);
}

/**
 * Format subscription duration for display
 */
export function formatDuration(months: number): string {
	if (months === 1) return "1 month";
	if (months === 12) return "1 year";
	if (months % 12 === 0) return `${months / 12} years`;
	return `${months} months`;
}

/**
 * Check if subscription is expired based on timestamps
 */
export function isSubscriptionExpired(
	startTimestamp: number,
	endTimestamp: number,
): boolean {
	const now = Date.now();
	return now < startTimestamp || now > endTimestamp;
}

/**
 * Calculate remaining subscription time
 */
export function getRemainingTime(endTimestamp: number): {
	days: number;
	hours: number;
	minutes: number;
	expired: boolean;
} {
	const now = Date.now();
	const remaining = endTimestamp - now;

	if (remaining <= 0) {
		return { days: 0, hours: 0, minutes: 0, expired: true };
	}

	const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
	const hours = Math.floor(
		(remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
	);
	const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

	return { days, hours, minutes, expired: false };
}

/**
 * Create PTB arguments for seal_approve functions
 */
export function createSealApproveArgs(identity: string) {
	return Array.from(new TextEncoder().encode(identity));
}
