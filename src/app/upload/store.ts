import { create } from "zustand";

export type UploadPageStatus =
	| "loading_channel" // Loading channel data
	| "ready" // Channel loaded, form ready
	| "no_channel" // User does not have a channel
	| "uploading" // User is uploading/submitting transaction
	| "transaction_rejected" // User rejected the transaction
	| "success"; // Upload successful

export interface UploadPageState {
	status: UploadPageStatus;
	error: string | null;
	uploadProgress: string;
	redirectUrl: string | null;

	// Check if the form can be submitted
	canSubmit: () => boolean;

	// Channel loading actions
	startLoadingChannel: () => void;
	setChannelReady: () => void;
	setNoChannel: () => void;
	setLoadingError: (error: string) => void;

	// Upload transaction actions
	startUploading: (progress: string) => void;
	updateProgress: (progress: string) => void;
	rejectTransaction: (error: string) => void;
	finishUpload: (channelId: string, podcastId: string) => void;
	failUpload: (error: string) => void;

	// Reset to ready state
	reset: () => void;
}

export const useUploadPageStore = create<UploadPageState>((set, get) => ({
	// Initial state
	status: "loading_channel",
	error: null,
	uploadProgress: "",
	redirectUrl: null,

	// Computed properties
	canSubmit: () => {
		const { status } = get();
		return status === "ready" || status === "transaction_rejected";
	},

	// Channel loading actions
	startLoadingChannel: () =>
		set({
			status: "loading_channel",
			error: null,
			uploadProgress: "",
			redirectUrl: null,
		}),

	setChannelReady: () =>
		set({
			status: "ready",
			error: null,
		}),

	setNoChannel: () =>
		set({
			status: "no_channel",
			error: null,
		}),

	setLoadingError: (error: string) =>
		set({
			status: "ready",
			error,
		}),

	// Upload transaction actions
	startUploading: (progress: string) =>
		set({
			status: "uploading",
			error: null,
			uploadProgress: progress,
		}),

	updateProgress: (progress: string) =>
		set({
			uploadProgress: progress,
		}),

	rejectTransaction: (error: string) =>
		set({
			status: "transaction_rejected",
			error,
			uploadProgress: "",
		}),

	finishUpload: (channelId: string, podcastId: string) =>
		set({
			status: "success",
			error: null,
			uploadProgress: "Upload successful!",
			redirectUrl: `/${channelId}/${podcastId}`,
		}),

	failUpload: (error: string) =>
		set({
			status: "ready",
			error,
			uploadProgress: "",
		}),

	// Reset to ready state
	reset: () =>
		set({
			status: "ready",
			error: null,
			uploadProgress: "",
			redirectUrl: null,
		}),
}));
