import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import {
	getAllPodcasts,
	getPodcastsByChannel,
	getPodcastDetails,
	getAllChannels,
	getChannelDetails,
} from "~/services/api";

export const podcastRouter = createTRPCRouter({
	podcast: {
		list: publicProcedure.query(async () => {
			return await getAllPodcasts();
		}),
		search: publicProcedure
			.input(
				z.object({
					query: z.string().optional(),
					category: z.string().optional(),
					channelId: z.string().optional(),
				}),
			)
			.query(async (opts) => {
				const { input } = opts;
				
				// Get podcasts from specific channel or all podcasts
				let filtered = input.channelId 
					? await getPodcastsByChannel(input.channelId)
					: await getAllPodcasts();
				
				console.log("Podcasts:", filtered);
				
				// Filter by search query
				if (input.query && input.query.trim() !== "") {
					const searchLower = input.query.toLowerCase();
					filtered = filtered.filter(
						(podcast) =>
							podcast?.title.toLowerCase().includes(searchLower) ||
							podcast?.description.toLowerCase().includes(searchLower),
					);
				}
				
				return filtered;
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
