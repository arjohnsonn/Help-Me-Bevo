import { useEffect, useRef, useCallback } from "react";

export type ButtonType = "assignments" | "quizzes" | "discussions" | "gradescope" | "classroom" | "other";

interface ObservedButton {
  element: HTMLElement;
  type: ButtonType;
}

interface UseButtonObserverOptions {
  enabled: boolean;
  assignments: boolean;
  quizzes: boolean;
  discussions: boolean;
  gradescope: boolean;
  classroom: boolean;
  other: boolean;
  onButtonClick: (type: ButtonType) => void;
}

const submitTexts = ["Submit", "Upload", "Submit & View Submission"];
const classroomText = ["Turn in", "Mark as done"];
const exceptions = [
  "Submit file using Canvas Files",
  "Submit PDF",
  "Submit Images",
];
const blacklisted = ["confirm_unfavorite_course"];

export function useButtonObserver(options: UseButtonObserverOptions) {
  const observedButtons = useRef<Set<HTMLElement>>(new Set());
  const observer = useRef<MutationObserver | null>(null);
  const optionsRef = useRef(options);
  
  // Keep options ref current
  optionsRef.current = options;

  const isSubmitButton = useCallback((
    element: HTMLElement,
    isButton: boolean | null,
    type: ButtonType | null
  ): boolean => {
    if (!element.textContent || element.id === "submit_quiz_button") {
      return false;
    }

    const textContent = element.textContent.trim();

    // Check exceptions
    for (const text of exceptions) {
      if (textContent.includes(text)) {
        return false;
      }
    }

    // Check submit texts
    for (const text of submitTexts) {
      if (type !== "gradescope" && text === "Upload") {
        continue;
      }
      if (textContent.includes(text) && !textContent.includes("Quiz")) {
        return true;
      }
    }

    // Check classroom specific texts
    if (!isButton && optionsRef.current.classroom) {
      for (const text of classroomText) {
        if (textContent === text) {
          return true;
        }
      }
    }

    return false;
  }, []);

  const initButton = useCallback((button: HTMLElement, type: ButtonType) => {
    if (
      button &&
      !observedButtons.current.has(button) &&
      !blacklisted.includes(button.id)
    ) {
      observedButtons.current.add(button);
      console.log(`Help Me Bevo: Initialized ${type} button:`, {
        id: button.id,
        text: button.textContent?.trim(),
        className: button.className
      });
      
      button.addEventListener("click", () => {
        const currentOptions = optionsRef.current;
        console.log(`Help Me Bevo: Button clicked - ${type}:`, {
          id: button.id,
          text: button.textContent?.trim(),
          enabled: currentOptions.enabled,
          typeEnabled: currentOptions[type],
          url: window.location.href
        });
        
        // Check if the specific type is enabled
        if (
          (type === "assignments" && currentOptions.assignments) ||
          (type === "quizzes" && currentOptions.quizzes) ||
          (type === "discussions" && currentOptions.discussions) ||
          (type === "gradescope" && currentOptions.gradescope) ||
          (type === "classroom" && currentOptions.classroom) ||
          (type === "other" && currentOptions.other)
        ) {
          console.log(`Help Me Bevo: Triggering Bevo for ${type}`);
          currentOptions.onButtonClick(type);
        } else {
          console.log(`Help Me Bevo: ${type} is disabled, not triggering Bevo`);
        }
      });
    } else if (observedButtons.current.has(button)) {
      console.log(`Help Me Bevo: Button already observed:`, {
        type,
        id: button.id,
        text: button.textContent?.trim()
      });
    } else if (blacklisted.includes(button.id)) {
      console.log(`Help Me Bevo: Button blacklisted:`, {
        type,
        id: button.id,
        text: button.textContent?.trim()
      });
    }
  }, []);

  const checkElement = useCallback((element: HTMLElement) => {
    // Check for specific button IDs
    if (element.id === "submit-button") {
      console.log("Help Me Bevo: Found assignments submit button by ID:", element.id);
      initButton(element, "assignments");
    } else if (element.id === "submit_quiz_button") {
      console.log("Help Me Bevo: Found quiz submit button by ID:", element.id);
      initButton(element, "quizzes");
    } else if (
      element.parentElement?.classList.contains("discussions-editor-submit")
    ) {
      console.log("Help Me Bevo: Found discussions submit button by parent class");
      initButton(element, "discussions");
    } else if (
      isSubmitButton(element, true, "gradescope") &&
      window.location.href.includes("gradescope")
    ) {
      console.log("Help Me Bevo: Found gradescope submit button:", element.textContent?.trim());
      initButton(element, "gradescope");
    } else if (isSubmitButton(element, true, "other")) {
      console.log("Help Me Bevo: Found other submit button:", element.textContent?.trim());
      initButton(element, "other");
    }
  }, []);

  useEffect(() => {
    if (!options.enabled) {
      console.log("Help Me Bevo: Button observer disabled");
      return;
    }
    
    console.log("Help Me Bevo: Initializing button observer");
    
    // Check for initial buttons
    const submitButton = document.querySelector<HTMLElement>("#submit-button");
    if (submitButton) {
      console.log("Help Me Bevo: Found initial assignments submit button");
      initButton(submitButton, "assignments");
    }

    const quizButton = document.querySelector<HTMLElement>("#submit_quiz_button");
    if (quizButton) {
      console.log("Help Me Bevo: Found initial quiz submit button");
      initButton(quizButton, "quizzes");
    }

    // Set up mutation observer
    const callback: MutationCallback = (mutationList) => {
      for (const mutation of mutationList) {
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node) => {
            if (node instanceof HTMLElement) {
              if (node.nodeName === "BUTTON") {
                checkElement(node);
              } else if (node.nodeType === 1) {
                // Check all buttons within the added element
                const buttons = node.querySelectorAll<HTMLElement>("button");
                if (buttons.length > 0) {
                  console.log(`Help Me Bevo: Found ${buttons.length} new button(s) in DOM`);
                  buttons.forEach(checkElement);
                }

                // Check for div buttons (role="button")
                const buttonDivs = node.querySelectorAll<HTMLElement>('div[role="button"]');
                if (buttonDivs.length > 0) {
                  console.log(`Help Me Bevo: Found ${buttonDivs.length} new div button(s) in DOM`);
                  buttonDivs.forEach((div) => {
                    if (isSubmitButton(div, null, "other")) {
                      console.log("Help Me Bevo: Div element is submit button");
                      initButton(div, "other");
                    }
                  });
                }
              }
            }
          });
        }
      }
    };

    observer.current = new MutationObserver(callback);
    observer.current.observe(document.body, {
      childList: true,
      subtree: true,
    });
    console.log("Help Me Bevo: Mutation observer started");

    return () => {
      console.log("Help Me Bevo: Cleaning up button observer");
      observer.current?.disconnect();
      observedButtons.current.clear();
    };
  }, [options.enabled]);

  return observedButtons.current;
}