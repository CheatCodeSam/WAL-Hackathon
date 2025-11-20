"use client";
import {
	useCurrentAccount,
	useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";
import { Edit, MoreVertical, Upload } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { env } from "~/env";
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
	channelIdentifier: string;
}

export function ChannelPageView(props: ChannelPageViewProps) {
	const channel = props.channel;
	const podcasts = props.podcasts;
	const channelIdentifier = props.channelIdentifier;

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
		isSubscriptionModalOpen,
		setIsSubscriptionModalOpen,
		subscriptionWeeks,
		setSubscriptionWeeks,
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

		setIsSubscriptionModalOpen(true);
	};

	const confirmSubscription = async () => {
		setIsSubscriptionModalOpen(false);
		startSubscribing();
		const totalCost = subscriptionWeeks * channel.subscriptionPriceInMist;

		const result = await subscribeToChannel(
			channel.channelId,
			hostingClientAddress,
			fundsuiPackageId,
			mutateAsync,
			totalCost,
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

	const bannerUrl = channel.coverPhotoUri
		? `${env.NEXT_PUBLIC_WALRUS_AGGREGATOR}/v1/blobs/${channel.coverPhotoUri}`
		: null;

	const profileUrl = channel.profilePhotoUri
		? `${env.NEXT_PUBLIC_WALRUS_AGGREGATOR}/v1/blobs/${channel.profilePhotoUri}`
		: null;

	return (
		<div className="min-h-screen bg-gray-50 pt-6 pb-12">
			<div className="container mx-auto max-w-5xl px-4">
				{/* Banner Image */}
				<div className="relative h-48 w-full overflow-hidden rounded-lg bg-gray-200 shadow-sm md:h-64 lg:h-80">
					{bannerUrl ? (
						<img
							alt="Channel Banner"
							className="h-full w-full object-cover"
							src={bannerUrl}
						/>
					) : (
						<div className="flex h-full w-full items-center justify-center bg-gradient-to-r from-blue-400 to-purple-500 text-white">
							<span className="font-bold text-4xl opacity-30">
								{channel.displayName}
							</span>
						</div>
					)}
				</div>

				<div className="-mt-16 relative mb-6 flex flex-col items-center px-4 md:mb-8 md:flex-row md:items-end md:space-x-6">
					{/* Profile Picture */}
					<Avatar className="h-32 w-32 rounded-full border-4 border-white bg-white shadow-lg md:h-40 md:w-40">
						<AvatarImage
							alt={channel.displayName}
							className="object-cover"
							src={profileUrl ?? undefined}
						/>
						<AvatarFallback className="font-bold text-2xl">
							{channel.displayName.substring(0, 2).toUpperCase()}
						</AvatarFallback>
					</Avatar>

					{/* Header Info */}
					<div className="mt-4 text-center md:mt-0 md:mb-4 md:text-left">
						<h1 className="font-bold text-3xl text-gray-900 md:text-4xl">
							{channel.displayName}
						</h1>
						<p className="text-gray-600 text-lg md:text-xl">
							{channel.tagLine}
						</p>
					</div>

					{/* Action Buttons */}
					<div className="mt-4 flex flex-wrap items-center gap-3 md:mt-0 md:mb-4 md:ml-auto">
						<Button
							className="min-w-[140px] cursor-pointer"
							disabled={isLoading() || isOwner}
							onClick={handleButtonClick}
							type="button"
							variant={status === "subscribed" ? "secondary" : "default"}
						>
							{getButtonText()}
						</Button>

						{isOwner && (
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										className="cursor-pointer"
										size="icon"
										variant="outline"
									>
										<MoreVertical className="h-4 w-4" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									<Link href="/channel/edit">
										<DropdownMenuItem className="cursor-pointer">
											<Edit className="mr-2 h-4 w-4" />
											<span>Edit Channel</span>
										</DropdownMenuItem>
									</Link>
									<Link href="/upload">
										<DropdownMenuItem className="cursor-pointer">
											<Upload className="mr-2 h-4 w-4" />
											<span>Upload Episode</span>
										</DropdownMenuItem>
									</Link>
								</DropdownMenuContent>
							</DropdownMenu>
						)}
					</div>
				</div>

				{/* Subscription Status/Error Messages */}
				<div className="mb-6">
					{error && (
						<div className="rounded-md bg-red-50 p-3 text-red-600 text-sm">
							Error: {error}
						</div>
					)}
					<div className="text-gray-500 text-xs">
						{status === "checking" && "Checking subscription status..."}
					</div>
				</div>

				{/* Main Content Tabs */}
				<Tabs className="w-full" defaultValue="episodes">
					<TabsList className="mb-6 w-full justify-start border-b bg-transparent p-0">
						<TabsTrigger
							className="rounded-none border-transparent border-b-2 px-6 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
							value="episodes"
						>
							Episodes
						</TabsTrigger>
						<TabsTrigger
							className="rounded-none border-transparent border-b-2 px-6 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
							value="about"
						>
							About
						</TabsTrigger>
					</TabsList>

					<TabsContent className="space-y-6" value="episodes">
						{podcasts.length === 0 ? (
							<div className="py-12 text-center">
								<h3 className="mb-2 font-semibold text-gray-900 text-xl">
									No episodes yet
								</h3>
								<p className="text-gray-500">
									This channel hasn't published any podcasts yet.
								</p>
							</div>
						) : (
							<div className="grid gap-4">
								{podcasts.map((podcast) => (
									<Link
										className="block transition-transform hover:scale-[1.01]"
										href={`/${channelIdentifier}/${podcast.id}`}
										key={podcast.id}
									>
										<Card className="hover:border-primary/50 hover:shadow-md">
											<CardContent className="p-6">
												<div className="flex items-start justify-between gap-4">
													<div>
														<h3 className="mb-2 font-bold text-gray-900 text-xl">
															{podcast.title}
														</h3>
														<p className="mb-2 line-clamp-2 text-gray-600 text-sm">
															{podcast.description}
														</p>
														{/* We could add a description or date here if available in the data */}
														<div className="truncate font-mono text-gray-400 text-xs">
															ID: {podcast.id}
														</div>
													</div>
													{/* If podcasts have images, we could add a thumbnail here */}
												</div>
											</CardContent>
										</Card>
									</Link>
								))}
							</div>
						)}
					</TabsContent>

					<TabsContent value="about">
						<Card>
							<CardContent className="space-y-6 p-6">
								<div>
									<h3 className="mb-2 font-semibold text-gray-900 text-lg">
										Description
									</h3>
									<p className="whitespace-pre-wrap text-gray-700 leading-relaxed">
										{channel.description || "No description available."}
									</p>
								</div>

								<div className="mt-6 grid grid-cols-1 gap-6 border-t pt-6 sm:grid-cols-2 md:grid-cols-3">
									<div>
										<span className="block text-gray-500 text-sm">Owner</span>
										<p className="break-all font-mono text-gray-900 text-sm">
											{channel.owner}
										</p>
									</div>

									<div>
										<span className="block text-gray-500 text-sm">
											Subscription Price
										</span>
										<p className="font-medium text-gray-900">
											{status === "not_subscribed"
												? `${(Number(channel.subscriptionPriceInMist) / 1_000_000_000).toFixed(4)} SUI`
												: `${channel.subscriptionPriceInMist} MIST`}
										</p>
									</div>

									<div>
										<span className="block text-gray-500 text-sm">
											Max Duration
										</span>
										<p className="font-medium text-gray-900">
											{channel.maxSubscriptionDurationInWeeks} weeks
										</p>
									</div>

									<div>
										<span className="block text-gray-500 text-sm">
											Podcasts
										</span>
										<p className="font-medium text-gray-900">
											{channel.numberOfPodcasts}
										</p>
									</div>

									<div>
										<span className="block text-gray-500 text-sm">
											Subscribers
										</span>
										<p className="font-medium text-gray-900">
											{channel.numberOfSubscribers}
										</p>
									</div>
								</div>
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>
			</div>
			<Dialog
				onOpenChange={setIsSubscriptionModalOpen}
				open={isSubscriptionModalOpen}
			>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle>Subscribe to {channel.displayName}</DialogTitle>
						<DialogDescription>
							Choose how many weeks you want to subscribe for. (Max:{" "}
							{channel.maxSubscriptionDurationInWeeks} weeks)
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<div className="grid grid-cols-4 items-center gap-4">
							<Label className="text-right" htmlFor="weeks">
								Weeks
							</Label>
							<Input
								className="col-span-3"
								id="weeks"
								max={channel.maxSubscriptionDurationInWeeks}
								min={1}
								onChange={(e) => {
									const val = Number.parseInt(e.target.value, 10);
									if (
										val > 0 &&
										val <= channel.maxSubscriptionDurationInWeeks
									) {
										setSubscriptionWeeks(val);
									}
								}}
								type="number"
								value={subscriptionWeeks}
							/>
						</div>
						<div className="grid grid-cols-4 items-center gap-4">
							<Label className="text-right">Total Cost</Label>
							<div className="col-span-3 font-medium">
								{(
									(subscriptionWeeks * channel.subscriptionPriceInMist) /
									1_000_000_000
								).toFixed(4)}{" "}
								SUI
							</div>
						</div>
					</div>
					<DialogFooter>
						<Button
							onClick={() => setIsSubscriptionModalOpen(false)}
							type="button"
							variant="secondary"
						>
							Cancel
						</Button>
						<Button onClick={confirmSubscription} type="button">
							Confirm Subscription
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
