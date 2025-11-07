"use client"
import { useState } from 'react';
import { IoShareSocialOutline, IoEllipsisHorizontal } from 'react-icons/io5';
import { RiUserFollowLine, RiUserUnfollowLine } from 'react-icons/ri';
import { BsCast } from 'react-icons/bs';
import Link from 'next/link';

interface PodcastData {
  id: string;
  title: string;
  coverImage: string;
  episodeCount: number;
  lastUpdated: string;
}

interface ChannelData {
  id: string;
  name: string;
  bio: string;
  profileImage: string;
  coverImage: string;
  memberCount: number;
  podcastCount: number;
  totalEpisodes: number;
}

export default function Channel() {
  const [isFollowing, setIsFollowing] = useState(false);

  // Mock channel data
  const channel: ChannelData = {
    id: '1',
    name: 'Tech Insights Network',
    bio: 'Exploring the future of technology through in-depth conversations with industry leaders, innovators, and visionaries. Join us as we uncover the latest trends and breakthrough innovations shaping our digital world.',
    profileImage: 'https://picsum.photos/200?random=1',
    coverImage: 'https://picsum.photos/1200/400?random=2',
    memberCount: 15420,
    podcastCount: 4,
    totalEpisodes: 156,
  };

  // Mock podcasts data
  const podcasts: PodcastData[] = [
    {
      id: '1',
      title: 'Future of AI',
      coverImage: 'https://picsum.photos/400?random=3',
      episodeCount: 45,
      lastUpdated: '2025-11-01',
    },
    {
      id: '2',
      title: 'Blockchain Revolution',
      coverImage: 'https://picsum.photos/400?random=4',
      episodeCount: 32,
      lastUpdated: '2025-10-28',
    },
    {
      id: '3',
      title: 'Cloud Computing Today',
      coverImage: 'https://picsum.photos/400?random=5',
      episodeCount: 28,
      lastUpdated: '2025-10-15',
    },
    {
      id: '4',
      title: 'DevOps Discussions',
      coverImage: 'https://picsum.photos/400?random=6',
      episodeCount: 51,
      lastUpdated: '2025-10-10',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner Section */}
      <div className="relative h-[400px]">
        <div className="absolute inset-0">
          <img
            src={channel.coverImage}
            alt="Channel cover"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-b from-transparent to-black/50"></div>
        </div>
      </div>

      {/* Profile Section */}
      <div className="container mx-auto px-4">
        <div className="relative -mt-24 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Profile Image */}
              <div className="shrink-0">
                <img
                  src={channel.profileImage}
                  alt={channel.name}
                  className="w-32 h-32 rounded-full border-4 border-white shadow-lg"
                />
              </div>

              {/* Channel Info */}
              <div className="grow">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">{channel.name}</h1>
                    <div className="flex gap-4 text-sm text-gray-600 mb-4">
                      <span>
                        {channel.memberCount.toLocaleString()} members
                      </span>
                      <span>•</span>
                      <span>{channel.podcastCount} podcasts</span>
                      <span>•</span>
                      <span>{channel.totalEpisodes} episodes</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => setIsFollowing(!isFollowing)}
                      className={`flex items-center gap-2 px-6 py-2 rounded-full font-medium ${
                        isFollowing
                          ? 'bg-gray-200 text-gray-800'
                          : 'bg-blue-500 text-white'
                      }`}
                    >
                      {isFollowing ? (
                        <>
                          <RiUserUnfollowLine /> Unfollow
                        </>
                      ) : (
                        <>
                          <RiUserFollowLine /> Follow
                        </>
                      )}
                    </button>
                    <button className="p-2 rounded-full hover:bg-gray-100">
                      <IoShareSocialOutline className="text-xl" />
                    </button>
                    <button className="p-2 rounded-full hover:bg-gray-100">
                      <IoEllipsisHorizontal className="text-xl" />
                    </button>
                  </div>
                </div>

                <p className="text-gray-600 max-w-3xl">{channel.bio}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Podcasts Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Podcasts</h2>
            <button className="text-blue-500 hover:text-blue-600">
              View all
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {podcasts.map((podcast) => (
              <Link
                key={podcast.id}
                href={`/podcast/${podcast.id}`}
                className="group bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
              >
                <div className="relative aspect-square">
                  <img
                    src={podcast.coverImage}
                    alt={podcast.title}
                    className="w-full h-full object-cover rounded-t-lg"
                  />
                  <div className="absolute top-2 right-2 bg-black/70 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
                    <BsCast />
                    {podcast.episodeCount}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold group-hover:text-blue-600 transition-colors">
                    {podcast.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Last updated:{' '}
                    {new Date(podcast.lastUpdated).toLocaleDateString()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
