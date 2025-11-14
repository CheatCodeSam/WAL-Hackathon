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
	userId: string;
	subscriptionPriceMist?: string; // price per month in mist (1e-9 SUI)
	durationMonths?: number; // optional, defaults to 3 months
}

export function SubscribeButton(props: SubscribeButtonProps) {
	const fundsuiPackageId = useNetworkVariable("fundsuiPackageId");
	const hostingClientAddress = useNetworkVariable("hostingClientAddress");
	const { mutateAsync } = useSignAndExecuteTransaction();

	const duration = props.durationMonths ?? 3;
	const pricePerMonthMist = props.subscriptionPriceMist
		? BigInt(props.subscriptionPriceMist)
		: 0n;
	const totalPaymentMist = pricePerMonthMist * BigInt(duration);

	const disabled = totalPaymentMist <= 0n;

	return (
		<Button
			className="cursor-pointer"
			disabled={disabled}
			onClick={() => {
				subscribeToChannel(
					props.userId,
					props.channelId,
					duration,
					totalPaymentMist,
					hostingClientAddress,
					fundsuiPackageId,
					mutateAsync,
				);
			}}
			type="button"
		>
			{disabled ? "Unavailable" : "Subscribe"}
		</Button>
	);
}
