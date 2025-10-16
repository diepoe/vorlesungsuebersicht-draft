import ICAL from "../dist/ical.min.js";
import { getWeekStart, getWeekNumber } from "./dates.js";
import { formatEventTime } from "./formatters.js";

export function transformEventsToClassData(icalEvents) {
  const classData = {
    id: icalEvents[0].description,
    title: "Wirtschaftsinformatik 3. Semester",
    semester: "3. Semester WS 2025/25",
    modules: extractModulesFromEvents(icalEvents),
    weeks: groupEventsByWeek(icalEvents),
  };

  // TODO Extract course ID (e.g., "HN-WWI24A3") from the description
  //console.info(icalEvents[0].description);
  const courseIdMatch = icalEvents[0].description.match(
    /HN-[A-Z]{2,3}\d{2}[A-Z]\d/
  );
  if (courseIdMatch) {
    classData.id = courseIdMatch[0];
  }

  return classData;
}

/**
 * Helper function to extract all relevant modules from the descriptions of the list items of ical events.
 *
 * @param {[ICAL.Event]} icalEvents
 * @returns {[]}
 */
function extractModulesFromEvents(icalEvents) {
  const moduleMap = new Map();
  const moduleColors = [
    "var(--color-cyan-600)",
    "var(--color-red-600)",
    "var(--color-lime-600)",
    "var(--color-blue-600)",
    "var(--color-orange-600)",
    "var(--color-emerald-600)",
    "var(--color-violet-600)",
    "var(--color-amber-600)",
    "var(--color-teal-600)",
    "var(--color-purple-600)",
    "var(--color-yellow-600)",
    "var(--color-sky-600)",
    "var(--color-pink-600)",
    "var(--color-green-600)",
    "var(--color-fuchsia-600)",
    "var(--color-indigo-600)",
  ];
  let colorIndex = 0;

  icalEvents.forEach((event) => {
    const summary = event.summary || "";
    const moduleCode = summary;

    if (moduleCode && !moduleMap.has(moduleCode)) {
      moduleMap.set(moduleCode, {
        id: moduleCode,
        name: moduleCode,
        professor: "UNKNOWN", // TODO: map professor/teacher from separatly fetched module dataset
        credits: -1,
        color: moduleColors[colorIndex % moduleColors.length],
      });
      colorIndex++;
    }
  });

  return Array.from(moduleMap.values());
}

/**
 *
 * @param {[ICAL.Event]} icalEvents parsed event list
 * @returns {Array<Object>} filtered list of parsed events grouped by week
 */
function groupEventsByWeek(icalEvents) {
  // TODO filter weeks: only include relevant weeks from the current semester (to be loaded from database)
  const weekMap = new Map();

  icalEvents.forEach((event) => {
    const startDate = event.startDate.toJSDate();
    const weekStart = getWeekStart(startDate);
    const weekKey = weekStart.toISOString().split("T")[0];

    if (!weekMap.has(weekKey)) {
      weekMap.set(weekKey, {
        week: getWeekNumber(weekStart),
        startDate: weekKey,
        sessions: [],
      });
    }

    const session = {
      date: startDate.toISOString().split("T")[0],
      time: formatEventTime(event),
      module: event.summary,
      room: event.location || "TBD",
    };

    weekMap.get(weekKey).sessions.push(session);
  });

  return Array.from(weekMap.values()).sort(
    (a, b) => new Date(a.startDate) - new Date(b.startDate)
  );
}
