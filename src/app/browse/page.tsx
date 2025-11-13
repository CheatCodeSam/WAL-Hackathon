'use client';

import Link from 'next/link';
import { api } from '~/trpc/react';
import { env } from '~/env';

type Channel = {
  id: string;
  name: string;
  description: string;
  cover_image_uri?: string;
  profile_image_uri?: string;
  subscription_price_in_mist?: string;
  max_subscription_duration_in_months?: number;
};

export default function BrowsePage() {
  const { data, isLoading, error, refetch, isFetching } =
    api.channel.channel.list.useQuery();

  const channels = (data ?? []) as Channel[];

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="container mx-auto px-4">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-bold text-3xl">Browse Channels</h1>
          <button
            className="rounded-md border px-4 py-2 text-sm transition-colors hover:bg-gray-100"
            disabled={isFetching}
            onClick={() => refetch()}
          >
            {isFetching ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {isLoading && (
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            Loading channels…
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-800">
            Failed to load channels: {error.message}
          </div>
        )}

        {!isLoading && !error && channels.length === 0 && (
          <div className="rounded-lg border bg-white p-6 text-gray-600 shadow-sm">
            No channels found.
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {channels.map((ch) => {
            const coverUrl = ch.cover_image_uri
              ? `${env.NEXT_PUBLIC_WALRUS_AGGREGATOR}/v1/blobs/${ch.cover_image_uri}`
              : undefined;
            const profileUrl = ch.profile_image_uri
              ? `${env.NEXT_PUBLIC_WALRUS_AGGREGATOR}/v1/blobs/${ch.profile_image_uri}`
              : undefined;

            const priceSui = ch.subscription_price_in_mist
              ? Number(BigInt(ch.subscription_price_in_mist)) / 1_000_000_000
              : undefined;

            return (
              <div
                key={ch.id}
                className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200"
              >
                {/* Cover */}
                <div className="relative h-36 w-full bg-gray-200">
                  {coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      alt={`${ch.name} cover`}
                      className="h-full w-full object-cover"
                      src={coverUrl}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-gray-400">
                      No cover image
                    </div>
                  )}
                  {/* Avatar */}
                  <div className="absolute -bottom-7 left-4 h-14 w-14 overflow-hidden rounded-full ring-2 ring-white">
                    {profileUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        alt={`${ch.name} avatar`}
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

                <div className="p-4 pt-8">
                  <h2 className="mb-1 line-clamp-1 font-semibold">
                    {ch.name || 'Untitled Channel'}
                  </h2>
                  <p className="mb-3 line-clamp-2 text-gray-600 text-sm">
                    {ch.description || 'No description provided.'}
                  </p>
                  <div className="mb-4 flex items-center gap-3 text-gray-500 text-sm">
                    {priceSui !== undefined && (
                      <span>
                        Price:{' '}
                        <span className="font-medium">
                          {priceSui.toFixed(4)} SUI
                        </span>
                      </span>
                    )}
                    {ch.max_subscription_duration_in_months !== undefined && (
                      <span>
                        Max: {ch.max_subscription_duration_in_months} mo
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    {/* Placeholder actions; wire to real routes when available */}
                    <Link
                      className="rounded-md bg-blue-600 px-3 py-2 text-white text-sm transition-colors hover:bg-blue-700"
                      href={`/subscribe?channelId=${ch.id}`}
                    >
                      Subcribe
                    </Link>
                    <div className="text-gray-400 text-xs">
                      ID: {ch.id.slice(0, 6)}…{ch.id.slice(-4)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
