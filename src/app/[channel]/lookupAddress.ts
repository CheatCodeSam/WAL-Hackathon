import { Transaction } from "@mysten/sui/transactions";
import { err, ok, Result } from "neverthrow";
import { resolve } from "path";
import { env } from "~/env";
import { suiClient, suinsClient } from "~/server/sui";

export type LookUpChannelError =
	| "CANNOT_FIND_SUINS_NAME"
	| "MALFORMED_SUI_ADDRESS"
	| "CHANNEL_NOT_FOUND_FOR_ADDRESS";

export interface ChannelViewInterface {
	owner: string;
	displayName: string;
	tagLine: string;
	description: string;
	coverPhotoUri: string;
	profilePhotoUri: string;
	subscriptionPriceInMist: number;
	maxSubscriptionDurationInMonths: number;
}

const SUI_ADDRESS_REGEX = /^0[xX][a-fA-F0-9]{64}$/;

export async function lookupChannel(
	addressOrSuins: string,
): Promise<Result<ChannelViewInterface, LookUpChannelError>> {
	let resolvedAddress: string;
	if (addressOrSuins.endsWith(".sui")) {
		const addressRet = await getSuiAddress(addressOrSuins);
		if (addressRet.isErr()) return err(addressRet.error);
		resolvedAddress = addressRet.value;
	} else if (SUI_ADDRESS_REGEX.test(addressOrSuins)) {
		resolvedAddress = addressOrSuins;
	} else {
		return err("MALFORMED_SUI_ADDRESS");
	}

	const channelResult = await getChannelForAddress(resolvedAddress);
	if (channelResult.isErr()) return err(channelResult.error);

	return ok(channelResult.value);
}

export async function getSuiAddress(
	suins: string,
): Promise<Result<string, LookUpChannelError>> {
	const nameRecord = await suinsClient.getNameRecord(suins);
	if (!nameRecord) {
		return err("CANNOT_FIND_SUINS_NAME");
	}
	return ok(nameRecord.targetAddress);
}

async function getChannelForAddress(
	address: string,
): Promise<Result<ChannelViewInterface, LookUpChannelError>> {
	const tx = new Transaction();
	tx.moveCall({
		target: `${env.NEXT_PUBLIC_CONTRACT_ADDRESS}::channel::get_channel_id_for_address`,
		arguments: [
			tx.object(env.NEXT_PUBLIC_CHANNEL_REGISTRY),
			tx.pure.address(address),
		],
	});

	const result = await suiClient.devInspectTransactionBlock({
		sender: address,
		transactionBlock: tx,
	});

	if (result.results?.[0]?.returnValues) {
		const returnValue = result.results[0].returnValues[0];
		if (returnValue && returnValue[0].length > 1) {
			const channelIdBytes = returnValue[0].slice(1);
			const channelId = `0x${Buffer.from(channelIdBytes).toString("hex")}`;

			const channelObject = await suiClient.getObject({
				id: channelId,
				options: { showContent: true },
			});

			if (channelObject.data?.content?.dataType === "moveObject") {
				// biome-ignore lint/suspicious/noExplicitAny: If we get a object we know it has fields
				const fields = channelObject.data.content.fields as any;

				const channelView: ChannelViewInterface = {
					owner: fields.owner,
					displayName: fields.display_name,
					tagLine: fields.tag_line,
					description: fields.description,
					coverPhotoUri: fields.cover_photo_uri,
					profilePhotoUri: fields.profile_photo_uri,
					subscriptionPriceInMist: Number(fields.subscription_price_in_mist),
					maxSubscriptionDurationInMonths: Number(
						fields.max_subscription_duration_in_months,
					),
				};

				return ok(channelView);
			}
		}
	}

	return err("CHANNEL_NOT_FOUND_FOR_ADDRESS");
}
