import { create } from "zustand";

export type SubscriptionStatus =
	| "no_wallet" // Wallet extension not installed/connected
	| "checking" // Currently checking subscription status
	| "subscribed" // User is subscribed
	| "expired_subscription" // The user owns a subscription object, but it is not active, it can now be deleted
	| "not_subscribed" // User is not subscribed
	| "error"; // Error checking subscription status

export type SubscriptionAction =
	| "none" // No action in progress
	| "subscribing" // Currently subscribing
	| "unsubscribing"; // Currently unsubscribing

export interface ChannelPageState {
	status: SubscriptionStatus;
	action: SubscriptionAction;
	error: string | null;
	isOwner: boolean;
	canSubscribe: () => boolean;
	canUnsubscribe: () => boolean;
	isLoading: () => boolean;

	isSubscriptionModalOpen: boolean;
	subscriptionWeeks: number;

	setIsSubscriptionModalOpen: (isOpen: boolean) => void;
	setSubscriptionWeeks: (weeks: number) => void;

	setIsOwner: (isOwner: boolean) => void;
	setNoWallet: () => void;
	startChecking: () => void;
	setSubscribed: () => void;
	setExpiredSubscription: () => void;
	setNotSubscribed: () => void;
	setCheckError: (error: string) => void;

	startSubscribing: () => void;
	finishSubscribing: () => void;
	failSubscribing: (error: string) => void;

	startUnsubscribing: () => void;
	finishUnsubscribing: () => void;
	failUnsubscribing: (error: string) => void;
}

export const useChannelPageStore = create<ChannelPageState>((set, get) => ({
	// Initial state
	status: "no_wallet",
	action: "none",
	error: null,
	isOwner: false,
	isSubscriptionModalOpen: false,
	subscriptionWeeks: 1,

	// Computed properties
	canSubscribe: () => {
		const { status, action, isOwner } = get();
		return status === "not_subscribed" && action === "none" && !isOwner;
	},

	canUnsubscribe: () => {
		const { status, action } = get();
		return status === "expired_subscription" && action === "none";
	},

	isLoading: () => {
		const { status, action } = get();
		return status === "checking" || action !== "none";
	},

	// Owner status action
	setIsOwner: (isOwner: boolean) =>
		set({
			isOwner,
		}),

	setIsSubscriptionModalOpen: (isOpen: boolean) =>
		set({
			isSubscriptionModalOpen: isOpen,
		}),

	setSubscriptionWeeks: (weeks: number) =>
		set({
			subscriptionWeeks: weeks,
		}),

	// Wallet status actions
	setNoWallet: () =>
		set({
			status: "no_wallet",
			action: "none",
			error: null,
		}),

	// Checking subscription status actions
	startChecking: () =>
		set({
			status: "checking",
			error: null,
		}),

	setSubscribed: () =>
		set({
			status: "subscribed",
			action: "none",
			error: null,
		}),

	setExpiredSubscription: () =>
		set({
			status: "expired_subscription",
			action: "none",
			error: null,
		}),

	setNotSubscribed: () =>
		set({
			status: "not_subscribed",
			action: "none",
			error: null,
		}),

	setCheckError: (error: string) =>
		set({
			status: "error",
			action: "none",
			error,
		}),

	// Subscribe actions
	startSubscribing: () =>
		set({
			action: "subscribing",
			error: null,
		}),

	finishSubscribing: () =>
		set({
			status: "subscribed",
			action: "none",
			error: null,
		}),

	failSubscribing: (error: string) =>
		set({
			action: "none",
			error,
		}),

	startUnsubscribing: () =>
		set({
			action: "unsubscribing",
			error: null,
		}),

	finishUnsubscribing: () =>
		set({
			status: "not_subscribed",
			action: "none",
			error: null,
		}),

	failUnsubscribing: (error: string) =>
		set({
			action: "none",
			error,
		}),
}));
