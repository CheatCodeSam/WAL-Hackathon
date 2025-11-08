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

const channels: ChannelData[] = [
  {
    id: '234',
    name: 'Tech Insights Network',
    bio: 'Exploring the future of technology through in-depth conversations with industry leaders, innovators, and visionaries. Join us as we uncover the latest trends and breakthrough innovations shaping our digital world.',
    profileImage: 'https://picsum.photos/200?random=1',
    coverImage: 'https://picsum.photos/1200/400?random=2',
    memberCount: 15420,
    podcastCount: 4,
    totalEpisodes: 156,
  },
  {
    id: '235',
    name: 'Finance Forward',
    bio: 'Your premier destination for financial insights, investment strategies, and economic analysis. We break down complex financial concepts into actionable insights for investors of all levels.',
    profileImage: 'https://picsum.photos/200?random=10',
    coverImage: 'https://picsum.photos/1200/400?random=11',
    memberCount: 8950,
    podcastCount: 3,
    totalEpisodes: 98,
  },
  {
    id: '236',
    name: 'Wellness Warriors',
    bio: 'Dedicated to helping you achieve optimal physical and mental health. Our experts share science-backed strategies for mindfulness, fitness, nutrition, and overall well-being.',
    profileImage: 'https://picsum.photos/200?random=20',
    coverImage: 'https://picsum.photos/1200/400?random=21',
    memberCount: 22100,
    podcastCount: 5,
    totalEpisodes: 245,
  },
  {
    id: 'bob',
    name: 'Bob\'s Creative Studio',
    bio: 'Where creativity meets technology. Join Bob as he explores art, design, innovation, and the creative process with talented artists and makers from around the world.',
    profileImage: 'https://picsum.photos/200?random=30',
    coverImage: 'https://picsum.photos/1200/400?random=31',
    memberCount: 12350,
    podcastCount: 6,
    totalEpisodes: 178,
  },
  {
    id: 'sarah',
    name: 'Sarah\'s Startup Stories',
    bio: 'Real stories from real entrepreneurs. Sarah brings you authentic conversations with founders, innovators, and business leaders who are changing the game.',
    profileImage: 'https://picsum.photos/200?random=40',
    coverImage: 'https://picsum.photos/1200/400?random=41',
    memberCount: 18700,
    podcastCount: 4,
    totalEpisodes: 132,
  },
];

export default channels;
export type { ChannelData };
