"use client";

import Link from "next/link";
import { use, useState } from "react";
import { FaCheck } from "react-icons/fa";
import { HiSpeakerWave } from "react-icons/hi2";
import { IoMdShuffle, IoMdSkipBackward, IoMdSkipForward } from "react-icons/io";
import {
	IoCloudDownloadOutline,
	IoEllipsisHorizontal,
	IoHeartOutline,
	IoPauseCircle,
	IoPlayCircle,
} from "react-icons/io5";
import { MdDevices } from "react-icons/md";
import { api } from "~/trpc/react";

interface PageProps {
	params: Promise<{
		channel: string;
		podcast: string;
	}>;
}

export default function Podcast({ params }: PageProps) {
	// Unwrap the params Promise using React's use() hook
	const { channel, podcast } = use(params);

	const [isPlaying, setIsPlaying] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);
	const totalDuration = 3600; // 1 hour in seconds

	// Fetch podcast info and episodes from tRPC
	const { data: podcastInfo, isLoading: isLoadingInfo } =
		api.podcast.podcast.byId.useQuery(podcast);
	const { data: episodes, isLoading: isLoadingEpisodes } =
		api.podcast.episode.listByPodcastId.useQuery(podcast);

	// Update progress bar when clicking on it
	const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
		const progressBar = e.currentTarget;
		const rect = progressBar.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const percentage = x / rect.width;
		setCurrentTime(Math.floor(percentage * totalDuration));
	};

	// Show loading state
	if (isLoadingInfo || isLoadingEpisodes) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-gray-100">
				<div className="text-center">
					<div className="mb-2 font-semibold text-2xl">Loading...</div>
					<div className="text-gray-600">Fetching podcast details</div>
				</div>
			</div>
		);
	}

	// Show error state
	if (!podcastInfo || !episodes) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-gray-100">
				<div className="text-center">
					<div className="mb-2 font-semibold text-2xl">Podcast not found</div>
					<div className="text-gray-600">Unable to load podcast details</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-100">
			{/* Main Content */}
			<div className="container mx-auto px-4 py-8">
				{/* Header Section */}
				<div className="mb-8 flex flex-col gap-8 md:flex-row">
					{/* Cover Image */}
					<div className="h-64 w-full md:w-64">
						<img
							alt={podcastInfo.title}
							className="h-full w-full rounded-lg object-cover shadow-lg"
							src={podcastInfo.coverImage}
						/>
					</div>

					{/* Podcast Info */}
					<div className="flex-1">
						<h1 className="mb-2 font-bold text-4xl">{podcastInfo.title}</h1>
						<p className="mb-4 text-gray-600 text-xl">
							<Link href={`/${podcastInfo.channel}`}>{podcastInfo.host}</Link>
						</p>
						<div className="space-y-1 text-gray-500 text-sm">
							<p>Released: {podcastInfo.releaseYear}</p>
							<p>{podcastInfo.episodeCount} episodes</p>
							<p>Total Duration: {podcastInfo.totalDuration}</p>
						</div>
					</div>
				</div>

				{/* Controls Section */}
				<div className="mb-8 flex items-center gap-4">
					<button
						className="text-5xl text-blue-500 transition-colors hover:text-blue-600"
						onClick={() => setIsPlaying(!isPlaying)}
					>
						{isPlaying ? <IoPauseCircle /> : <IoPlayCircle />}
					</button>
					<button className="text-2xl text-gray-600 hover:text-gray-800">
						<IoHeartOutline />
					</button>
					<button className="text-2xl text-gray-600 hover:text-gray-800">
						<IoCloudDownloadOutline />
					</button>
					<button className="text-2xl text-gray-600 hover:text-gray-800">
						<IoEllipsisHorizontal />
					</button>
				</div>

				{/* Episodes List */}
				<div className="rounded-lg bg-white shadow">
					{episodes.map((episode, index) => (
						<div
							className="flex items-center border-b p-4 last:border-b-0 hover:bg-gray-50"
							key={episode.id}
						>
							<div className="w-8 text-gray-400">{index + 1}</div>
							<div className="flex-1">
								<div className="flex items-center gap-2">
									<h3 className="font-medium">{episode.title}</h3>
									{episode.isPlayed && (
										<FaCheck className="text-green-500 text-sm" />
									)}
								</div>
								<p className="text-gray-500 text-sm">{episode.artist}</p>
							</div>
							<div className="text-gray-500 text-sm">{episode.duration}</div>
						</div>
					))}
				</div>
			</div>

			{/* Playback Bar */}
			<div className="fixed right-0 bottom-0 left-0 border-t bg-white p-4 shadow-lg">
				<div className="container mx-auto">
					<div className="flex flex-col gap-2">
						{/* Progress Bar */}
						<div className="flex items-center gap-2 text-gray-500 text-sm">
							<span>
								{Math.floor(currentTime / 60)}:
								{String(currentTime % 60).padStart(2, "0")}
							</span>
							<div
								className="h-1 flex-1 cursor-pointer rounded-full bg-gray-200"
								onClick={handleProgressBarClick}
							>
								<div
									className="h-full rounded-full bg-blue-500"
									style={{
										width: `${(currentTime / totalDuration) * 100}%`,
									}}
								></div>
							</div>
							<span>
								{Math.floor(totalDuration / 60)}:
								{String(totalDuration % 60).padStart(2, "0")}
							</span>
						</div>

						{/* Playback Controls */}
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-4">
								<button className="text-gray-600 hover:text-gray-800">
									<IoMdShuffle className="text-xl" />
								</button>
								<button className="text-gray-600 hover:text-gray-800">
									<IoMdSkipBackward className="text-xl" />
								</button>
								<button
									className="text-3xl text-blue-500 hover:text-blue-600"
									onClick={() => setIsPlaying(!isPlaying)}
								>
									{isPlaying ? <IoPauseCircle /> : <IoPlayCircle />}
								</button>
								<button className="text-gray-600 hover:text-gray-800">
									<IoMdSkipForward className="text-xl" />
								</button>
							</div>
							<div className="flex items-center gap-4">
								<button className="text-gray-600 hover:text-gray-800">
									<MdDevices className="text-xl" />
								</button>
								<button className="text-gray-600 hover:text-gray-800">
									<HiSpeakerWave className="text-xl" />
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
