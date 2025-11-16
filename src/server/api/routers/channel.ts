import { Transaction } from "@mysten/sui/transactions";
import { TRPCError } from "@trpc/server";
import z from "zod";
import { env } from "~/env";
import { getAllChannels, getChannelDetails } from "~/services/api";
import { lookupChannel } from "~/services/backend/channel/lookupChannel";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const channelRouter = createTRPCRouter({
	isAddressSubscribedToChannel: publicProcedure
		.input(z.object({ userAddress: z.string(), channelId: z.string() }))
		.query(async ({ ctx, input }) => {
			const suiClient = ctx.suiClient;

			const tx = new Transaction();
			tx.moveCall({
				arguments: [
					tx.object(input.channelId),
					tx.pure.address(input.userAddress),
				],
				target: `${env.NEXT_PUBLIC_CONTRACT_ADDRESS}::channel::is_address_subscribed`,
			});

			const result = await suiClient.devInspectTransactionBlock({
				sender: input.userAddress,
				transactionBlock: tx,
			});

			const booleanResult =
				result.results?.[0]?.returnValues?.at(0)?.at(0)?.at(0) === 1;

			return booleanResult;
		}),

	getChannelByOwner: publicProcedure.input(z.string()).query(async (opts) => {
		const channel = await lookupChannel(opts.input);
		if (channel.isErr()) {
			if (channel.error === "CHANNEL_NOT_FOUND_FOR_ADDRESS") {
				return null;
			}
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: channel.error,
			});
		}
		return channel.value;
	}),
	list: publicProcedure.query(async () => {
		return await getAllChannels();
	}),
	byId: publicProcedure.input(z.string()).query(async (opts) => {
		const { input } = opts;
		return await getChannelDetails(input);
	}),
});
