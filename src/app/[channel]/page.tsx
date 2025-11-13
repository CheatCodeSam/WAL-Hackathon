'use client';

import { SubscribeButton } from './SubscribeButton';
import { api } from '~/trpc/react';
import { env } from '~/env';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import ChannelPodcasts from './ChannelPodcasts';

type ChannelDetails = {
  id: string;
  name: string;
  description: string;
  tag_line?: string;
  cover_image_uri?: string;
  profile_image_uri?: string;
  subscription_price_in_mist?: string;
  max_subscription_duration_in_months?: number;
};

export default function ChannelPage() {
  const { channel: channelId } = useParams<{ channel: string }>();
  const { data, isLoading, error } = api.channel.channel.byId.useQuery(
    channelId,
    { enabled: !!channelId }
  );

  const ch = (data ?? null) as ChannelDetails | null;

  const coverUrl = ch?.cover_image_uri
    ? `${env.NEXT_PUBLIC_WALRUS_AGGREGATOR}/v1/blobs/${ch.cover_image_uri}`
    : undefined;
  const profileUrl = ch?.profile_image_uri
    ? `${env.NEXT_PUBLIC_WALRUS_AGGREGATOR}/v1/blobs/${ch.profile_image_uri}`
    : undefined;
  const priceSui = ch?.subscription_price_in_mist
    ? Number(BigInt(ch.subscription_price_in_mist)) / 1_000_000_000
    : undefined;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header / Cover */}
      <div className="relative h-56 w-full bg-gray-200">
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt="Cover"
            className="h-full w-full object-cover"
            src={coverUrl}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-400">
            No cover image
          </div>
        )}
        <div className="absolute -bottom-10 left-8 h-20 w-20 overflow-hidden rounded-full ring-4 ring-white">
          {profileUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt="Avatar"
              className="h-full w-full object-cover"
              src={profileUrl}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400">
              N/A
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 pb-12 pt-14">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="mb-1 font-bold text-3xl">
              {isLoading ? 'Loading…' : ch?.name ?? 'Channel'}
            </h1>
            {ch?.tag_line && <p className="text-gray-600">{ch.tag_line}</p>}
          </div>
          <div className="flex items-center gap-3">
            {ch && (
              <Link
                className="rounded-md bg-blue-600 px-3 py-2 text-white text-sm transition-colors hover:bg-blue-700"
                href={`/subscribe?channelId=${ch.id}`}
              >
                Subcribe
              </Link>
            )}
            <Link
              className="rounded-md border px-3 py-2 text-sm hover:bg-gray-100"
              href="/browse"
            >
              Back to Browse
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4 text-red-800">
            Failed to load channel: {error.message}
          </div>
        )}

        {ch && (
          <div className="grid gap-8 md:grid-cols-3">
            <div className="md:col-span-2">
              <div className="rounded-lg bg-white p-6 shadow">
                <h2 className="mb-3 font-semibold text-xl">About</h2>
                <p className="text-gray-700">
                  {ch.description || 'No description provided.'}
                </p>
              </div>
              <div className="mt-6">
                <ChannelPodcasts channelId={channelId} />
              </div>
            </div>
            <div className="space-y-4">
              <div className="rounded-lg bg-white p-6 shadow">
                <h3 className="mb-2 font-semibold">Subscription</h3>
                <div className="text-gray-700">
                  <div className="flex items-center justify-between">
                    <span>Price</span>
                    <span className="font-medium">
                      {priceSui !== undefined
                        ? `${priceSui.toFixed(4)} SUI`
                        : '—'}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span>Max duration</span>
                    <span className="font-medium">
                      {ch.max_subscription_duration_in_months ?? '—'} months
                    </span>
                  </div>
                </div>
                <div className="mt-4">
                  <SubscribeButton channelId={channelId} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
