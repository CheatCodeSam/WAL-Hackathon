"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { env } from "~/env";
import type { ChannelViewInterface } from "~/services/backend/channel/lookupChannel";

export interface ExplorePageViewProps {
	channels: ChannelViewInterface[];
}

export default function ExplorePageView(props: ExplorePageViewProps) {
	const { channels } = props;

	return (
		<div className="min-h-screen bg-gray-50 p-8">
			<div className="mx-auto max-w-4xl">
				<div className="mb-8">
					<h1 className="font-bold text-4xl text-gray-900">Explore Channels</h1>
					<p className="mt-2 text-gray-600 text-lg">
						Discover podcasts and subscribe to your favorite channels
					</p>
				</div>

				{channels.length === 0 ? (
					<div className="rounded-lg bg-white p-12 text-center shadow-md">
						<h2 className="mb-2 font-semibold text-2xl text-gray-800">
							No channels yet
						</h2>
						<p className="text-gray-600">
							Be the first to create a channel and share your podcasts!
						</p>
					</div>
				) : (
					<div className="space-y-4">
						{channels.map((channel) => {
							const profileUrl = channel.profilePhotoUri
								? `${env.NEXT_PUBLIC_WALRUS_AGGREGATOR}/v1/blobs/${channel.profilePhotoUri}`
								: undefined;

							return (
								<Link
									className="block rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-gray-300 hover:shadow-md"
									href={`/${channel.owner}`}
									key={channel.channelId}
								>
									<div className="flex items-start space-x-4">
										<Avatar className="h-16 w-16 border border-gray-100">
											<AvatarImage
												alt={channel.displayName}
												className="object-cover"
												src={profileUrl}
											/>
											<AvatarFallback>
												{channel.displayName.substring(0, 2).toUpperCase()}
											</AvatarFallback>
										</Avatar>

										<div className="flex-1 space-y-3">
											<div>
												<h2 className="font-bold text-gray-900 text-xl">
													{channel.displayName}
												</h2>
												{channel.tagLine && (
													<p className="mt-1 font-medium text-gray-700 text-sm">
														{channel.tagLine}
													</p>
												)}
											</div>

											<p className="text-gray-600 text-sm">
												{channel.description}
											</p>

											<div className="flex items-center gap-6 border-gray-200 border-t pt-3 text-sm">
												<div>
													<span className="text-gray-500">Subscription: </span>
													<span className="font-semibold text-gray-900">
														{(
															channel.subscriptionPriceInMist / 1_000_000_000
														).toFixed(2)}{" "}
														SUI
													</span>
												</div>
												<div>
													<span className="text-gray-500">Duration: </span>
													<span className="text-gray-700">
														{channel.maxSubscriptionDurationInWeeks} weeks
													</span>
												</div>
												<div>
													<span className="text-gray-500">Podcasts: </span>
													<span className="text-gray-700">
														{channel.numberOfPodcasts}
													</span>
												</div>
											</div>
										</div>
									</div>
								</Link>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
}
