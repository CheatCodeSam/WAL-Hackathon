"use client"
import Link from 'next/link';
import { useState, useMemo } from 'react';
import { IoSearch } from 'react-icons/io5';
import { api } from '~/trpc/react';

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
  const [searchInput, setSearchInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);

  // Use the search endpoint with the current query and category
  const { data: podcasts, isLoading, isError, error } = api.podcast.podcast.search.useQuery({
    query: searchQuery,
    category: selectedCategory,
  });

  // Handle search button click
  const handleSearch = () => {
    setSearchQuery(searchInput);
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Get unique categories for filter buttons
  const categories = useMemo(() => {
    if (!podcasts) return [];
    return Array.from(new Set(podcasts.map((p) => p.category)));
  }, [podcasts]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-2xl font-semibold mb-2">Loading Podcasts...</div>
          <div className="text-gray-600">Discovering amazing content for you</div>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <div className="text-2xl font-semibold mb-2 text-red-600">Error Loading Podcasts</div>
          <div className="text-gray-600 mb-4">
            {error?.message || 'Something went wrong. Please try again later.'}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // No podcasts found state
  if (!podcasts || podcasts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Search Section */}
        <div className="bg-white shadow-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search podcasts..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full pl-12 pr-4 py-3 rounded-lg bg-gray-100 border-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
              />
              {/* <IoSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" /> */}
              <button 
                onClick={handleSearch}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors"
              >
                <IoSearch className="text-xl" />
              </button>
            </div>
          </div>
        </div>

        {/* No results message */}
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold mb-2">No Podcasts Found</h2>
          <p className="text-gray-600 mb-4">
            {searchQuery
              ? `No results for "${searchQuery}"`
              : 'Try adjusting your search or filters'}
          </p>
          {(searchQuery || selectedCategory) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSearchInput('');
                setSelectedCategory(undefined);
              }}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Section */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search podcasts..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full pl-12 pr-4 py-3 rounded-lg bg-gray-100 border-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
            />
            {/* <IoSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" /> */}
            <button 
              onClick={handleSearch}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors"
            >
              <IoSearch className="text-xl" />
            </button>
          </div>
        </div>
      </div>

      {/* Podcasts Grid */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">
            {searchQuery ? `Search Results for "${searchQuery}"` : 'Popular Podcasts'}
          </h1>
          <div className="text-gray-600">
            {podcasts.length} {podcasts.length === 1 ? 'podcast' : 'podcasts'} found
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {podcasts.map((podcast) => (
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
            {/* All Categories button */}
            <button
              onClick={() => setSelectedCategory(undefined)}
              className={`px-4 py-2 rounded-full shadow-sm hover:shadow-md transition-all text-sm font-medium ${
                selectedCategory === undefined
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700'
              }`}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full shadow-sm hover:shadow-md transition-all text-sm font-medium ${
                  selectedCategory === category
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
