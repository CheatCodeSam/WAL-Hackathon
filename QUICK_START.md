# 🚀 Quick Start: Seal Encrypted Podcasts

## Upload Encrypted Podcast

```typescript
// In your upload component
import { uploadEncryptedAudio } from '~/services/walrus-utils';
import { useSeal } from '~/app/SealProvider';

const { encrypt } = useSeal();

// Encrypt and upload
const result = await uploadEncryptedAudio(
  audioFile,
  channelId,
  packageId,
  encrypt,
  { epochs: 10 }
);

// Store on-chain (note: nonce parameter added!)
tx.moveCall({
  arguments: [
    tx.object(cap),
    tx.object(channelId),
    tx.pure.string(title),
    tx.pure.string(description),
    tx.pure.string(result.blobId),
    tx.pure.string(result.nonce), // ← NEW!
  ],
  target: `${packageId}::podcast::new`,
});
```

## Play Encrypted Podcast

```typescript
// Simple component usage
<EncryptedAudioPlayer
  blobId={podcast.source_file_blob_id}
  nonce={podcast.nouce}
  channelId={channel.id}
  podcastId={podcast.id}
  subscriptionObjectId={userSubscription.id}
  title={podcast.title}
/>
```

## Custom Playback Logic

```typescript
import { useSealAudioPlayer } from '~/hooks/useSealAudioPlayer';

const { decryptAndPlayAudio, isDecrypting } = useSealAudioPlayer();

const audioUrl = await decryptAndPlayAudio({
  blobId: '0xabc...',
  nonce: 'a1b2c3...',
  channelId: '0x123...',
  podcastId: '0x456...',
  subscriptionObjectId: '0x789...',
});

// Use in <audio> element
audioRef.current.src = audioUrl;
```

## Key Points

✅ **Nonce Generation**: Automatic, cryptographically secure  
✅ **Encryption**: Happens client-side before upload  
✅ **Access Control**: On-chain subscription verification  
✅ **No Contract Changes**: Works with existing Move code

## Files Modified

- `src/services/walrus-utils.ts` - Added `uploadEncryptedAudio()`
- `src/app/channel/upload/page.tsx` - Integrated encrypted upload

## Files Created

- `src/hooks/useSealAudioPlayer.ts` - Decryption hook
- `src/app/_components/EncryptedAudioPlayer.tsx` - Player UI

## Smart Contract

Your contract already supports this! Just pass the nonce:

```move
public fun new(
    cap: &ChannelCap,
    channel: &mut Channel,
    title: String,
    description: String,
    source_file_blob_id: String,
    nouce: String,  // ← Store encryption nonce here
    ctx: &mut TxContext,
): ID
```

## Security Model

1. **Upload**: File encrypted with `${packageId}:${nonce}` identity
2. **Storage**: Nonce stored on-chain, encrypted file on Walrus
3. **Access**: Subscription verified via PTB → Seal decrypts → Audio plays

## Testing

```bash
# 1. Build contracts (if needed)
cd contract && sui move build

# 2. Run frontend
cd .. && pnpm dev

# 3. Upload podcast → Check nonce in transaction
# 4. Try play → Should decrypt if subscribed
```

That's it! 🎉
