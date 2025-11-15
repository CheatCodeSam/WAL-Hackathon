import { z } from "zod";
import {
	getAllPodcasts,
	getPodcastDetails,
	getPodcastsByChannel,
} from "~/services/api";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const podcastRouter = createTRPCRouter({
	podcast: {
		list: publicProcedure.query(async () => {
			return await getAllPodcasts();
		}),

		listFromChannel: publicProcedure.input(z.string()).query(async (opts) => {
			const { input } = opts;
			return await getPodcastsByChannel(input);
		}),
		byId: publicProcedure.input(z.string()).query(async (opts) => {
			const { input } = opts;
			return await getPodcastDetails(input);
		}),
	},
});
