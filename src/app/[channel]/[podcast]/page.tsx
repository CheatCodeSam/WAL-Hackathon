"use client"

import { use, useState } from 'react';
import {
  IoPlayCircle,
  IoPauseCircle,
  IoHeartOutline,
  IoCloudDownloadOutline,
  IoEllipsisHorizontal,
} from 'react-icons/io5';
import { IoMdSkipBackward, IoMdSkipForward, IoMdShuffle } from 'react-icons/io';
import { FaCheck } from 'react-icons/fa';
import { HiSpeakerWave } from 'react-icons/hi2';
import { MdDevices } from 'react-icons/md';
import Link from 'next/link';
import { api } from '~/trpc/react';



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
  const { data: podcastInfo, isLoading: isLoadingInfo } = api.podcast.podcast.byId.useQuery(podcast);
  const { data: episodes, isLoading: isLoadingEpisodes } = api.podcast.episode.listByPodcastId.useQuery(podcast);

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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-semibold mb-2">Loading...</div>
          <div className="text-gray-600">Fetching podcast details</div>
        </div>
      </div>
    );
  }

  // Show error state
  if (!podcastInfo || !episodes) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-semibold mb-2">Podcast not found</div>
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
        <div className="flex flex-col md:flex-row gap-8 mb-8">
          {/* Cover Image */}
          <div className="w-full md:w-64 h-64">
            <img
              src={podcastInfo.coverImage}
              alt={podcastInfo.title}
              className="w-full h-full object-cover rounded-lg shadow-lg"
            />
          </div>

          {/* Podcast Info */}
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-2">{podcastInfo.title}</h1>
            <p className="text-xl text-gray-600 mb-4">
              <Link href={`/${podcastInfo.channel}`}>{podcastInfo.host}</Link>
            </p>
            <div className="text-sm text-gray-500 space-y-1">
              <p>Released: {podcastInfo.releaseYear}</p>
              <p>{podcastInfo.episodeCount} episodes</p>
              <p>Total Duration: {podcastInfo.totalDuration}</p>
            </div>
          </div>
        </div>

        {/* Controls Section */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="text-5xl text-blue-500 hover:text-blue-600 transition-colors"
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
        <div className="bg-white rounded-lg shadow">
          {episodes.map((episode, index) => (
            <div
              key={episode.id}
              className="flex items-center p-4 hover:bg-gray-50 border-b last:border-b-0"
            >
              <div className="w-8 text-gray-400">{index + 1}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{episode.title}</h3>
                  {episode.isPlayed && (
                    <FaCheck className="text-green-500 text-sm" />
                  )}
                </div>
                <p className="text-sm text-gray-500">{episode.artist}</p>
              </div>
              <div className="text-sm text-gray-500">{episode.duration}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Playback Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4">
        <div className="container mx-auto">
          <div className="flex flex-col gap-2">
            {/* Progress Bar */}
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>
                {Math.floor(currentTime / 60)}:
                {String(currentTime % 60).padStart(2, '0')}
              </span>
              <div
                className="flex-1 h-1 bg-gray-200 rounded-full cursor-pointer"
                onClick={handleProgressBarClick}
              >
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{
                    width: `${(currentTime / totalDuration) * 100}%`,
                  }}
                ></div>
              </div>
              <span>
                {Math.floor(totalDuration / 60)}:
                {String(totalDuration % 60).padStart(2, '0')}
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
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="text-3xl text-blue-500 hover:text-blue-600"
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
