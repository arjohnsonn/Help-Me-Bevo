import React, { useEffect, useState, useRef } from "react";
import VideoOverlay from "../../components/ContentScript/VideoOverlay";
import WrappedPopup from "../../components/ContentScript/WrappedPopup";
import { useButtonObserver, ButtonType } from "../../hooks/useButtonObserver";
import {
  getAssignmentName,
  getCourseName,
  getDueDate,
  isValidVideo,
} from "../../lib/content-utils";
import * as storage from "../../lib/storage";
import { browser } from "wxt/browser";
import { type ContentScriptContext } from "#imports";

// Video URLs
const fullVideoURL = "https://aidenjohnson.dev/Images/BevoCrop.mp4";
const themedVideoURL = "https://aidenjohnson.dev/Images/ThemedBevo.mp4";
const blankVideoURL = "https://aidenjohnson.dev/Images/BlankBevo.mp4";

// Debug settings
const debug = false;
const DEBUG_ASSIGNMENT_NAME = "";
const SEMESTER = "FALL_2025";

interface AppProps {
  ctx: ContentScriptContext;
}

export default function App({ ctx }: AppProps) {
  // State for all settings
  const [settings, setSettings] = useState({
    enabled: true,
    assignmentName: true,
    assignments: true,
    quizzes: false,
    discussions: true,
    other: true,
    classroom: true,
    gradescope: true,
    themedAnims: true,
    volume: 50,
  });

  // Video playing state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState(fullVideoURL);
  const [currentAssignmentName, setCurrentAssignmentName] = useState<
    string | null
  >(null);
  const [watchTime, setWatchTime] = useState(0);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    assignments: 0,
    quizzes: 0,
    discussions: 0,
    other: 0,
    classroom: 0,
    gradescope: 0,
  });

  // Wrapped popup state
  const [showWrappedPopup, setShowWrappedPopup] = useState(false);

  // Refs for persistent state
  const personalStatsRef = useRef<storage.PersonalStats | null>(null);
  const watchTimeStartRef = useRef(0);

  // Load settings and stats on mount
  useEffect(() => {
    const loadData = async () => {
      const allSettings = await storage.getAllSettings();

      setSettings({
        enabled: allSettings.enabled,
        assignmentName: allSettings.assignmentName,
        assignments: allSettings.assignments,
        quizzes: allSettings.quizzes,
        discussions: allSettings.discussions,
        other: allSettings.other,
        classroom: allSettings.classroom,
        gradescope: allSettings.gradescope,
        themedAnims: allSettings.themedAnims,
        volume: allSettings.volume,
      });

      setStats({
        total: allSettings["stats-total"],
        assignments: allSettings["stats-assignments"],
        quizzes: allSettings["stats-quizzes"],
        discussions: allSettings["stats-discussions"],
        other: allSettings["stats-other"],
        classroom: allSettings["stats-classroom"],
        gradescope: allSettings["stats-gradescope"],
      });

      personalStatsRef.current = allSettings.personalStats;

      // Check for resumed playing state
      const playingState = allSettings.playing;
      if (playingState) {
        const [timestamp, wasPlaying, type] = playingState;
        if (wasPlaying && Date.now() / 1000 - timestamp < 4) {
          handleDisplayBevo(type as ButtonType, true);
        } else if (wasPlaying) {
          await storage.setSetting("playing", null);
        }
      }

      // Check wrapped popup visibility
      if (allSettings.wrappedPopupVisible_S25) {
        checkWrappedFeatureFlag();
      }
    };

    loadData();
    console.log("Help Me Bevo: content.js loaded");
  }, []);

  const checkWrappedFeatureFlag = async () => {
    try {
      const response = await fetch(
        "https://www.aidenjohnson.dev/api/help-me-bevo-fflags",
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const flags = await response.json();
      // Hard code bypass for testing purposes
      if (
        flags.Wrapped ||
        (settings.volume === 0 && !settings.themedAnims && !settings.other)
      ) {
        setShowWrappedPopup(true);
      }
    } catch (err) {
      console.error("Error fetching feature flags:", err);
    }
  };

  // Handle Bevo display when button is clicked
  const handleDisplayBevo = async (
    type: ButtonType,
    skipAnalytics: boolean = false,
  ) => {
    if (!settings.enabled || isPlaying) return;
    if (type === "assignments" && !settings.assignments) return;
    if (type === "quizzes" && !settings.quizzes) return;
    if (type === "discussions" && !settings.discussions) return;
    if (type === "gradescope" && !settings.gradescope) return;
    if (type === "classroom" && !settings.classroom) return;
    if (type === "other" && !settings.other) return;

    const assignmentName = getAssignmentName(type);
    let videoUrl = fullVideoURL;

    if (settings.themedAnims) {
      const isValid = await isValidVideo(themedVideoURL);
      if (isValid) {
        videoUrl = themedVideoURL;
      } else if (assignmentName && settings.assignmentName) {
        videoUrl = blankVideoURL;
        setCurrentAssignmentName(assignmentName);
      }
      console.log("Themed video " + (isValid ? "exists" : "doesn't exist"));
    }

    setCurrentVideoUrl(videoUrl);
    setCurrentAssignmentName(assignmentName);
    setIsPlaying(true);
    setWatchTime(Date.now() / 1000);
    watchTimeStartRef.current = Date.now() / 1000;

    // Save playing state
    await storage.setSetting("playing", [Date.now() / 1000, true, type]);

    if (!skipAnalytics) {
      logStatistics(type);
      // Send analytics
      sendAnalytic("bevo");
      sendAnalytic(type);

      // Update stats
      const newStats = { ...stats };
      newStats.total++;
      newStats[type as keyof typeof stats]++;
      setStats(newStats);

      // Save stats
      await storage.setSetting("stats-total", newStats.total);
      await storage.setSetting(
        `stats-${type}`,
        newStats[type as keyof typeof stats],
      );
    }
  };

  // Handle video end or skip
  const handleVideoEnd = async () => {
    setIsPlaying(false);
    setCurrentAssignmentName(null);

    // Calculate watch time
    const watchDuration = Date.now() / 1000 - watchTimeStartRef.current;
    if (personalStatsRef.current) {
      personalStatsRef.current[SEMESTER].timeWatched += Math.floor(
        watchDuration + 0.5,
      );
      await storage.setSetting("personalStats", personalStatsRef.current);
    }

    await storage.setSetting("playing", [Date.now() / 1000, false, null]);
  };

  // Log statistics for wrapped
  const logStatistics = async (type: ButtonType) => {
    if (!personalStatsRef.current) return;

    const stats = personalStatsRef.current[SEMESTER];
    const now = new Date();

    // Busiest Day
    const dayOfWeek = now.getDay();
    stats.busiestDay[dayOfWeek] = (stats.busiestDay[dayOfWeek] ?? 0) + 1;

    // Busiest Hour
    const hour = now.getHours();
    stats.busiestHour[hour] = (stats.busiestHour[hour] ?? 0) + 1;

    // Weekend & Weekday Submissions
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      stats.weekendSubmissions++;
    } else {
      stats.weekdaySubmissions++;
    }

    // Courses
    const courseName = getCourseName(type);
    if (courseName) {
      stats.courses[courseName] = (stats.courses[courseName] ?? 0) + 1;
    }

    // Last Minute Submissions & Assignment tracking
    const dueDate = getDueDate(type);
    if (dueDate) {
      const timeLeft = dueDate - Math.floor(Date.now() / 1000);

      if (timeLeft < 30 * 60) {
        // 30 minutes til due
        stats.lastMinuteSubmissions++;
      }

      const assignmentName = getAssignmentName(type);
      if (assignmentName) {
        // Most Procrastinated Assignment
        if (
          stats.mostProcrastinatedAssignment.timeLeft === -1 ||
          timeLeft < stats.mostProcrastinatedAssignment.timeLeft
        ) {
          stats.mostProcrastinatedAssignment = {
            name: assignmentName,
            timeLeft: timeLeft,
          };
        }

        // Earliest Assignment
        if (
          stats.earliestAssignment.timeLeft === -1 ||
          timeLeft > stats.earliestAssignment.timeLeft
        ) {
          stats.earliestAssignment = {
            name: assignmentName,
            timeLeft: timeLeft,
          };
        }
      }
    }

    await storage.setSetting("personalStats", personalStatsRef.current);
    console.log(personalStatsRef.current);
  };

  // Send analytics to background script
  const sendAnalytic = (data: string) => {
    browser.runtime.sendMessage(data);
  };

  // Message listener for popup communication
  useEffect(() => {
    const messageListener = (request: any) => {
      if (!request) return;

      const action = request[0];
      const data = request.slice(1);

      switch (action) {
        case "play":
          handleDisplayBevo(data[0], false);
          break;
        case "updateVolume":
          setSettings((prev) => ({ ...prev, volume: data[0] }));
          break;
        case "toggle":
          setSettings((prev) => ({ ...prev, enabled: data[0] }));
          break;
        case "changeValue":
          const [, variable, value] = request;
          setSettings((prev) => ({ ...prev, [variable]: value }));
          break;
      }
    };

    browser.runtime.onMessage.addListener(messageListener);
    return () => browser.runtime.onMessage.removeListener(messageListener);
  }, []);

  // Handle wrapped popup actions
  const handleWrappedShow = async () => {
    sendAnalytic("wrappedshow");
    await storage.setSetting("wrappedPopupVisible_S25", false);
    setShowWrappedPopup(false);
    // Open wrapped page
    browser.runtime.sendMessage({ action: "openWrapped" });
  };

  const handleWrappedHide = async () => {
    await storage.setSetting("wrappedPopupVisible_S25", false);
    setShowWrappedPopup(false);
  };

  // Button observer to detect submit buttons
  useButtonObserver({
    enabled: settings.enabled,
    assignments: settings.assignments,
    quizzes: settings.quizzes,
    discussions: settings.discussions,
    gradescope: settings.gradescope,
    classroom: settings.classroom,
    other: settings.other,
    onButtonClick: (type: ButtonType) => handleDisplayBevo(type, false),
  });

  return (
    <>
      {isPlaying && (
        <VideoOverlay
          ctx={ctx}
          videoUrl={currentVideoUrl}
          assignmentName={currentAssignmentName}
          volume={settings.volume}
          onVideoEnd={handleVideoEnd}
          onSkip={handleVideoEnd}
          showAssignmentName={settings.assignmentName}
          textHideTimeout={1.5}
        />
      )}

      {showWrappedPopup && (
        <WrappedPopup
          onShowClick={handleWrappedShow}
          onHideClick={handleWrappedHide}
          onClose={() => setShowWrappedPopup(false)}
        />
      )}
    </>
  );
}
