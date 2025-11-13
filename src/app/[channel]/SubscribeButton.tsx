"use client";

import {
	useCurrentAccount,
	useSignAndExecuteTransaction,
	useSuiClient,
} from "@mysten/dapp-kit";
import { Button } from "~/components/ui/button";
import { subscribeToChannel } from "../machines/subscribeButtonState";
import { useNetworkVariable } from "../networkConfig";

interface SubscribeButtonProps {
	channelId: string;
}

export function SubscribeButton(props: SubscribeButtonProps) {
	const account = useCurrentAccount()!;
	const fundsuiPackageId = useNetworkVariable("fundsuiPackageId");
	const hostingClientAddress = useNetworkVariable("hostingClientAddress");
	const { mutateAsync } = useSignAndExecuteTransaction();

	return (
		<Button
			className="cursor-pointer"
			onClick={() => {
				subscribeToChannel(
					account.address,
					props.channelId,
					3,
					hostingClientAddress,
					fundsuiPackageId,
					mutateAsync,
				);
			}}
			type="button"
		>
			Subscribe
		</Button>
	);
}
