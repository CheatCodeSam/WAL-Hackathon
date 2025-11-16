"use client";
import {
	useCurrentAccount,
	useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";
import Link from "next/link";
import { useEffect } from "react";
import { Button } from "~/components/ui/button";
import type {
	ChannelViewInterface,
	PodcastChannelViewInterface,
} from "~/services/backend/channel/lookupChannel";
import { api } from "~/trpc/react";
import { useNetworkVariable } from "../networkConfig";
import { deleteSubscriptionToChannel, subscribeToChannel } from "./actions";
import { useChannelPageStore } from "./store";

export interface ChannelPageViewProps {
	channel: ChannelViewInterface;
	podcasts: PodcastChannelViewInterface[];
}

export function ChannelPageView(props: ChannelPageViewProps) {
	const channel = props.channel;
	const podcasts = props.podcasts;

	const account = useCurrentAccount();
	const fundsuiPackageId = useNetworkVariable("fundsuiPackageId");
	const hostingClientAddress = useNetworkVariable("hostingClientAddress");
	const { mutateAsync } = useSignAndExecuteTransaction();

	const isOwner = account?.address === channel.owner;

	const {
		status,
		action,
		error,
		canSubscribe,
		canUnsubscribe,
		isLoading,
		setIsOwner,
		setNoWallet,
		startChecking,
		setSubscribed,
		setNotSubscribed,
		setCheckError,
		startSubscribing,
		finishSubscribing,
		setExpiredSubscription,
		failSubscribing,
		startUnsubscribing,
		finishUnsubscribing,
		failUnsubscribing,
	} = useChannelPageStore();

	const isSubscribedQuery = api.channel.isAddressSubscribedToChannel.useQuery(
		{
			channelId: channel.channelId,
			userAddress: account?.address ?? "",
		},
		{ enabled: !!account?.address },
	);

	useEffect(() => {
		setIsOwner(isOwner);
	}, [isOwner, setIsOwner]);

	useEffect(() => {
		if (!account?.address) {
			setNoWallet();
			return;
		}

		if (isSubscribedQuery.isPending) {
			startChecking();
		} else if (isSubscribedQuery.isError) {
			setCheckError(isSubscribedQuery.error.message);
		} else if (isSubscribedQuery.data !== undefined) {
			const subscriptionResult = isSubscribedQuery.data;
			if (subscriptionResult.hasSubscription) {
				if (subscriptionResult.isActive) {
					setSubscribed();
				} else {
					setExpiredSubscription();
				}
			} else {
				setNotSubscribed();
			}
		}
	}, [
		account?.address,
		isSubscribedQuery.isPending,
		isSubscribedQuery.isError,
		isSubscribedQuery.data,
		isSubscribedQuery.error,
		startChecking,
		setExpiredSubscription,
		setSubscribed,
		setNotSubscribed,
		setCheckError,
		setNoWallet,
	]);

	const handleSubscribe = async () => {
		if (!canSubscribe() || !account?.address) return;

		startSubscribing();
		const result = await subscribeToChannel(
			channel.channelId,
			hostingClientAddress,
			fundsuiPackageId,
			mutateAsync,
		);
		if (result.isErr()) failSubscribing(result.error.msg);
		else finishSubscribing();
	};

	const handleUnsubscribe = async () => {
		if (!canUnsubscribe() || !account?.address) return;

		startUnsubscribing();
		const result = await deleteSubscriptionToChannel(
			channel.channelId,
			fundsuiPackageId,
			mutateAsync,
		);
		if (result.isErr()) {
			failUnsubscribing(result.error.msg);
		} else {
			finishUnsubscribing();
		}
	};

	const getButtonText = () => {
		if (status === "no_wallet") return "Connect Wallet";
		if (action === "subscribing") return "Subscribing...";
		if (action === "unsubscribing") return "Deleting Subscription...";
		if (status === "checking") return "Checking subscription...";
		if (status === "subscribed") return "Subscribed";
		if (status === "expired_subscription") return "Delete Expired Subscription";
		if (status === "not_subscribed") return "Subscribe";
		if (status === "error") return "Error - Retry";
		return "Loading...";
	};

	const handleButtonClick = () => {
		if (status === "no_wallet") {
			return;
		}
		if (status === "expired_subscription") {
			// User has expired subscription object, delete it
			handleUnsubscribe();
		} else if (status === "not_subscribed" || status === "error") {
			handleSubscribe();
		}
	};

	return (
		<div className="min-h-screen bg-gray-50 p-8">
			<div className="mx-auto max-w-4xl rounded-lg bg-white p-6 shadow-md">
				<h1 className="mb-6 font-bold text-3xl">Channel Details</h1>
				<div className="space-y-4">
					<div className="flex gap-4">
						<Button
							className="cursor-pointer"
							disabled={isLoading() || isOwner}
							onClick={handleButtonClick}
							type="button"
						>
							{getButtonText()}
						</Button>
						{isOwner && (
							<Link href="/upload">
								<Button className="cursor-pointer" type="button">
									Upload New Episode
								</Button>
							</Link>
						)}
					</div>
					{error && <p className="text-red-600 text-sm">Error: {error}</p>}
					<div className="border-gray-300 border-t pt-4 text-gray-600 text-xs">
						<p>Status: {status}</p>
						<p>Action: {action}</p>
						<p>Can Subscribe: {canSubscribe() ? "Yes" : "No"}</p>
						<p>Can Unsubscribe: {canUnsubscribe() ? "Yes" : "No"}</p>
						<p>Is Owner: {isOwner ? "Yes" : "No"}</p>
					</div>
				</div>
				<div className="space-y-4">
					<div>
						<span className="font-semibold">Owner:</span>
						<p className="break-all font-mono text-gray-700 text-sm">
							{channel.owner}
						</p>
					</div>

					<div>
						<span className="font-semibold">Display Name:</span>
						<p className="text-gray-700">{channel.displayName}</p>
					</div>

					<div>
						<span className="font-semibold">Tag Line:</span>
						<p className="text-gray-700">{channel.tagLine}</p>
					</div>

					<div>
						<span className="font-semibold">Description:</span>
						<p className="text-gray-700">{channel.description}</p>
					</div>

					<div>
						<span className="font-semibold">Cover Photo URI:</span>
						<p className="break-all text-gray-700">{channel.coverPhotoUri}</p>
					</div>

					<div>
						<span className="font-semibold">Profile Photo URI:</span>
						<p className="break-all text-gray-700">{channel.profilePhotoUri}</p>
					</div>

					<div>
						<span className="font-semibold">Subscription Price (in MIST):</span>
						<p className="text-gray-700">{channel.subscriptionPriceInMist}</p>
					</div>

					<div>
						<span className="font-semibold">
							Max Subscription Duration (weeks):
						</span>
						<p className="text-gray-700">
							{channel.maxSubscriptionDurationInWeeks}
						</p>
					</div>
				</div>

				<div className="mt-8 space-y-4">
					<h2 className="font-bold text-2xl">Podcasts</h2>
					{podcasts.length === 0 ? (
						<p className="text-gray-600">No podcasts available yet.</p>
					) : (
						<div className="space-y-2">
							{podcasts.map((podcast) => (
								<Link
									key={podcast.id}
									href={`/${channel.owner}/${podcast.id}`}
									className="block rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
								>
									<div className="font-semibold text-lg">{podcast.title}</div>
									<div className="font-mono text-gray-500 text-xs">
										{podcast.id}
									</div>
								</Link>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
