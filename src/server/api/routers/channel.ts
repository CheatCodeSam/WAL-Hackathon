import z from "zod";
import { getAllChannels, getChannelDetails } from "~/services/api";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const channelRouter = createTRPCRouter({
  channel: {
		list: publicProcedure.query(async () => {
			return await getAllChannels();
		}),
		byId: publicProcedure.input(z.string()).query(async (opts) => {
			const { input } = opts;
			return await getChannelDetails(input);
		}),
	},
});
