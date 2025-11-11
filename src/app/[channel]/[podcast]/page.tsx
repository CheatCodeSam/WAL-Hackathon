'use client';

import Link from 'next/link';
import { use, useRef, useState, useEffect } from 'react';
import { IoMdSkipBackward, IoMdSkipForward } from 'react-icons/io';
import {
  IoCloudDownloadOutline,
  IoEllipsisHorizontal,
  IoHeartOutline,
  IoPauseCircle,
  IoPlayCircle,
} from 'react-icons/io5';
import { HiSpeakerWave } from 'react-icons/hi2';
import { api } from '~/trpc/react';
import { env } from '~/env';

interface PageProps {
  params: Promise<{
    channel: string;
    podcast: string;
  }>;
}

export default function Podcast({ params }: PageProps) {
  // Unwrap the params Promise using React's use() hook
  const { channel, podcast } = use(params);

  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Fetch podcast info from tRPC
  const { data: podcastInfo, isLoading: isLoadingInfo } =
    api.podcast.podcast.byId.useQuery(podcast);

  // Audio URL from Walrus
  const audioUrl = podcastInfo?.source_file_uri
    ? `${env.NEXT_PUBLIC_WALRUS_AGGREGATOR}/v1/${podcastInfo.source_file_uri}`
    : '';

  // Handle play/pause
  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Update current time
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', () => setIsPlaying(false));

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', () => setIsPlaying(false));
    };
  }, []);

  // Update progress bar when clicking on it
  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;

    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;

    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Format time in mm:ss
  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  };

  // Show loading state
  if (isLoadingInfo) {
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
  if (!podcastInfo) {
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
    <div className="min-h-screen bg-gray-100 pb-32">
      {/* Audio Element */}
      {audioUrl && (
        <audio ref={audioRef} src={audioUrl}>
          <track kind="captions" />
        </audio>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8 flex flex-col gap-8 md:flex-row">
          {/* Cover Image Placeholder */}
          <div className="h-64 w-full md:w-64">
            <div className="flex h-full w-full items-center justify-center rounded-lg bg-linear-to-br from-blue-500 to-purple-600 shadow-lg">
              <div className="text-center text-white">
                <IoPlayCircle className="mx-auto mb-2 text-6xl" />
                <p className="font-semibold text-sm">Podcast Cover</p>
              </div>
            </div>
          </div>{' '}
          {/* Podcast Info */}
          <div className="flex-1">
            <h1 className="mb-2 font-bold text-4xl">{podcastInfo.title}</h1>
            <p className="mb-4 text-gray-600 text-lg">
              {podcastInfo.description}
            </p>
            <Link
              className="text-blue-600 hover:underline"
              href={`/${channel}`}
            >
              View Channel
            </Link>
            <div className="mt-4 space-y-1 text-gray-500 text-sm">
              <p>
                Created:{' '}
                {new Date(Number(podcastInfo.created_at)).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Controls Section */}
        <div className="mb-8 flex items-center gap-4">
          <button
            className="text-5xl text-blue-500 transition-colors hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!audioUrl}
            onClick={togglePlayPause}
          >
            {isPlaying ? <IoPauseCircle /> : <IoPlayCircle />}
          </button>
          <button className="text-2xl text-gray-600 hover:text-gray-800">
            <IoHeartOutline />
          </button>
          <button
            className="text-2xl text-gray-600 hover:text-gray-800"
            disabled={!audioUrl}
          >
            <IoCloudDownloadOutline />
          </button>
          <button className="text-2xl text-gray-600 hover:text-gray-800">
            <IoEllipsisHorizontal />
          </button>
        </div>

        {/* Podcast Description */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 font-bold text-2xl">About this Podcast</h2>
          <p className="text-gray-700">{podcastInfo.description}</p>
          {!audioUrl && (
            <div className="mt-4 rounded-md bg-yellow-50 p-4 text-yellow-800">
              <p className="font-medium">Audio file not available</p>
              <p className="text-sm">
                The audio file for this podcast is not yet uploaded or is
                unavailable.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Playback Bar */}
      {audioUrl && (
        <div className="fixed right-0 bottom-0 left-0 border-t bg-white p-4 shadow-lg">
          <div className="container mx-auto">
            <div className="flex flex-col gap-2">
              {/* Progress Bar */}
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <span>{formatTime(currentTime)}</span>
                <div
                  className="h-1 flex-1 cursor-pointer rounded-full bg-gray-200"
                  onClick={handleProgressBarClick}
                >
                  <div
                    className="h-full rounded-full bg-blue-500"
                    style={{
                      width: `${
                        duration ? (currentTime / duration) * 100 : 0
                      }%`,
                    }}
                  ></div>
                </div>
                <span>{formatTime(duration)}</span>
              </div>

              {/* Playback Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button className="text-gray-600 hover:text-gray-800">
                    <IoMdSkipBackward className="text-xl" />
                  </button>
                  <button
                    className="text-3xl text-blue-500 hover:text-blue-600"
                    onClick={togglePlayPause}
                  >
                    {isPlaying ? <IoPauseCircle /> : <IoPlayCircle />}
                  </button>
                  <button className="text-gray-600 hover:text-gray-800">
                    <IoMdSkipForward className="text-xl" />
                  </button>
                </div>
                <div className="flex items-center gap-4">
                  <button className="text-gray-600 hover:text-gray-800">
                    <HiSpeakerWave className="text-xl" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
