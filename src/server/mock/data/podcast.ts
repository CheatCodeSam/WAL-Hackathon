

interface PodcastData {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  episodeCount: number;
  channel: string;
  category: string;
  lastUpdated: string;
  type: 'personality' | 'abstract' | 'text';
  host: string;
  releaseYear: number;
  totalDuration: string;
}


  const podcasts: PodcastData[] = [
      {
        id: '1',
        title: 'Tech Talks Daily',
        description: 'With Sarah Anderson & Dr. James Smith',
        coverImage: 'https://picsum.photos/400?random=1',
        episodeCount: 45,
        channel: "bob",
        category: 'Technology',
        lastUpdated: '2025-10-10',
        type: 'personality',
        host: 'Sarah Anderson',
        releaseYear: 2024,
        totalDuration: '45 hours',
      },
      {
        id: '2',
        title: 'Future Finance',
        description: 'Exploring DeFi and Digital Currency',
        coverImage: 'https://picsum.photos/400?random=2',
        episodeCount: 32,
        channel: "bob",
        category: 'Finance',
        lastUpdated: '2025-10-15',
        type: 'abstract',
        host: 'Emily Chen',
        releaseYear: 2024,
        totalDuration: '32 hours',
      },
      {
        id: '3',
        title: 'Mindfulness Matters',
        description: 'Daily meditation and wellness tips',
        coverImage: 'https://picsum.photos/400?random=3',
        episodeCount: 67,
        channel: "bob",
        category: 'Health',
        lastUpdated: '2025-10-28',
        type: 'text',
        host: 'Dr. Rachel Moore',
        releaseYear: 2023,
        totalDuration: '67 hours',
      },
      {
        id: '4',
        title: 'Startup Stories',
        description: 'Interviews with successful founders',
        coverImage: 'https://picsum.photos/400?random=4',
        episodeCount: 28,
        channel: "sarah",
        category: 'Business',
        lastUpdated: '2025-11-01',
        type: 'personality',
        host: 'Mark Johnson',
        releaseYear: 2024,
        totalDuration: '28 hours',
      },
      {
        id: '5',
        title: 'AI Revolution',
        description: 'The future of artificial intelligence',
        coverImage: 'https://picsum.photos/400?random=5',
        episodeCount: 15,
        channel: "sarah",
        category: 'Technology',
        lastUpdated: '2025-10-28',
        type: 'abstract',
        host: 'Dr. Alex Rivera',
        releaseYear: 2025,
        totalDuration: '15 hours',
      },
      {
        id: '6',
        title: 'Creative Corner',
        description: 'Artists share their creative journey',
        coverImage: 'https://picsum.photos/400?random=6',
        episodeCount: 52,
        channel: "sarah",
        category: 'Arts',
        lastUpdated: '2025-10-28',
        type: 'personality',
        host: 'Lisa Zhang',
        releaseYear: 2023,
        totalDuration: '52 hours',
      },
    ];
  export default podcasts
  export type { PodcastData }