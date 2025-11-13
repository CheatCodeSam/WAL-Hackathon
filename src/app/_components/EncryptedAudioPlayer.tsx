'use client';

import { useState, useRef, useEffect } from 'react';
import {
  useSealAudioPlayer,
  type DecryptAudioOptions,
} from '~/hooks/useSealAudioPlayer';

interface EncryptedAudioPlayerProps {
  /** Walrus blob ID of the encrypted audio */
  blobId: string;
  /** Encryption nonce stored on-chain */
  nonce: string;
  /** Channel ID */
  channelId: string;
  /** Podcast ID */
  podcastId: string;
  /** User's subscription object ID */
  subscriptionObjectId: string;
  /** Display title */
  title?: string;
}

export function EncryptedAudioPlayer({
  blobId,
  nonce,
  channelId,
  podcastId,
  subscriptionObjectId,
  title,
}: EncryptedAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasDecrypted, setHasDecrypted] = useState(false);

  const { decryptAndPlayAudio, revokeAudioUrl, isDecrypting, error, ready } =
    useSealAudioPlayer();

  // Cleanup audio URL on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) {
        revokeAudioUrl(audioUrl);
      }
    };
  }, [audioUrl, revokeAudioUrl]);

  const handleDecryptAndPlay = async () => {
    if (audioUrl) {
      // Already decrypted, just play/pause
      if (audioRef.current) {
        if (isPlaying) {
          audioRef.current.pause();
        } else {
          await audioRef.current.play();
        }
      }
      return;
    }

    try {
      // Decrypt the audio
      const options: DecryptAudioOptions = {
        blobId,
        nonce,
        channelId,
        podcastId,
        subscriptionObjectId,
      };

      const decryptedUrl = await decryptAndPlayAudio(options);
      setAudioUrl(decryptedUrl);
      setHasDecrypted(true);

      // Auto-play after decryption
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play().catch((err) => {
            console.error('Failed to auto-play:', err);
          });
        }
      }, 100);
    } catch (err) {
      console.error('Decryption failed:', err);
    }
  };

  const handlePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  if (!ready) {
    return (
      <div className="rounded-lg border border-gray-300 bg-gray-50 p-4">
        <p className="text-gray-600 text-sm">
          🔒 Initializing encryption service...
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-300 bg-white p-4 shadow-sm">
      {title && (
        <h3 className="mb-3 font-semibold text-gray-900 text-lg">{title}</h3>
      )}

      <div className="flex items-center gap-4">
        {/* Play/Decrypt Button */}
        <button
          onClick={hasDecrypted ? handlePlayPause : handleDecryptAndPlay}
          disabled={isDecrypting}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
        >
          {isDecrypting ? (
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
          ) : isPlaying ? (
            // Pause icon
            <svg
              className="h-5 w-5"
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : hasDecrypted ? (
            // Play icon
            <svg
              className="h-5 w-5"
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          ) : (
            // Unlock/Decrypt icon
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
              />
            </svg>
          )}
        </button>

        {/* Audio Element (hidden controls) */}
        {audioUrl && (
          <div className="flex-1">
            <audio
              ref={audioRef}
              src={audioUrl}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
              controls
              className="w-full"
            />
          </div>
        )}

        {/* Status Text */}
        {!audioUrl && (
          <div className="flex-1">
            <p className="text-gray-700 text-sm">
              {isDecrypting
                ? '🔓 Decrypting audio...'
                : '🔒 Encrypted audio - Click to decrypt and play'}
            </p>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-3 rounded-md bg-red-50 p-3">
          <p className="text-red-800 text-sm">
            <strong>Error:</strong> {error}
          </p>
          <p className="mt-1 text-red-600 text-xs">
            Make sure you have an active subscription to this channel.
          </p>
        </div>
      )}

      {/* Info */}
      {!hasDecrypted && !isDecrypting && (
        <div className="mt-3 rounded-md bg-blue-50 p-3">
          <p className="text-blue-800 text-xs">
            ℹ️ This content is encrypted and requires a valid subscription to
            access. Your subscription will be verified on-chain before
            decryption.
          </p>
        </div>
      )}
    </div>
  );
}
