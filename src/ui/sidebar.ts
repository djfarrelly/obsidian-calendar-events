import { ItemView, WorkspaceLeaf } from "obsidian";
import { CalendarEvent } from "../types";
import type CalendarEventsPlugin from "../main";

export const VIEW_TYPE = "calendar-events-view";

export class CalendarEventsView extends ItemView {
  private plugin: CalendarEventsPlugin;
  private selectedDate: Date;

  constructor(leaf: WorkspaceLeaf, plugin: CalendarEventsPlugin) {
    super(leaf);
    this.plugin = plugin;
    this.selectedDate = new Date();
  }

  getViewType(): string {
    return VIEW_TYPE;
  }

  getDisplayText(): string {
    return "Calendar Events";
  }

  getIcon(): string {
    return "calendar-clock";
  }

  async onOpen(): Promise<void> {
    this.render();
  }

  setDate(date: Date): void {
    this.selectedDate = date;
    this.render();
  }

  render(): void {
    const container = this.containerEl.children[1] as HTMLElement;
    container.empty();
    container.addClass("calendar-events-container");

    // Date header with nav
    const header = container.createDiv({ cls: "calendar-events-header" });
    const prevBtn = header.createEl("button", { cls: "calendar-events-nav", text: "‹" });
    prevBtn.addEventListener("click", () => this.shiftDate(-1));

    const dateStr = this.selectedDate.toLocaleDateString("en-US", {
      weekday: "short", month: "short", day: "numeric"
    });
    header.createEl("span", { cls: "calendar-events-date", text: dateStr });

    const nextBtn = header.createEl("button", { cls: "calendar-events-nav", text: "›" });
    nextBtn.addEventListener("click", () => this.shiftDate(1));

    // Today button
    const todayBtn = header.createEl("button", { cls: "calendar-events-today-btn", text: "Today" });
    todayBtn.addEventListener("click", () => this.setDate(new Date()));

    // Event list
    const events = this.plugin.cache.getEventsForDate(this.selectedDate);
    const list = container.createDiv({ cls: "calendar-events-list" });

    if (events.length === 0) {
      list.createDiv({ cls: "calendar-events-empty", text: "No events" });
      return;
    }

    for (const event of events) {
      const item = list.createDiv({ cls: "calendar-events-item" });

      // Color indicator
      const dot = item.createDiv({ cls: "calendar-events-dot" });
      dot.style.backgroundColor = event.feedColor || "var(--interactive-accent)";

      const info = item.createDiv({ cls: "calendar-events-info" });

      // Time
      const time = event.isAllDay
        ? "All day"
        : this.formatTime(event.start) + " – " + this.formatTime(event.end);
      info.createDiv({ cls: "calendar-events-time", text: time });

      // Title
      info.createDiv({ cls: "calendar-events-title", text: event.title });

      // Attendees
      if (event.attendees.length > 0) {
        const selfEmails = new Set(this.plugin.settings.selfEmails.map(e => e.toLowerCase()));
        const others = event.attendees.filter(a => !selfEmails.has(a.email.toLowerCase()));
        if (others.length > 0) {
          const names = others.map(a => a.name || a.email).join(", ");
          info.createDiv({ cls: "calendar-events-attendees", text: names });
        }
      }

      // Click to add to daily note
      item.addEventListener("click", async () => {
        await this.plugin.noteCreator.addEventToDaily(event, this.selectedDate);
        item.addClass("calendar-events-item-added");
      });
    }
  }

  private shiftDate(days: number): void {
    const d = new Date(this.selectedDate);
    d.setDate(d.getDate() + days);
    this.setDate(d);
  }

  private formatTime(date: Date): string {
    const h = date.getHours();
    const m = String(date.getMinutes()).padStart(2, "0");
    const ampm = h >= 12 ? "PM" : "AM";
    return `${(h % 12) || 12}:${m} ${ampm}`;
  }
}
