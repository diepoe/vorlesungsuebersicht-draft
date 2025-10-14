import ICAL from "https://unpkg.com/ical.js/dist/ical.min.js";

import {
  formatEventTime,
  formatDayHeader,
  formatRoom,
} from "./util/formatters.js";

async function fetchPlanData(classId) {
  // Original URL: "https://rapla.dhbw.de/rapla/ical?key=e9U66lekDXL6sG639VTK69wZiKdfo2rPh6BxyWKXodBkdReTGOQGrZVRilYXYBV8-r4lqwlGfF18DgUBFOBwmiJyYRjQeQRkhJZkyn9AKdCuT35E6HT1mocxgwzDrjez&salt=953482152"
  const apiCall = {
    response: await fetch(`http://localhost:5555/calendar?course=${encodeURIComponent(classId)}`, {
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    }),
  };

  // Read the response body as text since we're expecting an ICS file
  const responseBody = await apiCall.response.text();

  var jcalData = ICAL.parse(responseBody);
  var comp = new ICAL.Component(jcalData);
  var vevents = comp.getAllSubcomponents("vevent");

  const parsedEvents = [];

  for (const vevent of vevents) {
    var evt = new ICAL.Event(vevent);
    parsedEvents.push(evt);
  }

  return transformEventsToClassData(parsedEvents);
}

function transformEventsToClassData(icalEvents) {
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
        credits: 5,
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

function getWeekStart(date) {
  const weekStart = new Date(date);
  const day = weekStart.getDay();
  const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
  weekStart.setDate(diff);
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
}

function getWeekNumber(date) {
  const start = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date - start) / (24 * 60 * 60 * 1000));
  return Math.ceil((days + start.getDay() + 1) / 7);
}

function getDayName(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("de-DE", {
    weekday: "long",
  });
}

function getModuleColor(modules, moduleId) {
  const module = modules.find((m) => m.id === moduleId);
  return module ? module.color : "gray";
}

function getModuleName(modules, moduleId) {
  const module = modules.find((m) => m.id === moduleId);
  return module ? module.name : moduleId;
}

/**
 * Checks if a session date and time are in the past
 * @param {string} dateString - ISO date string (YYYY-MM-DD)
 * @param {string} timeString - Time range in format "HH:MM-HH:MM"
 * @returns {boolean} - True if the session end time is in the past
 */
function isDateInPast(dateString, timeString) {
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

function isToday(dateString) {
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

function isWeekInPast(weekStartDate) {
  const startDate = new Date(weekStartDate);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  const today = new Date();

  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);
  today.setHours(0, 0, 0, 0);

  return endDate < today;
}

function scrollToCurrentDay() {
  const currentDayElement = document.getElementById("current-day");
  if (currentDayElement) {
    currentDayElement.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }
}

function renderModules(modules) {
  const container = document.getElementById("modules-container");
  container.innerHTML = "";

  modules.forEach((module) => {
    const moduleDiv = document.createElement("div");
    moduleDiv.className = "module-card";
    moduleDiv.style.borderLeftColor = module.color;

    moduleDiv.innerHTML = `
        <div class="module-name">${module.name}</div>
        ${
          module.professor !== "UNKNOWN"
            ? `<div class="module-details">${module.professor}</div>`
            : ""
        }
        <div class="module-credits">${module.credits} ECTS</div>
        `;

    container.appendChild(moduleDiv);
  });
}

// Function to get calendar week number
function getCalendarWeek(dateString) {
  const date = new Date(dateString);
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const dayNumber = Math.floor((date - firstDayOfYear) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((dayNumber + firstDayOfYear.getDay() + 1) / 7);
  return weekNumber;
}

function renderClassWeeks(weeks, modules) {
  const container = document.getElementById("weeks-container");
  container.innerHTML = "";

  const pastWeeks = weeks.filter((week) => isWeekInPast(week.startDate));
  const futureWeeks = weeks.filter((week) => !isWeekInPast(week.startDate));

  if (pastWeeks.length > 0) {
    const pastWeeksSection = document.createElement("div");
    pastWeeksSection.className = "accordion-section past-weeks-section";

    const pastWeeksHeader = document.createElement("div");
    pastWeeksHeader.className = "accordion-header collapsed";
    pastWeeksHeader.setAttribute("data-target", "past-weeks-content");

    const pastWeeksTitle = document.createElement("h4");
    pastWeeksTitle.textContent = `Vergangene Wochen (${pastWeeks.length})`;

    const toggle = document.createElement("span");
    toggle.className = "accordion-toggle";
    toggle.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          `;

    pastWeeksHeader.appendChild(pastWeeksTitle);
    pastWeeksHeader.appendChild(toggle);
    pastWeeksSection.appendChild(pastWeeksHeader);

    const pastWeeksContent = document.createElement("div");
    pastWeeksContent.id = "past-weeks-content";
    pastWeeksContent.className = "accordion-content collapsed";

    pastWeeks.forEach((week) => {
      const weekDiv = renderWeekContent(week, modules);
      pastWeeksContent.appendChild(weekDiv);
    });

    pastWeeksSection.appendChild(pastWeeksContent);
    container.appendChild(pastWeeksSection);
  }

  futureWeeks.forEach((week) => {
    const weekDiv = renderWeekContent(week, modules);
    container.appendChild(weekDiv);
  });
}

function renderWeekContent(week, modules) {
  const weekDiv = document.createElement("div");
  weekDiv.className = "week-timeline";

  const weekHeader = document.createElement("h4");
  weekHeader.textContent = `KW ${getCalendarWeek(week.startDate)}`;
  weekDiv.appendChild(weekHeader);

  const sessionsContainer = document.createElement("div");
  sessionsContainer.className = "sessions-container";

  const dayGroups = week.sessions.reduce((groups, session) => {
    const dayName = getDayName(session.date);
    if (!groups[dayName]) groups[dayName] = [];
    groups[dayName].push(session);
    return groups;
  }, {});

  Object.entries(dayGroups).forEach(([day, sessions]) => {
    const dayDiv = document.createElement("div");
    dayDiv.className = "day-group";

    if (isToday(sessions[0].date)) {
      dayDiv.id = "current-day";
    }

    const dayHeader = document.createElement("h5");
    dayHeader.textContent = formatDayHeader(sessions[0].date);
    dayDiv.appendChild(dayHeader);

    sessions.forEach((session) => {
      const sessionDiv = document.createElement("div");
      sessionDiv.className = `session-item`;

      if (isDateInPast(session.date, session.time)) {
        sessionDiv.classList.add("past-session");
      }

      sessionDiv.style.borderLeftColor = getModuleColor(
        modules,
        session.module
      );

      sessionDiv.innerHTML = `
              <div class="session-time">${session.time}</div>
              <div class="session-module">${getModuleName(
                modules,
                session.module
              )}</div>
              <div class="session-room">${formatRoom(session.room)}</div>
            `;

      dayDiv.appendChild(sessionDiv);
    });

    sessionsContainer.appendChild(dayDiv);
  });

  weekDiv.appendChild(sessionsContainer);
  return weekDiv;
}

function showLoadingState() {
  document.getElementById("loading-state").classList.remove("hidden");
  document.getElementById("error-state").classList.add("hidden");
  document.getElementById("plan-content").classList.add("hidden");
}

function showErrorState() {
  document.getElementById("loading-state").classList.add("hidden");
  document.getElementById("error-state").classList.remove("hidden");
  document.getElementById("plan-content").classList.add("hidden");
}

function initializeAccordions() {
  const accordionHeaders = document.querySelectorAll(".accordion-header");

  accordionHeaders.forEach((header) => {
    header.addEventListener("click", function () {
      const targetId = this.getAttribute("data-target");
      const content = document.getElementById(targetId);
      const toggle = this.querySelector(".accordion-toggle");

      if (this.classList.contains("collapsed")) {
        this.classList.remove("collapsed");
        this.classList.add("expanded");
        content.classList.remove("collapsed");
        content.classList.add("expanded");
        toggle.innerHTML =
          '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" /></svg>';
      } else {
        this.classList.remove("expanded");
        this.classList.add("collapsed");
        content.classList.remove("expanded");
        content.classList.add("collapsed");
        toggle.innerHTML =
          '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>';
      }
    });
  });
}

function showPlanContent(classData) {
  document.getElementById("loading-state").classList.add("hidden");
  document.getElementById("error-state").classList.add("hidden");
  document.getElementById("plan-content").classList.remove("hidden");

  document.getElementById("class-title").textContent = classData.title;
  document.getElementById("class-semester").textContent = classData.semester;

  renderModules(classData.modules);
  renderClassWeeks(classData.weeks, classData.modules);
  initializeAccordions();

  setTimeout(() => {
    scrollToCurrentDay();
  }, 100);
}

function storeClassInLocalStorage(classData) {
  localStorage.setItem("selectedClass", JSON.stringify(classData));
  localStorage.setItem("lastViewedClass", classData.id);
}

async function loadClassPlan(classId) {
  if (!classId) return;

  showLoadingState();

  try {
    const classData = await fetchPlanData(classId);
    showPlanContent(classData);
    storeClassInLocalStorage(classData);
  } catch (error) {
    console.error("Failed to load class:", error);
    showErrorState();
  }
}

const params = new URLSearchParams(document.location.search);
const classParam = params.get("class") || params.get("course");
const classIDEl = document.getElementById("class-id");

if (classParam) {
  classIDEl.textContent = classParam;
  loadClassPlan(classParam);
} else {
  classIDEl.textContent = "Bitte wählen Sie einen Kurs";
  showErrorState();
}
