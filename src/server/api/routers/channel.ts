import { TRPCError } from "@trpc/server";
import z from "zod";
import { suiClient } from "~/server/sui";
import { getAllChannels, getChannelDetails } from "~/services/api";
import { lookupChannel } from "~/services/backend/channel/lookupChannel";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const channelRouter = createTRPCRouter({
	isAddressSubscribedToChannel: publicProcedure
		.input(z.string())
		.query(async (opts) => {
			await new Promise((resolve) => setTimeout(resolve, 10));
			return false;
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
