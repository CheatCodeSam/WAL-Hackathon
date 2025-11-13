import { env } from "~/env";

export interface WalrusUploadResponse {
	blobId: string;
	url: string;
	certifiedEpoch?: number;
	size?: number;
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

export async function uploadData(
	data: string,
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
			method: 'PUT',
			body: data,
		});



		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(
				`Walrus upload failed: ${response.status} - ${errorText}`,
			);
		}

		const result = (await response.json()) as WalrusStoreResponse;

		// Extract blob ID from response
		let blobId: string;
		if ("newlyCreated" in result) {
			blobId = result.newlyCreated.blobObject.blobId;
		} else if ("alreadyCertified" in result) {
			blobId = result.alreadyCertified.blobId;
		} else {
			throw new Error("Unexpected Walrus response format");
		}

		// Generate access URL using aggregator
		const accessUrl = getWalrusUrl(blobId);

		return {
			blobId,
			url: accessUrl,
			certifiedEpoch:
				"newlyCreated" in result
					? (result.newlyCreated.blobObject.certifiedEpoch ?? undefined)
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
