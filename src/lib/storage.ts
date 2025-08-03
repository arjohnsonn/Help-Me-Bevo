import { storage } from "#imports";

export const enabled = storage.defineItem<boolean>("local:enabled", {
  fallback: true,
});

export const assignmentName = storage.defineItem<boolean>(
  "local:assignmentName",
  {
    fallback: true,
  },
);

export const assignments = storage.defineItem<boolean>("local:assignments", {
  fallback: true,
});

export const classroom = storage.defineItem<boolean>("local:classroom", {
  fallback: true,
});

export const discussions = storage.defineItem<boolean>("local:discussions", {
  fallback: true,
});

export const gradescope = storage.defineItem<boolean>("local:gradescope", {
  fallback: true,
});

export const quizzes = storage.defineItem<boolean>("local:quizzes", {
  fallback: false,
});

export const other = storage.defineItem<boolean>("local:other", {
  fallback: true,
});

export const themedAnims = storage.defineItem<boolean>("local:themedAnims", {
  fallback: true,
});

export const volume = storage.defineItem<number>("local:volume", {
  fallback: 50,
});

export const statsAssignments = storage.defineItem<number>(
  "local:stats-assignments",
  {
    fallback: 0,
  },
);

export const statsClassroom = storage.defineItem<number>(
  "local:stats-classroom",
  {
    fallback: 0,
  },
);

export const statsDiscussions = storage.defineItem<number>(
  "local:stats-discussions",
  {
    fallback: 0,
  },
);

export const statsGradescope = storage.defineItem<number>(
  "local:stats-gradescope",
  {
    fallback: 0,
  },
);

export const statsOther = storage.defineItem<number>("local:stats-other", {
  fallback: 0,
});

export const statsQuizzes = storage.defineItem<number>("local:stats-quizzes", {
  fallback: 0,
});

export const statsTotal = storage.defineItem<number>("local:stats-total", {
  fallback: 0,
});

export const clientId = storage.defineItem<number>("local:clientId", {
  fallback: 0,
});

// Playing state: [timestamp, isPlaying, type]
export const playing = storage.defineItem<[number, boolean, string] | null>(
  "local:playing",
  {
    fallback: null,
  },
);

// Personal statistics for wrapped
export interface PersonalStats {
  [semester: string]: {
    busiestHour: Record<number, number>;
    busiestDay: Record<number, number>;
    weekendSubmissions: number;
    weekdaySubmissions: number;
    courses: Record<string, number>;
    timeWatched: number;
    lastMinuteSubmissions: number;
    mostProcrastinatedAssignment: {
      name: string;
      timeLeft: number;
    };
    earliestAssignment: {
      name: string;
      timeLeft: number;
    };
  };
}

export const personalStats = storage.defineItem<PersonalStats>(
  "local:personalStats",
  {
    fallback: {
      SPRING_2025: {
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
      },
    },
  },
);

// Wrapped popup visibility
export const wrappedPopupVisible_S25 = storage.defineItem<boolean>(
  "local:wrappedPopupVisible_S25",
  {
    fallback: true,
  },
);

export async function getAllSettings() {
  const [
    enabledVal,
    assignmentNameVal,
    assignmentsVal,
    classroomVal,
    discussionsVal,
    gradescopeVal,
    quizzesVal,
    otherVal,
    themedAnimsVal,
    volumeVal,
    statsAssignmentsVal,
    statsClassroomVal,
    statsDiscussionsVal,
    statsGradescopeVal,
    statsOtherVal,
    statsQuizzesVal,
    statsTotalVal,
    clientIdVal,
    playingVal,
    personalStatsVal,
    wrappedPopupVisibleVal,
  ] = await Promise.all([
    enabled.getValue(),
    assignmentName.getValue(),
    assignments.getValue(),
    classroom.getValue(),
    discussions.getValue(),
    gradescope.getValue(),
    quizzes.getValue(),
    other.getValue(),
    themedAnims.getValue(),
    volume.getValue(),
    statsAssignments.getValue(),
    statsClassroom.getValue(),
    statsDiscussions.getValue(),
    statsGradescope.getValue(),
    statsOther.getValue(),
    statsQuizzes.getValue(),
    statsTotal.getValue(),
    clientId.getValue(),
    playing.getValue(),
    personalStats.getValue(),
    wrappedPopupVisible_S25.getValue(),
  ]);

  return {
    enabled: enabledVal,
    assignmentName: assignmentNameVal,
    assignments: assignmentsVal,
    classroom: classroomVal,
    discussions: discussionsVal,
    gradescope: gradescopeVal,
    quizzes: quizzesVal,
    other: otherVal,
    themedAnims: themedAnimsVal,
    volume: volumeVal,
    "stats-assignments": statsAssignmentsVal,
    "stats-classroom": statsClassroomVal,
    "stats-discussions": statsDiscussionsVal,
    "stats-gradescope": statsGradescopeVal,
    "stats-other": statsOtherVal,
    "stats-quizzes": statsQuizzesVal,
    "stats-total": statsTotalVal,
    clientId: clientIdVal,
    playing: playingVal,
    personalStats: personalStatsVal,
    wrappedPopupVisible_S25: wrappedPopupVisibleVal,
  };
}

export async function setSetting(key: string, value: any) {
  switch (key) {
    case "enabled":
      await enabled.setValue(value);
      break;
    case "assignmentName":
      await assignmentName.setValue(value);
      break;
    case "assignments":
      await assignments.setValue(value);
      break;
    case "classroom":
      await classroom.setValue(value);
      break;
    case "discussions":
      await discussions.setValue(value);
      break;
    case "gradescope":
      await gradescope.setValue(value);
      break;
    case "quizzes":
      await quizzes.setValue(value);
      break;
    case "other":
      await other.setValue(value);
      break;
    case "themedAnims":
      await themedAnims.setValue(value);
      break;
    case "volume":
      await volume.setValue(value);
      break;
    case "stats-assignments":
      await statsAssignments.setValue(value);
      break;
    case "stats-classroom":
      await statsClassroom.setValue(value);
      break;
    case "stats-discussions":
      await statsDiscussions.setValue(value);
      break;
    case "stats-gradescope":
      await statsGradescope.setValue(value);
      break;
    case "stats-other":
      await statsOther.setValue(value);
      break;
    case "stats-quizzes":
      await statsQuizzes.setValue(value);
      break;
    case "stats-total":
      await statsTotal.setValue(value);
      break;
    case "clientId":
      await clientId.setValue(value);
      break;
    case "playing":
      await playing.setValue(value);
      break;
    case "personalStats":
      await personalStats.setValue(value);
      break;
    case "wrappedPopupVisible_S25":
      await wrappedPopupVisible_S25.setValue(value);
      break;
  }
}

export const storageItems = {
  enabled,
  assignmentName,
  assignments,
  classroom,
  discussions,
  gradescope,
  quizzes,
  other,
  themedAnims,
  volume,
  statsAssignments,
  statsClassroom,
  statsDiscussions,
  statsGradescope,
  statsOther,
  statsQuizzes,
  statsTotal,
  clientId,
  playing,
  personalStats,
  wrappedPopupVisible_S25,
};
