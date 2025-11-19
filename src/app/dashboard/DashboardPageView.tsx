"use client";

import { useCurrentAccount } from "@mysten/dapp-kit";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { env } from "~/env";
import { api } from "~/trpc/react";

export default function DashboardPageView() {
	const account = useCurrentAccount();

	const {
		data: feedData,
		isLoading: isFeedLoading,
		error: feedError,
	} = api.channel.getFeed.useQuery(
		{ userAddress: account?.address ?? "" },
		{ enabled: !!account?.address },
	);

	const formatAddress = (addr: string) => {
		if (!addr) return "";
		return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
	};

	return (
		<div className="min-h-screen bg-gray-50 p-8">
			<div className="mx-auto max-w-3xl">
				<div className="mb-8">
					<div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
						<div>
							<h1 className="font-bold text-4xl text-gray-900">Dashboard</h1>
							<p className="mt-2 text-gray-600 text-lg">
								Your personalized feed
							</p>
						</div>
						{account?.address && (
							<div className="text-right">
								<div className="font-mono text-gray-500 text-sm">
									Logged in as {formatAddress(account.address)}
								</div>
								{feedData && (
									<div className="font-medium text-primary text-sm">
										Subscribed to {feedData.subscriptionCount} channels
									</div>
								)}
							</div>
						)}
					</div>
				</div>

				{!account?.address ? (
					<div className="rounded-lg bg-white p-12 text-center shadow-md">
						<h2 className="mb-2 font-semibold text-2xl text-gray-800">
							Connect your wallet
						</h2>
						<p className="text-gray-600">
							Connect your wallet to see podcasts from channels you're
							subscribed to.
						</p>
					</div>
				) : isFeedLoading ? (
					<div className="py-12 text-center text-gray-500">
						Loading your feed...
					</div>
				) : feedError ? (
					<div className="rounded-lg bg-red-50 p-6 text-center text-red-600">
						Error loading feed: {feedError.message}
					</div>
				) : !feedData?.feed || feedData.feed.length === 0 ? (
					<div className="rounded-lg bg-white p-12 text-center shadow-md">
						<h2 className="mb-2 font-semibold text-2xl text-gray-800">
							Your feed is empty
						</h2>
						<p className="mb-6 text-gray-600">
							Subscribe to channels to see their latest podcasts here!
						</p>
						<Link href="/explore">
							<Button>Browse Channels</Button>
						</Link>
					</div>
				) : (
					<div className="grid gap-6">
						{feedData.feed.map((item) => {
							const podcastDate = new Date(Number(item.createdAt));
							const formattedDate = new Intl.DateTimeFormat("en-US", {
								dateStyle: "long",
								timeStyle: "short",
							}).format(podcastDate);

							const channelProfileUrl = item.channelProfilePhotoUri
								? `${env.NEXT_PUBLIC_WALRUS_AGGREGATOR}/v1/blobs/${item.channelProfilePhotoUri}`
								: undefined;

							return (
								<Link
									href={`/${item.channelOwner}/${item.id}`}
									key={item.id}
									className="block transition-transform hover:scale-[1.01]"
								>
									<Card className="hover:border-primary/50 hover:shadow-md">
										<CardContent className="p-6">
											<div className="mb-4 flex items-center gap-3">
												<Avatar className="h-10 w-10 border border-gray-100">
													<AvatarImage
														src={channelProfileUrl}
														alt={item.channelName}
														className="object-cover"
													/>
													<AvatarFallback>
														{item.channelName.substring(0, 2).toUpperCase()}
													</AvatarFallback>
												</Avatar>
												<div>
													<div className="font-semibold text-gray-900 text-sm">
														{item.channelName}
													</div>
													<div className="text-xs text-gray-500">
														{formattedDate}
													</div>
												</div>
											</div>

											<h3 className="mb-2 font-bold text-xl text-gray-900">
												{item.title}
											</h3>
											<p className="line-clamp-3 text-gray-600 leading-relaxed">
												{item.description}
											</p>
										</CardContent>
									</Card>
								</Link>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
}
