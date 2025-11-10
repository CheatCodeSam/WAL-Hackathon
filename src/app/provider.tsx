"use client";

import { SuiClientProvider, WalletProvider } from "@mysten/dapp-kit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import "@mysten/dapp-kit/dist/index.css";
import { TRPCReactProvider } from "~/trpc/react";
import { networkConfig } from "./networkConfig";

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
	return (
		<QueryClientProvider client={queryClient}>
			<SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
				<WalletProvider
					autoConnect
					slushWallet={{
						name: "De Gallery",
					}}
				>
					<TRPCReactProvider>{children}</TRPCReactProvider>
				</WalletProvider>
			</SuiClientProvider>
		</QueryClientProvider>
	);
}
