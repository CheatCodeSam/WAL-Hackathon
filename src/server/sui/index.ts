import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import { SuinsClient } from "@mysten/suins";

export const suiClient = new SuiClient({ url: getFullnodeUrl("testnet") });

export const suinsClient = new SuinsClient({
	client: suiClient,
	network: "testnet",
});
