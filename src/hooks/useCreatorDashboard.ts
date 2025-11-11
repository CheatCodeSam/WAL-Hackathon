import {
	useCurrentAccount,
	useSignAndExecuteTransaction,
	useSuiClient,
} from "@mysten/dapp-kit";
import { useEffect, useState } from "react";
import { getChannelId } from "../services/api";
import { Channel as ServiceChannel } from "../services/contracts/channel";

interface Channel {
	id: string;
	name: string;
	bio: string;
	coverImage: string;
	profileImage: string;
	tiers: Tier[];
}

export interface Podcast {
	id: string;
	channelId: string;
	title: string;
	description: string;
	coverImage: string;
	tiers: Tier[];
	episodes: Episode[];
}

interface Tier {
	id: string;
	name: string;
	price: number;
	description: string;
	benefits: string[];
}

interface Episode {
	id: string;
	podcastId: string;
	title: string;
	description: string;
	audioUrl: string;
	duration: number;
	isPublished: boolean;
	createdAt: Date;
}

export interface Metrics {
	totalSubscribers: number;
	totalEpisodes: number;
	monthlyRevenue: number;
	podcastListens: { [podcastId: string]: number };
	episodeListens: { [episodeId: string]: number };
}

export function useCreatorDashboard() {
	const suiClient = useSuiClient();
	const currentAccount = useCurrentAccount();
	const { mutateAsync: signAndExcute } = useSignAndExecuteTransaction();
	const [channelId, setChannelId] = useState<null | string>(null);
	// const [channelCapId, setChannelCapId] = useState<null | string>(null);
	const [errorState, setErrorState] = useState<
		"connect_wallet" | "create_channel" | null
	>();
	const [activeTab, setActiveTab] = useState<
		"channel" | "podcasts" | "metrics"
	>("channel");
	const [channel, setChannel] = useState<Channel>({
		id: "",
		name: "",
		bio: "",
		coverImage: "",
		profileImage: "",
		tiers: [],
	});
	const [podcasts, setPodcasts] = useState<Podcast[]>([]);
	const [metrics, setMetrics] = useState<Metrics>({
		totalSubscribers: 0,
		totalEpisodes: 0,
		monthlyRevenue: 0,
		podcastListens: {},
		episodeListens: {},
	});
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		setErrorState(null);
		try {
			async function init() {
				setErrorState("create_channel");
				const address = currentAccount?.address;

				if (!address) {
					setErrorState("connect_wallet");
					throw new Error("Please connect wallet");
				}

				const id = await getChannelId(address);

				if (!id) {
					setErrorState("create_channel");
					throw new Error("channel ID not found");
				}

				setChannelId(id.channelId);
			}

			init();
		} catch (err) {
			console.warn((err as Error).message);
			setError((err as Error).message);
		}
	}, [suiClient, currentAccount?.address]);

	// if (channelId) {
	//   return null
	// }

	// Channel Management
	const updateChannel = (updates: Partial<Omit<Channel, "id">>) => {
		setChannel((prev) => ({ ...prev, ...updates }));
	};

	const uploadChannelCover = async (file: File) => {
		try {
			setIsLoading(true);
			// TODO: Implement file upload logic
			const imageUrl = `temp_url_${file.name}`;
			setChannel((prev) => ({ ...prev, coverImage: imageUrl }));
		} catch {
			setError("Failed to upload cover image");
		} finally {
			setIsLoading(false);
		}
	};

	const uploadChannelProfile = async (file: File) => {
		try {
			setIsLoading(true);
			// TODO: Implement file upload logic
			const imageUrl = `temp_url_${file.name}`;
			setChannel((prev) => ({ ...prev, coverImage: imageUrl }));
		} catch {
			setError("Failed to upload cover image");
		} finally {
			setIsLoading(false);
		}
	};

	const saveChannel = async () => {
		try {
			setIsLoading(true);
			// TODO: Implement API call to save channel
			// await api.updateChannel(channel);
			const tx = ServiceChannel.init()
				.create({
					username: channel.name,
					bio: channel.bio,
					coverPhoto: channel.coverImage,
					profilePhoto: channel.profileImage,
				})
				.build();

			await signAndExcute({ transaction: tx });
		} catch {
			setError("Failed to save channel");
		} finally {
			setIsLoading(false);
		}
	};

	// Channel Tier Management
	const addChannelTier = (tier: Omit<Tier, "id">) => {
		const newTier = { ...tier, id: Date.now().toString() };
		setChannel((prev) => ({
			...prev,
			tiers: [...prev.tiers, newTier],
		}));
	};

	const updateChannelTier = (id: string, updates: Partial<Tier>) => {
		setChannel((prev) => ({
			...prev,
			tiers: prev.tiers.map((tier) =>
				tier.id === id ? { ...tier, ...updates } : tier,
			),
		}));
	};

	const deleteChannelTier = (id: string) => {
		setChannel((prev) => ({
			...prev,
			tiers: prev.tiers.filter((tier) => tier.id !== id),
		}));
	};

	// Podcast Management
	const createPodcast = (
		title: string,
		description: string,
		coverImage: string,
	) => {
		// if (!channelId) {
		//   return // Add toast
		// }

		const newPodcast: Podcast = {
			id: Date.now().toString(),
			channelId: "iii",
			title,
			description,
			coverImage,
			tiers: [],
			episodes: [],
		};
		setPodcasts((prev) => [...prev, newPodcast]);
	};

	const updatePodcast = (
		podcastId: string,
		updates: Partial<Omit<Podcast, "id" | "channelId">>,
	) => {
		setPodcasts((prev) =>
			prev.map((podcast) =>
				podcast.id === podcastId ? { ...podcast, ...updates } : podcast,
			),
		);
	};

	const deletePodcast = (podcastId: string) => {
		setPodcasts((prev) => prev.filter((podcast) => podcast.id !== podcastId));
	};

	// Podcast Tier Management
	const addPodcastTier = (podcastId: string, tier: Omit<Tier, "id">) => {
		const newTier = { ...tier, id: Date.now().toString() };
		setPodcasts((prev) =>
			prev.map((podcast) =>
				podcast.id === podcastId
					? { ...podcast, tiers: [...podcast.tiers, newTier] }
					: podcast,
			),
		);
	};

	// Episode Management
	const uploadEpisode = async (
		podcastId: string,
		title: string,
		description: string,
		audioFile: File,
	) => {
		try {
			setIsLoading(true);
			// TODO: Implement file upload logic
			const audioUrl = `temp_url_${audioFile.name}`;
			const newEpisode: Episode = {
				id: Date.now().toString(),
				podcastId,
				title,
				description,
				audioUrl,
				duration: 0, // TODO: Calculate actual duration
				isPublished: false,
				createdAt: new Date(),
			};
			setPodcasts((prev) =>
				prev.map((podcast) =>
					podcast.id === podcastId
						? { ...podcast, episodes: [...podcast.episodes, newEpisode] }
						: podcast,
				),
			);
		} catch {
			setError("Failed to upload episode");
		} finally {
			setIsLoading(false);
		}
	};

	const toggleEpisodePublish = (podcastId: string, episodeId: string) => {
		setPodcasts((prev) =>
			prev.map((podcast) =>
				podcast.id === podcastId
					? {
							...podcast,
							episodes: podcast.episodes.map((episode) =>
								episode.id === episodeId
									? { ...episode, isPublished: !episode.isPublished }
									: episode,
							),
						}
					: podcast,
			),
		);
	};

	const deleteEpisode = (podcastId: string, episodeId: string) => {
		setPodcasts((prev) =>
			prev.map((podcast) =>
				podcast.id === podcastId
					? {
							...podcast,
							episodes: podcast.episodes.filter(
								(episode) => episode.id !== episodeId,
							),
						}
					: podcast,
			),
		);
	};

	// Metrics
	const fetchMetrics = async () => {
		try {
			setIsLoading(true);
			// TODO: Implement API call to fetch metrics
			const totalEpisodes = podcasts.reduce(
				(sum, podcast) => sum + podcast.episodes.length,
				0,
			);

			const newMetrics: Metrics = {
				totalSubscribers: 0,
				totalEpisodes,
				monthlyRevenue: 0,
				podcastListens: {},
				episodeListens: {},
			};
			setMetrics(newMetrics);
		} catch {
			setError("Failed to fetch metrics");
		} finally {
			setIsLoading(false);
		}
	};

	return {
		// State

		activeTab,
		channel,
		podcasts,
		metrics,
		isLoading,
		error,
		errorState,
		setErrorState,

		// Channel Actions
		setActiveTab,
		updateChannel,
		uploadChannelCover,
		uploadChannelProfile,
		saveChannel,
		addChannelTier,
		updateChannelTier,
		deleteChannelTier,

		// Podcast Actions
		createPodcast,
		updatePodcast,
		deletePodcast,
		addPodcastTier,

		// Episode Actions
		uploadEpisode,
		toggleEpisodePublish,
		deleteEpisode,

		// Metrics
		fetchMetrics,
	};
}
