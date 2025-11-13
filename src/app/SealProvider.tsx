"use client";

import React, {
	createContext,
	useContext,
	useEffect,
	useMemo,
	useState,
	type ReactNode,
} from "react";
import { SealClient, SessionKey, EncryptedObject } from "@mysten/seal";
import { SuiClient } from "@mysten/sui/client";
import { useCurrentAccount, useSignPersonalMessage, useSignTransaction } from "@mysten/dapp-kit";

// Types
export type KeyServer = {
	objectId: string;
	url?: string;
	weight?: number;
	apiKeyName?: string;
	apiKey?: string;
};

export type EncryptOptions = {
	identity?: string;
	threshold?: number;
};

export type DecryptOptions = {
	identity?: string;
	txBytes: Uint8Array;
};

type SealContextValue = {
	ready: boolean;
	client?: SealClient;
	sessionKey?: SessionKey;
	keyServers: KeyServer[];
	setKeyServers: (ks: KeyServer[]) => void;
	encrypt: (
		plaintext: Uint8Array | string,
		opts?: EncryptOptions,
	) => Promise<{ encryptedObject: Uint8Array; key: Uint8Array }>;
	decrypt: (ciphertext: Uint8Array, opts: DecryptOptions) => Promise<Uint8Array>;
	verifyKeyServers: (keyServers: KeyServer[]) => Promise<boolean>;
	initializeSession: (packageId: string, ttlMin?: number) => Promise<void>;
};

const SealContext = createContext<SealContextValue | undefined>(undefined);

export const useSeal = (): SealContextValue => {
	const ctx = useContext(SealContext);
	if (!ctx) throw new Error("useSeal must be used within a SuiSealProvider");
	return ctx;
};

export type SuiSealProviderProps = {
	children: ReactNode;
	packageId: string;
	suiClient: SuiClient;
	initialKeyServers?: KeyServer[];
	network?: "testnet" | "mainnet";
	autoInitSession?: boolean;
	defaultThreshold?: number;
};

// Testnet verified key servers (from Seal docs)
const DEFAULT_TESTNET_KEY_SERVERS: KeyServer[] = [
	{
		objectId:
			"0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75",
		weight: 1,
	},
	{
		objectId:
			"0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8",
		weight: 1,
	},
];

// Mainnet verified key servers (update with actual mainnet servers when available)
const DEFAULT_MAINNET_KEY_SERVERS: KeyServer[] = [
	// Add mainnet key servers here
];

export const SuiSealProvider: React.FC<SuiSealProviderProps> = ({
	children,
	packageId,
	suiClient,
	initialKeyServers,
	network = "testnet",
	autoInitSession = true,
	defaultThreshold = 2,
}) => {
	const currentAccount = useCurrentAccount();
	const [client, setClient] = useState<SealClient | undefined>(undefined);
	const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();
	const [sessionKey, setSessionKey] = useState<SessionKey | undefined>(
		undefined,
	);
	const [ready, setReady] = useState(false);
	const [keyServers, setKeyServers] = useState<KeyServer[]>(
		initialKeyServers ||
			(network === "testnet"
				? DEFAULT_TESTNET_KEY_SERVERS
				: DEFAULT_MAINNET_KEY_SERVERS),
	);

	// Initialize Seal client
	useEffect(() => {
		let mounted = true;

		async function init() {
			try {
				const sealClient = new SealClient({
					suiClient,
					serverConfigs: keyServers.map((ks) => ({
						objectId: ks.objectId,
						weight: ks.weight ?? 1,
					})),
					verifyKeyServers: false, // Set to true if you want to verify key servers
				});

				if (!mounted) return;

				setClient(sealClient);
				setReady(true);
			} catch (e) {
				console.error("Failed to initialize Seal SDK:", e);
			}
		}

		init();

		return () => {
			mounted = false;
		};
	}, [suiClient, keyServers]);

	// Auto-initialize session when account is connected
	useEffect(() => {
		if (
			autoInitSession &&
			ready &&
			client &&
			currentAccount?.address &&
			!sessionKey
		) {
			initializeSession(packageId) // 30 minutes default TTL
				.catch((err) => {
					console.error("Failed to auto-initialize session:", err);
				});
		}
	}, [autoInitSession, ready, client, currentAccount?.address, sessionKey]);

	// Initialize session key
	const initializeSession = async (
		targetPackageId: string,
		ttlMin: number = 30,
	) => {
		if (!currentAccount?.address) {
			throw new Error("Wallet not connected");
		}

		try {
			const session = await SessionKey.create({
				address: currentAccount.address,
				packageId: targetPackageId.startsWith("0x")
					? targetPackageId
					: `0x${targetPackageId}`,
				ttlMin,
				suiClient,
			});

			const message = session.getPersonalMessage();

			const { signature } = await signPersonalMessage({ message });
			session.setPersonalMessageSignature(signature);
			setSessionKey(session);

			console.log(
				"Session initialized. User needs to sign message:",
				message,
			);
		} catch (e) {
			console.error("Failed to initialize session:", e);
			throw e;
		}
	};

	// Encrypt function
	const encrypt = useMemo(() => {
		return async (
			plaintext: Uint8Array | string,
			opts: EncryptOptions = {},
		) => {
			if (!client) throw new Error("Seal SDK not initialized");

			const pt =
				typeof plaintext === "string"
					? new TextEncoder().encode(plaintext)
					: plaintext;
			const identity = opts.identity ?? "default";
			const threshold = opts.threshold ?? defaultThreshold;

			return await client.encrypt({
				threshold,
				packageId: packageId.startsWith("0x")
					? packageId
					: `0x${packageId}`,
				id: identity,
				data: pt,
			});
		};
	}, [client, keyServers, packageId, defaultThreshold]);

	// Decrypt function
	const decrypt = useMemo(() => {
		return async (
			ciphertext: Uint8Array,
			opts: DecryptOptions,
		): Promise<Uint8Array> => {
			if (!client) throw new Error("Seal SDK not initialized");
			if (!sessionKey) throw new Error("Session key not initialized");

			const data =  await client.decrypt({
				data: ciphertext,
				sessionKey,
				txBytes: opts.txBytes,

				checkLEEncoding: false,
        checkShareConsistency: false
			});

			return data
		};
	}, [client, sessionKey]);

	// Verify key servers
	const verifyKeyServers = useMemo(() => {
		return async (servers: KeyServer[]): Promise<boolean> => {
			if (!client) throw new Error("Seal SDK not initialized");

			try {
				// Create a new client with verification enabled
				const verifyClient = new SealClient({
					suiClient,
					serverConfigs: servers.map((ks) => ({
						objectId: ks.objectId,
						weight: ks.weight ?? 1,
						apiKeyName: ks.apiKeyName,
						apiKey: ks.apiKey,
					})),
					verifyKeyServers: true,
				});

				return true;
			} catch (e) {
				console.error("Key server verification failed:", e);
				return false;
			}
		};
	}, [suiClient]);

	const value: SealContextValue = {
		ready,
		client,
		sessionKey,
		keyServers,
		setKeyServers,
		encrypt,
		decrypt,
		verifyKeyServers,
		initializeSession,
	};

	return <SealContext.Provider value={value}>{children}</SealContext.Provider>;
};

export default SuiSealProvider;
