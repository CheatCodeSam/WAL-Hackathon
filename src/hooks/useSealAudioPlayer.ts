import { useState } from "react";
import { useSeal } from "~/app/SealProvider";
import { useNetworkVariable } from "~/app/networkConfig";
import { useSuiClient, useCurrentAccount } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { env } from "~/env";

export interface DecryptAudioOptions {
  blobId: string;
  nonce: string;
  channelId: string;
  podcastId: string;
  subscriptionObjectId: string;
  file_type: string;
}

export function useSealAudioPlayer() {
  const { decrypt, ready, client } = useSeal();
  const fundsuiPackageId = useNetworkVariable("fundsuiPackageId");
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
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

    if (!currentAccount?.address) {
      throw new Error("Wallet not connected");
    }

    setIsDecrypting(true);
    setError(null);

    try {
      // 0. Quick preflight: ensure the podcast mapping exists under this channel via blob_id to avoid opaque VM aborts
      try {
        const df = await suiClient.getDynamicFieldObject({
          parentId: options.channelId,
          name: {
            // We indexed by blob_id String in the contract
            type: "0x1::string::String",
            value: options.blobId,
          },
        });
        if (!df || !("data" in df) || !df.data) {
          throw new Error("Podcast not found in this channel.");
        }
      } catch (preErr) {
        // Surface a clean message that directly points to the likely cause
        const msg = preErr instanceof Error ? preErr.message : String(preErr);
        if (msg.includes("not found") || msg.includes("Podcast not found")) {
          throw new Error("Podcast not found in this channel.");
        }
        // If RPC doesn’t support the dynamic field query, continue and let devInspect validate
      }

      // 1. Create approval transaction to verify subscription is valid
      const tx = new Transaction();
      tx.setSender(currentAccount.address);

      // Call the seal_approve_subscription function
      tx.moveCall({
        target: `${fundsuiPackageId}::subscription::seal_approve_subscription`,
        arguments: [
          tx.pure.vector("u8", Array.from(new TextEncoder().encode(options.nonce))),
          tx.pure.string(options.blobId),
          tx.object(options.subscriptionObjectId),
          tx.object(options.channelId),
        ],
      });

      // 2. Perform dev inspect to verify access before decrypting
      console.log("Verifying subscription access...", {
        channelId: options.channelId,
        blobId: options.blobId,
        subscriptionId: options.subscriptionObjectId,
      });
      try {
        const devInspectResult = await suiClient.devInspectTransactionBlock({
          sender: currentAccount.address,
          transactionBlock: tx,
        });

        // Check if dev inspect was successful
        if (devInspectResult.effects.status.status !== "success") {
          const error = devInspectResult.effects.status.error || "Unknown error";
          throw new Error(`Access verification failed: ${error}`);
        }

        console.log("✅ Subscription verified successfully");
      } catch (devInspectError) {
        const errorMsg = devInspectError instanceof Error ? devInspectError.message : String(devInspectError);
        
        // Parse common error messages
        if (errorMsg.includes("ESubscriptionExpired")) {
          throw new Error("Your subscription has expired. Please renew to access this content.");
        } else if (errorMsg.includes("EInvalidChannel")) {
          throw new Error("This subscription is not valid for this channel.");
        } else if (errorMsg.includes("EPodcastNotFound")) {
          throw new Error("Podcast not found in this channel.");
        } else if (errorMsg.includes("EInvalidNonce")) {
          throw new Error("Invalid nonce - the encryption key doesn't match this podcast.");
        } else {
          throw new Error(`Subscription verification failed: ${errorMsg}`);
        }

        throw new Error(`Subscription verification failed: ${errorMsg}`);
      }

      // 3. Fetch encrypted audio from Walrus (only after verification succeeds)
      console.log("Fetching encrypted audio from Walrus...");
      const walrusUrl = `${env.NEXT_PUBLIC_WALRUS_AGGREGATOR}/v1/blobs/${options.blobId}`;
      const response = await fetch(walrusUrl);

      if (!response.ok) {
        throw new Error(`Failed to fetch encrypted audio: ${response.status}`);
      }

      const encryptedData = new Uint8Array(await response.arrayBuffer());

      // 4. Build the transaction bytes for decryption (doesn't execute it)
      const txBytes = await tx.build({ client: suiClient, onlyTransactionKind: true });

      // 5. Decrypt the audio using Seal
      console.log("Decrypting audio...");
      const decryptedAudio = await decrypt(encryptedData, {
        txBytes,
      });

      // 6. Create a playable audio blob URL
      const audioBlob = new Blob([new Uint8Array(decryptedAudio)], {
        type: options.file_type,
      });
      const audioUrl = URL.createObjectURL(audioBlob);

      console.log("✅ Audio decrypted successfully");
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
    podcastId: string,
    subscriptionObjectId: string,
  ): Promise<string> => {
    if (!ready || !client) {
      throw new Error("Seal client not initialized");
    }

    if (!currentAccount?.address) {
      throw new Error("Wallet not connected");
    }

    setIsDecrypting(true);
    setError(null);

    try {
      // 1. Create approval transaction
      const tx = new Transaction();
      tx.setSender(currentAccount.address);

      tx.moveCall({
        target: `${fundsuiPackageId}::subscription::seal_approve_channel_access`,
        arguments: [
          tx.pure.vector("u8", Array.from(new TextEncoder().encode(nonce))),
          tx.pure.string(blobId),
          tx.object(subscriptionObjectId),
          tx.object(channelId),
        ],
      });

      // 2. Perform dev inspect to verify access before decrypting
      console.log("Verifying channel access...");
      try {
        const devInspectResult = await suiClient.devInspectTransactionBlock({
          sender: currentAccount.address,
          transactionBlock: tx,
        });

        // Check if dev inspect was successful
        if (devInspectResult.effects.status.status !== "success") {
          const error = devInspectResult.effects.status.error || "Unknown error";
          throw new Error(`Access verification failed: ${error}`);
        }

        console.log("✅ Channel access verified successfully");
      } catch (devInspectError) {
        const errorMsg = devInspectError instanceof Error ? devInspectError.message : String(devInspectError);
        
        // Parse common error messages
        if (errorMsg.includes("ESubscriptionExpired")) {
          throw new Error("Your subscription has expired. Please renew to access this content.");
        } else if (errorMsg.includes("EInvalidChannel")) {
          throw new Error("This subscription is not valid for this channel.");
        } else if (errorMsg.includes("EPodcastNotFound")) {
          throw new Error("Podcast not found in this channel.");
        } else if (errorMsg.includes("EInvalidNonce")) {
          throw new Error("Invalid nonce - the encryption key doesn't match this podcast.");
        } else {
          throw new Error(`Channel access verification failed: ${errorMsg}`);
        }
      }

      // 3. Fetch encrypted audio from Walrus (only after verification succeeds)
      console.log("Fetching encrypted audio from Walrus...");
  const walrusUrl = `${env.NEXT_PUBLIC_WALRUS_AGGREGATOR}/v1/blobs/${blobId}`;
      const response = await fetch(walrusUrl);

      if (!response.ok) {
        throw new Error(`Failed to fetch encrypted audio: ${response.status}`);
      }

      const encryptedData = new Uint8Array(await response.arrayBuffer());

      // 4. Build transaction bytes for decryption
      const txBytes = await tx.build({ client: suiClient, onlyTransactionKind: true });

      // 5. Decrypt
      console.log("Decrypting audio...");
      const decryptedAudio = await decrypt(encryptedData, {
        txBytes,
      });

      // 6. Create playable URL
      const audioBlob = new Blob([new Uint8Array(decryptedAudio)], {
        type: "audio/mpeg",
      });
      const audioUrl = URL.createObjectURL(audioBlob);

      console.log("✅ Audio decrypted successfully");
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
