import { createNetworkConfig } from "@mysten/dapp-kit";
import { getFullnodeUrl } from "@mysten/sui/client";
import { env } from "~/env";

const { networkConfig, useNetworkVariable, useNetworkVariables } =
	createNetworkConfig({
		testnet: {
			url: getFullnodeUrl("testnet"),
			variables: {
				fundsuiPackageId: env.NEXT_PUBLIC_CONTRACT_ADDRESS,
				fundsuiChannelRegistry: env.NEXT_PUBLIC_CHANNEL_REGISTRY,
			},
		},
		mainnet: { 
			url: getFullnodeUrl("mainnet"),
			variables: {
				fundsuiPackageId: env.NEXT_PUBLIC_CONTRACT_ADDRESS,
				fundsuiChannelRegistry: env.NEXT_PUBLIC_CHANNEL_REGISTRY,
			},
		},
	});
export { useNetworkVariable, useNetworkVariables, networkConfig };
