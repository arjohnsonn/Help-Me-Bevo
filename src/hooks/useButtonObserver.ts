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
      if (textContent.includes(text)) return false;
    }

    // Check submit texts
    for (const text of submitTexts) {
      if (type !== "gradescope" && text === "Upload") continue;
      if (textContent.includes(text) && !textContent.includes("Quiz")) {
        return true;
      }
    }

    // Check classroom specific texts
    if (!isButton && options.classroom) {
      for (const text of classroomText) {
        if (textContent === text) return true;
      }
    }

    return false;
  }, [options.classroom]);

  const initButton = useCallback((button: HTMLElement, type: ButtonType) => {
    if (
      button &&
      !observedButtons.current.has(button) &&
      !blacklisted.includes(button.id)
    ) {
      observedButtons.current.add(button);
      
      button.addEventListener("click", () => {
        // Check if the specific type is enabled
        if (
          (type === "assignments" && options.assignments) ||
          (type === "quizzes" && options.quizzes) ||
          (type === "discussions" && options.discussions) ||
          (type === "gradescope" && options.gradescope) ||
          (type === "classroom" && options.classroom) ||
          (type === "other" && options.other)
        ) {
          options.onButtonClick(type);
        }
      });
    }
  }, [options]);

  const checkElement = useCallback((element: HTMLElement) => {
    // Check for specific button IDs
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
  }, [initButton, isSubmitButton]);

  useEffect(() => {
    if (!options.enabled) return;

    // Check for initial buttons
    // Regular assignments
    const submitButton = document.querySelector<HTMLElement>("#submit-button");
    if (submitButton) {
      initButton(submitButton, "assignments");
    }

    // Quizzes
    const quizButton = document.querySelector<HTMLElement>("#submit_quiz_button");
    if (quizButton) {
      initButton(quizButton, "quizzes");
    }

    // Set up mutation observer
    const callback: MutationCallback = (mutationList) => {
      for (const mutation of mutationList) {
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach((node) => {
            if (node instanceof HTMLElement) {
              if (node.nodeName === "BUTTON") {
                checkElement(node);
              } else if (node.nodeType === 1) {
                // Check all buttons within the added element
                const buttons = node.querySelectorAll<HTMLElement>("button");
                buttons.forEach(checkElement);

                // Check for div buttons (role="button")
                const buttonDivs = node.querySelectorAll<HTMLElement>('div[role="button"]');
                buttonDivs.forEach((div) => {
                  if (isSubmitButton(div, null, "other")) {
                    initButton(div, "other");
                  }
                });
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
  }, [options.enabled, checkElement, initButton, isSubmitButton]);

  return observedButtons.current;
}