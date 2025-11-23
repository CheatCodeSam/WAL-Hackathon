import { Lock, Shield } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { HydrateClient } from "~/trpc/server";
import SpinningModel from "./_components/SpinningModel";

export const revalidate = 60;

export default async function Home() {
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
						and Seal. Creators can launch their own channels, set subscription
						prices, and upload encrypted podcasts. Subscribers gain access to
						decrypt and listen to exclusive content.
					</p>
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
