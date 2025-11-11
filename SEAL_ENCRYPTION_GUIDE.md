# Seal Encryption Integration Guide

This guide explains how the Seal encryption system is integrated with your podcast platform to provide secure, subscription-based access control.

## Overview

Your podcasts are now **encrypted end-to-end** using Mysten's Seal protocol before being uploaded to Walrus storage. Only users with valid on-chain subscriptions can decrypt and play the content.

## Architecture

```
User uploads podcast → Encrypt with Seal → Upload to Walrus → Store nonce on-chain
                         ↓
User with subscription → Fetch from Walrus → Verify subscription → Decrypt → Play
```

## Key Components

### 1. **Encryption on Upload** (`walrus-utils.ts`)

```typescript
// Generates unique nonce and encrypts audio
uploadEncryptedAudio(file, channelId, packageId, encrypt, options);
```

**Flow:**

1. Generate cryptographically secure nonce (32-byte hex string)
2. Create Seal identity: `${packageId}:${nonce}`
3. Encrypt audio file with Seal (threshold: 2 key servers)
4. Upload encrypted file to Walrus
5. Return blob ID and nonce for on-chain storage

### 2. **On-Chain Storage** (Smart Contract)

The `podcast.move` contract stores:

```move
public struct Podcast has key, store {
    id: UID,
    source_file_blob_id: String,  // Walrus blob ID (encrypted)
    title: String,
    description: String,
    nouce: String,  // ← Encryption nonce stored here
    created_at: u64,
}
```

### 3. **Decryption on Playback** (`useSealAudioPlayer.ts`)

```typescript
const { decryptAndPlayAudio } = useSealAudioPlayer();

// Requires valid subscription
const audioUrl = await decryptAndPlayAudio({
  blobId,
  nonce,
  channelId,
  podcastId,
  subscriptionObjectId,
});
```

**Flow:**

1. Fetch encrypted audio from Walrus
2. Build PTB transaction calling `seal_approve_subscription`
3. Transaction verifies subscription is valid
4. Seal decrypts audio using transaction proof
5. Create playable audio URL

### 4. **Access Control** (Smart Contract)

```move
// Verifies subscription before allowing decryption
entry fun seal_approve_subscription(
    id: vector<u8>,           // nonce
    podcast_id: ID,
    subscription: &Subscription,
    channel: &Channel,
    ctx: &TxContext,
)
```

**Checks:**

- ✅ Subscription not expired
- ✅ Subscription matches channel
- ✅ Podcast exists in channel
- ✅ Nonce matches podcast

## Usage Examples

### Upload Encrypted Podcast

```typescript
import { uploadEncryptedAudio } from '~/services/walrus-utils';
import { useSeal } from '~/app/SealProvider';

function UploadForm() {
  const { encrypt } = useSeal();
  const fundsuiPackageId = useNetworkVariable('fundsuiPackageId');

  const handleUpload = async (audioFile: File, channelId: string) => {
    // Encrypt and upload
    const result = await uploadEncryptedAudio(
      audioFile,
      channelId,
      fundsuiPackageId,
      encrypt,
      { epochs: 10, deletable: false }
    );

    // Store on-chain
    const tx = new Transaction();
    tx.moveCall({
      arguments: [
        tx.object(capId),
        tx.object(channelId),
        tx.pure.string(title),
        tx.pure.string(description),
        tx.pure.string(result.blobId), // Encrypted blob
        tx.pure.string(result.nonce), // Encryption nonce
      ],
      target: `${packageId}::podcast::new`,
    });

    await signAndExecute({ transaction: tx });
  };
}
```

### Play Encrypted Podcast

```typescript
import { EncryptedAudioPlayer } from '~/app/_components/EncryptedAudioPlayer';

function PodcastPage() {
  return (
    <EncryptedAudioPlayer
      blobId="0xabc123..." // From Walrus
      nonce="a1b2c3..." // From on-chain podcast
      channelId="0x456..." // Channel object ID
      podcastId="0x789..." // Podcast ID
      subscriptionObjectId="0xdef..." // User's subscription
      title="Episode 1: Getting Started"
    />
  );
}
```

### Custom Decryption Logic

```typescript
import { useSealAudioPlayer } from '~/hooks/useSealAudioPlayer';

function CustomPlayer() {
  const { decryptAndPlayAudio, isDecrypting, error } = useSealAudioPlayer();

  const handlePlay = async () => {
    try {
      const audioUrl = await decryptAndPlayAudio({
        blobId: podcast.blobId,
        nonce: podcast.nonce,
        channelId: channel.id,
        podcastId: podcast.id,
        subscriptionObjectId: userSubscription.id,
      });

      // Use audioUrl in <audio> element
      audioRef.current.src = audioUrl;
      audioRef.current.play();
    } catch (err) {
      console.error('Access denied:', err);
    }
  };

  return (
    <button onClick={handlePlay} disabled={isDecrypting}>
      {isDecrypting ? 'Decrypting...' : 'Play'}
    </button>
  );
}
```

## Security Features

### 🔐 End-to-End Encryption

- Audio encrypted on client before upload
- Never stored unencrypted on Walrus
- Encryption keys distributed across multiple key servers

### 🎫 On-Chain Access Control

- Subscription verified via smart contract
- Timestamp checks prevent expired access
- Channel ownership enforced

### 🔑 Threshold Cryptography

- Requires 2 of 2 key servers to decrypt
- No single point of failure
- Key servers can't decrypt alone

### 🌐 Decentralized Storage

- Encrypted data stored on Walrus
- Content-addressed and permanent
- No centralized hosting

## Key Server Configuration

Default testnet key servers (configured in `SealProvider.tsx`):

```typescript
const DEFAULT_TESTNET_KEY_SERVERS = [
  {
    objectId:
      '0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75',
    weight: 1,
  },
  {
    objectId:
      '0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8',
    weight: 1,
  },
];
```

## Utilities

### Generate Encryption Nonce

```typescript
import { generateEncryptionNonce } from '~/services/walrus-utils';

const nonce = generateEncryptionNonce();
// Returns: "a1b2c3d4e5f6..." (64-char hex string)
```

### Parse Encrypted Object

```typescript
import { parseEncryptedObject } from '~/lib/seal-utils';

const metadata = parseEncryptedObject(encryptedData);
// Returns: { id, packageId, threshold, services }
```

### Create Seal Approve Arguments

```typescript
import { createSealApproveArgs } from '~/lib/seal-utils';

const args = createSealApproveArgs(nonce);
// Returns: [97, 49, 98, 50, ...] (byte array)
```

## Error Handling

Common errors and solutions:

### "Subscription has expired"

- User's subscription end_timestamp < current time
- Solution: Purchase new subscription

### "Subscription is not for this channel"

- User's subscription is for different channel
- Solution: Purchase subscription for correct channel

### "Podcast not found"

- Podcast ID doesn't exist in channel
- Solution: Verify podcast ID is correct

### "Seal SDK not initialized"

- SealProvider not wrapping component
- Solution: Ensure component is child of SealProvider

## Performance Considerations

### Upload Time

- **Encryption**: ~1-2 seconds for typical audio file
- **Upload to Walrus**: Depends on file size and network
- **On-chain transaction**: ~1-2 seconds

### Playback Time

- **Fetch from Walrus**: ~1-3 seconds
- **Decryption**: ~1-2 seconds
- **Total time to play**: ~2-5 seconds first time
- **Subsequent plays**: Instant (already decrypted)

### Optimization Tips

1. **Cache decrypted audio**: Store decrypted URL in state
2. **Pre-decrypt on page load**: Start decryption before user clicks play
3. **Show loading indicators**: Better UX during decryption
4. **Cleanup object URLs**: Prevent memory leaks

```typescript
useEffect(() => {
  return () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
  };
}, [audioUrl]);
```

## Testing

### Test Encryption/Decryption Flow

```typescript
// 1. Upload encrypted podcast
const result = await uploadEncryptedAudio(file, channelId, packageId, encrypt);

// 2. Store on-chain with nonce
await createPodcast(result.blobId, result.nonce);

// 3. Try to decrypt with valid subscription
const audioUrl = await decryptAndPlayAudio({
  blobId: result.blobId,
  nonce: result.nonce,
  channelId,
  podcastId,
  subscriptionObjectId,
});

// 4. Verify audio is playable
const audio = new Audio(audioUrl);
await audio.play();
```

## Troubleshooting

### Decryption fails with "Failed to fetch encrypted audio"

- Check Walrus aggregator URL in `.env`
- Verify blob ID is correct
- Ensure Walrus storage hasn't expired

### Decryption fails with transaction error

- Check subscription object ID is correct
- Verify user wallet is connected
- Ensure subscription hasn't expired

### Audio won't play after decryption

- Check browser console for errors
- Verify audio format is supported
- Try different audio file

## Best Practices

1. **Always store nonce on-chain**: Don't lose the nonce or content is unrecoverable
2. **Use appropriate epochs**: Set Walrus storage duration based on content value
3. **Handle errors gracefully**: Show user-friendly messages
4. **Cleanup resources**: Revoke object URLs to prevent memory leaks
5. **Test subscriptions**: Verify access control before production

## Migration from Non-Encrypted

If you have existing non-encrypted podcasts:

1. **Keep old podcasts as-is**: Don't break existing content
2. **Mark encrypted podcasts**: Add `isEncrypted` field
3. **Conditional playback**: Use different players based on encryption status

```typescript
{
  podcast.isEncrypted ? (
    <EncryptedAudioPlayer {...props} />
  ) : (
    <RegularAudioPlayer {...props} />
  );
}
```

## Additional Resources

- [Seal Documentation](https://seal-docs.wal.app/)
- [Walrus Documentation](https://docs.wal.app/)
- [Sui Move Documentation](https://docs.sui.io/)

## Support

For issues or questions:

1. Check error messages in browser console
2. Verify smart contract is deployed correctly
3. Ensure environment variables are set
4. Review this documentation

---

**Security Note**: Never share encryption nonces or keys publicly. The nonce stored on-chain is safe because it's used as part of the identity, not as the encryption key itself.
