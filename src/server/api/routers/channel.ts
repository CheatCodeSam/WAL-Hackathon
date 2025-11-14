import z from "zod";
import { getAllChannels, getChannelDetails } from "~/services/api";
import { getChannelDetailsByAddress } from "~/services/api/channel";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { suinsClient } from "~/server/sui";

export const channelRouter = createTRPCRouter({
  channel: {
		list: publicProcedure.query(async () => {
			return await getAllChannels();
		}),
		byId: publicProcedure.input(z.string()).query(async (opts) => {
			const { input } = opts;
			return await getChannelDetails(input);
		}),
		byAddress: publicProcedure.input(z.string()).query(async (opts) => {
			const SUI_ADDRESS_REGEX = /^0[xX][a-fA-F0-9]{64}$/;

			const { input } = opts;
			let resolvedAddress = "";

			if (input.endsWith(".sui")) {
				const nameRecord = await suinsClient.getNameRecord(input);
				if (!nameRecord || !nameRecord.targetAddress) {
					throw new Error("CANNOT_FIND_SUINS_NAME");
				}

				if (!SUI_ADDRESS_REGEX.test(nameRecord.targetAddress)) {
					throw new Error("MALFORMED_SUI_ADDRESS");
				}

				resolvedAddress = nameRecord.targetAddress;
			} else if (SUI_ADDRESS_REGEX.test(input)) {
				resolvedAddress = input;
			} else {
				throw new Error("MALFORMED_SUI_ADDRESS");
			}

			return await getChannelDetailsByAddress(resolvedAddress);
		})
	},
});
