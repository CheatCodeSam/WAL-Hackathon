'use client';

import { useEffect, useState } from 'react';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { useNetworkVariable } from '~/app/networkConfig';
import { getUserDetails } from '~/services/api';
import { type UserDetails } from '~/services/api/user';
import { SubscribeButton } from './SubscribeButton';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface ChannelSubscriptionProps {
  channelId: string;
  subscriptionPriceMist?: string;
  maxSubscriptionDurationMonths?: number;
}

// NOTE: Converts mist (1e-9 SUI) to SUI number for display.
function mistToSui(mist?: string): number | undefined {
  if (!mist) return undefined;
  try {
    return Number(BigInt(mist)) / 1_000_000_000;
  } catch {
    return undefined;
  }
}

export function ChannelSubscription({
  channelId,
  subscriptionPriceMist,
  maxSubscriptionDurationMonths,
}: ChannelSubscriptionProps) {
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const fundsuiPackageId = useNetworkVariable('fundsuiPackageId');
  const pathname = usePathname();

  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<UserDetails | null>(null);

  useEffect(() => {
    let cancelled = false;
    const inspect = async () => {
      if (!channelId || !account?.address) {
        setIsSubscribed(null);
        return;
      }
      try {
        setIsLoading(true);
        setError(null);
        const userDetails = await getUserDetails(account.address);
        if (!userDetails) {
          setIsSubscribed(false);
          return;
        }
        setUser(userDetails);
        const tx = new Transaction();
        tx.moveCall({
          target: `${fundsuiPackageId}::user::has_subscription`,
          arguments: [
            tx.object(userDetails.id), // &User
            tx.object(channelId), // Channel object ID
          ],
        });
        const result = await suiClient.devInspectTransactionBlock({
          sender: account.address,
          transactionBlock: tx,
        });
        let subscribed = false;
        const rv = result.results?.[0]?.returnValues?.[0];
        if (rv) {
          const [bytes] = rv as [number[], string];
          if (Array.isArray(bytes) && bytes.length === 1) {
            subscribed = bytes[0] === 1;
          } else if (Array.isArray(bytes) && bytes.length > 1) {
            subscribed = bytes[0] !== 0;
          }
        }
        if (!cancelled) setIsSubscribed(subscribed);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
          setIsSubscribed(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    inspect();
    return () => {
      cancelled = true;
    };
  }, [channelId, account?.address, suiClient, fundsuiPackageId]);

  const priceSui = mistToSui(subscriptionPriceMist);

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <h3 className="mb-2 font-semibold">Subscription</h3>
      <div className="text-gray-700">
        <div className="flex items-center justify-between">
          <span>Price</span>
          <span className="font-medium">
            {priceSui !== undefined ? `${priceSui.toFixed(4)} SUI` : '—'}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span>Max duration</span>
          <span className="font-medium">
            {maxSubscriptionDurationMonths ?? '—'} months
          </span>
        </div>
      </div>
      <div className="mt-4">
        {error && (
          <div className="mb-3 rounded-md border border-yellow-200 bg-yellow-50 p-2 text-xs text-yellow-800">
            Subscription status unavailable: {error}
          </div>
        )}
        {isLoading && (
          <div className="mb-2 text-sm text-gray-500">Checking subscription…</div>
        )}
        {/* If wallet connected but no on-chain user exists, prompt to sign up */}
        {account?.address && !user ? (
          <Link
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            href={`/auth/signup?returnTo=${encodeURIComponent(pathname || '/')}`}
          >
            Create your account to subscribe
          </Link>
        ) : isSubscribed ? (
          <div className="rounded-md bg-green-100 px-3 py-2 text-sm font-medium text-green-700">
            You are subscribed to this channel.
          </div>
        ) : (
          <SubscribeButton
            channelId={channelId}
            userId={user?.id || ''}
            subscriptionPriceMist={subscriptionPriceMist}
            durationMonths={3}
          />
        )}
      </div>
    </div>
  );
}
