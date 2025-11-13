import z from "zod";
import { getAllChannels, getChannelDetails } from "~/services/api";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const channelRouter = createTRPCRouter({
	isAddressSubscribedToChannel: publicProcedure
		.input(z.string())
		.query(async (opts) => {
			await new Promise((resolve) => setTimeout(resolve, 10));
			return false;
		}),
	list: publicProcedure.query(async () => {
		return await getAllChannels();
	}),
	byId: publicProcedure.input(z.string()).query(async (opts) => {
		const { input } = opts;
		return await getChannelDetails(input);
	}),
});
