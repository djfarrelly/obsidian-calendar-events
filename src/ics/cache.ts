import { CalendarEvent, CalendarFeed } from "../types";
import { fetchICS } from "./fetcher";
import { parseICS } from "./parser";

export class EventCache {
  private events: CalendarEvent[] = [];
  private lastFetch: number = 0;

  async refresh(feeds: CalendarFeed[]): Promise<void> {
    const allEvents: CalendarEvent[] = [];
    for (const feed of feeds) {
      if (!feed.enabled) continue;
      try {
        const icsData = await fetchICS(feed);
        const parsed = parseICS(icsData, feed);
        allEvents.push(...parsed);
      } catch (e) {
        console.error(`Calendar Events: failed to fetch ${feed.name}`, e);
      }
    }
    this.events = allEvents.sort((a, b) => a.start.getTime() - b.start.getTime());
    this.lastFetch = Date.now();
  }

  getEventsForDate(date: Date): CalendarEvent[] {
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayEnd = new Date(dayStart.getTime() + 86400000);
    return this.events.filter(e => e.start < dayEnd && e.end > dayStart);
  }

  getDatesWithEvents(year: number, month: number): Set<number> {
    const dates = new Set<number>();
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);
    for (const e of this.events) {
      if (e.start <= monthEnd && e.end >= monthStart) {
        // Add each day the event spans
        const start = new Date(Math.max(e.start.getTime(), monthStart.getTime()));
        const end = new Date(Math.min(e.end.getTime(), monthEnd.getTime()));
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          if (d.getMonth() === month) dates.add(d.getDate());
        }
      }
    }
    return dates;
  }

  needsRefresh(intervalMinutes: number): boolean {
    return Date.now() - this.lastFetch > intervalMinutes * 60 * 1000;
  }
}
