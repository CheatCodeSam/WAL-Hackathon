import { create } from "zustand";

export type PodcastPageStatus = "idle" | "deleting" | "deleted" | "error";

export interface PodcastPageState {
	status: PodcastPageStatus;
	error: string | null;
	isOwner: boolean;

	setIsOwner: (isOwner: boolean) => void;
	startDeleting: () => void;
	finishDeleting: () => void;
	failDeleting: (error: string) => void;
	reset: () => void;
}

export const usePodcastPageStore = create<PodcastPageState>((set) => ({
	status: "idle",
	error: null,
	isOwner: false,

	setIsOwner: (isOwner: boolean) =>
		set({
			isOwner,
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

	failDeleting: (error: string) =>
		set({
			status: "error",
			error,
		}),

	reset: () =>
		set({
			status: "idle",
			error: null,
		}),
}));
