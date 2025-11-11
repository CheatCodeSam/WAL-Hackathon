/**
 * Walrus Storage Service
 * Handles file uploads to Walrus and provides access URLs
 * Documentation: https://docs.wal.app/usage/web-api.html
 */

import { env } from "~/env";

export interface WalrusUploadResponse {
	blobId: string;
	url: string;
	size: number;
	certifiedEpoch?: number;
}

interface WalrusNewlyCreatedResponse {
	newlyCreated: {
		blobObject: {
			id: string;
			blobId: string;
			size: number;
			encodingType: string;
			certifiedEpoch: number | null;
			storage: {
				id: string;
				startEpoch: number;
				endEpoch: number;
				storageSize: number;
			};
			deletable: boolean;
		};
		resourceOperation: {
			registerFromScratch: {
				encodedLength: number;
				epochsAhead: number;
			};
		};
		cost: number;
	};
}

interface WalrusAlreadyCertifiedResponse {
	alreadyCertified: {
		blobId: string;
		event: {
			txDigest: string;
			eventSeq: string;
		};
		endEpoch: number;
	};
}

type WalrusStoreResponse =
	| WalrusNewlyCreatedResponse
	| WalrusAlreadyCertifiedResponse;

/**
 * Uploads a file to Walrus storage
 * @param file - The file to upload
 * @param options - Upload options (epochs, deletable, etc.)
 * @returns Upload response with blob ID and access URL
 */
export async function uploadToWalrus(
	file: File,
	options: {
		epochs?: number;
		deletable?: boolean;
		permanent?: boolean;
	} = {},
): Promise<WalrusUploadResponse> {
	const { epochs = 5, deletable = true, permanent = false } = options;

	// Build query parameters
	const params = new URLSearchParams();
	params.append("epochs", epochs.toString());

	if (permanent) {
		params.append("permanent", "true");
	} else if (deletable) {
		params.append("deletable", "true");
	}

	const publisherUrl = `${env.NEXT_PUBLIC_WALRUS_PUBLISHER}/v1/blobs?${params.toString()}`;

	try {
		// Upload the file to Walrus publisher
		const response = await fetch(publisherUrl, {
			method: "PUT",
			body: file,
			headers: {
				"Content-Type": file.type || "application/octet-stream",
			},
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(
				`Walrus upload failed: ${response.status} - ${errorText}`,
			);
		}

		const data = (await response.json()) as WalrusStoreResponse;

		// Extract blob ID from response
		let blobId: string;
		if ("newlyCreated" in data) {
			blobId = data.newlyCreated.blobObject.blobId;
		} else if ("alreadyCertified" in data) {
			blobId = data.alreadyCertified.blobId;
		} else {
			throw new Error("Unexpected Walrus response format");
		}

		// Generate access URL using aggregator
		const accessUrl = getWalrusUrl(blobId);

		return {
			blobId,
			url: accessUrl,
			size: file.size,
			certifiedEpoch:
				"newlyCreated" in data
					? (data.newlyCreated.blobObject.certifiedEpoch ?? undefined)
					: undefined,
		};
	} catch (error) {
		console.error("Error uploading to Walrus:", error);
		throw error;
	}
}

/**
 * Generates the access URL for a blob stored in Walrus
 * @param blobId - The blob ID returned from upload
 * @returns The full URL to access the blob
 */
export function getWalrusUrl(blobId: string): string {
	return `${env.NEXT_PUBLIC_WALRUS_AGGREGATOR}/v1/blobs/${blobId}`;
}

/**
 * Uploads multiple files as a Walrus Quilt
 * @param files - Object mapping identifiers to files
 * @param options - Upload options
 * @returns Upload response with quilt ID and patch IDs
 */
export async function uploadQuilt(
	files: Record<string, File>,
	options: {
		epochs?: number;
		deletable?: boolean;
	} = {},
): Promise<{
	quiltId: string;
	patches: Array<{ identifier: string; patchId: string; url: string }>;
}> {
	const { epochs = 5, deletable = true } = options;

	const params = new URLSearchParams();
	params.append("epochs", epochs.toString());
	if (deletable) {
		params.append("deletable", "true");
	}

	const publisherUrl = `${env.NEXT_PUBLIC_WALRUS_PUBLISHER}/v1/quilts?${params.toString()}`;

	// Create FormData with files
	const formData = new FormData();
	for (const [identifier, file] of Object.entries(files)) {
		formData.append(identifier, file);
	}

	try {
		const response = await fetch(publisherUrl, {
			method: "PUT",
			body: formData,
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(
				`Walrus quilt upload failed: ${response.status} - ${errorText}`,
			);
		}

		const data = await response.json();

		const quiltId =
			"newlyCreated" in data.blobStoreResult
				? data.blobStoreResult.newlyCreated.blobObject.blobId
				: data.blobStoreResult.alreadyCertified.blobId;

		const patches = data.storedQuiltBlobs.map(
			(blob: { identifier: string; quiltPatchId: string }) => ({
				identifier: blob.identifier,
				patchId: blob.quiltPatchId,
				url: `${env.NEXT_PUBLIC_WALRUS_AGGREGATOR}/v1/blobs/by-quilt-patch-id/${blob.quiltPatchId}`,
			}),
		);

		return {
			quiltId,
			patches,
		};
	} catch (error) {
		console.error("Error uploading quilt to Walrus:", error);
		throw error;
	}
}

/**
 * Checks if a Walrus blob exists and is accessible
 * @param blobId - The blob ID to check
 * @returns true if the blob exists and is accessible
 */
export async function checkBlobExists(blobId: string): Promise<boolean> {
	try {
		const url = getWalrusUrl(blobId);
		const response = await fetch(url, { method: "HEAD" });
		return response.ok;
	} catch {
		return false;
	}
}
