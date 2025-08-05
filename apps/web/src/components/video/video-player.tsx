'use client';

import { useEffect, useRef, useState } from 'react';
import { VideoPlayer as VideoPlayerClass } from '@course-platform/video';
import type { VideoProgress } from '@course-platform/video';

interface VideoPlayerProps {
  videoUrl: string;
  poster?: string;
  onProgress?: (progress: VideoProgress) => void;
  onComplete?: () => void;
  initialTime?: number;
  className?: string;
}

export function VideoPlayer({
  videoUrl,
  poster,
  onProgress,
  onComplete,
  initialTime = 0,
  className = '',
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<VideoPlayerClass | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!videoRef.current) return;

    const initPlayer = async () => {
      try {
        const player = new VideoPlayerClass('video-player', {
          url: videoUrl,
          poster,
          controls: true,
          fluid: true,
          responsive: true,
          playbackRates: [0.5, 1, 1.25, 1.5, 2],
          qualityLevels: true,
        });

        await player.initialize();
        playerRef.current = player;

        // Set up progress tracking
        if (onProgress) {
          player.onProgress(onProgress);
        }

        // Set initial time if provided
        if (initialTime > 0) {
          player.seek(initialTime);
        }

        // Track completion
        player.onAnalytics((event) => {
          if (event === 'ended' && onComplete) {
            onComplete();
          }
        });

        setIsReady(true);
      } catch (err) {
        console.error('Failed to initialize video player:', err);
        setError('Failed to load video player');
      }
    };

    initPlayer();

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [videoUrl, poster, onProgress, onComplete, initialTime]);

  if (error) {
    return (
      <div className="bg-gray-900 rounded-lg flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-white mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative bg-black rounded-lg overflow-hidden ${className}`}>
      <video
        id="video-player"
        ref={videoRef}
        className="video-js vjs-default-skin vjs-big-play-centered"
        playsInline
      />
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      )}
    </div>
  );
}