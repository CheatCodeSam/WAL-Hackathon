import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { channelRouter } from "./routers/channel";
import { podcastRouter } from "./routers/podcast";

export const appRouter = createTRPCRouter({
	podcast: podcastRouter,
	channel: channelRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
