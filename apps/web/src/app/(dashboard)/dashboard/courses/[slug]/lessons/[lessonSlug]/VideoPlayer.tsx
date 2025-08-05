'use client';

import { useEffect, useRef } from 'react';

interface VideoPlayerProps {
  videoUrl: string;
  initialPosition?: number;
  onProgress: (progress: number) => void;
}

export default function VideoPlayer({
  videoUrl,
  initialPosition = 0,
  onProgress,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastReportedProgress = useRef(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Set initial position
    if (initialPosition > 0) {
      video.currentTime = initialPosition;
    }

    // Report progress
    const handleTimeUpdate = () => {
      if (!video.duration) return;
      
      const progress = (video.currentTime / video.duration) * 100;
      
      // Only report significant progress changes (every 5%)
      if (Math.abs(progress - lastReportedProgress.current) >= 5) {
        lastReportedProgress.current = progress;
        onProgress(Math.floor(progress));
      }
    };

    const handleEnded = () => {
      onProgress(100);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
  }, [initialPosition, onProgress]);

  // Parse video URL to determine provider
  const getVideoEmbed = () => {
    // YouTube
    if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
      const videoId = videoUrl.includes('youtu.be') 
        ? videoUrl.split('/').pop() 
        : new URLSearchParams(new URL(videoUrl).search).get('v');
      
      return (
        <iframe
          className="w-full aspect-video rounded-lg"
          src={`https://www.youtube.com/embed/${videoId}?start=${initialPosition}`}
          title="Lesson video"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      );
    }

    // Vimeo
    if (videoUrl.includes('vimeo.com')) {
      const videoId = videoUrl.split('/').pop();
      return (
        <iframe
          className="w-full aspect-video rounded-lg"
          src={`https://player.vimeo.com/video/${videoId}`}
          title="Lesson video"
          frameBorder="0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      );
    }

    // Direct video file
    return (
      <video
        ref={videoRef}
        className="w-full aspect-video rounded-lg bg-black"
        controls
        src={videoUrl}
      >
        Your browser does not support the video tag.
      </video>
    );
  };

  return (
    <div className="bg-black rounded-lg overflow-hidden shadow-lg">
      {getVideoEmbed()}
    </div>
  );
}