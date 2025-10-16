// TODO load data of all courses that need to be displayed

// TODO render course columns based on loaded data

// TODO change course columns when day is switched

// -- CURRENT TIME OVERLAY --

function updateCurrentTimeOverlay() {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // Calculate total minutes since start of day
  const totalMinutes = currentHour * 60 + currentMinute;

  // Schedule starts at 8:00 AM (480 minutes) and ends at 23:30 (1410 minutes)
  const scheduleStart = 8 * 60; // 8:00 AM in minutes
  const scheduleEnd = 23.5 * 60; // 23:30 in minutes

  const overlay = document.getElementById("currentTimeOverlay");
  const timeLabel = document.getElementById("currentTimeLabel");

  // Format time for display
  const timeString = now.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  timeLabel.textContent = timeString;

  // Only show overlay during schedule hours
  if (totalMinutes >= scheduleStart && totalMinutes <= scheduleEnd) {
    overlay.style.display = "block";

    // Calculate position within the schedule
    const scheduleProgress =
      (totalMinutes - scheduleStart) / (scheduleEnd - scheduleStart);

    // Grid starts at row 2 (after header), has 10 rows of 80px each plus gaps
    const headerHeight = 50 + 4; // header height + gap
    const rowHeight = 80 + 4; // row height + gap
    const totalScheduleHeight = 10 * rowHeight;

    // Calculate pixel position
    const pixelPosition = headerHeight + scheduleProgress * totalScheduleHeight;

    overlay.style.top = pixelPosition + "px";
  } else {
    // Hide overlay outside schedule hours
    overlay.style.display = "none";
  }
}

// Update immediately
updateCurrentTimeOverlay();

// Update every minute
setInterval(updateCurrentTimeOverlay, 60000);

// Update every second for smooth real-time updates (optional - can be changed to every minute for performance)
setInterval(updateCurrentTimeOverlay, 1000);
