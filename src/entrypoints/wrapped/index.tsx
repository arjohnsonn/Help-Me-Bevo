import React from "react";
import ReactDOM from "react-dom/client";
import "@/assets/tailwind.css";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import { browser } from "wxt/browser";

const WRAPPED_SEMESTER = "FALL_2025";
const RECAP_TITLE = "Your school year, wrapped";

const escapeHtml = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[c]!),
  );

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
  const slideDuration = 8.5;
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
  
  const baseURL = "/wrapped";
  const [slides, setSlides] = useState<Slide[]>([
    {
      id: 1,
      videoSrc: `${baseURL}/RibbonOrangeVert.webm`,
      textAnimation: "fadeIn",
      text: "Before we begin:",
      subtitle: `
        <span style="display:block;">This Wrapped covers the full <b>2025–2026 school year</b> (Fall 2025 and Spring 2026).</span>
        <span style="display:block;border-top:1px solid rgba(255,255,255,0.2);margin:10px 0;"></span>
        <span style="display:block;">This feature is still in development, so some data may be missing or off. Next school year should be a ton better with full data!</span>
        <span style="display:block;border-top:1px solid rgba(255,255,255,0.2);margin:10px 0;"></span>
        <span style="display:block;">We do NOT store any of your data. All data is stored locally on your device and is not sent to us.</span>
        <span style="display:block;border-top:1px solid rgba(255,255,255,0.2);margin:10px 0;"></span>
        <span style="display:block;">Since this is a new feature, it may be buggy. Feel free to DM me (IG in extension popup) for any concerns.</span>
        <span style="display:block;border-top:1px solid rgba(255,255,255,0.2);margin:10px 0;"></span>
        <span style="display:block;">You can view this at any time by going into the extension's menu.</span>
      `,
      audioStartTime: 52,
    },
    {
      id: 2,
      videoSrc: `${baseURL}/Intro.webm`,
      textAnimation: "fadeIn",
      audioStartTime: 0,
    },
    {
      id: 3,
      videoSrc: `${baseURL}/DiamondBlack.webm`,
      textAnimation: "slideUp",
      audioStartTime: slideDuration * 1,
    },
    {
      id: 4,
      videoSrc: `${baseURL}/DiamondOrange.webm`,
      textAnimation: "slideUp",
      audioStartTime: slideDuration * 2,
    },
    {
      id: 5,
      videoSrc: `${baseURL}/DoubleHorizontalRibbons.webm`,
      textAnimation: "slideUp",
      audioStartTime: slideDuration * 3,
    },
    {
      id: 6,
      videoSrc: `${baseURL}/RibbonOrangeVert.webm`,
      textAnimation: "slideUp",
      audioStartTime: slideDuration * 4,
    },
    {
      id: 7,
      videoSrc: `${baseURL}/VerticalDiamond.webm`,
      textAnimation: "slideUp",
      audioStartTime: slideDuration * 5,
    },
    {
      id: 8,
      videoSrc: `${baseURL}/DiamondBlack.webm`,
      textAnimation: "slideUp",
      audioStartTime: slideDuration * 6,
    },
    {
      id: 9,
      videoSrc: `${baseURL}/DoubleHorizontalRibbons.webm`,
      textAnimation: "slideUp",
      audioStartTime: slideDuration * 7,
    },
    {
      id: 10,
      videoSrc: `${baseURL}/RibbonOrangeVert.webm`,
      textAnimation: "slideUp",
      audioStartTime: slideDuration * 8,
    },
    {
      id: 11,
      videoSrc: `${baseURL}/VerticalDiamond.webm`,
      textAnimation: "slideUp",
      audioStartTime: slideDuration * 9,
    },
    {
      id: 12,
      videoSrc: `${baseURL}/BlackOrangeRectangles.webm`,
      textAnimation: "slideUp",
      text: "Thanks for using <b>Help Me Bevo</b> this school year!",
      subtitle: `
        If you enjoyed Wrapped and the extension, please leave a review! 🧡
        <br /><br />
        <a
          style="
            font-weight: bold;
            text-decoration: underline;
            color: #c77d40;
          "
          href="https://chromewebstore.google.com/detail/help-me-bevo/igepffgmogjaehnlpgepliimadegcapd?authuser=1&hl=en"
          target="_blank"
          rel="noopener noreferrer"
        >
          Click here to leave a rating!
        </a>
      `,
      audioStartTime: slideDuration * 10,
    },
    {
      id: 13,
      videoSrc: `${baseURL}/BlackOrangeRectangles.webm`,
      textAnimation: "fadeIn",
      text: RECAP_TITLE,
      subtitle: "",
      audioStartTime: slideDuration * 11,
    },
    {
      id: 14,
      videoSrc: `${baseURL}/DoubleHorizontalRibbons.webm`,
      textAnimation: "fadeIn",
      text: "Have a great summer break!",
      subtitle: `If you're returning next semester, see you in the fall! For those graduating, good luck with your future endeavors!<br /><br />
        <a
          style="
            font-weight: bold;
            text-decoration: underline;
            color: #c77d40;
          "
          href="https://chromewebstore.google.com/detail/help-me-bevo/igepffgmogjaehnlpgepliimadegcapd?authuser=1&hl=en"
          target="_blank"
          rel="noopener noreferrer"
        >
          Like the extension? Click here to leave a rating!
        </a>
        <br />
        <span style="font-style: italic; font-size: 0.85em;">
          also follow me on
          <a
            style="
              font-style: italic;
              text-decoration: underline;
              color: #c77d40;
            "
            href="https://www.instagram.com/aidenn.johnson/"
            target="_blank"
            rel="noopener noreferrer"
          >instagram!</a>
        </span>
        <span style="display: block; margin-top: 16px; font-size: 1.25em; font-weight: 700;">
          Thank you so much for using Help Me Bevo!
        </span>`,
      audioStartTime: slideDuration * 12,
    },
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
        !personalStats[WRAPPED_SEMESTER] ||
        !personalStats[WRAPPED_SEMESTER].busiestDay ||
        !personalStats[WRAPPED_SEMESTER].busiestHour ||
        Object.keys(personalStats[WRAPPED_SEMESTER].busiestDay).length === 0 ||
        Object.keys(personalStats[WRAPPED_SEMESTER].busiestHour).length === 0
      ) {
        console.log("No personal stats found");
        return;
      }
      setPersonalStats(personalStats);
      const semester = personalStats[WRAPPED_SEMESTER];

      // Track which slides to remove
      const slidesToRemove: number[] = [];

      // get busiest day
      const busiestDay = semester.busiestDay;
      const busiestDayEntries = Object.entries(busiestDay) as [
        string,
        number
      ][];
      const [busiestDayKey] = busiestDayEntries.reduce((prev, curr) =>
        curr[1] > prev[1] ? curr : prev
      );
      const dayNames = [
        "Sunday",
        "Monday", 
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      const busiestDayIndex = Number.parseInt(busiestDayKey, 10);
      const busiestDayName = dayNames[busiestDayIndex] ?? busiestDayKey;

      // get busiest hour
      const busiestHour = semester.busiestHour;
      const busiestHourEntries = Object.entries(busiestHour) as [
        string,
        number
      ][];
      const [busiestHourKey] = busiestHourEntries.reduce((prev, curr) =>
        curr[1] > prev[1] ? curr : prev
      );
      const hourNum = Number.parseInt(busiestHourKey, 10);
      const period = hourNum >= 12 ? "PM" : "AM";
      const hour12 = hourNum % 12 === 0 ? 12 : hourNum % 12;
      const busiestHourLabel = `${hour12} ${period}`;

      setSlides((prev) => {
        const updated = [...prev];
        updated[2] = {
          ...updated[2],
          text: `Every day was a fight this school year. You submitted the most assignments on <b>${busiestDayName}!</b>`,
          subtitle: getSubtitle("busiestDay", busiestDayIndex),
        };
        updated[3] = {
          ...updated[3], 
          text: `Most of your assignments were submitted within the hour of <b>${busiestHourLabel}!</b>`,
          subtitle: getSubtitle("busiestHour", hourNum),
        };
        return updated;
      });

      // get most submitted course
      const courses = semester.courses as Record<string, number>;
      const courseEntries = Object.entries(courses).filter(
        ([name]) => name !== "undefined"
      ) as [string, number][];

      let topCourse: string | null = null;

      if (courseEntries.length === 0) {
        // No courses to show, mark this slide for removal
        slidesToRemove.push(4);
      } else {
        // Find top course and update slide
        const [winner, topCount] = courseEntries.reduce((prev, curr) =>
          curr[1] > prev[1] ? curr : prev
        );
        topCourse = winner;
        const safeTopCourse = escapeHtml(winner);

        setSlides((prev) => {
          const updated = [...prev];
          updated[4] = {
            ...updated[4],
            text: `Some classes can be a piece of work. Your most submitted course was <b>${safeTopCourse}</b> with <b>${topCount}</b> submissions!`,
          };
          return updated;
        });
      }

      // get earliest submission
      const earliest = semester.earliestAssignment as {
        name: string;
        timeLeft: number;
      };

      // Check if earliest assignment should be removed (timeLeft === -1)
      if (earliest.timeLeft === -1) {
        slidesToRemove.push(5);
      } else {
        const cleanName = escapeHtml(
          earliest.name
            .replace(/[^\x20-\x7E]/g, "")
            .replace(/\n/g, "")
            .trim(),
        );

        const totalSeconds = earliest.timeLeft;
        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor((totalSeconds % 86400) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        const parts: string[] = [];
        if (days > 0) parts.push(`${days}d`);
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);
        parts.push(`${seconds}s`);

        const timeLabel = parts.join(" ");

        setSlides((prev) => {
          const updated = [...prev];
          updated[5] = {
            ...updated[5],
            text: `Procrastination? Never heard of it. Your earliest assignment was <b>${cleanName}</b>, submitted with <b>${timeLabel}</b> to spare!`,
            subtitle: getSubtitle("earliestAssignment", totalSeconds / 60 / 60),
          };
          return updated;
        });
      }

      // get most procrastinated assignment
      const procrastinated = semester.mostProcrastinatedAssignment as {
        name: string;
        timeLeft: number;
      };

      // Check if procrastinated assignment should be removed (timeLeft === -1)
      if (procrastinated.timeLeft === -1) {
        slidesToRemove.push(6);
      } else {
        const cleanProcrastinatedName = escapeHtml(
          procrastinated.name
            .replace(/[^\x20-\x7E]/g, "")
            .replace(/\n/g, "")
            .trim(),
        );

        const timeLeft = procrastinated.timeLeft;
        if (timeLeft >= 0) {
          // on‑time submission
          const daysP = Math.floor(timeLeft / 86400);
          const hoursP = Math.floor((timeLeft % 86400) / 3600);
          const minsP = Math.floor((timeLeft % 3600) / 60);
          const secsP = timeLeft % 60;
          const partsP: string[] = [];
          if (daysP > 0) partsP.push(`${daysP}d`);
          if (hoursP > 0) partsP.push(`${hoursP}h`);
          if (minsP > 0) partsP.push(`${minsP}m`);
          partsP.push(`${secsP}s`);
          const procrastTimeLabel = partsP.join(" ");

          setSlides((prev) => {
            const updated = [...prev];
            updated[6] = {
              ...updated[6],
              text: `Procrastination happens sometimes. Your most procrastinated assignment was <b>${cleanProcrastinatedName}</b>, submitted with <b>${procrastTimeLabel}</b> to spare!`,
              subtitle: getSubtitle(
                "mostProcrastinatedAssignment",
                timeLeft / 60 / 60
              ),
            };
            return updated;
          });
        } else {
          // late submission
          const lateSec = Math.abs(timeLeft);
          const daysL = Math.floor(lateSec / 86400);
          const hoursL = Math.floor((lateSec % 86400) / 3600);
          const minsL = Math.floor((lateSec % 3600) / 60);
          const secsL = lateSec % 60;
          const partsL: string[] = [];
          if (daysL > 0) partsL.push(`${daysL}d`);
          if (hoursL > 0) partsL.push(`${hoursL}h`);
          if (minsL > 0) partsL.push(`${minsL}m`);
          partsL.push(`${secsL}s`);
          const lateTimeLabel = partsL.join(" ");

          setSlides((prev) => {
            const updated = [...prev];
            updated[6] = {
              ...updated[6],
              text: `Late work happens to all of us. Your most procrastinated assignment was <b>${cleanProcrastinatedName}</b>, submitted <b>${lateTimeLabel}</b> late!`,
              subtitle: getSubtitle(
                "mostProcrastinatedAssignment", 
                -lateSec / 60 / 60
              ),
            };
            return updated;
          });
        }
      }

      // last minute submissions
      const lastMinuteCount = (semester.lastMinuteSubmissions as number) ?? 0;
      setSlides((prev) => {
        const updated = [...prev];
        updated[7] = {
          ...updated[7],
          text: `We all make buzzer beaters sometimes. You made <b>${lastMinuteCount}</b> last‑minute submission${
            lastMinuteCount !== 1 ? "s" : ""
          }.`,
          subtitle: getSubtitle("lastMinuteSubmissions", lastMinuteCount),
        };
        return updated;
      });

      const weekdaySubmissions = (semester.weekdaySubmissions as number) ?? 0;
      const weekendSubmissions = (semester.weekendSubmissions as number) ?? 0;

      setSlides((prev) => {
        const updated = [...prev];
        updated[8] = {
          ...updated[8],
          text: `Some weeks feel way too long. You submitted <b>${weekdaySubmissions}</b> assignments on school days.`,
        };
        updated[9] = {
          ...updated[9],
          text: `Even with no school, you displayed hard work. You submitted <b>${weekendSubmissions}</b> assignments on weekends.`,
        };
        return updated;
      });

      // handle total time watched and format to minutes/seconds
      const timeWatchedSec = (semester.timeWatched as number) ?? 0;
      const mins = Math.floor(timeWatchedSec / 60);
      const secs = timeWatchedSec % 60;
      const formattedWatch = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

      setSlides((prev) => {
        const updated = [...prev];
        updated[10] = {
          ...updated[10],
          text: `Hopefully you enjoyed seeing Bevo on your screen. You spent <b>${formattedWatch}</b> watching Bevo after submissions!`,
        };
        return updated;
      });

      // Now remove slides and update IDs if needed
      if (slidesToRemove.length > 0) {
        setSlides((prev) => {
          // Sort in descending order to remove from the end first
          slidesToRemove.sort((a, b) => b - a);

          // Create a copy of the slides
          const updated = [...prev];

          // Remove the slides
          for (const index of slidesToRemove) {
            updated.splice(index, 1);
          }

          // Update IDs and audioStartTime for all slides
          return updated.map((slide, index) => {
            return {
              ...slide,
              id: index + 1,
              // Keep the first two slides' audio times as they are, adjust the rest
              audioStartTime:
                index <= 1 ? slide.audioStartTime : slideDuration * (index - 1),
            };
          });
        });
      }

      // Build the recap (overview) slide content
      const recapCard = (label: string, value: string) => `
        <span style="display: block; background: rgba(0,0,0,0.45); border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; padding: 12px 14px; text-align: left;">
          <span style="display: block; font-size: 0.65em; opacity: 0.7; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 4px;">${label}</span>
          <span style="display: block; font-size: 1.2em; font-weight: 800; color: #c77d40; line-height: 1.2; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${value}</span>
        </span>
      `;

      const totalSubmissions = weekdaySubmissions + weekendSubmissions;

      const cards: string[] = [
        recapCard("Busiest day", busiestDayName),
        recapCard("Busiest hour", busiestHourLabel),
        recapCard("Total submissions", `${totalSubmissions}`),
        recapCard("Time watched", formattedWatch),
      ];
      if (topCourse) cards.push(recapCard("Top course", escapeHtml(topCourse)));
      cards.push(recapCard("Buzzer beaters", `${lastMinuteCount}`));
      cards.push(recapCard("Weekday submissions", `${weekdaySubmissions}`));
      cards.push(recapCard("Weekend submissions", `${weekendSubmissions}`));

      const recapSubtitle = `
        <span style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; width: 100%; max-width: 320px; margin: 0 auto;">
          ${cards.join("")}
        </span>
      `;

      setSlides((prev) => {
        const updated = [...prev];
        const recapIdx = updated.findIndex((s) => s.text === RECAP_TITLE);
        if (recapIdx === -1) return updated;
        updated[recapIdx] = { ...updated[recapIdx], subtitle: recapSubtitle };
        return updated;
      });
    };

    loadStats();
  }, []);

  useEffect(() => {
    browser.runtime.sendMessage("wrappedland");
  }, []);

  const audioSrc = `${baseURL}/Song.mp3`;

  // Animation variants
  const textAnimations = {
    fadeIn: {
      initial: { opacity: 0 },
      animate: { opacity: 1, transition: { duration: 1 } },
    },
    slideUp: {
      initial: { opacity: 0, y: 50 },
      animate: { opacity: 1, y: 0, transition: { duration: 0.8 } },
    },
    zoomIn: {
      initial: { opacity: 0, scale: 0.8 },
      animate: { opacity: 1, scale: 1, transition: { duration: 0.7 } },
    },
  };

  // Subtitle animation variants - always fade in but with delay
  const subtitleAnimation = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.8, delay: 2 } }, // Delay after main text
  };

  // Reset audio to the current slide's start time
  const resetAudioToSlideStart = () => {
    if (audioRef.current && isPlaying) {
      audioRef.current.currentTime = slides[currentSlide].audioStartTime;
      audioRef.current
        .play()
        .catch((e) => console.error("Audio play error:", e));
    }
  };

  // Handle keyboard events
  const handleKeyDown = (event: KeyboardEvent) => {
    // Only handle keyboard events after initialization
    if (!isInitialized) return;

    if (
      event.code === "Space" ||
      event.key === " " ||
      event.key === "Spacebar"
    ) {
      event.preventDefault(); // Prevent page scrolling
      // Toggle audio playback
      if (audioRef.current) {
        if (audioRef.current.paused) {
          audioRef.current
            .play()
            .catch((e) => console.error("Audio play error:", e));
          setIsPlaying(true);
        } else {
          audioRef.current.pause();
          setIsPlaying(false);
        }
      }
      // Toggle video playback for current slide
      const idx = currentSlideRef.current; // use the ref, not the captured state
      const currentVideo = videoRefs.current[idx];
      if (currentVideo) {
        if (currentVideo.paused) {
          currentVideo
            .play()
            .catch((e) => console.error("Video play error:", e));
        } else {
          currentVideo.pause();
        }
      }
    }
    // Left arrow for previous slide
    else if (event.code === "ArrowLeft") {
      prevSlide();
    }
    // Right arrow for next slide
    else if (event.code === "ArrowRight") {
      nextSlide();
    }
  };

  // Register keyboard event listener
  useEffect(() => {
    if (isInitialized) {
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isInitialized]);

  // Initialize when component mounts
  useEffect(() => {
    // Only initialize audio and video if isInitialized is true
    if (isInitialized) {
      // Initialize the first slide with autoplay
      const initializeAudio = async () => {
        if (audioRef.current) {
          try {
            audioRef.current.currentTime = slides[0].audioStartTime;
            await audioRef.current.play();
            setIsPlaying(true);
          } catch (e) {
            console.error("Audio autoplay error:", e);
            setIsPlaying(false);
          }
        }
      };

      goToSlide(0);
      initializeAudio();
    }

    // Set up audio duration
    if (audioRef.current) {
      audioRef.current.onloadedmetadata = () => {
        if (audioRef.current) {
          setAudioDuration(audioRef.current.duration);
        }
      };
    }

    // Cleanup
    return () => {
      videoRefs.current.forEach((video) => {
        if (video) video.pause();
      });
      if (audioRef.current) audioRef.current.pause();
    };
  }, [isInitialized]); // Added isInitialized as a dependency

  // Update event listeners when currentSlide changes
  useEffect(() => {
    if (!isInitialized) return;
    const currentVideo = videoRefs.current[currentSlide];
    if (currentVideo) {
      const onTimeUpdate = () => {
        if (
          currentVideo.currentTime > currentVideo.duration - 0.1 &&
          currentSlide !== slides.length - 1
        ) {
          resetAudioToSlideStart();
        }
      };
      currentVideo.addEventListener("timeupdate", onTimeUpdate);
      return () => {
        currentVideo.removeEventListener("timeupdate", onTimeUpdate);
      };
    }
  }, [currentSlide, isInitialized]);

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
        src={audioSrc}
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
          <AnimatePresence>
            {!isInitialized && (
              <motion.div
                key="start-button"
                className="absolute inset-x-0 bottom-4 z-50 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 1, delay: 3 } }}
                exit={{ opacity: 0, transition: { duration: 0 } }}
              >
                <Button
                  onClick={initializeCarousel}
                  size="lg"
                  className="rounded-full h-12 w-12 flex items-center justify-center bg-[#BF5700] hover:bg-[#BF5700]/90"
                  aria-label="Start"
                >
                  <Play className="h-8 w-8" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

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
                crossOrigin="anonymous"
                className="object-cover w-full h-full"
                muted
                playsInline
                onEnded={() => {
                  const isLastSlide = index === slides.length - 1;
                  if (isAutoplay && !isLastSlide) {
                    nextSlide();
                  } else {
                    const video = videoRefs.current[index];
                    if (video) {
                      video.currentTime = 0;
                      video
                        .play()
                        .catch((e) => console.error("Video replay error:", e));
                    }
                    if (isPlaying && !isLastSlide) {
                      resetAudioToSlideStart();
                    }
                  }
                }}
              />

              {/* Text Overlay - Centered vertically and horizontally */}
              {currentSlide === index && (
                <AnimatePresence>
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-white text-center">
                    {/* Main Text */}
                    <motion.h2
                      className="text-2xl font-medium drop-shadow-lg mb-3 select-none"
                      initial={
                        textAnimations[
                          slide.textAnimation as keyof typeof textAnimations
                        ].initial
                      }
                      animate={
                        textAnimations[
                          slide.textAnimation as keyof typeof textAnimations
                        ].animate
                      }
                      key={`text-${slide.id}`}
                      dangerouslySetInnerHTML={{ __html: slide.text || "" }}
                    />

                    {slide.subtitle && (
                      <motion.p
                        className="text-base font-normal text-white/90 max-w-xs drop-shadow-lg select-none"
                        initial={subtitleAnimation.initial}
                        animate={subtitleAnimation.animate}
                        key={`subtitle-${slide.id}`}
                        dangerouslySetInnerHTML={{
                          __html: slide.subtitle || "",
                        }}
                      />
                    )}
                  </div>
                </AnimatePresence>
              )}
            </div>
          ))}

          {/* Only show controls after initialization */}
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
                  title={isPlaying ? "[SPACE] Pause" : "[SPACE] Play"}
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
                  title={isMuted ? "Unmute audio" : "Mute audio"}
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
                  title={
                    isAutoplay
                      ? "Disable autoplay between slides"
                      : "Enable autoplay between slides"
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