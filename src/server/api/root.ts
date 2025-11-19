import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { channelRouter } from "./routers/channel";

export const appRouter = createTRPCRouter({
	channel: channelRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
