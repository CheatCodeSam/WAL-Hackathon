"use client";

import { useCurrentAccount } from "@mysten/dapp-kit";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { api } from "~/trpc/react";
import { CreateChannelForm } from "./CreateChannelForm";
import { useChannelPageStore } from "./store";

export function ChannelPageView() {
	const account = useCurrentAccount();
	const router = useRouter();

	const {
		status,
		error,
		setNoWallet,
		startChecking,
		setNoChannel,
		setCheckError,
	} = useChannelPageStore();

	const channelQuery = api.channel.getChannelByOwner.useQuery(
		account?.address ?? "",
		{ enabled: !!account?.address },
	);

	useEffect(() => {
		if (!account?.address) {
			setNoWallet();
			return;
		}
		if (channelQuery.isPending) {
			startChecking();
		} else if (channelQuery.isError) {
			setCheckError(channelQuery.error.message);
		} else if (channelQuery.isSuccess) {
			if (channelQuery.data === null) {
				setNoChannel();
			} else {
				router.push(`/${channelQuery.data.owner}`);
			}
		}
	}, [
		account?.address,
		channelQuery.isPending,
		channelQuery.isError,
		channelQuery.isSuccess,
		channelQuery.data,
		channelQuery.error,
		startChecking,
		setNoChannel,
		router.push,
		setCheckError,
		setNoWallet,
	]);

	// Render different states
	if (status === "no_wallet") {
		return (
			<div className="flex min-h-screen items-center justify-center bg-gray-50 p-8">
				<div className="mx-auto max-w-md rounded-lg bg-white p-6 text-center shadow-md">
					<h1 className="mb-4 font-bold text-2xl">Wallet Not Connected</h1>
					<p className="text-gray-600">
						Please install and connect your Sui wallet to create a channel.
					</p>
				</div>
			</div>
		);
	}

	if (status === "checking") {
		return (
			<div className="flex min-h-screen items-center justify-center bg-gray-50 p-8">
				<div className="mx-auto max-w-md rounded-lg bg-white p-6 text-center shadow-md">
					<h1 className="mb-4 font-bold text-2xl">Checking...</h1>
					<p className="text-gray-600">
						Checking if you have an existing channel...
					</p>
				</div>
			</div>
		);
	}

	if (status === "error") {
		return (
			<div className="flex min-h-screen items-center justify-center bg-gray-50 p-8">
				<div className="mx-auto max-w-md rounded-lg bg-white p-6 text-center shadow-md">
					<h1 className="mb-4 font-bold text-2xl text-red-600">Error</h1>
					<p className="mb-4 text-gray-600">{error}</p>
					<button
						className="rounded-md bg-blue-500 px-6 py-2 font-semibold text-white transition-colors hover:bg-blue-600"
						onClick={() => channelQuery.refetch()}
						type="button"
					>
						Retry
					</button>
				</div>
			</div>
		);
	}

	if (status === "no_channel" || status === "creating") {
		return <CreateChannelForm />;
	}

	return null;
}
