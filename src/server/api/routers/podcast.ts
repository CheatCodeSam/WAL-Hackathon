import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from "../trpc";
import podcasts from '~/server/mock/data/podcast';
import { episodes } from '~/server/mock/data/episode';
import channels from '~/server/mock/data/channel';


export const podcastRouter = createTRPCRouter({
  podcast: {
    list: publicProcedure.query(async () => {
      // Todo: query indexer for podcasts
      // Mock podcasts data
      
      return podcasts
    }),
    search: publicProcedure
      .input(z.object({ 
        query: z.string().optional(),
        category: z.string().optional() 
      }))
      .query(async (opts) => {
        const { input } = opts;
        let filtered = podcasts;

        // Filter by search query
        if (input.query && input.query.trim() !== '') {
          const searchLower = input.query.toLowerCase();
          filtered = filtered.filter(
            (podcast) =>
              podcast.title.toLowerCase().includes(searchLower) ||
              podcast.description.toLowerCase().includes(searchLower)
          );
        }

        // Filter by category
        if (input.category) {
          filtered = filtered.filter(
            (podcast) => podcast.category === input.category
          );
        }

        return filtered;
      }),
    listFromChannel: publicProcedure.input(z.string()).query(async (opts) => {
      // Todo: query indexer for podcast of channel `input`
      const { input } = opts;
      return podcasts.filter(pod => pod.channel === input);
    }),
    byId: publicProcedure.input(z.string()).query(async (opts) => {
      const { input } = opts;
      return podcasts.find(pod => pod.id === input)
      // Todo: query indexer for podcast by ID,
    })
  },
  episode: {
    list: publicProcedure.query(async () => {
      // Todo: query indexer for all episodes
      return episodes;
    }),
    listByPodcastId: publicProcedure.input(z.string()).query(async (opts) => {
      const { input } = opts;
      // Todo: query indexer for episodes of podcast `input`
      return episodes.filter(episode => episode.podcastId === input);
    }),
    byId: publicProcedure.input(z.number()).query(async (opts) => {
      const { input } = opts;
      // Todo: query indexer for episode by ID
      return episodes.find(episode => episode.id === input);
    })
  },
  channel: {
    list: publicProcedure.query(async () => {
      // Todo: query indexer for all channels
      return channels;
    }),
    byId: publicProcedure.input(z.string()).query(async (opts) => {
      const { input } = opts;
      // Todo: query indexer for channel by ID
      return channels.find(channel => channel.id === input);
    })
  }
})
