# Seal Encryption Flow Diagram

## 📤 Upload Flow

```
┌─────────────────┐
│ User            │
│ Selects Audio   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│ 1. Generate Nonce                                       │
│    crypto.getRandomValues(32 bytes)                     │
│    → "a1b2c3d4e5f6...64chars"                          │
└────────┬────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│ 2. Create Seal Identity                                 │
│    identity = `${packageId}:${nonce}`                   │
│    → "0x123...abc:a1b2c3d4..."                         │
└────────┬────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│ 3. Encrypt with Seal                                    │
│    SealClient.encrypt({                                 │
│      data: audioBytes,                                  │
│      identity,                                          │
│      threshold: 2                                       │
│    })                                                   │
│    → encryptedObject: Uint8Array                        │
└────────┬────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│ 4. Upload to Walrus                                     │
│    PUT /v1/blobs?epochs=10                             │
│    Body: encryptedObject                                │
│    → blobId: "0xdef...789"                             │
└────────┬────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│ 5. Store on Sui Blockchain                              │
│    podcast::new(                                        │
│      cap, channel,                                      │
│      title, description,                                │
│      blobId,                                           │
│      nonce  ← stored here!                             │
│    )                                                    │
└─────────────────────────────────────────────────────────┘
```

## 📥 Playback Flow

```
┌─────────────────┐
│ User            │
│ Clicks Play     │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│ 1. Fetch On-Chain Data                                  │
│    - podcast.source_file_blob_id                        │
│    - podcast.nouce                                      │
│    - subscription.id                                    │
└────────┬────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│ 2. Fetch Encrypted Audio from Walrus                    │
│    GET /v1/${blobId}                                    │
│    → encryptedData: Uint8Array                          │
└────────┬────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│ 3. Build Verification Transaction (PTB)                 │
│    tx.moveCall({                                        │
│      target: "seal_approve_subscription",               │
│      arguments: [                                       │
│        nonce,                                           │
│        podcastId,                                       │
│        subscriptionObject,                              │
│        channelObject                                    │
│      ]                                                  │
│    })                                                   │
│    tx.build() → txBytes                                 │
└────────┬────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│ 4. Smart Contract Verification                          │
│    ✓ Subscription not expired?                          │
│    ✓ Subscription matches channel?                      │
│    ✓ Podcast exists?                                    │
│    ✓ Nonce matches?                                     │
│    → Verification passes or fails                       │
└────────┬────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│ 5. Decrypt with Seal                                    │
│    SealClient.decrypt({                                 │
│      data: encryptedData,                               │
│      txBytes: verificationTx                            │
│    })                                                   │
│    → decryptedAudio: Uint8Array                         │
└────────┬────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│ 6. Create Playable Audio                                │
│    blob = new Blob([decryptedAudio])                    │
│    url = URL.createObjectURL(blob)                      │
│    → "blob:http://localhost:3000/..."                   │
└────────┬────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────┐
│ <audio> Element │
│ Plays Audio     │
└─────────────────┘
```

## 🔒 Security Checkpoints

```
Upload Phase:
├─ Client-side encryption ✓
├─ Unique nonce per podcast ✓
├─ Threshold cryptography (2/2) ✓
└─ Encrypted storage on Walrus ✓

Access Phase:
├─ On-chain subscription check ✓
├─ Timestamp validation ✓
├─ Channel ownership verification ✓
├─ Nonce matching ✓
└─ PTB transaction proof ✓
```

## 📊 Data Flow

```
┌────────────┐         ┌────────────┐         ┌────────────┐
│            │ Encrypt │            │ Upload  │            │
│   Client   ├────────►│    Seal    ├────────►│   Walrus   │
│            │         │            │         │            │
└─────┬──────┘         └────────────┘         └──────▲─────┘
      │                                               │
      │ Store nonce                          Fetch   │
      │                                      encrypted│
      ▼                                               │
┌────────────┐                              ┌────────┴─────┐
│            │         Verify               │              │
│    Sui     │◄─────────────────────────────┤    Client    │
│ Blockchain │         subscription         │  (Playback)  │
│            ├──────────────────────────────►              │
└────────────┘         Approve               └──────┬───────┘
                       decryption                    │
                                                     │
                       ┌────────────┐               │
                       │            │   Decrypt     │
                       │    Seal    │◄──────────────┘
                       │            │
                       └─────┬──────┘
                             │
                             ▼
                      ┌────────────┐
                      │   Audio    │
                      │   Player   │
                      └────────────┘
```

## 🎯 Key Components Map

```
Frontend:
├─ src/app/SealProvider.tsx
│  └─ Initializes Seal client
│     └─ Manages key servers
│
├─ src/services/walrus-utils.ts
│  ├─ generateEncryptionNonce()
│  └─ uploadEncryptedAudio()
│     ├─ Encrypts audio
│     └─ Uploads to Walrus
│
├─ src/hooks/useSealAudioPlayer.ts
│  ├─ decryptAndPlayAudio()
│  └─ Creates verification PTB
│
└─ src/app/_components/EncryptedAudioPlayer.tsx
   └─ Complete player UI

Smart Contract:
├─ contract/sources/podcast.move
│  └─ Stores nonce in podcast.nouce field
│
└─ contract/sources/subscription.move
   ├─ seal_approve_subscription()
   │  └─ Verifies access to specific podcast
   └─ seal_approve_channel_access()
      └─ Verifies access to any channel content
```

## 🔑 Key Concepts

### Nonce (Number Used Once)

- 32-byte cryptographically secure random value
- Generated client-side for each podcast
- Stored on-chain in `podcast.nouce` field
- Used in Seal identity: `${packageId}:${nonce}`

### Identity

- Unique string identifying encrypted content
- Format: `${packageId}:${nonce}`
- Example: `0x123...abc:a1b2c3d4e5f6...`
- Required for both encryption and decryption

### Threshold Cryptography

- Requires 2 of 2 key servers to decrypt
- No single key server can decrypt alone
- Provides redundancy and security
- Configured in SealClient initialization

### PTB (Programmable Transaction Block)

- Transaction that proves subscription validity
- Built but not executed (just needs bytes)
- Passed to Seal for decryption authorization
- Contains verification function call

## 🎬 Example Timeline

```
Time    Action                              Component
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
00:00   User selects audio file            Upload Page
00:01   Generate nonce                     walrus-utils
00:02   Encrypt with Seal                  SealClient
00:05   Upload to Walrus                   walrus-utils
00:08   Create on-chain podcast            Move Contract
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Later...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
00:00   User clicks play                   AudioPlayer
00:01   Fetch from Walrus                  useSealAudioPlayer
00:03   Build verification PTB             useSealAudioPlayer
00:04   Verify subscription                Move Contract
00:05   Decrypt with Seal                  SealClient
00:07   Create audio URL                   useSealAudioPlayer
00:08   Audio starts playing               <audio> element
```

## 💡 Remember

- **Nonce is NOT the encryption key** - It's part of the identity
- **Smart contract verifies access** - Not Seal
- **Seal handles crypto** - You just pass the identity
- **Walrus stores encrypted data** - Never plaintext
- **Each podcast unique** - Different nonce = different identity
