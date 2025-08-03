import React, { useEffect, useRef, useState } from "react";

interface VideoOverlayProps {
  videoUrl: string;
  assignmentName?: string | null;
  volume: number;
  onVideoEnd: () => void;
  onSkip: () => void;
  showAssignmentName: boolean;
}

const VideoOverlay: React.FC<VideoOverlayProps> = ({
  videoUrl,
  assignmentName,
  volume,
  onVideoEnd,
  onSkip,
  showAssignmentName,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume / 100;
    }
  }, [volume]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" || event.key === "Backspace") {
        onSkip();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onSkip]);

  const getFontSize = (name: string) => {
    const length = name.length;
    let baseSize = 8; // rem

    if (length > 70) baseSize = 5;
    else if (length > 50) baseSize = 6;
    else if (length > 30) baseSize = 7;

    if (window.innerWidth < 850) baseSize /= 2.25;
    else if (window.innerWidth < 1300) baseSize /= 1.5;

    return `${baseSize}rem`;
  };

  return (
    <div className="video-overlay-container">
      {showAssignmentName && assignmentName && (
        <h1
          className="assignment-name shake"
          style={{ fontSize: getFontSize(assignmentName) }}
        >
          {assignmentName.toUpperCase()}
        </h1>
      )}

      <video
        ref={videoRef}
        className="video-player"
        autoPlay
        onEnded={onVideoEnd}
      >
        <source src={videoUrl} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      <button className="skip-button" onClick={onSkip}>
        SKIP (ESC)
      </button>
    </div>
  );
};

export default VideoOverlay;
