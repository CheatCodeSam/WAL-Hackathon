import { create } from "zustand";

export type ChannelEditPageStatus =
	| "no_wallet"
	| "loading"
	| "loaded"
	| "updating"
	| "error"
	| "no_channel";

export interface ChannelEditPageState {
	status: ChannelEditPageStatus;
	error: string | null;
	uploadProgress: string;

	setNoWallet: () => void;
	startLoading: () => void;
	setLoaded: () => void;
	setNoChannel: () => void;
	setLoadError: (error: string) => void;

	startUpdating: () => void;
	finishUpdating: () => void;
	failUpdating: (error: string) => void;

	setUploadProgress: (progress: string) => void;
}

export const useChannelEditPageStore = create<ChannelEditPageState>(
	(set, get) => ({
		status: "loading",
		error: null,
		uploadProgress: "",

		setNoWallet: () =>
			set({
				status: "no_wallet",
				error: null,
				uploadProgress: "",
			}),

		startLoading: () =>
			set({
				status: "loading",
				error: null,
				uploadProgress: "",
			}),

		setLoaded: () =>
			set({
				status: "loaded",
				error: null,
				uploadProgress: "",
			}),

		setNoChannel: () =>
			set({
				status: "no_channel",
				error: null,
				uploadProgress: "",
			}),

		setLoadError: (error: string) =>
			set({
				status: "error",
				error,
				uploadProgress: "",
			}),

		startUpdating: () =>
			set({
				status: "updating",
				error: null,
				uploadProgress: "Preparing to update channel...",
			}),

		finishUpdating: () =>
			set({
				status: "loaded",
				error: null,
				uploadProgress: "Channel updated successfully! Redirecting...",
			}),

		failUpdating: (error: string) =>
			set({
				status: "loaded",
				error,
				uploadProgress: `Error: ${error}`,
			}),

		setUploadProgress: (progress: string) =>
			set({
				uploadProgress: progress,
			}),
	}),
);
