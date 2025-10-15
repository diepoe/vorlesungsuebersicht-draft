// Function to get calendar week number
export function getCalendarWeek(dateString) {
  const date = new Date(dateString);
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const dayNumber = Math.floor((date - firstDayOfYear) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((dayNumber + firstDayOfYear.getDay() + 1) / 7);
  return weekNumber;
}

export function getDayName(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("de-DE", {
    weekday: "long",
  });
}

export function getWeekStart(date) {
  const weekStart = new Date(date);
  const day = weekStart.getDay();
  const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
  weekStart.setDate(diff);
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
}

export function getWeekNumber(date) {
  const start = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date - start) / (24 * 60 * 60 * 1000));
  return Math.ceil((days + start.getDay() + 1) / 7);
}

/**
 * Checks if a session date and time are in the past
 * @param {string} dateString - ISO date string (YYYY-MM-DD)
 * @param {string} timeString - Time range in format "HH:MM-HH:MM"
 * @returns {boolean} - True if the session end time is in the past
 */
export function isDateInPast(dateString, timeString) {
  const sessionDate = new Date(dateString);
  const now = new Date();

  // If the date is clearly in the past, return early
  if (sessionDate.setHours(23, 59, 59) < now) {
    return true;
  }

  // Extract the end time from timeString (format: "09:45-12:15")
  const endTimeStr = timeString.split("-")[1];
  if (!endTimeStr) return false;

  const [hours, minutes] = endTimeStr.split(":").map(Number);

  // Create date object with the session date and end time
  const sessionEndTime = new Date(dateString);
  sessionEndTime.setHours(hours, minutes, 0, 0);

  return sessionEndTime < now;
}

export function isToday(dateString) {
  const sessionDate = new Date(dateString);
  const targetDate = getScrollTargetDate();

  sessionDate.setHours(0, 0, 0, 0);
  targetDate.setHours(0, 0, 0, 0);

  return sessionDate.getTime() === targetDate.getTime();
}

function getScrollTargetDate() {
  const today = new Date();
  const dayOfWeek = today.getDay();

  if (dayOfWeek === 0 || dayOfWeek === 6) {
    const daysUntilMonday = dayOfWeek === 0 ? 1 : 2;
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + daysUntilMonday);
    return nextMonday;
  }

  return today;
}

export function isWeekInPast(weekStartDate) {
  const startDate = new Date(weekStartDate);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  const today = new Date();

  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);
  today.setHours(0, 0, 0, 0);

  return endDate < today;
}
