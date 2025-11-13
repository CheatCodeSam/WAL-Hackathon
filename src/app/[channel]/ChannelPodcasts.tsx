'use client';

import Link from 'next/link';
import { api } from '~/trpc/react';

type Props = {
  channelId?: string | null;
};

export default function ChannelPodcasts({ channelId }: Props) {
  const {
    data: podcasts,
    isLoading,
    error,
  } = api.podcast.podcast.listFromChannel.useQuery(channelId ?? '', {
    enabled: !!channelId,
  });

  if (!channelId) return null;

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <h2 className="mb-4 font-semibold text-xl">Podcasts</h2>

      {isLoading && <div className="text-gray-600">Loading podcasts…</div>}

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-red-800">
          Failed to load podcasts: {error.message}
        </div>
      )}

      {!isLoading && podcasts && podcasts.length === 0 && (
        <div className="text-gray-600">No podcasts found for this channel.</div>
      )}

      <ul className="space-y-4">
        {podcasts?.map((p: any, idx: number) => {
          const created = p.created_at
            ? new Date(Number(p.created_at)).toLocaleDateString()
            : p.created_at || 'Unknown';
          // podcast objects from GraphQL may not include an id in this query
          const id = p.id || p.object_id || null;

          return (
            <li key={idx} className="overflow-hidden rounded-md border p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">
                    {p.title || 'Untitled'}
                  </h3>
                  <p className="text-sm text-gray-600">{p.description || ''}</p>
                  <div className="mt-2 text-xs text-gray-500">
                    {created} · {p.file_type || 'unknown'}
                  </div>
                </div>
                <div className="ml-4 shrink-0">
                  {id ? (
                    <Link
                      className="rounded-md bg-blue-600 px-3 py-2 text-white text-sm hover:bg-blue-700"
                      href={`/${channelId}/${id}`}
                    >
                      View
                    </Link>
                  ) : (
                    <button
                      disabled
                      className="rounded-md bg-gray-200 px-3 py-2 text-sm text-gray-500"
                    >
                      No ID
                    </button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
