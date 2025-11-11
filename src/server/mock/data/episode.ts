interface Episode {
	id: number;
	podcastId: string;
	title: string;
	artist: string;
	duration: string;
	isPlayed: boolean;
}

const episodes: Episode[] = [
	// Episodes for podcast 1
	{
		id: 1,
		podcastId: "1",
		title: "The Rise of Artificial Intelligence",
		artist: "With Guest: Dr. James Smith",
		duration: "45:30",
		isPlayed: true,
	},
	{
		id: 2,
		podcastId: "1",
		title: "Blockchain Revolution",
		artist: "With Guest: Emily Chen",
		duration: "52:15",
		isPlayed: true,
	},
	{
		id: 3,
		podcastId: "1",
		title: "Future of Remote Work",
		artist: "With Guest: Mark Johnson",
		duration: "48:20",
		isPlayed: false,
	},
	{
		id: 4,
		podcastId: "1",
		title: "Quantum Computing Explained",
		artist: "With Guest: Dr. Lisa Zhang",
		duration: "55:10",
		isPlayed: false,
	},
	{
		id: 5,
		podcastId: "1",
		title: "The Metaverse and Beyond",
		artist: "With Guest: Alex Rivera",
		duration: "50:45",
		isPlayed: false,
	},
	// Episodes for podcast 2
	{
		id: 6,
		podcastId: "2",
		title: "Understanding DeFi",
		artist: "With Guest: Michael Zhang",
		duration: "42:30",
		isPlayed: true,
	},
	{
		id: 7,
		podcastId: "2",
		title: "NFTs and Digital Assets",
		artist: "With Guest: Sarah Park",
		duration: "38:15",
		isPlayed: false,
	},
	{
		id: 8,
		podcastId: "2",
		title: "The Future of Banking",
		artist: "With Guest: Robert Smith",
		duration: "47:20",
		isPlayed: false,
	},
	// Episodes for podcast 3
	{
		id: 9,
		podcastId: "3",
		title: "Introduction to Mindfulness",
		artist: "Solo Episode",
		duration: "35:00",
		isPlayed: true,
	},
	{
		id: 10,
		podcastId: "3",
		title: "Breathing Techniques for Stress",
		artist: "With Guest: Yoga Master Chen",
		duration: "40:30",
		isPlayed: true,
	},
	{
		id: 11,
		podcastId: "3",
		title: "Meditation for Beginners",
		artist: "Solo Episode",
		duration: "30:15",
		isPlayed: false,
	},
];

export { episodes };
export type { Episode };
