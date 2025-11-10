/**
 * Walrus Upload Utilities
 * Common patterns and helpers for file uploads
 */

import { uploadToWalrus, uploadQuilt, type WalrusUploadResponse } from "./walrus";

/**
 * Validates a file before upload
 */
export function validateFile(
  file: File,
  options: {
    maxSize?: number; // in bytes
    allowedTypes?: string[]; // MIME types
  } = {}
): { valid: boolean; error?: string } {
  const { maxSize = 10 * 1024 * 1024, allowedTypes } = options;

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File too large. Maximum size is ${(maxSize / 1024 / 1024).toFixed(0)}MB`,
    };
  }

  if (allowedTypes && !allowedTypes.some((type) => file.type.startsWith(type))) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${allowedTypes.join(", ")}`,
    };
  }

  return { valid: true };
}

/**
 * Upload an image with validation
 */
export async function uploadImage(
  file: File,
  options: {
    maxSize?: number;
    epochs?: number;
    deletable?: boolean;
  } = {}
): Promise<WalrusUploadResponse> {
  const validation = validateFile(file, {
    maxSize: options.maxSize,
    allowedTypes: ["image/"],
  });

  if (!validation.valid) {
    throw new Error(validation.error);
  }

  return uploadToWalrus(file, {
    epochs: options.epochs ?? 5,
    deletable: options.deletable ?? true,
  });
}

/**
 * Upload an audio file with validation
 */
export async function uploadAudio(
  file: File,
  options: {
    maxSize?: number;
    epochs?: number;
    deletable?: boolean;
  } = {}
): Promise<WalrusUploadResponse> {
  const validation = validateFile(file, {
    maxSize: options.maxSize,
    allowedTypes: ["audio/"],
  });

  if (!validation.valid) {
    throw new Error(validation.error);
  }

  return uploadToWalrus(file, {
    epochs: options.epochs ?? 10,
    deletable: options.deletable ?? false,
  });
}

/**
 * Upload a podcast episode (cover + audio) as a quilt
 */
export async function uploadPodcastEpisode(
  coverImage: File,
  audioFile: File,
  options: {
    epochs?: number;
    deletable?: boolean;
  } = {}
): Promise<{
  quiltId: string;
  coverUrl: string;
  audioUrl: string;
}> {
  // Validate both files
  const coverValidation = validateFile(coverImage, {
    allowedTypes: ["image/"],
  });
  if (!coverValidation.valid) {
    throw new Error(`Cover image: ${coverValidation.error}`);
  }

  const audioValidation = validateFile(audioFile, {
    allowedTypes: ["audio/"],
  });
  if (!audioValidation.valid) {
    throw new Error(`Audio file: ${audioValidation.error}`);
  }

  // Upload as quilt
  const result = await uploadQuilt(
    {
      cover: coverImage,
      audio: audioFile,
    },
    {
      epochs: options.epochs ?? 10,
      deletable: options.deletable ?? false,
    }
  );

  const coverUrl = result.patches.find((p) => p.identifier === "cover")?.url || "";
  const audioUrl = result.patches.find((p) => p.identifier === "audio")?.url || "";

  if (!coverUrl || !audioUrl) {
    throw new Error("Failed to retrieve URLs from quilt upload");
  }

  return {
    quiltId: result.quiltId,
    coverUrl,
    audioUrl,
  };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

/**
 * Extract blob ID from Walrus URL
 */
export function getBlobIdFromUrl(url: string): string | null {
  const match = url.match(/\/v1\/blobs\/([^/]+)/);
  return match?.[1] ?? null;
}

/**
 * Check if a URL is a Walrus URL
 */
export function isWalrusUrl(url: string): boolean {
  return url.includes("/v1/blobs/");
}

/**
 * Upload with progress tracking (requires custom implementation)
 * This is a placeholder for future enhancement with XMLHttpRequest
 */
export async function uploadWithProgress(
  file: File,
  onProgress: (progress: number) => void,
  options: {
    epochs?: number;
    deletable?: boolean;
  } = {}
): Promise<WalrusUploadResponse> {
  // For now, just call the regular upload
  // TODO: Implement with XMLHttpRequest for progress tracking
  onProgress(0);
  
  try {
    const result = await uploadToWalrus(file, options);
    onProgress(100);
    return result;
  } catch (error) {
    onProgress(0);
    throw error;
  }
}

/**
 * Retry upload with exponential backoff
 */
export async function uploadWithRetry(
  file: File,
  options: {
    maxRetries?: number;
    retryDelay?: number;
    epochs?: number;
    deletable?: boolean;
  } = {}
): Promise<WalrusUploadResponse> {
  const { maxRetries = 3, retryDelay = 1000, epochs, deletable } = options;
  
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await uploadToWalrus(file, { epochs, deletable });
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < maxRetries - 1) {
        // Wait before retrying with exponential backoff
        const delay = retryDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error("Upload failed after retries");
}
