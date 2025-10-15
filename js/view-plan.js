import {
  getCalendarWeek,
  getDayName,
  isDateInPast,
  isToday,
  isWeekInPast,
} from "./util/dates.js";
import { formatDayHeader, formatRoom } from "./util/formatters.js";
import { fetchPlanData } from "./util/loadData.js";

function getModuleColor(modules, moduleId) {
  const module = modules.find((m) => m.id === moduleId);
  return module ? module.color : "gray";
}

function getModuleName(modules, moduleId) {
  const module = modules.find((m) => m.id === moduleId);
  return module ? module.name : moduleId;
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
      ${
        module.credits > 0
        ? `<div class="module-credits">${module.credits} ECTS</div>`
        : ""
      }
      `;

    container.appendChild(moduleDiv);
  });
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
    pastWeeksHeader.id = "past-weeks-header"

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
