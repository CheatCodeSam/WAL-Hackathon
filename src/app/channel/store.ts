import { create } from "zustand";

export type ChannelPageStatus =
	| "no_wallet"
	| "checking"
	| "no_channel"
	| "creating"
	| "error";

export interface ChannelPageState {
	status: ChannelPageStatus;
	error: string | null;

	setNoWallet: () => void;
	startChecking: () => void;
	setNoChannel: () => void;
	setCheckError: (error: string) => void;

	startCreating: () => void;
	finishCreating: () => void;
	failCreating: (error: string) => void;
}

export const useChannelPageStore = create<ChannelPageState>((set, get) => ({
	status: "no_wallet",
	error: null,

	setNoWallet: () =>
		set({
			status: "no_wallet",
			error: null,
		}),

	startChecking: () =>
		set({
			status: "checking",
			error: null,
		}),

	setNoChannel: () =>
		set({
			status: "no_channel",
			error: null,
		}),

	setCheckError: (error: string) =>
		set({
			status: "error",
			error,
		}),

	startCreating: () =>
		set({
			status: "creating",
			error: null,
		}),

	finishCreating: () =>
		set({
			status: "checking",
			error: null,
		}),

	failCreating: (error: string) =>
		set({
			status: "no_channel",
			error,
		}),
}));
