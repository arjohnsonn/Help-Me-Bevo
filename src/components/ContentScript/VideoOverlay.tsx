import React, { useEffect, useRef, useState } from "react";
import { createShadowRootUi, type ContentScriptContext } from "#imports";

interface VideoOverlayProps {
  ctx: ContentScriptContext;
  videoUrl: string;
  assignmentName?: string | null;
  volume: number;
  onVideoEnd: () => void;
  onSkip: () => void;
  showAssignmentName: boolean;
  textHideTimeout?: number;
}

const VideoOverlay: React.FC<VideoOverlayProps> = ({
  ctx,
  videoUrl,
  assignmentName,
  volume,
  onVideoEnd,
  onSkip,
  showAssignmentName,
  textHideTimeout = 0,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const uiRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    let mounted = true;

    const initializeUI = async () => {
      if (uiRef.current) {
        uiRef.current.remove();
      }

      const ui = await createShadowRootUi(ctx, {
        name: 'bevo-video-overlay',
        position: 'overlay',
        onMount: (container) => {
          // Create styles
          const style = document.createElement('style');
          style.textContent = `
            @import url("https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap");

            .video-overlay-container {
              position: fixed;
              top: 0;
              left: 0;
              width: 100vw;
              height: 100vh;
              background-color: rgba(0, 0, 0, 0.25);
              display: flex;
              align-items: center;
              justify-content: center;
              z-index: 999999;
              opacity: 0;
              visibility: hidden;
              transition: opacity 0.3s ease, visibility 0.3s ease;
            }

            .video-overlay-container.show-bevo {
              opacity: 1;
              visibility: visible;
            }

            .video-player {
              width: 100%;
              max-width: 100%;
              height: auto;
            }

            .assignment-name {
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              font-family: "Poppins", sans-serif;
              font-weight: 900;
              color: white;
              -webkit-text-stroke: 5px black;
              -moz-text-stroke: 5px black;
              paint-order: stroke fill;
              text-shadow: 0 0 15px rgb(12, 12, 12);
              text-align: center;
              z-index: 9999999;
              width: 95%;
              line-height: 1;
              overflow: hidden;
              margin: 0;
              padding: 0;
            }

            .skip-button {
              position: absolute;
              background: white;
              bottom: 10px;
              right: 20px;
              font-weight: bold;
              border-radius: 8px;
              padding: 5px 10px;
              border: none;
              cursor: pointer;
              color: black;
              font-family: system-ui, -apple-system, sans-serif;
            }

            .skip-button:hover {
              background-color: #f0f0f0;
            }

            .shake {
              animation: shake 0.5s infinite;
            }

            @keyframes shake {
              0% { transform: translate(-50%, -50%) rotate(0deg); }
              11% { transform: translate(calc(-50% + 3px), calc(-50% + 2px)) rotate(-1deg); }
              22% { transform: translate(calc(-50% - 3px), calc(-50% - 2px)) rotate(1deg); }
              33% { transform: translate(calc(-50% + 2px), calc(-50% - 3px)) rotate(-0.5deg); }
              44% { transform: translate(calc(-50% - 2px), calc(-50% + 3px)) rotate(0.5deg); }
              55% { transform: translate(calc(-50% + 3px), calc(-50% - 2px)) rotate(-1deg); }
              66% { transform: translate(calc(-50% - 3px), calc(-50% + 2px)) rotate(1deg); }
              77% { transform: translate(calc(-50% + 2px), calc(-50% + 3px)) rotate(-0.5deg); }
              88% { transform: translate(calc(-50% - 2px), calc(-50% - 3px)) rotate(0.5deg); }
              100% { transform: translate(-50%, -50%) rotate(0deg); }
            }

            .assignment-name.hidden {
              display: none;
              opacity: 0;
              max-height: 0;
            }
          `;

          // Create overlay container
          const overlayContainer = document.createElement('div');
          overlayContainer.className = 'video-overlay-container';

          // Create assignment name element if needed
          let assignmentElement: HTMLElement | null = null;
          if (showAssignmentName && assignmentName) {
            assignmentElement = document.createElement('h1');
            assignmentElement.className = 'assignment-name shake';
            assignmentElement.textContent = assignmentName.toUpperCase();
            
            // Calculate font size
            const length = assignmentName.length;
            let baseSize = 8;
            if (length > 70) baseSize = 5;
            else if (length > 50) baseSize = 6;
            else if (length > 30) baseSize = 7;
            
            if (window.innerWidth < 850) baseSize /= 2.25;
            else if (window.innerWidth < 1300) baseSize /= 1.5;
            
            assignmentElement.style.fontSize = `${baseSize}rem`;
            overlayContainer.appendChild(assignmentElement);
          }

          // Create video element
          const video = document.createElement('video');
          video.className = 'video-player';
          video.autoplay = true;
          video.muted = false; // Start unmuted in shadow DOM
          video.volume = volume / 100;
          video.src = videoUrl;
          videoRef.current = video;

          // Video event listeners
          video.addEventListener('ended', () => {
            if (mounted) onVideoEnd();
          });

          video.addEventListener('canplay', () => {
            video.play().catch(console.error);
          });

          // Create skip button
          const skipButton = document.createElement('button');
          skipButton.className = 'skip-button';
          skipButton.textContent = 'SKIP (ESC)';
          skipButton.addEventListener('click', () => {
            if (mounted) onSkip();
          });

          // Append elements
          overlayContainer.appendChild(video);
          overlayContainer.appendChild(skipButton);

          // Append to container
          container.appendChild(style);
          container.appendChild(overlayContainer);

          // Show with delay
          setTimeout(() => {
            if (mounted) {
              overlayContainer.classList.add('show-bevo');
              setIsVisible(true);
            }
          }, 100);

          // Handle assignment name timeout
          if (assignmentElement && textHideTimeout > 0) {
            setTimeout(() => {
              if (mounted && assignmentElement) {
                assignmentElement.classList.add('hidden');
              }
            }, textHideTimeout * 1000);
          }
        },
        onRemove: () => {
          setIsVisible(false);
          videoRef.current = null;
        },
      });

      if (mounted) {
        uiRef.current = ui;
        ui.mount();
      }
    };

    initializeUI();

    return () => {
      mounted = false;
      if (uiRef.current) {
        uiRef.current.remove();
        uiRef.current = null;
      }
    };
  }, [ctx, videoUrl, assignmentName, volume, showAssignmentName, textHideTimeout, onVideoEnd, onSkip]);

  // Handle keyboard events (must be on document)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isVisible && (event.key === "Escape" || event.key === "Backspace")) {
        onSkip();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isVisible, onSkip]);

  // Update volume when it changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume / 100;
    }
  }, [volume]);

  // This component doesn't render anything directly to the React tree
  // The UI is created in the Shadow DOM via createShadowRootUi
  return null;
};

export default VideoOverlay;