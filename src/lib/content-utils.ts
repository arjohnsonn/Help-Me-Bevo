import { ButtonType } from "../hooks/useButtonObserver";

export function getAssignmentName(type: ButtonType): string | null {
  let titleElement: Element | null;
  let titleText: string | null;

  switch (type) {
    case "assignments": {
      titleElement = document.querySelector('[data-testid="title"]');
      titleText = titleElement ? titleElement.textContent : null;
      return titleText;
    }
    case "quizzes": {
      // First element is an active open quiz, the second one is after the submission when page refreshes
      titleElement =
        document.querySelector(".quiz-header h1") ||
        document.getElementById("quiz_title");
      titleText = titleElement ? titleElement.textContent : null;
      return titleText;
    }
    case "discussions": {
      const breadcrumbs = document.querySelector("#breadcrumbs ul");
      if (!breadcrumbs) return null;
      
      const lastSpan = breadcrumbs.querySelector("li:last-child span");
      if (!lastSpan) return null;
      
      titleText = lastSpan.textContent?.trim() || null;
      return titleText;
    }
    case "gradescope": {
      const h1Element = document.querySelector(
        "h1.submissionOutlineHeader--assignmentTitle"
      );
      titleText = h1Element?.innerHTML.trim() || null;
      return titleText;
    }
    default:
      return null;
  }
}

export function getCourseName(type: ButtonType): string | null {
  switch (type) {
    case "quizzes":
    case "discussions":
    case "assignments": {
      const courseElement = document.querySelector(
        'a[href^="/courses/"] span.ellipsible'
      );
      const courseText = courseElement?.textContent?.trim() || null;
      return courseText;
    }
    case "gradescope": {
      const courseTitleElement = document.querySelector(
        "h1.courseHeader--title"
      );
      const courseTitle = courseTitleElement?.textContent?.trim() || null;
      return courseTitle;
    }
    default:
      return null;
  }
}

export function getDueDate(type: ButtonType): number | undefined {
  let dueDateElement: HTMLElement | null;
  let dateTime: number;
  let unixTimestampSeconds: number;

  switch (type) {
    case "assignments": {
      dueDateElement = document.querySelector(
        '[data-testid="due-date"]'
      ) as HTMLElement;

      if (!dueDateElement) return undefined;

      const dateAttr = dueDateElement.getAttribute("datetime");
      dateTime = dateAttr ? Number(dateAttr) : 0;
      unixTimestampSeconds = Math.floor(new Date(dateTime).getTime() / 1000);

      return unixTimestampSeconds;
    }
    case "quizzes": {
      dueDateElement = document.querySelector("span.due_at") as HTMLElement;
      const dueDateText = dueDateElement?.textContent?.trim();

      if (!dueDateText) return undefined;

      unixTimestampSeconds = Math.floor(new Date(dueDateText).getTime() / 1000);
      return unixTimestampSeconds;
    }
    case "gradescope": {
      dueDateElement = document.querySelector(
        "div[data-react-class='AssignmentSubmissionViewer']"
      ) as HTMLElement;
      if (!dueDateElement) return undefined;

      const dataPropsAttr = dueDateElement.getAttribute("data-react-props");
      if (!dataPropsAttr) return undefined;

      try {
        const dataProps = JSON.parse(dataPropsAttr);
        if (!dataProps?.assignment?.due_date) return undefined;

        dateTime = dataProps.assignment.due_date;
        unixTimestampSeconds = Math.floor(new Date(dateTime).getTime() / 1000);
        return unixTimestampSeconds;
      } catch {
        return undefined;
      }
    }
    default:
      return undefined;
  }
}

export async function isValidVideo(url: string): Promise<boolean> {
  // First, check if the URL ends with .mp4
  if (!url.toLowerCase().endsWith(".mp4")) {
    return false;
  }

  const video = document.createElement("video");
  video.src = url;

  return new Promise((resolve) => {
    video.onloadeddata = () => {
      resolve(true); // Valid video
    };

    video.onerror = () => {
      resolve(false); // Invalid video
    };
  });
}

// Wait for element utility (from original code)
export function waitForElm<T extends Element = HTMLElement>(
  selector: string
): Promise<T> {
  return new Promise((resolve) => {
    const element = document.querySelector(selector) as T | null;
    if (element) {
      return resolve(element);
    }
    
    const observer = new MutationObserver(() => {
      const elm = document.querySelector(selector) as T | null;
      if (elm) {
        observer.disconnect();
        resolve(elm);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  });
}