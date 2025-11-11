import { useState } from "react";
import { useSeal } from "~/app/SealProvider";
import { useNetworkVariable } from "~/app/networkConfig";
import { useSuiClient } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { env } from "~/env";

export interface DecryptAudioOptions {
  blobId: string;
  nonce: string;
  channelId: string;
  podcastId: string;
  subscriptionObjectId: string;
}

export function useSealAudioPlayer() {
  const { decrypt, ready, client } = useSeal();
  const fundsuiPackageId = useNetworkVariable("fundsuiPackageId");
  const suiClient = useSuiClient();
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Decrypt and create a playable audio URL
   * This requires a valid subscription to access the content
   */
  const decryptAndPlayAudio = async (
    options: DecryptAudioOptions,
  ): Promise<string> => {
    if (!ready || !client) {
      throw new Error("Seal client not initialized");
    }

    setIsDecrypting(true);
    setError(null);

    try {
      // 1. Fetch encrypted audio from Walrus
      const walrusUrl = `${env.NEXT_PUBLIC_WALRUS_AGGREGATOR}/v1/${options.blobId}`;
      const response = await fetch(walrusUrl);

      if (!response.ok) {
        throw new Error(`Failed to fetch encrypted audio: ${response.status}`);
      }

      const encryptedData = new Uint8Array(await response.arrayBuffer());

      // 2. Create approval transaction to prove subscription is valid
      const tx = new Transaction();

      // Call the seal_approve_subscription function
      tx.moveCall({
        target: `${fundsuiPackageId}::subscription::seal_approve_subscription`,
        arguments: [
          tx.pure.vector("u8", Array.from(new TextEncoder().encode(options.nonce))),
          tx.pure.id(options.podcastId),
          tx.object(options.subscriptionObjectId),
          tx.object(options.channelId),
        ],
      });

      // Build the transaction bytes (doesn't execute it)
      const txBytes = await tx.build({ client: suiClient });

      // 3. Decrypt the audio using Seal
      const decryptedAudio = await decrypt(encryptedData, {
        txBytes,
      });

      // 4. Create a playable audio blob URL
      const audioBlob = new Blob([new Uint8Array(decryptedAudio)], {
        type: "audio/mpeg",
      });
      const audioUrl = URL.createObjectURL(audioBlob);

      setIsDecrypting(false);
      return audioUrl;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to decrypt audio";
      setError(errorMessage);
      setIsDecrypting(false);
      throw new Error(errorMessage);
    }
  };

  /**
   * Decrypt audio for channel access (less restrictive)
   */
  const decryptChannelAudio = async (
    blobId: string,
    nonce: string,
    channelId: string,
    subscriptionObjectId: string,
  ): Promise<string> => {
    if (!ready || !client) {
      throw new Error("Seal client not initialized");
    }

    setIsDecrypting(true);
    setError(null);

    try {
      // 1. Fetch encrypted audio from Walrus
      const walrusUrl = `${env.NEXT_PUBLIC_WALRUS_AGGREGATOR}/v1/${blobId}`;
      const response = await fetch(walrusUrl);

      if (!response.ok) {
        throw new Error(`Failed to fetch encrypted audio: ${response.status}`);
      }

      const encryptedData = new Uint8Array(await response.arrayBuffer());

      // 2. Create approval transaction
      const tx = new Transaction();

      tx.moveCall({
        target: `${fundsuiPackageId}::subscription::seal_approve_channel_access`,
        arguments: [
          tx.pure.vector("u8", Array.from(new TextEncoder().encode(nonce))),
          tx.object(subscriptionObjectId),
          tx.object(channelId),
        ],
      });

      const txBytes = await tx.build({ client: suiClient });

      // 3. Decrypt
      const decryptedAudio = await decrypt(encryptedData, {
        txBytes,
      });

      // 4. Create playable URL
      const audioBlob = new Blob([new Uint8Array(decryptedAudio)], {
        type: "audio/mpeg",
      });
      const audioUrl = URL.createObjectURL(audioBlob);

      setIsDecrypting(false);
      return audioUrl;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to decrypt audio";
      setError(errorMessage);
      setIsDecrypting(false);
      throw new Error(errorMessage);
    }
  };

  /**
   * Clean up object URLs to prevent memory leaks
   */
  const revokeAudioUrl = (url: string) => {
    URL.revokeObjectURL(url);
  };

  return {
    decryptAndPlayAudio,
    decryptChannelAudio,
    revokeAudioUrl,
    isDecrypting,
    error,
    ready,
  };
}
