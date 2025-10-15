import ICAL from "https://unpkg.com/ical.js/dist/ical.min.js";
import { transformEventsToClassData } from "./parseIcal.js";
// TODO move ICAL parsing out of this file

/**
 * 
 * @param {string} classId 
 * @returns 
 */
export async function fetchPlanData(classId) {
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