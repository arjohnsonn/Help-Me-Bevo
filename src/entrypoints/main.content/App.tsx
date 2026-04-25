import React, { useEffect, useState, useRef } from "react";
import ReactDOM from "react-dom/client";
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
import { type ContentScriptContext, createShadowRootUi } from "#imports";

const fullVideoURL = "https://aidenjohnson.dev/Images/BevoCrop.mp4";
const themedVideoURL = "https://aidenjohnson.dev/Images/ThemedBevo.mp4";
const blankVideoURL = "https://aidenjohnson.dev/Images/BlankBevo.mp4";

const debug = false;
const DEBUG_ASSIGNMENT_NAME = "";
const CURRENT_SEMESTER = "FALL_2025";

interface AppProps {
  ctx: ContentScriptContext;
}

export default function App({ ctx }: AppProps) {
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

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState(fullVideoURL);
  const [currentAssignmentName, setCurrentAssignmentName] = useState<
    string | null
  >(null);
  const [watchTime, setWatchTime] = useState(0);

  const [stats, setStats] = useState({
    total: 0,
    assignments: 0,
    quizzes: 0,
    discussions: 0,
    other: 0,
    classroom: 0,
    gradescope: 0,
  });

  const [showWrappedPopup, setShowWrappedPopup] = useState(false);
  const personalStatsRef = useRef<storage.PersonalStats | null>(null);
  const watchTimeStartRef = useRef(0);
  const wrappedPopupUiRef = useRef<any>(null);

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

      const playingState = allSettings.playing;
      if (playingState) {
        const [timestamp, wasPlaying, type] = playingState;
        const timeDiff = Date.now() / 1000 - timestamp;

        if (wasPlaying && timeDiff < 4) {
          const resumeVideo = async () => {
            if (!allSettings.enabled) return;
            if (type === "assignments" && !allSettings.assignments) return;
            if (type === "quizzes" && !allSettings.quizzes) return;
            if (type === "discussions" && !allSettings.discussions) return;
            if (type === "gradescope" && !allSettings.gradescope) return;
            if (type === "classroom" && !allSettings.classroom) return;
            if (type === "other" && !allSettings.other) return;

            const assignmentName = getAssignmentName(type as ButtonType);
            let videoUrl = fullVideoURL;
            let displayAssignmentName = assignmentName;

            if (allSettings.themedAnims) {
              const isValid = await isValidVideo(themedVideoURL);
              if (isValid) {
                videoUrl = themedVideoURL;
                displayAssignmentName = null;
              } else {
                videoUrl = blankVideoURL;
                if (assignmentName && allSettings.assignmentName) {
                  displayAssignmentName = assignmentName;
                } else {
                  displayAssignmentName = null;
                }
              }
            } else if (allSettings.assignmentName && assignmentName) {
              videoUrl = blankVideoURL;
              displayAssignmentName = assignmentName;
            } else {
              displayAssignmentName = null;
            }

            setCurrentVideoUrl(videoUrl);
            setCurrentAssignmentName(displayAssignmentName);
            setIsPlaying(true);
            setWatchTime(Date.now() / 1000);
            watchTimeStartRef.current = Date.now() / 1000;
          };

          setTimeout(resumeVideo, 100);
        } else if (wasPlaying) {
          await storage.setSetting("playing", null);
        }
      }

      if (allSettings.wrappedPopupVisible_S26) {
        checkWrappedFeatureFlag();
      }
    };

    loadData();
  }, []);

  const checkWrappedFeatureFlag = async () => {
    try {
      const response = await fetch(
        "https://www.aidenjohnson.dev/api/help-me-bevo-fflags",
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const flags = await response.json();
      if (
        flags.Wrapped ||
        (settings.volume === 0 && !settings.themedAnims && !settings.other)
      ) {
        setShowWrappedPopup(true);
      }
    } catch (err) {}
  };

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
    let displayAssignmentName = assignmentName;

    if (settings.themedAnims) {
      const isValid = await isValidVideo(themedVideoURL);
      if (isValid) {
        videoUrl = themedVideoURL;
        displayAssignmentName = null;
      } else {
        videoUrl = blankVideoURL;
        if (assignmentName && settings.assignmentName) {
          displayAssignmentName = assignmentName;
        } else {
          displayAssignmentName = null;
        }
      }
    } else if (settings.assignmentName && assignmentName) {
      videoUrl = blankVideoURL;
      displayAssignmentName = assignmentName;
    } else {
      displayAssignmentName = null;
    }

    setCurrentVideoUrl(videoUrl);
    setCurrentAssignmentName(displayAssignmentName);
    setIsPlaying(true);
    setWatchTime(Date.now() / 1000);
    watchTimeStartRef.current = Date.now() / 1000;

    const playingStateData = [Date.now() / 1000, true, type];

    await storage.setSetting("playing", playingStateData);

    if (!skipAnalytics) {
      logStatistics(type);
      sendAnalytic("bevo");
      sendAnalytic(type);

      const newStats = { ...stats };
      newStats.total++;
      newStats[type as keyof typeof stats]++;
      setStats(newStats);

      await storage.setSetting("stats-total", newStats.total);
      await storage.setSetting(
        `stats-${type}`,
        newStats[type as keyof typeof stats],
      );
    }
  };

  const handleVideoEnd = async () => {
    setIsPlaying(false);
    setCurrentAssignmentName(null);

    const watchDuration = Date.now() / 1000 - watchTimeStartRef.current;
    if (personalStatsRef.current) {
      ensureSemesterExists(personalStatsRef.current, CURRENT_SEMESTER);

      personalStatsRef.current[CURRENT_SEMESTER].timeWatched += Math.floor(
        watchDuration + 0.5,
      );
      await storage.setSetting("personalStats", personalStatsRef.current);
    }

    const clearPlayingStateData = [Date.now() / 1000, false, null];

    await storage.setSetting("playing", clearPlayingStateData);
  };

  const ensureSemesterExists = (
    personalStats: storage.PersonalStats,
    semester: string,
  ) => {
    if (!personalStats[semester]) {
      personalStats[semester] = {
        busiestHour: {},
        busiestDay: {},
        weekendSubmissions: 0,
        weekdaySubmissions: 0,
        courses: {},
        timeWatched: 0,
        lastMinuteSubmissions: 0,
        mostProcrastinatedAssignment: {
          name: "",
          timeLeft: -1,
        },
        earliestAssignment: {
          name: "",
          timeLeft: -1,
        },
      };
    }
  };

  const logStatistics = async (type: ButtonType) => {
    if (!personalStatsRef.current) return;

    ensureSemesterExists(personalStatsRef.current, CURRENT_SEMESTER);

    const stats = personalStatsRef.current[CURRENT_SEMESTER];
    const now = new Date();

    const dayOfWeek = now.getDay();
    stats.busiestDay[dayOfWeek] = (stats.busiestDay[dayOfWeek] ?? 0) + 1;

    const hour = now.getHours();
    stats.busiestHour[hour] = (stats.busiestHour[hour] ?? 0) + 1;

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      stats.weekendSubmissions++;
    } else {
      stats.weekdaySubmissions++;
    }

    const courseName = getCourseName(type);
    if (courseName) {
      stats.courses[courseName] = (stats.courses[courseName] ?? 0) + 1;
    }

    const dueDate = getDueDate(type);
    if (dueDate) {
      const timeLeft = dueDate - Math.floor(Date.now() / 1000);

      if (timeLeft < 30 * 60) {
        stats.lastMinuteSubmissions++;
      }

      const assignmentName = getAssignmentName(type);
      if (assignmentName) {
        if (
          stats.mostProcrastinatedAssignment.timeLeft === -1 ||
          timeLeft < stats.mostProcrastinatedAssignment.timeLeft
        ) {
          stats.mostProcrastinatedAssignment = {
            name: assignmentName,
            timeLeft: timeLeft,
          };
        }

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
  };

  const sendAnalytic = (data: string) => {
    browser.runtime.sendMessage(data);
  };

  useEffect(() => {
    const listenerFuncs = {
      play: (request: any) => handleDisplayBevo(request[1], false),
      updateVolume: (request: any) => updateVolume(request),
      toggle: (request: any) => toggle(request),
      changeValue: (request: any) => changeValue(request),
    };

    const messageListener = (request: any) => {
      if (request == null) return;

      const action = request[0] as keyof typeof listenerFuncs;
      if (listenerFuncs[action]) {
        listenerFuncs[action](request);
      }
    };

    browser.runtime.onMessage.addListener(messageListener);
    return () => browser.runtime.onMessage.removeListener(messageListener);
  }, []);

  function changeValue(data: [string, string, boolean | string | number]) {
    const variable = data[1];
    const value = data[2];

    switch (variable) {
      case "assignments":
        setSettings((prev) => ({ ...prev, assignments: value as boolean }));
        break;
      case "quizzes":
        setSettings((prev) => ({ ...prev, quizzes: value as boolean }));
        break;
      case "discussions":
        setSettings((prev) => ({ ...prev, discussions: value as boolean }));
        break;
      case "other":
        setSettings((prev) => ({ ...prev, other: value as boolean }));
        break;
      case "classroom":
        setSettings((prev) => ({ ...prev, classroom: value as boolean }));
        break;
      case "gradescope":
        setSettings((prev) => ({ ...prev, gradescope: value as boolean }));
        break;
      case "themedAnims":
        setSettings((prev) => ({ ...prev, themedAnims: value as boolean }));
        break;
      case "assignmentName":
        setSettings((prev) => ({ ...prev, assignmentName: value as boolean }));
        break;
    }
  }

  function updateVolume(data: [null, number]) {
    const volume = data[1];
    setSettings((prev) => ({ ...prev, volume }));
  }

  function toggle(data: [null, boolean]) {
    const enabled = data[1];
    setSettings((prev) => ({ ...prev, enabled }));
  }

  const handleWrappedShow = async () => {
    sendAnalytic("wrappedshow");
    await storage.setSetting("wrappedPopupVisible_S26", false);
    setShowWrappedPopup(false);
    if (wrappedPopupUiRef.current) {
      wrappedPopupUiRef.current.remove();
      wrappedPopupUiRef.current = null;
    }
    browser.runtime.sendMessage("openWrapped");
  };

  const handleWrappedHide = async () => {
    await storage.setSetting("wrappedPopupVisible_S26", false);
    setShowWrappedPopup(false);
    if (wrappedPopupUiRef.current) {
      wrappedPopupUiRef.current.remove();
      wrappedPopupUiRef.current = null;
    }
  };

  const handleWrappedClose = () => {
    setShowWrappedPopup(false);
    if (wrappedPopupUiRef.current) {
      wrappedPopupUiRef.current.remove();
      wrappedPopupUiRef.current = null;
    }
  };

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

  useEffect(() => {
    const createWrappedPopup = async () => {
      if (showWrappedPopup && !wrappedPopupUiRef.current) {
        const ui = await createShadowRootUi(ctx, {
          name: "wrapped-popup",
          position: "inline",
          anchor: "body",
          onMount: (container) => {
            // Create a wrapper div to avoid React warnings
            const app = document.createElement("div");
            container.append(app);

            const root = ReactDOM.createRoot(app);
            root.render(
              <WrappedPopup
                onShowClick={handleWrappedShow}
                onHideClick={handleWrappedHide}
                onClose={handleWrappedClose}
              />,
            );
            return root;
          },
          onRemove: (root) => {
            root?.unmount();
          },
        });

        wrappedPopupUiRef.current = ui;
        ui.mount();
      } else if (!showWrappedPopup && wrappedPopupUiRef.current) {
        wrappedPopupUiRef.current.remove();
        wrappedPopupUiRef.current = null;
      }
    };

    createWrappedPopup();
  }, [showWrappedPopup]);

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
    </>
  );
}
