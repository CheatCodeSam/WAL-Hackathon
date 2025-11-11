"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { IoSearch } from "react-icons/io5";
import { api } from "~/trpc/react";

interface Podcast {
	id: string;
	title: string;
	description: string;
	coverImage: string;
	episodeCount: number;
	channel: string;
	category: string;
	type: "personality" | "abstract" | "text";
}

export default function Browse() {
	const [searchQuery, setSearchQuery] = useState("");
	const [searchInput, setSearchInput] = useState("");
	const [selectedCategory, setSelectedCategory] = useState<string | undefined>(
		undefined,
	);

	// Use the search endpoint with the current query and category
	const {
		data: podcasts,
		isLoading,
		isError,
		error,
	} = api.podcast.podcast.search.useQuery({
		query: searchQuery,
		category: selectedCategory,
	});

	// Handle search button click
	const handleSearch = () => {
		setSearchQuery(searchInput);
	};

	// Handle Enter key press
	const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
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
			<div className="flex min-h-screen items-center justify-center bg-gray-50">
				<div className="text-center">
					<div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-blue-500 border-b-2"></div>
					<div className="mb-2 font-semibold text-2xl">Loading Podcasts...</div>
					<div className="text-gray-600">
						Discovering amazing content for you
					</div>
				</div>
			</div>
		);
	}

	// Error state
	if (isError) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-gray-50">
				<div className="text-center">
					<div className="mb-4 text-6xl">⚠️</div>
					<div className="mb-2 font-semibold text-2xl text-red-600">
						Error Loading Podcasts
					</div>
					<div className="mb-4 text-gray-600">
						{error?.message || "Something went wrong. Please try again later."}
					</div>
					<button
						className="rounded-lg bg-blue-500 px-6 py-2 text-white transition-colors hover:bg-blue-600"
						onClick={() => window.location.reload()}
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
				<div className="sticky top-0 z-10 bg-white shadow-sm">
					<div className="container mx-auto px-4 py-4">
						<div className="relative">
							<input
								className="w-full rounded-lg border-none bg-gray-100 py-3 pr-4 pl-12 transition-colors focus:bg-white focus:ring-2 focus:ring-blue-500"
								onChange={(e) => setSearchInput(e.target.value)}
								onKeyPress={handleKeyPress}
								placeholder="Search podcasts..."
								type="text"
								value={searchInput}
							/>
							{/* <IoSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" /> */}
							<button
								className="-translate-y-1/2 absolute top-1/2 right-4 transform text-gray-400 transition-colors hover:text-blue-500"
								onClick={handleSearch}
							>
								<IoSearch className="text-xl" />
							</button>
						</div>
					</div>
				</div>

				{/* No results message */}
				<div className="container mx-auto px-4 py-16 text-center">
					<div className="mb-4 text-6xl">🔍</div>
					<h2 className="mb-2 font-bold text-2xl">No Podcasts Found</h2>
					<p className="mb-4 text-gray-600">
						{searchQuery
							? `No results for "${searchQuery}"`
							: "Try adjusting your search or filters"}
					</p>
					{(searchQuery || selectedCategory) && (
						<button
							className="rounded-lg bg-blue-500 px-6 py-2 text-white transition-colors hover:bg-blue-600"
							onClick={() => {
								setSearchQuery("");
								setSearchInput("");
								setSelectedCategory(undefined);
							}}
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
			<div className="sticky top-0 z-10 bg-white shadow-sm">
				<div className="container mx-auto px-4 py-4">
					<div className="relative">
						<input
							className="w-full rounded-lg border-none bg-gray-100 py-3 pr-4 pl-12 transition-colors focus:bg-white focus:ring-2 focus:ring-blue-500"
							onChange={(e) => setSearchInput(e.target.value)}
							onKeyPress={handleKeyPress}
							placeholder="Search podcasts..."
							type="text"
							value={searchInput}
						/>
						{/* <IoSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" /> */}
						<button
							className="-translate-y-1/2 absolute top-1/2 right-4 transform text-gray-400 transition-colors hover:text-blue-500"
							onClick={handleSearch}
						>
							<IoSearch className="text-xl" />
						</button>
					</div>
				</div>
			</div>

			{/* Podcasts Grid */}
			<div className="container mx-auto px-4 py-8">
				<div className="mb-6 flex items-center justify-between">
					<h1 className="font-bold text-2xl">
						{searchQuery
							? `Search Results for "${searchQuery}"`
							: "Popular Podcasts"}
					</h1>
					<div className="text-gray-600">
						{podcasts.length} {podcasts.length === 1 ? "podcast" : "podcasts"}{" "}
						found
					</div>
				</div>

				<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
					{podcasts.map((podcast) => (
						<Link
							className="group"
							href={`/${podcast.channel}/${podcast.id}`}
							key={podcast.id}
						>
							<div className="overflow-hidden rounded-lg bg-white shadow-md transition-shadow duration-300 hover:shadow-lg">
								{/* Card Header with Cover Image */}
								<div className="relative aspect-square">
									<img
										alt={podcast.title}
										className="h-full w-full object-cover"
										src={podcast.coverImage}
									/>
									{/* Category Badge */}
									<div className="absolute top-3 left-3 rounded-full bg-white/90 px-3 py-1 font-medium text-sm backdrop-blur-sm">
										{podcast.category}
									</div>
									{/* Episode Count Badge */}
									<div className="absolute right-3 bottom-3 rounded-full bg-black/70 px-3 py-1 text-sm text-white">
										{podcast.episodeCount} eps
									</div>
								</div>

								{/* Card Content */}
								<div className="p-4">
									<h3 className="mb-1 font-bold text-lg transition-colors group-hover:text-blue-600">
										{podcast.title}
									</h3>
									<p className="line-clamp-2 text-gray-600 text-sm">
										{podcast.description}
									</p>
								</div>
							</div>
						</Link>
					))}
				</div>

				{/* Categories Section */}
				<div className="mt-12">
					<h2 className="mb-6 font-bold text-2xl">Browse by Category</h2>
					<div className="flex flex-wrap gap-3">
						{/* All Categories button */}
						<button
							className={`rounded-full px-4 py-2 font-medium text-sm shadow-sm transition-all hover:shadow-md ${
								selectedCategory === undefined
									? "bg-blue-500 text-white"
									: "bg-white text-gray-700"
							}`}
							onClick={() => setSelectedCategory(undefined)}
						>
							All
						</button>
						{categories.map((category) => (
							<button
								className={`rounded-full px-4 py-2 font-medium text-sm shadow-sm transition-all hover:shadow-md ${
									selectedCategory === category
										? "bg-blue-500 text-white"
										: "bg-white text-gray-700"
								}`}
								key={category}
								onClick={() => setSelectedCategory(category)}
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
