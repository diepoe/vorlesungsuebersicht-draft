export function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
}

export function formatDayHeader(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
  });
}

export function formatEventTime(event) {
  const start = event.startDate.toJSDate();
  const end = event.endDate.toJSDate();

  const formatTime = (date) => {
    return date.toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  return `${formatTime(start)}-${formatTime(end)}`;
}

/**
 * Mark all occasions where a event location is set to "Online"
 *
 * @param {string} room the location (room) where the event takes place
 * @returns the formatted room string
 */
export function formatRoom(room) {
  if (room.includes("Online")) {
    return `<mark>${room}</mark>`;
  }
  return room;
}
