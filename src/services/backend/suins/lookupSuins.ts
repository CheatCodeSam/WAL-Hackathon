import { err, ok, type Result } from "neverthrow";
import { suiClient, suinsClient } from "~/server/sui";

export type LookupSuinsError = "MALFORMED_SUI_ADDRESS";

export const SUI_ADDRESS_REGEX = /^0[xX][a-fA-F0-9]{64}$/;

export async function lookupSuinsName(
	address: string,
): Promise<Result<string | undefined, LookupSuinsError>> {
	if (SUI_ADDRESS_REGEX.test(address)) {
		// biome-ignore lint/suspicious/noExplicitAny: It's a jsonRPC response
		const x: any = await suiClient.jsonRpc.call(
			"suix_resolveNameServiceNames",
			[address],
		);
		if (x?.data?.length > 0) {
			const suinsName = x.data.at(0) as string;
			return ok(suinsName);
		}
	} else {
		return err("MALFORMED_SUI_ADDRESS");
	}
	return ok(undefined);
}

export type getSuinsNameOrAddressError = LookupSuinsError;

export async function getSuinsNameOrAddress(
	address: string,
): Promise<Result<string, getSuinsNameOrAddressError>> {
	const name = await lookupSuinsName(address);
	if (name.isErr()) return err(name.error);
	if (name.value) return ok(name.value);
	else return ok(address);
}

export type ResolveSuinsOrGetAddressError =
	| "MALFORMED_SUI_ADDRESS"
	| GetSuiAddressError;

export async function resolveSuinsOrGetAddress(
	addressOrSuins: string,
): Promise<Result<string, ResolveSuinsOrGetAddressError>> {
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
	return ok(resolvedAddress);
}

export type GetSuiAddressError = "CANNOT_FIND_SUINS_NAME";

export async function getSuiAddress(
	suins: string,
): Promise<Result<string, GetSuiAddressError>> {
	const nameRecord = await suinsClient.getNameRecord(suins);
	if (!nameRecord) {
		return err("CANNOT_FIND_SUINS_NAME");
	}
	return ok(nameRecord.targetAddress);
}
