import { App, TFile, normalizePath } from "obsidian";
import { CalendarEvent, CalendarEventsSettings } from "../types";

export class NoteCreator {
  constructor(private app: App, private settings: CalendarEventsSettings) {}

  updateSettings(settings: CalendarEventsSettings) {
    this.settings = settings;
  }

  async addEventToDaily(event: CalendarEvent, date: Date): Promise<void> {
    const dailyPath = this.getDailyNotePath(date);
    let file = this.app.vault.getAbstractFileByPath(dailyPath);

    if (!file || !(file instanceof TFile)) {
      // Create the daily note if it doesn't exist
      const folder = dailyPath.substring(0, dailyPath.lastIndexOf("/"));
      if (folder) {
        const folderExists = this.app.vault.getAbstractFileByPath(folder);
        if (!folderExists) {
          await this.app.vault.createFolder(folder);
        }
      }
      file = await this.app.vault.create(dailyPath, `# ${this.formatDate(date)}\n\n${this.settings.meetingHeading}\n`);
    }

    const tfile = file as TFile;
    const content = await this.app.vault.read(tfile);
    const bullet = this.buildBullet(event);

    // Check if already added
    if (content.contains(event.title) && content.contains(this.formatTime(event.start))) {
      return; // Already exists
    }

    const heading = this.settings.meetingHeading;
    if (content.contains(heading)) {
      // Insert after heading
      const idx = content.indexOf(heading) + heading.length;
      const before = content.slice(0, idx);
      const after = content.slice(idx);
      await this.app.vault.modify(tfile, before + "\n" + bullet + after);
    } else {
      // Append heading + bullet
      await this.app.vault.modify(tfile, content + "\n" + heading + "\n" + bullet + "\n");
    }
  }

  private buildBullet(event: CalendarEvent): string {
    const time = event.isAllDay ? "All day" : this.formatTime(event.start);
    const attendeeLinks = this.resolveAttendees(event);
    const attendeeStr = attendeeLinks.length > 0 ? " — " + attendeeLinks.join(", ") : "";

    return this.settings.bulletTemplate
      .replace("{{time}}", time)
      .replace("{{title}}", event.title)
      .replace("{{attendees}}", attendeeStr)
      .replace("{{location}}", event.location || "");
  }

  private resolveAttendees(event: CalendarEvent): string[] {
    const selfEmails = new Set(this.settings.selfEmails.map(e => e.toLowerCase()));
    return event.attendees
      .filter(a => !selfEmails.has(a.email.toLowerCase()))
      .map(a => {
        const noteName = this.resolveNameMapping(a.name, a.email);
        const folder = this.settings.peopleFolder;
        const path = folder ? `${folder}/${noteName}` : noteName;
        return `[[${path}|${noteName}]]`;
      });
  }

  private resolveNameMapping(name: string, email: string): string {
    for (const mapping of this.settings.nameMappings) {
      if (mapping.from.toLowerCase() === email.toLowerCase() ||
          mapping.from.toLowerCase() === name.toLowerCase()) {
        return mapping.to;
      }
    }
    return name || email.split("@")[0];
  }

  private getDailyNotePath(date: Date): string {
    const formatted = this.formatDate(date);
    const folder = this.settings.dailyNoteFolder;
    const path = folder ? `${folder}/${formatted}.md` : `${formatted}.md`;
    return normalizePath(path);
  }

  private formatDate(date: Date): string {
    // Simple YYYY-MM-DD — could extend to support the dailyNoteFormat setting
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  private formatTime(date: Date): string {
    const h = date.getHours();
    const m = String(date.getMinutes()).padStart(2, "0");
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  }
}
