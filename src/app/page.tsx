import { Lock, Shield } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { env } from "~/env";
import { lookupChannel } from "~/services/backend/channel/lookupChannel";
import { HydrateClient } from "~/trpc/server";
import SpinningModel from "./_components/SpinningModel";

export const revalidate = 60;

export default async function Home() {
	const featuredCreatorAddress =
		"0x48b3200106389c38535e7beecd39c5d65e27a4197a62315f65ea3e70261e8639";
	const featuredChannel = await lookupChannel(featuredCreatorAddress);
	return (
		<HydrateClient>
			<div className="flex flex-col w-full">
				{/* Section 1: Model and Slogan */}
				<section className="flex flex-col md:flex-row items-center justify-center w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-20 gap-8 md:gap-12">
					<div className="w-[300px] h-[300px] md:w-[400px] md:h-[400px]">
						<SpinningModel />
					</div>
					<h1 className="text-5xl md:text-7xl font-black tracking-tighter text-gray-900 max-w-xl text-center md:text-left">
						Percent fees, forever
					</h1>
				</section>

				{/* Section 2: Description */}
				<section className="flex flex-col items-center justify-center w-full py-24 bg-gray-50">
					<div className="flex items-center gap-4 mb-4">
						<Image
							alt="FundSui Logo"
							className="object-contain"
							height={64}
							src="/beaverlogo.png"
							width={64}
						/>
						<h2 className="text-4xl md:text-6xl font-black text-gray-900 text-center">
							Fundsui
						</h2>
					</div>
					<p className="text-xl md:text-2xl text-gray-600 text-center max-w-2xl px-4 mb-10">
						A decentralized creator-subscription platform built on Sui, Walrus,
						and Seal.
					</p>

					{/* Featured Creator Inline */}
					{featuredChannel.isOk() && (
						<div className="max-w-3xl w-full px-4 mb-10">
							<p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 text-center">
								Featured Creator
							</p>
							<Link href={`/${featuredCreatorAddress}`}>
								<Card className="p-6 hover:shadow-lg transition-shadow">
									<div className="flex gap-6 items-start">
										<Avatar className="h-20 w-20 border-2 border-gray-200 flex-shrink-0">
											<AvatarImage
												alt={featuredChannel.value.displayName}
												className="object-cover"
												src={
													featuredChannel.value.profilePhotoUri
														? `${env.NEXT_PUBLIC_WALRUS_AGGREGATOR}/v1/blobs/${featuredChannel.value.profilePhotoUri}`
														: undefined
												}
											/>
											<AvatarFallback className="text-2xl">
												{featuredChannel.value.displayName
													.substring(0, 2)
													.toUpperCase()}
											</AvatarFallback>
										</Avatar>

										<div className="flex-1 min-w-0">
											<div className="mb-2">
												<h3 className="text-xl font-bold text-gray-900">
													{featuredChannel.value.displayName}
												</h3>
												{featuredChannel.value.tagLine && (
													<p className="text-sm font-medium text-gray-600 mt-1">
														{featuredChannel.value.tagLine}
													</p>
												)}
											</div>

											<p className="text-sm text-gray-600 line-clamp-2 mb-3">
												{featuredChannel.value.description}
											</p>

											<div className="flex flex-wrap items-center gap-4 text-sm">
												<div>
													<span className="text-gray-500">
														{featuredChannel.value.numberOfPodcasts}
													</span>{" "}
													<span className="text-gray-400">podcasts</span>
												</div>
												<div>
													<span className="text-gray-500">
														{featuredChannel.value.numberOfSubscribers}
													</span>{" "}
													<span className="text-gray-400">subscribers</span>
												</div>
												<div>
													<span className="text-gray-500">
														{(
															featuredChannel.value.subscriptionPriceInMist /
															1_000_000_000
														).toFixed(2)}{" "}
														SUI
													</span>{" "}
													<span className="text-gray-400">/ month</span>
												</div>
											</div>
										</div>
									</div>
								</Card>
							</Link>
						</div>
					)}

					<div className="flex gap-4">
						<Link href="/explore">
							<Button size="lg">Explore</Button>
						</Link>
						<Link href="/dashboard">
							<Button size="lg" variant="outline">
								Go to your feed
							</Button>
						</Link>
					</div>
					<p className="mt-20 text-gray-400 text-xs text-center max-w-2xl px-4">
						This work is based on{" "}
						<a
							className="underline hover:text-gray-600"
							href="https://sketchfab.com/3d-models/3d-number-3-three-ae5779c280a54dbd8cf7e79526115464"
							rel="noopener noreferrer"
							target="_blank"
						>
							"3D Number - 3 (THREE)"
						</a>{" "}
						by{" "}
						<a
							className="underline hover:text-gray-600"
							href="https://sketchfab.com/jihambru"
							rel="noopener noreferrer"
							target="_blank"
						>
							Jihambru
						</a>{" "}
						licensed under{" "}
						<a
							className="underline hover:text-gray-600"
							href="http://creativecommons.org/licenses/by/4.0/"
							rel="noopener noreferrer"
							target="_blank"
						>
							CC-BY-4.0
						</a>
						.
					</p>
				</section>

				{/* Section 3: Features */}
				<section className="flex flex-col items-center justify-center w-full py-24 bg-white">
					<div className="max-w-5xl px-4 w-full">
						<h2 className="text-4xl md:text-5xl font-black text-gray-900 text-center mb-12">
							Our Features
						</h2>
						<div className="grid md:grid-cols-2 gap-6">
							{/* 3% Fee Card */}
							<Card className="p-8 flex items-start gap-6 hover:shadow-lg transition-shadow">
								<div className="flex-shrink-0">
									<div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
										<Lock className="w-8 h-8 text-blue-600" />
									</div>
								</div>
								<div className="flex-1">
									<h3 className="text-2xl font-bold text-gray-900 mb-3">
										3% Fee, Forever
									</h3>
									<p className="text-gray-600 leading-relaxed">
										Immutable 3% fee built into the smart contract. No surprise
										fee hikes or shifting policies—ever.
									</p>
								</div>
							</Card>

							{/* Censorship Resistant Card */}
							<Card className="p-8 flex items-start gap-6 hover:shadow-lg transition-shadow">
								<div className="flex-shrink-0">
									<div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
										<Shield className="w-8 h-8 text-purple-600" />
									</div>
								</div>
								<div className="flex-1">
									<h3 className="text-2xl font-bold text-gray-900 mb-3">
										Censorship-Resistant
									</h3>
									<p className="text-gray-600 leading-relaxed">
										Decentralized frontends with revenue sharing. No payment
										processor can censor your content.
									</p>
								</div>
							</Card>
						</div>
					</div>
				</section>
			</div>
		</HydrateClient>
	);
}
