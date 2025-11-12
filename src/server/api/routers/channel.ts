import { Transaction } from "@mysten/sui/transactions";
import z from "zod";
import { env } from "~/env";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const channelRouter = createTRPCRouter({
	getChannelBySuiAddress: publicProcedure
		.input(z.object({ address: z.string() }))
		.query(async ({ input, ctx }) => {
			const { suiClient, suinsClient } = ctx;

			let resolvedAddress: string;

			if (input.address.endsWith(".sui")) {
				const nameRecord = await suinsClient.getNameRecord(input.address);
				if (!nameRecord?.targetAddress) {
					throw new Error(
						`SuiNS name "${input.address}" not found or has no target address`,
					);
				}
				resolvedAddress = nameRecord.targetAddress;
			} else if (/^0[xX][a-fA-F0-9]{64}$/.test(input.address)) {
				resolvedAddress = input.address;
			} else {
				throw new Error(
					"Malformed request: address must be a valid Sui address (0x...) or SuiNS name (.sui)",
				);
			}

			const tx = new Transaction();
			tx.moveCall({
				target: `${env.NEXT_PUBLIC_CONTRACT_ADDRESS}::channel::get_channel_id_for_address`,
				arguments: [
					tx.object(env.NEXT_PUBLIC_CHANNEL_REGISTRY),
					tx.pure.address(resolvedAddress),
				],
			});

			const result = await suiClient.devInspectTransactionBlock({
				sender: resolvedAddress,
				transactionBlock: tx,
			});

			if (result.results?.[0]?.returnValues) {
				const returnValue = result.results[0].returnValues[0];
				if (returnValue && returnValue[0].length > 1) {
					const channelIdBytes = returnValue[0].slice(1);
					const channelId = `0x${Buffer.from(channelIdBytes).toString("hex")}`;

					const channelObject = await suiClient.getObject({
						id: channelId,
						options: { showContent: true },
					});

					if (channelObject.data?.content?.dataType === "moveObject") {
						const fields = channelObject.data.content.fields as any;
						const channelName = fields.display_name;
						console.log(fields);
						console.log(`Channel name: ${channelName}`);
						return { channelName, exists: true, address: resolvedAddress };
					}
				}
			}

			console.log("No channel found for this address");
			return { channelName: null, exists: false, address: resolvedAddress };
		}),
});
