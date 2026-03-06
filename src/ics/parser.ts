import ICAL from "ical.js";
import { CalendarEvent, Attendee, CalendarFeed } from "../types";

export function parseICS(icsData: string, feed: CalendarFeed): CalendarEvent[] {
  const jcalData = ICAL.parse(icsData);
  const comp = new ICAL.Component(jcalData);

  // Register VTIMEZONE components so ical.js can resolve TZID parameters.
  // Without this, times with a TZID are treated as floating (local) time,
  // causing events from other timezones to display at the wrong time.
  const timezones = comp.getAllSubcomponents("vtimezone");
  for (const tz of timezones) {
    const tzid = tz.getFirstPropertyValue("tzid");
    if (tzid) {
      ICAL.TimezoneService.register(
        tzid,
        new ICAL.Timezone({ component: tz, tzid })
      );
    }
  }

  const vevents = comp.getAllSubcomponents("vevent");
  const events: CalendarEvent[] = [];

  // Collect recurrence overrides keyed by "uid_originalStartMs".
  // These are VEVENTs with RECURRENCE-ID that replace or reschedule a single
  // occurrence of a recurring event. We need to:
  // 1. Remove the original occurrence from the RRULE expansion
  // 2. Add the override's actual start/end time instead
  const overrides = new Map<string, ICAL.Component[]>();
  for (const vevent of vevents) {
    const recurrenceId = vevent.getFirstPropertyValue("recurrence-id") as ICAL.Time | null;
    if (!recurrenceId) continue;
    const uid = vevent.getFirstPropertyValue("uid") as string;
    const key = uid + "_" + recurrenceId.toJSDate().getTime();
    if (!overrides.has(key)) overrides.set(key, []);
    overrides.get(key)!.push(vevent);
  }

  for (const vevent of vevents) {
    // Skip override VEVENTs here — they are processed via the overrides map
    if (vevent.getFirstPropertyValue("recurrence-id")) {
      continue;
    }

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
          const key = event.uid + "_" + occStart.getTime();
          const overrideVevents = overrides.get(key);
          if (overrideVevents) {
            // This occurrence has been overridden (rescheduled/modified).
            // Use the override's actual time instead of the RRULE occurrence.
            for (const ov of overrideVevents) {
              const ovEvent = new ICAL.Event(ov);
              const ovStart = ovEvent.startDate;
              const ovEnd = ovEvent.endDate;
              if (ovStart) {
                events.push(buildEvent(ov, ovEvent, feed, ovStart.toJSDate(), ovEnd ? ovEnd.toJSDate() : ovStart.toJSDate()));
              }
            }
          } else {
            const duration = event.duration;
            const occEnd = new Date(occStart.getTime() + (duration ? duration.toSeconds() * 1000 : 3600000));
            events.push(buildEvent(vevent, event, feed, occStart, occEnd));
          }
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
