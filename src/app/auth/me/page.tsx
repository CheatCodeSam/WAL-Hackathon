"use client";

import { useEffect, useState } from "react";
import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import { getUserDetails, type UserDetails } from "~/services/api";
import Link from "next/link";

interface LoadState {
	loading: boolean;
	error: string | null;
	user: UserDetails | null;
}

export default function MePage() {
	const account = useCurrentAccount();
	// Sui client kept in case we later enrich data (e.g., dynamic subscriptions fetch)
	useSuiClient();

	const [state, setState] = useState<LoadState>({
		loading: false,
		error: null,
		user: null,
	});

	// Fetch user details whenever wallet changes.
	useEffect(() => {
		let cancelled = false;
		const load = async () => {
			if (!account?.address) {
				setState({ loading: false, error: null, user: null });
				return;
			}
			setState((s) => ({ ...s, loading: true, error: null }));
			try {
				const user = await getUserDetails(account.address);
				if (!cancelled) setState({ loading: false, error: null, user });
			} catch (e) {
				if (!cancelled)
					setState({
						loading: false,
						error: e instanceof Error ? e.message : String(e),
						user: null,
					});
			}
		};
		load();
		return () => {
			cancelled = true;
		};
	}, [account?.address]);

	const refresh = async () => {
		if (!account?.address) return;
		setState((s) => ({ ...s, loading: true, error: null }));
		try {
			const user = await getUserDetails(account.address);
			setState({ loading: false, error: null, user });
		} catch (e) {
			setState({
				loading: false,
				error: e instanceof Error ? e.message : String(e),
				user: null,
			});
		}
	};

	// Render states
	if (!account) {
		return (
			<div className="mx-auto max-w-md p-6">
				<h1 className="mb-4 text-2xl font-bold">My Profile</h1>
				<p className="text-gray-600 mb-4">Connect your wallet to view your on-chain user profile.</p>
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-lg p-6 space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-3xl font-bold">My Profile</h1>
				<button
					onClick={refresh}
					disabled={state.loading}
					className="rounded-md border px-3 py-1 text-sm font-medium hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{state.loading ? "Refreshing..." : "Refresh"}
				</button>
			</div>
			<div className="text-sm text-gray-500 break-all">Wallet: {account.address}</div>
			{state.error && (
				<div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
					Failed to load user: {state.error}
				</div>
			)}
			{state.loading && !state.user && !state.error && (
				<div className="text-sm text-gray-500">Loading user data...</div>
			)}
			{!state.loading && !state.error && !state.user && (
				<div className="space-y-4">
					<p className="text-gray-700">No user profile found for this address.</p>
					<Link
						href="/auth/signup"
						className="inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
					>
						Create Profile
					</Link>
				</div>
			)}
			{state.user && (
				<div className="space-y-4">
					<div className="rounded-md border bg-white p-4 shadow-sm">
						<h2 className="mb-2 text-xl font-semibold">Profile</h2>
						<dl className="space-y-1 text-sm">
							<div className="flex"><dt className="w-32 font-medium">Username</dt><dd>{state.user.username}</dd></div>
							<div className="flex"><dt className="w-32 font-medium">User Object</dt><dd className="break-all">{state.user.id}</dd></div>
							<div className="flex"><dt className="w-32 font-medium">Has Channel</dt><dd>{state.user.has_channel ? "Yes" : "No"}</dd></div>
							<div className="flex"><dt className="w-32 font-medium">Channel ID</dt><dd className="break-all">{state.user.channel_id || "—"}</dd></div>
							<div className="flex"><dt className="w-32 font-medium">Subs Bag</dt><dd className="break-all">{state.user.subscriptions_bag_id || "—"}</dd></div>
						</dl>
					</div>
					{!state.user.has_channel && (
						<div className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
							You don't have a channel yet. Create one to start publishing podcasts.
						</div>
					)}
				</div>
			)}
		</div>
	);
}
