import { personalStats, PersonalStats } from "./storage";
import { ButtonType } from "../hooks/useButtonObserver";

const CURRENT_SEMESTER = "SPRING_2025";

export function getStatsFields() {
  return {
    busiestHour: {} as Record<number, number>,
    busiestDay: {} as Record<number, number>,
    weekendSubmissions: 0,
    weekdaySubmissions: 0,
    courses: {} as Record<string, number>,
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

export async function logStatistics(
  type: ButtonType,
  assignmentName: string | null,
  courseName: string | null,
  dueDate: number | undefined
) {
  const stats = await personalStats.getValue();
  
  // Ensure current semester exists
  if (!stats[CURRENT_SEMESTER]) {
    stats[CURRENT_SEMESTER] = getStatsFields();
  }

  const currentStats = stats[CURRENT_SEMESTER];

  // Busiest Day
  const dayOfWeek = new Date().getDay();
  currentStats.busiestDay[dayOfWeek] = (currentStats.busiestDay[dayOfWeek] ?? 0) + 1;

  // Busiest Hour
  const hour = new Date().getHours();
  currentStats.busiestHour[hour] = (currentStats.busiestHour[hour] ?? 0) + 1;

  // Weekend & Weekday Submissions
  const day = new Date().getDay();
  if (day === 0 || day === 6) {
    currentStats.weekendSubmissions++;
  } else {
    currentStats.weekdaySubmissions++;
  }

  // Courses
  if (courseName) {
    currentStats.courses[courseName] = (currentStats.courses[courseName] ?? 0) + 1;
  }

  // Last Minute Submissions and Procrastination tracking
  if (dueDate) {
    const timeLeft = dueDate - Math.floor(Date.now() / 1000);
    
    if (timeLeft < 30 * 60) { // 30 minutes til due
      currentStats.lastMinuteSubmissions++;
    }

    // Most Procrastinated Assignment
    const closestTilDue = currentStats.mostProcrastinatedAssignment.timeLeft;
    if (
      assignmentName &&
      (closestTilDue === -1 || timeLeft < currentStats.mostProcrastinatedAssignment.timeLeft)
    ) {
      currentStats.mostProcrastinatedAssignment = {
        name: assignmentName,
        timeLeft: timeLeft,
      };
    }

    // Earliest Assignment
    const earliestTilDue = currentStats.earliestAssignment.timeLeft;
    if (
      assignmentName &&
      (earliestTilDue === -1 || timeLeft > currentStats.earliestAssignment.timeLeft)
    ) {
      currentStats.earliestAssignment = {
        name: assignmentName,
        timeLeft: timeLeft,
      };
    }
  }

  await personalStats.setValue(stats);
}

export async function addWatchTime(seconds: number) {
  const stats = await personalStats.getValue();
  
  if (!stats[CURRENT_SEMESTER]) {
    stats[CURRENT_SEMESTER] = getStatsFields();
  }

  stats[CURRENT_SEMESTER].timeWatched += Math.floor(seconds + 0.5);
  await personalStats.setValue(stats);
}

export async function getPersonalStats(): Promise<PersonalStats> {
  return await personalStats.getValue();
}