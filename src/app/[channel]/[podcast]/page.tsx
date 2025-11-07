"use client"

import { useState } from 'react';
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

interface Episode {
  id: number;
  title: string;
  artist: string;
  duration: string;
  isPlayed: boolean;
}

export default function Podcast() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const totalDuration = 3600; // 1 hour in seconds

  // Update progress bar when clicking on it
  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    setCurrentTime(Math.floor(percentage * totalDuration));
  };

  // Mock data
  const podcastInfo = {
    title: 'The Future of Technology',
    host: 'Sarah Anderson',
    coverImage: 'https://picsum.photos/400', // Placeholder image
    channel: "234",
    releaseYear: 2025,
    episodeCount: 12,
    totalDuration: '12 hours',
  };

  const episodes: Episode[] = [
    {
      id: 1,
      title: 'The Rise of Artificial Intelligence',
      artist: 'With Guest: Dr. James Smith',
      duration: '45:30',
      isPlayed: true,
    },
    {
      id: 2,
      title: 'Blockchain Revolution',
      artist: 'With Guest: Emily Chen',
      duration: '52:15',
      isPlayed: true,
    },
    {
      id: 3,
      title: 'Future of Remote Work',
      artist: 'With Guest: Mark Johnson',
      duration: '48:20',
      isPlayed: false,
    },
    // Add more episodes as needed
  ];

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
