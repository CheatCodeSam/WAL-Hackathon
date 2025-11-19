"use client";

import { SuiClientProvider, WalletProvider } from "@mysten/dapp-kit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@mysten/dapp-kit/dist/index.css";
import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import { env } from "~/env";
import { TRPCReactProvider } from "~/trpc/react";
import { networkConfig } from "./networkConfig";
import { SuiSealProvider } from "./SealProvider";

const queryClient = new QueryClient();

// Initialize SuiClient for Seal
const suiClient = new SuiClient({ url: getFullnodeUrl("testnet") });

export function Providers({ children }: { children: React.ReactNode }) {
	return (
		<QueryClientProvider client={queryClient}>
			<SuiClientProvider defaultNetwork="testnet" networks={networkConfig}>
				<WalletProvider
					autoConnect
					slushWallet={{
						name: "FundSui",
					}}
				>
					<SuiSealProvider
						autoInitSession={false}
						defaultThreshold={2}
						network="testnet"
						packageId={env.NEXT_PUBLIC_CONTRACT_ADDRESS}
						suiClient={suiClient}
					>
						<TRPCReactProvider>{children}</TRPCReactProvider>
					</SuiSealProvider>
				</WalletProvider>
			</SuiClientProvider>
		</QueryClientProvider>
	);
}
