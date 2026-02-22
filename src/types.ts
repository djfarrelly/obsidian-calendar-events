export interface CalendarFeed {
  name: string;
  url: string;
  color: string;
  enabled: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description: string;
  location: string;
  attendees: Attendee[];
  feedName: string;
  feedColor: string;
  isAllDay: boolean;
}

export interface Attendee {
  name: string;
  email: string;
  role: string;
}

export interface NameMapping {
  from: string; // email or display name
  to: string;   // obsidian note name
}

export interface CalendarEventsSettings {
  feeds: CalendarFeed[];
  dailyNoteFormat: string;
  dailyNoteFolder: string;
  meetingHeading: string;
  peopleFolder: string;
  nameMappings: NameMapping[];
  selfEmails: string[];
  refreshIntervalMinutes: number;
  bulletTemplate: string;
}

export const DEFAULT_SETTINGS: CalendarEventsSettings = {
  feeds: [],
  dailyNoteFormat: "YYYY-MM-DD",
  dailyNoteFolder: "",
  meetingHeading: "## Meetings",
  peopleFolder: "people",
  nameMappings: [],
  selfEmails: [],
  refreshIntervalMinutes: 30,
  bulletTemplate: "- **{{time}}** {{title}} {{attendees}}",
};
