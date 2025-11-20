import { HydrateClient } from "~/trpc/server";
import SpinningModel from "./_components/SpinningModel";
import { Button } from "~/components/ui/button";
import Image from "next/image";
import Link from "next/link";

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
						a creator-subscription platform
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
			</div>
		</HydrateClient>
	);
}
