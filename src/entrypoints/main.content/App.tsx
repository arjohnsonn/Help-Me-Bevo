import React, { useEffect, useState, useRef, useCallback } from "react";
import ReactDOM from "react-dom/client";
import { createShadowRootUi, type ContentScriptContext } from "#imports";
import { browser } from "wxt/browser";
import VideoOverlay from "@/components/ContentScript/VideoOverlay";
import WrappedPopup from "@/components/ContentScript/WrappedPopup";
import { useButtonObserver, type ButtonType } from "@/hooks/useButtonObserver";
import { 
  getAssignmentName, 
  getCourseName, 
  getDueDate, 
  isValidVideo 
} from "@/lib/content-utils";
import { logStatistics, addWatchTime } from "@/lib/statistics";
import * as storage from "@/lib/storage";

const fullVideoURL = "https://aidenjohnson.dev/Images/BevoCrop.mp4";
const themedVideoURL = "https://aidenjohnson.dev/Images/ThemedBevo.mp4";
const blankVideoURL = "https://aidenjohnson.dev/Images/BlankBevo.mp4";

interface AppProps {
  ctx: ContentScriptContext;
}

const App: React.FC<AppProps> = ({ ctx }) => {
  // Settings state
  const [enabled, setEnabled] = useState(true);
  const [assignments, setAssignments] = useState(true);
  const [quizzes, setQuizzes] = useState(false);
  const [discussions, setDiscussions] = useState(true);
  const [other, setOther] = useState(true);
  const [classroom, setClassroom] = useState(true);
  const [gradescope, setGradescope] = useState(true);
  const [themedAnims, setThemedAnims] = useState(true);
  const [assignmentName, setAssignmentName] = useState(true);
  const [volume, setVolume] = useState(50);
  const [wrappedVisible, setWrappedVisible] = useState(true);

  // UI state
  const [showVideo, setShowVideo] = useState(false);
  const [showWrapped, setShowWrapped] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState(fullVideoURL);
  const [currentAssignmentName, setCurrentAssignmentName] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  
  // Refs for UI components
  const videoUiRef = useRef<any>(null);
  const wrappedUiRef = useRef<any>(null);
  const debugUiRef = useRef<any>(null);
  const watchTimeRef = useRef<number>(0);
  
  // Debug mode
  const [debugMode, setDebugMode] = useState(false);

  // Load settings from storage
  useEffect(() => {
    const loadSettings = async () => {
      const settings = await storage.getAllSettings();
      setEnabled(settings.enabled);
      setAssignments(settings.assignments);
      setQuizzes(settings.quizzes);
      setDiscussions(settings.discussions);
      setOther(settings.other);
      setClassroom(settings.classroom);
      setGradescope(settings.gradescope);
      setThemedAnims(settings.themedAnims);
      setAssignmentName(settings.assignmentName);
      setVolume(settings.volume);
      setWrappedVisible(settings.wrappedPopupVisible_S25);

      // Check if video was playing before reload
      if (settings.playing) {
        const [timestamp, wasPlaying, type] = settings.playing;
        if (wasPlaying && Date.now() / 1000 - timestamp < 4) {
          handleButtonClick(type as ButtonType);
        } else {
          await storage.playing.setValue(null);
        }
      }
      
      // Enable debug mode based on URL parameter or storage
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('bevo-debug') === 'true' || settings.volume === 0) {
        console.log('Help Me Bevo: Debug mode enabled');
        setDebugMode(true);
      }
    };

    loadSettings();
  }, []);

  // Simple unmute on click (like the old implementation)
  useEffect(() => {
    const handleClick = () => {
      if (!playing) return;
      
      // Find video element in shadow root and unmute it
      if (videoUiRef.current) {
        const video = videoUiRef.current.container?.querySelector('video');
        if (video) {
          video.muted = false;
        }
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [playing]);

  // Handle video end
  const handleVideoEnd = useCallback(async () => {
    setShowVideo(false);
    setPlaying(false);
    setCurrentAssignmentName(null);
    
    if (videoUiRef.current) {
      videoUiRef.current.remove();
    }

    // Track watch time
    const watchTime = Date.now() / 1000 - watchTimeRef.current;
    await addWatchTime(watchTime);

    await storage.playing.setValue(null);
  }, []);

  // Handle skip
  const handleSkip = useCallback(() => handleVideoEnd(), [handleVideoEnd]);

  // Handle wrapped popup actions
  const handleWrappedClose = useCallback(() => {
    setShowWrapped(false);
    if (wrappedUiRef.current) {
      wrappedUiRef.current.remove();
    }
  }, []);

  const handleWrappedShow = useCallback(async () => {
    await browser.runtime.sendMessage("wrappedshow");
    await storage.wrappedPopupVisible_S25.setValue(false);
    
    // Send message to background script to open the wrapped page
    // This avoids shadow DOM restrictions
    await browser.runtime.sendMessage("openWrapped");
    
    handleWrappedClose();
  }, [handleWrappedClose]);

  const handleWrappedHide = useCallback(async () => {
    await storage.wrappedPopupVisible_S25.setValue(false);
    handleWrappedClose();
  }, [handleWrappedClose]);

  // Handle button clicks
  const handleButtonClick = useCallback(async (type: ButtonType) => {
    if (!enabled || playing) return;

    // Check if specific type is enabled
    if (
      (type === "assignments" && !assignments) ||
      (type === "quizzes" && !quizzes) ||
      (type === "discussions" && !discussions) ||
      (type === "gradescope" && !gradescope) ||
      (type === "classroom" && !classroom) ||
      (type === "other" && !other)
    ) {
      return;
    }

    const assignmentNameStr = getAssignmentName(type);
    const courseName = getCourseName(type);
    const dueDate = getDueDate(type);

    // Determine video URL
    let videoUrl = fullVideoURL;
    if (themedAnims) {
      const isValid = await isValidVideo(themedVideoURL);
      if (isValid) {
        videoUrl = themedVideoURL;
      } else if (assignmentNameStr && assignmentName) {
        videoUrl = blankVideoURL;
        setCurrentAssignmentName(assignmentNameStr);
      }
    }

    setCurrentVideoUrl(videoUrl);
    setPlaying(true);
    setShowVideo(true);
    watchTimeRef.current = Date.now() / 1000;

    // Save playing state
    await storage.playing.setValue([Date.now() / 1000, true, type]);

    // Mount the video UI
    if (videoUiRef.current) {
      videoUiRef.current.mount();
    }

    // Log statistics
    await logStatistics(type, assignmentNameStr, courseName, dueDate);

    // Update stats
    switch (type) {
      case "assignments":
        const assignmentsValue = await storage.statsAssignments.getValue();
        await storage.statsAssignments.setValue(assignmentsValue + 1);
        break;
      case "quizzes":
        const quizzesValue = await storage.statsQuizzes.getValue();
        await storage.statsQuizzes.setValue(quizzesValue + 1);
        break;
      case "discussions":
        const discussionsValue = await storage.statsDiscussions.getValue();
        await storage.statsDiscussions.setValue(discussionsValue + 1);
        break;
      case "gradescope":
        const gradescopeValue = await storage.statsGradescope.getValue();
        await storage.statsGradescope.setValue(gradescopeValue + 1);
        break;
      case "classroom":
        const classroomValue = await storage.statsClassroom.getValue();
        await storage.statsClassroom.setValue(classroomValue + 1);
        break;
      case "other":
        const otherValue = await storage.statsOther.getValue();
        await storage.statsOther.setValue(otherValue + 1);
        break;
    }

    // Update total stats
    const totalValue = await storage.statsTotal.getValue();
    await storage.statsTotal.setValue(totalValue + 1);

    // Send analytics
    await browser.runtime.sendMessage(type);
    await browser.runtime.sendMessage("bevo");
  }, [enabled, playing, assignments, quizzes, discussions, gradescope, classroom, other, themedAnims, assignmentName]);

  // Create video overlay UI
  useEffect(() => {
    const createVideoUi = async () => {
      const ui = await createShadowRootUi(ctx, {
        name: "help-me-bevo-video",
        position: "overlay",
        onMount: (container) => {
          const root = ReactDOM.createRoot(container);
          root.render(
            <VideoOverlay
              videoUrl={currentVideoUrl}
              assignmentName={currentAssignmentName}
              volume={volume}
              showAssignmentName={assignmentName && !!currentAssignmentName}
              onVideoEnd={handleVideoEnd}
              onSkip={handleSkip}
            />
          );
        },
      });
      
      videoUiRef.current = ui;
    };

    createVideoUi();

    return () => {
      videoUiRef.current?.remove();
    };
  }, [ctx, currentVideoUrl, currentAssignmentName, volume, assignmentName, handleVideoEnd, handleSkip]);

  // Create wrapped popup UI
  useEffect(() => {
    const createWrappedUi = async () => {
      if (!wrappedVisible) return;

      // Check feature flags
      try {
        const res = await fetch("https://www.aidenjohnson.dev/api/help-me-bevo-fflags");
        const flags = await res.json();
        
        // Hard code bypass for testing
        if (flags.Wrapped || (volume === 0 && !themedAnims && !other)) {
          const ui = await createShadowRootUi(ctx, {
            name: "help-me-bevo-wrapped",
            position: "inline",
            anchor: "body",
            append: "last",
            onMount: (container) => {
              const root = ReactDOM.createRoot(container);
              root.render(
                <WrappedPopup
                  onShowClick={handleWrappedShow}
                  onHideClick={handleWrappedHide}
                  onClose={handleWrappedClose}
                />
              );
            },
          });
          
          wrappedUiRef.current = ui;
          setShowWrapped(true);
          ui.mount();
        }
      } catch (err) {
        console.error("Error fetching feature flags:", err);
      }
    };

    createWrappedUi();

    return () => {
      wrappedUiRef.current?.remove();
    };
  }, [ctx, wrappedVisible, volume, themedAnims, other, handleWrappedShow, handleWrappedHide, handleWrappedClose]);

  // Create debug button UI
  useEffect(() => {
    const createDebugUi = async () => {
      if (!debugMode) {
        console.log('Help Me Bevo: Debug mode is off, not creating debug button');
        return;
      }

      console.log('Help Me Bevo: Creating debug button');
      const ui = await createShadowRootUi(ctx, {
        name: "help-me-bevo-debug",
        position: "inline",
        anchor: "body",
        append: "last",
        onMount: (container) => {
          // Create debug button
          const button = document.createElement("button");
          button.textContent = "🤘 Trigger Bevo";
          button.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            z-index: 99999;
            background: #bf5700;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            font-weight: bold;
            cursor: pointer;
            font-family: system-ui, -apple-system, sans-serif;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
          `;
          
          button.addEventListener("mouseenter", () => {
            button.style.background = "#ff8c00";
          });
          
          button.addEventListener("mouseleave", () => {
            button.style.background = "#bf5700";
          });
          
          button.addEventListener("click", () => {
            console.log('Help Me Bevo: Debug button clicked');
            handleButtonClick("assignments");
          });
          
          container.appendChild(button);
          console.log('Help Me Bevo: Debug button mounted');
        },
      });
      
      debugUiRef.current = ui;
      ui.mount();
    };

    createDebugUi();

    return () => {
      debugUiRef.current?.remove();
    };
  }, [ctx, debugMode, handleButtonClick]);

  // Use button observer hook
  useButtonObserver({
    enabled,
    assignments,
    quizzes,
    discussions,
    gradescope,
    classroom,
    other,
    onButtonClick: handleButtonClick,
  });

  // Listen for messages from popup
  useEffect(() => {
    const handleMessage = async (request: any) => {
      if (!request) return;

      const [action, ...params] = request;

      switch (action) {
        case "play":
          handleButtonClick(params[0] as ButtonType);
          break;
        case "updateVolume":
          setVolume(params[0]);
          await storage.volume.setValue(params[0]);
          break;
        case "toggle":
          setEnabled(params[0]);
          await storage.enabled.setValue(params[0]);
          break;
        case "changeValue":
          const [variable, value] = params;
          switch (variable) {
            case "assignments":
              setAssignments(value);
              await storage.assignments.setValue(value);
              break;
            case "quizzes":
              setQuizzes(value);
              await storage.quizzes.setValue(value);
              break;
            case "discussions":
              setDiscussions(value);
              await storage.discussions.setValue(value);
              break;
            case "other":
              setOther(value);
              await storage.other.setValue(value);
              break;
            case "classroom":
              setClassroom(value);
              await storage.classroom.setValue(value);
              break;
            case "gradescope":
              setGradescope(value);
              await storage.gradescope.setValue(value);
              break;
            case "themedAnims":
              setThemedAnims(value);
              await storage.themedAnims.setValue(value);
              break;
            case "assignmentName":
              setAssignmentName(value);
              await storage.assignmentName.setValue(value);
              break;
          }
          break;
      }
    };

    browser.runtime.onMessage.addListener(handleMessage);
    return () => {
      browser.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  // Listen for debug keyboard shortcut (Ctrl/Cmd + Shift + B)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'B') {
        e.preventDefault();
        setDebugMode(prev => !prev);
        console.log(`Debug mode ${!debugMode ? 'enabled' : 'disabled'}`);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [debugMode]);

  // This component doesn't render anything visible
  return null;
};

export default App;
