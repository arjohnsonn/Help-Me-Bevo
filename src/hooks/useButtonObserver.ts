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

    for (const text of exceptions) {
      if (textContent.includes(text)) {
        return false;
      }
    }

    for (const text of submitTexts) {
      if (type !== "gradescope" && text === "Upload") {
        continue;
      }
      if (textContent.includes(text) && !textContent.includes("Quiz")) {
        return true;
      }
    }

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
      
      button.addEventListener("click", () => {
        const currentOptions = optionsRef.current;
        
        if (
          (type === "assignments" && currentOptions.assignments) ||
          (type === "quizzes" && currentOptions.quizzes) ||
          (type === "discussions" && currentOptions.discussions) ||
          (type === "gradescope" && currentOptions.gradescope) ||
          (type === "classroom" && currentOptions.classroom) ||
          (type === "other" && currentOptions.other)
        ) {
          currentOptions.onButtonClick(type);
        } else {
        }
      });
    } else if (observedButtons.current.has(button)) {
    } else if (blacklisted.includes(button.id)) {
    }
  }, []);

  const checkElement = useCallback((element: HTMLElement) => {
      if (element.id === "submit-button") {
      initButton(element, "assignments");
    } else if (element.id === "submit_quiz_button") {
      initButton(element, "quizzes");
    } else if (
      element.parentElement?.classList.contains("discussions-editor-submit")
    ) {
      initButton(element, "discussions");
    } else if (
      isSubmitButton(element, true, "gradescope") &&
      window.location.href.includes("gradescope")
    ) {
      initButton(element, "gradescope");
    } else if (isSubmitButton(element, true, "other")) {
      initButton(element, "other");
    }
  }, []);

  useEffect(() => {
    if (!options.enabled) {
      return;
    }
    
    
    const submitButton = document.querySelector<HTMLElement>("#submit-button");
    if (submitButton) {
      initButton(submitButton, "assignments");
    }

    const quizButton = document.querySelector<HTMLElement>("#submit_quiz_button");
    if (quizButton) {
      initButton(quizButton, "quizzes");
    }

    const callback: MutationCallback = (mutationList) => {
      for (const mutation of mutationList) {
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node) => {
            if (node instanceof HTMLElement) {
              if (node.nodeName === "BUTTON") {
                checkElement(node);
              } else if (node.nodeType === 1) {
                const buttons = node.querySelectorAll<HTMLElement>("button");
                if (buttons.length > 0) {
                  buttons.forEach(checkElement);
                }

                const buttonDivs = node.querySelectorAll<HTMLElement>('div[role="button"]');
                if (buttonDivs.length > 0) {
                  buttonDivs.forEach((div) => {
                    if (isSubmitButton(div, null, "other")) {
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

    return () => {
      observer.current?.disconnect();
      observedButtons.current.clear();
    };
  }, [options.enabled]);

  return observedButtons.current;
}