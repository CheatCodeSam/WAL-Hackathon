import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import z from "zod";
import { env } from "~/env";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const channelRouter = createTRPCRouter({
    //TODO support suiNS
    getChannelBySuiAddress: publicProcedure
        .input(z.object({ address: z.string() }))
        .query(async ({ input }) => {
            const client = new SuiClient({ url: getFullnodeUrl("testnet") });

            const tx = new Transaction();
            tx.moveCall({
                target: `${env.NEXT_PUBLIC_CONTRACT_ADDRESS}::channel::get_channel_id_for_address`,
                arguments: [
                    tx.object(env.NEXT_PUBLIC_CHANNEL_REGISTRY),
                    tx.pure.address(input.address),
                ],
            });

            const result = await client.devInspectTransactionBlock({
                sender: input.address,
                transactionBlock: tx,
            });

            if (result.results?.[0]?.returnValues) {
                const returnValue = result.results[0].returnValues[0];
                if (returnValue && returnValue[0].length > 1) {
                    const channelIdBytes = returnValue[0].slice(1);
                    const channelId = "0x" + Buffer.from(channelIdBytes).toString("hex");

                    const channelObject = await client.getObject({
                        id: channelId,
                        options: { showContent: true },
                    });

                    if (channelObject.data?.content?.dataType === "moveObject") {
                        const fields = channelObject.data.content.fields as any;
                        const channelName = fields.display_name;
                        console.log(`Channel name: ${channelName}`);
                        return { channelName, exists: true };
                    }
                }
            }

            console.log("No channel found for this address");
            return { channelName: null, exists: false };
        }),
});
