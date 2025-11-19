import { create } from "zustand";

export type PodcastPageStatus =
	| "idle"
	| "deleting"
	| "deleted"
	| "error"
	| "downloading";

export interface PodcastPageState {
	status: PodcastPageStatus;
	error: string | null;
	isOwner: boolean;
	isSubscribed: boolean;

	setIsOwner: (isOwner: boolean) => void;
	setIsSubscribed: (isSubscribed: boolean) => void;
	startDeleting: () => void;
	finishDeleting: () => void;
	startDownloading: () => void;
	finishDownloading: () => void;
	failDeleting: (error: string) => void;
	reset: () => void;
}

export const usePodcastPageStore = create<PodcastPageState>((set) => ({
	status: "idle",
	error: null,
	isOwner: false,
	isSubscribed: false,

	setIsOwner: (isOwner: boolean) =>
		set({
			isOwner,
		}),

	setIsSubscribed: (isSubscribed: boolean) =>
		set({
			isSubscribed,
		}),

	startDeleting: () =>
		set({
			status: "deleting",
			error: null,
		}),

	finishDeleting: () =>
		set({
			status: "deleted",
			error: null,
		}),

	startDownloading: () =>
		set({
			status: "downloading",
			error: null,
		}),

	finishDownloading: () =>
		set({
			status: "idle",
			error: null,
		}),

	failDeleting: (error: string) =>
		set({
			status: "error",
			error,
		}),

	reset: () =>
		set({
			status: "idle",
			error: null,
			isSubscribed: false,
		}),
}));
