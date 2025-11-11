# Sui Seal Integration Guide

This guide explains how to use Seal encryption in your FundSui application for subscription-based content access control.

## Overview

Seal is a decentralized secrets management service that provides:
- Client-side encryption/decryption
- Programmable access control via Move smart contracts
- Threshold-based key management with multiple key servers

## Architecture

### Components

1. **SealProvider** (`src/app/SealProvider.tsx`)
   - React context provider that initializes and manages Seal SDK
   - Handles key server configuration
   - Manages session keys for decryption

2. **useSealSubscription Hook** (`src/hooks/useSealSubscription.ts`)
   - Custom hook for subscription-based content encryption/decryption
   - Integrates with your subscription smart contract
   - Provides helper functions for verifying subscription access

3. **Subscription Smart Contract** (`contract/sources/subscription.move`)
   - Contains `seal_approve_*` functions for access control
   - Validates subscription status and expiration
   - Enforces channel-based access control

## Installation

The Seal SDK is already installed:
```bash
pnpm add @mysten/seal
```

## Configuration

### 1. Environment Variables

Make sure you have these in your `.env`:
```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...  # Your deployed contract address
NEXT_PUBLIC_CHANNEL_REGISTRY=0x...  # Channel registry address
```

### 2. Key Servers

The provider is configured with testnet key servers by default:
- `0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75`
- `0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8`

For mainnet, you'll need to update the key servers in `SealProvider.tsx`.

## Usage

### Basic Setup

The `SealProvider` is already integrated in your app's provider hierarchy:

```tsx
import { SuiSealProvider } from "./SealProvider";

<SuiSealProvider
  packageId={env.NEXT_PUBLIC_CONTRACT_ADDRESS}
  suiClient={suiClient}
  network="testnet"
  autoInitSession={true}
  defaultThreshold={2}
>
  {children}
</SuiSealProvider>
```

### Using the useSealSubscription Hook

```tsx
import { useSealSubscription } from "~/hooks/useSealSubscription";

function MyComponent() {
  const {
    encryptSubscribedContent,
    decryptSubscribedContent,
    verifySubscriptionAccess,
    isLoading,
    sessionKey
  } = useSealSubscription(packageId);

  // Encrypt content
  const encrypted = await encryptSubscribedContent(
    "Secret podcast content",
    channelId,
    2 // threshold
  );

  // Decrypt content (requires valid subscription)
  const decrypted = await decryptSubscribedContent(
    encrypted.encryptedData,
    subscriptionObjectId,
    channelId
  );

  // Verify subscription without decrypting
  const isValid = await verifySubscriptionAccess(
    subscriptionObjectId,
    channelId
  );
}
```

### Session Management

Before encrypting or decrypting, you need to initialize a session:

```tsx
import { useSeal } from "~/app/SealProvider";

function MyComponent() {
  const { initializeSession, sessionKey } = useSeal();

  const handleInit = async () => {
    await initializeSession(packageId, 60); // 60 minutes TTL
    // User will be prompted to sign a message
  };
}
```

## Smart Contract Integration

### Access Control Functions

The subscription contract includes two Seal access control functions:

#### 1. `seal_approve_subscription`
Verifies that a subscription is active (not expired):

```move
entry fun seal_approve_subscription(
    id: vector<u8>,
    subscription: &Subscription,
    ctx: &TxContext,
)
```

#### 2. `seal_approve_channel_access`
Verifies subscription is for the correct channel AND active:

```move
entry fun seal_approve_channel_access(
    id: vector<u8>,
    subscription: &Subscription,
    channel_id: ID,
    ctx: &TxContext,
)
```

### How It Works

1. **Encryption**: Content is encrypted with a unique identity (e.g., `channel_{channelId}`)
2. **Storage**: Encrypted content is stored (Walrus, Sui, etc.)
3. **Decryption Request**: User provides their subscription object ID
4. **Access Verification**: 
   - PTB calls `seal_approve_channel_access` with subscription object
   - Contract checks if subscription is valid and for correct channel
   - If valid, key servers provide decryption keys
5. **Decryption**: Client decrypts content using provided keys

## Example Use Cases

### 1. Encrypt Podcast Episode

```tsx
const { encryptSubscribedContent } = useSealSubscription(packageId);

// Creator encrypts their podcast
const result = await encryptSubscribedContent(
  podcastAudioData,
  channelId
);

// Store encrypted data and backup key
await storeOnWalrus(result.encryptedData);
await saveBackupKey(result.backupKey); // Optional: for disaster recovery
```

### 2. Decrypt for Subscriber

```tsx
const { decryptSubscribedContent } = useSealSubscription(packageId);

// Fetch encrypted podcast
const encryptedData = await fetchFromWalrus(podcastId);

// Decrypt with subscription verification
const audioData = await decryptSubscribedContent(
  encryptedData,
  userSubscriptionId,
  channelId
);

// Play audio
playAudio(audioData);
```

### 3. Check Subscription Status

```tsx
const { verifySubscriptionAccess } = useSealSubscription(packageId);

const canAccess = await verifySubscriptionAccess(
  subscriptionId,
  channelId
);

if (canAccess) {
  // Show premium content
} else {
  // Show subscription prompt
}
```

## Testing

Use the example component to test the integration:

```tsx
import { SealSubscriptionExample } from "~/app/_components/SealSubscriptionExample";

// Add to your page
<SealSubscriptionExample />
```

This component provides a UI for:
- Initializing sessions
- Encrypting content
- Decrypting content with subscription verification
- Verifying subscription status

## Best Practices

### 1. Session Management
- Initialize session once per user session (done automatically with `autoInitSession`)
- Store session in memory, not localStorage (security)
- Set appropriate TTL (60 minutes recommended)

### 2. Performance
- Reuse SealClient instance (handled by provider)
- Cache decryption keys (handled by SDK)
- Use envelope encryption for large files:
  ```tsx
  // Encrypt with AES first, then encrypt the key with Seal
  const aesKey = generateAESKey();
  const encryptedContent = await aesEncrypt(largeFile, aesKey);
  const encryptedKey = await encryptSubscribedContent(aesKey, channelId);
  ```

### 3. Security
- Never expose backup keys to users (except for disaster recovery)
- Use different identities for different content types
- Validate subscription on-chain before decryption
- Use sufficient threshold (2+ key servers recommended)

### 4. Error Handling
- Handle expired sessions gracefully
- Catch and handle subscription verification failures
- Provide clear error messages to users

## Production Deployment

Before deploying to mainnet:

1. **Update Key Servers**: Configure mainnet key servers in `SealProvider.tsx`
2. **Deploy Contracts**: Deploy and verify your subscription contract
3. **Test Thoroughly**: Test encryption/decryption flows end-to-end
4. **Monitor Performance**: Track key server response times
5. **Set Up Backup**: Implement backup key storage for disaster recovery

## Troubleshooting

### "Seal SDK not initialized"
- Check that SealProvider is properly mounted
- Verify key servers are accessible
- Check console for initialization errors

### "Session key not initialized"
- Call `initializeSession()` before encrypting/decrypting
- User must sign the personal message in their wallet

### "Subscription has expired"
- The subscription is no longer valid
- User needs to renew their subscription

### "Decryption failed"
- Verify subscription is for the correct channel
- Check that subscription is still active
- Ensure PTB is correctly formatted

## Resources

- [Seal Documentation](https://seal-docs.wal.app/)
- [Seal SDK on NPM](https://www.npmjs.com/package/@mysten/seal)
- [Seal GitHub](https://github.com/MystenLabs/seal)
- [Example Patterns](https://seal-docs.wal.app/ExamplePatterns/)

## Support

For issues or questions:
- Check [Seal Discord](https://discord.com/channels/916379725201563759/1356767654265880586)
- Review [Security Best Practices](https://seal-docs.wal.app/SecurityBestPractices/)
- Open an issue on GitHub
