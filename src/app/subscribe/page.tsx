"use client";

import {
	useCurrentAccount,
	useSignAndExecuteTransaction,
	useSuiClient,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { useEffect, useState } from "react";
import { useNetworkVariable } from "~/app/networkConfig";
import { api } from "~/trpc/react";
import { useSearchParams } from "next/navigation";

interface ChannelData {
	id: string;
	name: string;
	description: string;
  subscriptionPriceMist: bigint;
	subscriptionPrice: string;
	maxDuration: number;
	coverImage: string;
	profileImage: string;
}

export default function SubscribePage() {
	const account = useCurrentAccount();
	const fundsuiPackageId = useNetworkVariable("fundsuiPackageId");
	const suiClient = useSuiClient();
	const { mutateAsync } = useSignAndExecuteTransaction();

	const searchParams = useSearchParams();

	const [channelId, setChannelId] = useState("");
	const [durationMonths, setDurationMonths] = useState(1);
	const [frontendAddress, setFrontendAddress] = useState(
		"0x0000000000000000000000000000000000000000000000000000000000000000",
	);
	const [channel, setChannel] = useState<ChannelData | null>(null);
	const [fetchError, setFetchError] = useState<string | null>(null);
	const [isPurchasing, setIsPurchasing] = useState(false);
	const [purchaseStatus, setPurchaseStatus] = useState("");
	const [subscriptionId, setSubscriptionId] = useState<string | null>(null);

	const channelQuery = api.channel.channel.byId.useQuery(channelId, {
		enabled: false,
	});

	// Initialize channelId from ?channelId=… and auto-fetch once
	useEffect(() => {
		const qp = searchParams.get("channelId");
		if (qp && !channelId) {
			setChannelId(qp);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [searchParams]);

	useEffect(() => {
		if (channelId && !channel && !channelQuery.isFetching) {
			void handleFetchChannel();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [channelId]);

	// Fetch channel data
	const handleFetchChannel = async () => {
		if (!channelId) {
			alert("Please enter a channel ID");
			return;
		}

		setFetchError(null);

		try {
			const result = await channelQuery.refetch();

			if (result.data) {
				const priceInMist = BigInt(
					result.data.subscription_price_in_mist || "0",
				);
				const priceInSui = Number(priceInMist) / 1_000_000_000;

				const channelData: ChannelData = {
					id: channelId,
					name: result.data.name || "Unnamed Channel",
					description: result.data.description || "",
          subscriptionPriceMist: priceInMist,
					subscriptionPrice: priceInSui.toFixed(4),
					maxDuration: Number(result.data.max_subscription_duration_in_months || 12),
					coverImage: result.data.cover_image_uri || "",
					profileImage: result.data.profile_image_uri || "",
				};

				setChannel(channelData);
				setDurationMonths(1);
			} else {
				throw new Error("Channel not found");
			}
		} catch (error) {
			console.error("Fetch error:", error);
			setFetchError(
				`Failed to fetch channel: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	};

	// Purchase subscription
	const handlePurchase = async () => {
		if (!channel) {
			alert("Please fetch channel data first");
			return;
		}

		if (!account) {
			alert("Please connect your wallet first");
			return;
		}

		if (durationMonths < 1 || durationMonths > channel.maxDuration) {
			alert(
				`Duration must be between 1 and ${channel.maxDuration} months`,
			);
			return;
		}

		setIsPurchasing(true);
		setPurchaseStatus("Creating subscription transaction...");
		setSubscriptionId(null);

		try {
			const pricePerMonth = parseFloat(channel.subscriptionPrice);
			const totalPrice = pricePerMonth * durationMonths;
			const totalPriceInMist = Number(channel.subscriptionPriceMist) * durationMonths;

			setPurchaseStatus("Splitting payment coin...");

			const tx = new Transaction();

			// Split coins for payment
			const [paymentCoin] = tx.splitCoins(tx.gas, [totalPriceInMist]);

			setPurchaseStatus("Calling subscription contract...");

			// Call subscription::new
			const subscriptionResult = tx.moveCall({
				arguments: [
					tx.object(channelId),
					tx.pure.u8(durationMonths),
					tx.pure.address(frontendAddress),
					paymentCoin,
				],
				target: `${fundsuiPackageId}::subscription::new`,
			});

			// Transfer subscription to user
			tx.transferObjects([subscriptionResult], account.address);

			setPurchaseStatus("Waiting for wallet approval...");

			const result = await mutateAsync({
				transaction: tx,
			});

			setPurchaseStatus("Transaction submitted. Waiting for confirmation...");

			const txResult = await suiClient.waitForTransaction({
				digest: result.digest,
				options: {
					showEffects: true,
					showObjectChanges: true,
				},
			});

			// Find the subscription object ID from created objects
			const createdObjects = txResult.objectChanges?.filter(
				(change) => change.type === "created",
			);

			const subscriptionObject = createdObjects?.find((obj) =>
				obj.objectType?.includes("::subscription::Subscription"),
			);

			if (subscriptionObject && subscriptionObject.type === "created") {
				setSubscriptionId(subscriptionObject.objectId);
				setPurchaseStatus("Subscription purchased successfully!");
			} else {
				setPurchaseStatus(
					"Transaction successful! Check your wallet for the subscription object.",
				);
			}

			setTimeout(() => {
				setIsPurchasing(false);
			}, 3000);
		} catch (error) {
			console.error("Purchase error:", error);
			setPurchaseStatus(
				`Purchase failed: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
			setIsPurchasing(false);
		}
	};

	const calculateTotal = () => {
		if (!channel) return "0";
		const pricePerMonth = parseFloat(channel.subscriptionPrice);
		return (pricePerMonth * durationMonths).toFixed(4);
	};

	return (
		<div className="container mx-auto max-w-3xl py-8">
			<div className="mb-6">
				<h1 className="font-bold text-3xl">Subscribe to Channel</h1>
				<p className="mt-2 text-gray-600">
					Purchase a subscription to access encrypted podcast content
				</p>
			</div>

			{/* Connection Status */}
			<div className="mb-6 rounded-lg border bg-white p-4 shadow-sm">
				<div className="flex items-center gap-2">
					<span
						className={`h-2 w-2 rounded-full ${account ? "bg-green-500" : "bg-red-500"}`}
					/>
					<span className="font-medium text-sm">Wallet:</span>
					<span className="text-gray-600 text-sm">
						{account
							? `Connected (${account.address.slice(0, 8)}...)`
							: "Not connected"}
					</span>
				</div>
			</div>

			{/* Step 1: Fetch Channel */}
			<div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
				<h2 className="mb-4 font-semibold text-xl">Step 1: Fetch Channel Data</h2>

				<div className="space-y-4">
					<div>
						<label
							className="mb-2 block font-medium text-sm"
							htmlFor="channelId"
						>
							Channel ID
						</label>
						<input
							id="channelId"
							type="text"
							value={channelId}
							onChange={(e) => setChannelId(e.target.value)}
							placeholder="0x..."
							className="w-full rounded-md border border-gray-300 px-4 py-2 font-mono text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500"
						/>
					</div>

					<button
						onClick={handleFetchChannel}
						disabled={channelQuery.isFetching || !channelId}
						className="w-full rounded-md bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
						type="button"
					>
						{channelQuery.isFetching ? "Fetching..." : "Fetch Channel"}
					</button>

					{fetchError && (
						<div className="rounded-md bg-red-50 p-3">
							<p className="text-red-800 text-sm">{fetchError}</p>
						</div>
					)}
				</div>
			</div>

			{/* Channel Info */}
			{channel && (
				<div className="mb-6 rounded-lg border border-green-300 bg-white p-6 shadow-sm">
					<h2 className="mb-4 font-semibold text-green-800 text-xl">
						Channel Information
					</h2>

					<div className="space-y-3">
						<div>
							<span className="font-medium text-sm">Name:</span>
							<p className="text-gray-700">{channel.name}</p>
						</div>

						<div>
							<span className="font-medium text-sm">Description:</span>
							<p className="text-gray-600 text-sm">{channel.description}</p>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div>
								<span className="font-medium text-sm">Price per month:</span>
								<p className="text-gray-700">{channel.subscriptionPrice} SUI</p>
							</div>

							<div>
								<span className="font-medium text-sm">Max duration:</span>
								<p className="text-gray-700">{channel.maxDuration} months</p>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Step 2: Configure Subscription */}
			{channel && (
				<div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
					<h2 className="mb-4 font-semibold text-xl">
						Step 2: Configure Subscription
					</h2>

					<div className="space-y-4">
						<div>
							<label
								className="mb-2 block font-medium text-sm"
								htmlFor="durationMonths"
							>
								Duration (months)
							</label>
							<input
								id="durationMonths"
								type="number"
								min="1"
								max={channel.maxDuration}
								value={durationMonths}
								onChange={(e) => setDurationMonths(Number(e.target.value))}
								className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
							/>
							<p className="mt-1 text-gray-600 text-xs">
								Choose between 1 and {channel.maxDuration} months
							</p>
						</div>

						<div>
							<label
								className="mb-2 block font-medium text-sm"
								htmlFor="frontendAddress"
							>
								Frontend Provider Address
							</label>
							<input
								id="frontendAddress"
								type="text"
								value={frontendAddress}
								onChange={(e) => setFrontendAddress(e.target.value)}
								placeholder="0x..."
								className="w-full rounded-md border border-gray-300 px-4 py-2 font-mono text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500"
							/>
							<p className="mt-1 text-gray-600 text-xs">
								Address for frontend provider tax (1%)
							</p>
						</div>

						{/* Price Summary */}
						<div className="rounded-md border border-blue-200 bg-blue-50 p-4">
							<h3 className="mb-2 font-semibold text-blue-900 text-sm">
								Price Summary
							</h3>
							<div className="space-y-1 text-sm">
								<div className="flex justify-between">
									<span className="text-gray-700">Price per month:</span>
									<span className="font-medium text-gray-900">
										{channel.subscriptionPrice} SUI
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-gray-700">Duration:</span>
									<span className="font-medium text-gray-900">
										{durationMonths} month{durationMonths > 1 ? "s" : ""}
									</span>
								</div>
								<div className="flex justify-between border-t border-blue-200 pt-1">
									<span className="font-semibold text-gray-900">Total:</span>
									<span className="font-bold text-blue-700">
										{calculateTotal()} SUI
									</span>
								</div>
								<p className="pt-1 text-gray-600 text-xs">
								Includes platform tax (2%) and frontend tax (1%)
								</p>
							</div>
						</div>

						<button
							onClick={handlePurchase}
							disabled={isPurchasing || !account}
							className="w-full rounded-md bg-green-600 px-6 py-3 font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
							type="button"
						>
							{isPurchasing ? (
								<span className="flex items-center justify-center gap-2">
									<svg
										className="h-5 w-5 animate-spin"
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
									>
										<circle
											className="opacity-25"
											cx="12"
											cy="12"
											r="10"
											stroke="currentColor"
											strokeWidth="4"
										/>
										<path
											className="opacity-75"
											fill="currentColor"
											d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
										/>
									</svg>
									{purchaseStatus}
								</span>
							) : (
								`Purchase Subscription (${calculateTotal()} SUI)`
							)}
						</button>
					</div>
				</div>
			)}

			{/* Purchase Status */}
			{purchaseStatus && !isPurchasing && (
				<div
					className={`mb-6 rounded-lg border p-4 ${
						purchaseStatus.includes("failed")
							? "border-red-300 bg-red-50"
							: purchaseStatus.includes("success")
								? "border-green-300 bg-green-50"
								: "border-blue-300 bg-blue-50"
					}`}
				>
					<p
						className={`text-sm ${
							purchaseStatus.includes("failed")
								? "text-red-800"
								: purchaseStatus.includes("success")
									? "text-green-800"
									: "text-blue-800"
						}`}
					>
						{purchaseStatus}
					</p>
				</div>
			)}

			{/* Subscription Result */}
			{subscriptionId && (
				<div className="mb-6 rounded-lg border border-green-400 bg-white p-6 shadow-lg">
					<h2 className="mb-4 font-semibold text-green-800 text-xl">
						Subscription Created Successfully
					</h2>

					<div className="space-y-3">
						<div>
							<span className="font-medium text-sm">Subscription ID:</span>
							<p className="break-all font-mono text-gray-700 text-xs">
								{subscriptionId}
							</p>
						</div>

						<div>
							<span className="font-medium text-sm">Channel:</span>
							<p className="text-gray-700">{channel?.name}</p>
						</div>

						<div>
							<span className="font-medium text-sm">Duration:</span>
							<p className="text-gray-700">
								{durationMonths} month{durationMonths > 1 ? "s" : ""}
							</p>
						</div>

						<div className="rounded-md bg-green-50 p-3">
							<p className="text-green-800 text-xs">
								You can now use this subscription ID to decrypt and play
								encrypted podcasts from this channel!
							</p>
						</div>
					</div>
				</div>
			)}

			{/* Instructions */}
			<div className="rounded-lg border bg-gray-50 p-6">
				<h3 className="mb-3 font-semibold text-gray-900">Instructions</h3>
				<ol className="ml-4 list-decimal space-y-2 text-gray-700 text-sm">
					<li>
						<strong>Connect your wallet</strong> if you haven't already
					</li>
					<li>
						<strong>Enter the Channel ID</strong> you want to subscribe to and
						click "Fetch Channel"
					</li>
					<li>
						<strong>Choose subscription duration</strong> between 1 and the
						maximum allowed months
					</li>
					<li>
						<strong>Set frontend provider address</strong> (optional, defaults
						to zero address)
					</li>
					<li>
						<strong>Review the total price</strong> and click "Purchase
						Subscription"
					</li>
					<li>
						<strong>Approve the transaction</strong> in your wallet
					</li>
					<li>
						<strong>Save your Subscription ID</strong> to use for playing
						encrypted podcasts
					</li>
				</ol>

				<div className="mt-4 rounded-md bg-blue-50 p-3">
					<p className="text-blue-800 text-xs">
						<strong>Note:</strong> Subscriptions are stored on-chain and give
						you access to all encrypted podcasts in the channel for the
						duration you purchased. The total price includes a 2% platform fee
						and 1% frontend provider fee.
					</p>
				</div>
			</div>
		</div>
	);
}
