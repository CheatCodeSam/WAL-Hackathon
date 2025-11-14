import z from "zod";
import { getUserDetails } from "~/services/api";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const userRouter = createTRPCRouter({
  user: {
    byAddress: publicProcedure.input(z.string()).query(async ({ input }) => {
      return await getUserDetails(input);
    }),
  },
});
