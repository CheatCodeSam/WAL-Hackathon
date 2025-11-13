import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
	server: {
		DATABASE_URL: z.string().url(),
		NODE_ENV: z
			.enum(["development", "test", "production"])
			.default("development"),
	},
	client: {
		NEXT_PUBLIC_CONTRACT_ADDRESS: z.string(),
		NEXT_PUBLIC_CHANNEL_REGISTRY: z.string(),
		// NEXT_PUBLIC_CLIENT_ADDRESS: z.string(),
		NEXT_PUBLIC_WALRUS_PUBLISHER: z.string().url(),
		NEXT_PUBLIC_WALRUS_AGGREGATOR: z.string().url(),
		NEXT_PUBLIC_SUI_GRAPHQL_URL: z
			.string()
			.url()
			.default("https://graphql.testnet.sui.io/graphql"),
	},
	runtimeEnv: {
		DATABASE_URL: process.env.DATABASE_URL,
		NODE_ENV: process.env.NODE_ENV,
		NEXT_PUBLIC_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
		NEXT_PUBLIC_CHANNEL_REGISTRY: process.env.NEXT_PUBLIC_CHANNEL_REGISTRY,
		// NEXT_PUBLIC_CLIENT_ADDRESS: process.env.NEXT_PUBLIC_CLIENT_ADDRESS,
		NEXT_PUBLIC_WALRUS_PUBLISHER: process.env.NEXT_PUBLIC_WALRUS_PUBLISHER,
		NEXT_PUBLIC_WALRUS_AGGREGATOR: process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR,
		NEXT_PUBLIC_SUI_GRAPHQL_URL: process.env.NEXT_PUBLIC_SUI_GRAPHQL_URL,
	},
	skipValidation: !!process.env.SKIP_ENV_VALIDATION,
	emptyStringAsUndefined: true,
});
