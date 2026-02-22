import ICAL from "ical.js";
import { CalendarEvent, Attendee, CalendarFeed } from "../types";

export function parseICS(icsData: string, feed: CalendarFeed): CalendarEvent[] {
  const jcalData = ICAL.parse(icsData);
  const comp = new ICAL.Component(jcalData);
  const vevents = comp.getAllSubcomponents("vevent");
  const events: CalendarEvent[] = [];

  for (const vevent of vevents) {
    const event = new ICAL.Event(vevent);
    if (event.isRecurring()) {
      // Expand recurring events for a window (±6 months)
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - 6, 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 6, 0);
      const iter = event.iterator();
      let next = iter.next();
      let count = 0;
      while (next && count < 500) {
        const occStart = next.toJSDate();
        if (occStart > end) break;
        if (occStart >= start) {
          const duration = event.duration;
          const occEnd = new Date(occStart.getTime() + (duration ? duration.toSeconds() * 1000 : 3600000));
          events.push(buildEvent(vevent, event, feed, occStart, occEnd));
        }
        next = iter.next();
        count++;
      }
    } else {
      const dtstart = event.startDate;
      const dtend = event.endDate;
      if (dtstart) {
        events.push(buildEvent(vevent, event, feed, dtstart.toJSDate(), dtend ? dtend.toJSDate() : dtstart.toJSDate()));
      }
    }
  }
  return events;
}

function buildEvent(vevent: ICAL.Component, event: ICAL.Event, feed: CalendarFeed, start: Date, end: Date): CalendarEvent {
  const attendees: Attendee[] = [];
  const attendeeProps = vevent.getAllProperties("attendee");
  for (const prop of attendeeProps) {
    const cn = prop.getParameter("cn") || "";
    const email = (prop.getFirstValue() || "").replace("mailto:", "");
    const role = prop.getParameter("role") || "REQ-PARTICIPANT";
    attendees.push({ name: cn, email, role });
  }

  const isAllDay = event.startDate?.isDate || false;

  return {
    id: event.uid + "_" + start.getTime(),
    title: event.summary || "Untitled",
    start,
    end,
    description: event.description || "",
    location: event.location || "",
    attendees,
    feedName: feed.name,
    feedColor: feed.color,
    isAllDay,
  };
}
