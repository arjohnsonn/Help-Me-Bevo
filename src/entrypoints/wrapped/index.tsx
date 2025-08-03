import React from "react";
import ReactDOM from "react-dom/client";
import "@/assets/tailwind.css";

import { useState, useRef, useEffect } from "react";
// import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Volume2,
  VolumeOff,
  Repeat,
  StepForward,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import * as storage from "@/lib/storage";
import Aurora from "@/components/Aurora";

type Slide = {
  id: number;
  videoSrc: string;
  text?: string;
  subtitle?: string;
  textAnimation: "fadeIn" | "slideUp" | "zoomIn";
  audioStartTime: number;
};

function getSubtitle(type: string, value: any) {
  switch (type) {
    case "busiestHour": {
      if (value >= 0 && value <= 6) {
        return "What has you up so late at night?";
      } else if (value >= 7 && value <= 12) {
        return "Early bird gets the worm";
      } else if (value >= 13 && value <= 18) {
        return "Afternoon productivity >";
      } else if (value >= 19 && value <= 23) {
        return "W night owl";
      }
      break;
    }
    case "busiestDay": {
      if (value == 0) {
        return "Sunday scaries?";
      } else if (value == 1) {
        return "Everyone hates Mondays";
      } else if (value == 3) {
        return "Hump day is a productive day";
      } else if (value == 5) {
        return "Submit everything before the weekend so you can relax is smart";
      } else if (value >= 6) {
        return "Weekend warrior";
      }
      break;
    }
    case "earliestAssignment": {
      // value is in hours until due date
      if (value >= 0 && value <= 6) {
        return "You need to submit more assignments earlier!";
      } else if (value >= 24 && value <= 72) {
        return "Not procrastinating is a great habit!";
      } else if (value >= 73 && value <= 100000) {
        return "i need your help with not procrastinating fr";
      }
      break;
    }
    case "mostProcrastinatedAssignment": {
      if (value >= 0) {
        return "At least you submitted it on time!";
      } else if (value < 0 && value >= -24) {
        return "At least it isn't a day late. Hope you had a slip day";
      } else if (value < -24 && value >= -72) {
        return "Could be worse... I think";
      } else if (value < -72) {
        return "I hope that this assignment got credit for being this late";
      }
      break;
    }
    case "lastMinuteSubmissions": {
      if (value >= 0 && value <= 5) {
        return "A couple more buzzer beaters and you'll have the same as Dwayne Wade's game-winning ones";
      } else if (value == 5) {
        return "Dwayne Wade had 5 game-winning buzzer beaters";
      } else if (value > 5 && value < 7) {
        return "You're getting close to tying Kobe's game-winning buzzer beaters";
      } else if (value == 8) {
        return "Kobe Bryant & Lebron had 8 game-winning buzzer beaters";
      } else if (value == 9) {
        return "Michael Jordan had 9 game-winning buzzer beaters";
      } else {
        return "If these were game-winning buzzer beaters, you'd be the GOAT";
      }
    }
  }
}

function Wrapped() {
  const [curPersonalStats, setPersonalStats] = useState<any>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const currentSlideRef = useRef<number>(currentSlide);
  useEffect(() => {
    currentSlideRef.current = currentSlide;
  }, [currentSlide]);

  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [, setAudioTime] = useState(0);
  const [, setAudioDuration] = useState(0);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAutoplay, setIsAutoplay] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  const slideDuration = 8.5;

  // Note: Video files would need to be in public/wrapped/ directory
  const baseURL = "/wrapped";
  const [slides, setSlides] = useState<Slide[]>([
    {
      id: 1,
      videoSrc: `${baseURL}/RibbonOrangeVert.webm`,
      textAnimation: "fadeIn",
      text: "Before we begin:",
      subtitle:
        "- This feature was not added until mid semester, so some data may be missing or off. Next semester should be a ton better with full data!<br />- We do NOT store any of your data. All data is stored locally on your device and is not sent to us.<br />- Since this is a new feature, it may be buggy. Feel free to DM me (IG in extension popup) for any concerns<br />- You can view this at any time by going into the extension's menu.<br /><br /><b>Now, let's get started!</b>",
      audioStartTime: 52,
    },
    {
      id: 2,
      videoSrc: `${baseURL}/Intro.webm`,
      textAnimation: "fadeIn",
      audioStartTime: 0,
    },
    // Additional slides would be populated here...
  ]);

  // Initialize the carousel after user interaction
  const initializeCarousel = async () => {
    setIsInitialized(true);

    // Start playing the first slide
    const currentVideo = videoRefs.current[0];
    if (currentVideo) {
      try {
        await currentVideo.play();
      } catch (e) {
        console.error("Video play error:", e);
      }
    }

    // Start playing audio
    if (audioRef.current) {
      try {
        audioRef.current.currentTime = slides[0].audioStartTime;
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (e) {
        console.error("Audio play error:", e);
        setIsPlaying(false);
      }
    }
  };

  useEffect(() => {
    const loadStats = async () => {
      const personalStats = await storage.personalStats.getValue();
      if (
        !personalStats ||
        !personalStats.SPRING_2025 ||
        !personalStats.SPRING_2025.busiestDay ||
        !personalStats.SPRING_2025.busiestHour ||
        Object.keys(personalStats.SPRING_2025.busiestDay).length === 0 ||
        Object.keys(personalStats.SPRING_2025.busiestHour).length === 0
      ) {
        console.log("No personal stats found");
        return;
      }
      setPersonalStats(personalStats);
      // Additional slide population logic would go here...
    };

    loadStats();
  }, []);

  // Handle slide navigation
  const goToSlide = (index: number) => {
    if (index >= 0 && index < slides.length) {
      setCurrentSlide(index);

      // Reset all videos
      videoRefs.current.forEach((video, i) => {
        if (video) {
          video.currentTime = 0;
          if (i === index) {
            video.play().catch((e) => console.error("Video play error:", e));
          } else {
            video.pause();
          }
        }
      });

      // Set audio to the appropriate time for this slide and autoplay
      if (audioRef.current) {
        audioRef.current.currentTime = slides[index].audioStartTime;
        audioRef.current
          .play()
          .catch((e) => console.error("Audio play error:", e));
      }

      setIsPlaying(true);
    }
  };

  const nextSlide = () => goToSlide(currentSlideRef.current + 1);
  const prevSlide = () => goToSlide(currentSlideRef.current - 1);

  // Toggle play/pause for both video and audio
  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);

    const currentVideo = videoRefs.current[currentSlide];
    if (currentVideo) {
      if (isPlaying) {
        currentVideo.pause();
      } else {
        currentVideo.play().catch((e) => console.error("Video play error:", e));
      }
    }

    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current
          .play()
          .catch((e) => console.error("Audio play error:", e));
      }
    }
  };

  const toggleAutoplay = () => {
    setIsAutoplay(!isAutoplay);
  };

  // Update audio time
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setAudioTime(audioRef.current.currentTime);
    }
  };

  // Toggle mute/unmute
  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black p-4">
      <Aurora
        colorStops={["#BF5700", "#5B2F0B", "#5E3F1C"]}
        blend={0.5}
        amplitude={1.0}
        speed={0.5}
      />

      <audio
        ref={audioRef}
        src={`${baseURL}/Song.mp3`}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
        className="hidden"
      />

      {curPersonalStats ? (
        <div
          ref={containerRef}
          className="relative w-full max-w-sm mx-auto overflow-hidden rounded-lg aspect-[9/16] bg-black filter drop-shadow-[0_0_20px_rgba(0,0,0,0.85)]"
        >
          {/* Initial Play Button Overlay */}
          {!isInitialized && (
            <div className="absolute inset-x-0 top-[81%] z-50 flex items-center justify-center">
              <Button
                onClick={initializeCarousel}
                size="lg"
                className="rounded-full h-12 w-12 flex items-center justify-center bg-[#BF5700] hover:bg-[#BF5700]/90"
                aria-label="Start"
              >
                <Play className="h-8 w-8" />
              </Button>
            </div>
          )}

          {/* Videos */}
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={cn(
                "absolute inset-0 w-full h-full transition-opacity duration-300 flex items-center justify-center",
                currentSlide === index ? "opacity-100 z-10" : "opacity-0 z-0"
              )}
            >
              <video
                ref={(el) => {
                  videoRefs.current[index] = el;
                }}
                src={slide.videoSrc}
                preload="auto"
                className="object-cover w-full h-full"
                muted
                playsInline
                onEnded={() => {
                  if (isAutoplay) {
                    if (index === slides.length - 1) {
                      goToSlide(0);
                    } else {
                      nextSlide();
                    }
                  }
                }}
              />

              {/* Text Overlay */}
              {currentSlide === index && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-white text-center">
                  {/* Main Text */}
                  <h2
                    className="text-2xl font-medium drop-shadow-lg mb-3 select-none"
                    dangerouslySetInnerHTML={{ __html: slide.text || "" }}
                  />

                  {slide.subtitle && (
                    <p
                      className="text-base font-normal text-white/90 max-w-xs drop-shadow-lg select-none"
                      dangerouslySetInnerHTML={{
                        __html: slide.subtitle || "",
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Controls */}
          {isInitialized && (
            <>
              {/* Play/Pause Button */}
              <div className="absolute bottom-4 right-4 flex items-center space-x-2 z-30">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full bg-black/50 text-white hover:bg-black/70"
                  onClick={togglePlayPause}
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5" />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full bg-black/50 text-white hover:bg-black/70"
                  onClick={toggleMute}
                  aria-label={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? (
                    <VolumeOff className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full bg-black/50 text-white hover:bg-black/70"
                  onClick={toggleAutoplay}
                  aria-label={
                    isAutoplay ? "Disable Autoplay" : "Enable Autoplay"
                  }
                >
                  {isAutoplay ? (
                    <StepForward className="h-5 w-5" />
                  ) : (
                    <Repeat className="h-5 w-5" />
                  )}
                </Button>
              </div>

              {/* Navigation Controls */}
              {currentSlide !== 0 && (
                <div className="absolute inset-y-0 left-2 flex items-center z-20">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full text-white cursor-pointer bg-transparent transform transition-transform duration-200 ease-out hover:scale-110 hover:-translate-x-1"
                    onClick={prevSlide}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                </div>
              )}

              {currentSlide !== slides.length - 1 && (
                <div className="absolute inset-y-0 right-2 flex items-center z-20">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full text-white cursor-pointer bg-transparent transform transition-transform duration-200 ease-out hover:scale-110 hover:translate-x-1"
                    onClick={nextSlide}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                </div>
              )}

              {/* Progress Indicators */}
              <div className="absolute top-4 inset-x-4 flex gap-1 z-20">
                {slides.map((_, index) => (
                  <div
                    key={index}
                    className={cn(
                      "h-1 flex-1 rounded-full transition-all duration-300",
                      currentSlide === index
                        ? "bg-white"
                        : currentSlide > index
                        ? "bg-white/70"
                        : "bg-white/30"
                    )}
                    onClick={() => goToSlide(index)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        <p className="text-white text-lg font-medium text-center">
          Seems like you haven't submitted an assignment yet. Submit one and use
          the extension menu to come back!
        </p>
      )}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <Wrapped />
  </React.StrictMode>
);