import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { channelRouter } from "./routers/channel";
import { podcastRouter } from "./routers/podcast";
import { userRouter } from "./routers/user";

export const appRouter = createTRPCRouter({
	podcast: podcastRouter,
	channel: channelRouter,
	user: userRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
