import { TRPCError } from "@trpc/server";
import z from "zod";
import { getAllChannels, getChannelDetails } from "~/services/api";
import { lookupChannel } from "~/services/backend/channel/lookupChannel";
import { isAddressSubscribedToChannel } from "~/services/backend/subscription/lookupSubscription";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const channelRouter = createTRPCRouter({
	isAddressSubscribedToChannel: publicProcedure
		.input(z.object({ userAddress: z.string(), channelId: z.string() }))
		.query(async ({ ctx, input }) => {
			return await isAddressSubscribedToChannel(
				ctx.suiClient,
				input.userAddress,
				input.channelId,
			);
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
