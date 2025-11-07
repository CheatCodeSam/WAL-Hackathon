"use client"
import Link from 'next/link';
import { useState } from 'react';
import { IoSearch, IoMicOutline } from 'react-icons/io5';

interface Podcast {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  episodeCount: number;
  channel: string;
  category: string;
  type: 'personality' | 'abstract' | 'text';
}

export default function Browse() {
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data for podcasts
  const podcasts: Podcast[] = [
    {
      id: '1',
      title: 'Tech Talks Daily',
      description: 'With Sarah Anderson & Dr. James Smith',
      coverImage: 'https://picsum.photos/400?random=1',
      episodeCount: 45,
      channel: "234",
      category: 'Technology',
      type: 'personality',
    },
    {
      id: '2',
      title: 'Future Finance',
      description: 'Exploring DeFi and Digital Currency',
      coverImage: 'https://picsum.photos/400?random=2',
      episodeCount: 32,
      channel: "234",
      category: 'Finance',
      type: 'abstract',
    },
    {
      id: '3',
      title: 'Mindfulness Matters',
      description: 'Daily meditation and wellness tips',
      coverImage: 'https://picsum.photos/400?random=3',
      episodeCount: 67,
      channel: "234",
      category: 'Health',
      type: 'text',
    },
    {
      id: '4',
      title: 'Startup Stories',
      description: 'Interviews with successful founders',
      coverImage: 'https://picsum.photos/400?random=4',
      episodeCount: 28,
      channel: "234",
      category: 'Business',
      type: 'personality',
    },
    {
      id: '5',
      title: 'AI Revolution',
      description: 'The future of artificial intelligence',
      coverImage: 'https://picsum.photos/400?random=5',
      episodeCount: 15,
      channel: "234",
      category: 'Technology',
      type: 'abstract',
    },
    {
      id: '6',
      title: 'Creative Corner',
      description: 'Artists share their creative journey',
      coverImage: 'https://picsum.photos/400?random=6',
      episodeCount: 52,
      channel: "234",
      category: 'Arts',
      type: 'personality',
    },
  ];

  const filteredPodcasts = podcasts.filter(
    (podcast) =>
      podcast.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      podcast.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Section */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search podcasts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-lg bg-gray-100 border-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
            />
            <IoSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
            <button className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-500">
              <IoMicOutline className="text-xl" />
            </button>
          </div>
        </div>
      </div>

      {/* Podcasts Grid */}
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Popular Podcasts</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredPodcasts.map((podcast) => (
            <Link
              key={podcast.id}
              href={`/${podcast.channel}/${podcast.id}`}
              className="group"
            >
              <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
                {/* Card Header with Cover Image */}
                <div className="relative aspect-square">
                  <img
                    src={podcast.coverImage}
                    alt={podcast.title}
                    className="w-full h-full object-cover"
                  />
                  {/* Category Badge */}
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
                    {podcast.category}
                  </div>
                  {/* Episode Count Badge */}
                  <div className="absolute bottom-3 right-3 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                    {podcast.episodeCount} eps
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1 group-hover:text-blue-600 transition-colors">
                    {podcast.title}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {podcast.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Categories Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Browse by Category</h2>
          <div className="flex flex-wrap gap-3">
            {Array.from(new Set(podcasts.map((p) => p.category))).map(
              (category) => (
                <button
                  key={category}
                  className="px-4 py-2 rounded-full bg-white shadow-sm hover:shadow-md transition-shadow text-sm font-medium"
                >
                  {category}
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
