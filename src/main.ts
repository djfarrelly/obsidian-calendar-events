import { Plugin, WorkspaceLeaf } from "obsidian";
import { CalendarEventsSettings, DEFAULT_SETTINGS } from "./types";
import { EventCache } from "./ics/cache";
import { NoteCreator } from "./notes/creator";
import { CalendarEventsView, VIEW_TYPE } from "./ui/sidebar";
import { CalendarEventsSettingTab } from "./ui/settings";

export default class CalendarEventsPlugin extends Plugin {
  settings: CalendarEventsSettings = DEFAULT_SETTINGS;
  cache: EventCache = new EventCache();
  noteCreator!: NoteCreator;
  private refreshInterval: number | null = null;

  async onload(): Promise<void> {
    await this.loadSettings();
    this.noteCreator = new NoteCreator(this.app, this.settings);

    this.registerView(VIEW_TYPE, (leaf) => new CalendarEventsView(leaf, this));

    this.addRibbonIcon("calendar-clock", "Calendar Events", () => this.activateView());

    this.addCommand({
      id: "show-calendar-events",
      name: "Show calendar events",
      callback: () => this.activateView(),
    });

    this.addCommand({
      id: "refresh-calendar-events",
      name: "Refresh calendar events",
      callback: () => this.refreshEvents(),
    });

    this.addSettingTab(new CalendarEventsSettingTab(this.app, this));

    // Initial fetch after layout ready
    this.app.workspace.onLayoutReady(async () => {
      await this.refreshEvents();
      this.startAutoRefresh();
    });
  }

  onunload(): void {
    if (this.refreshInterval) {
      window.clearInterval(this.refreshInterval);
    }
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
    this.noteCreator.updateSettings(this.settings);
  }

  async refreshEvents(): Promise<void> {
    await this.cache.refresh(this.settings.feeds);
    // Re-render active view
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE);
    for (const leaf of leaves) {
      const view = leaf.view as CalendarEventsView;
      view.render();
    }
  }

  private startAutoRefresh(): void {
    if (this.refreshInterval) window.clearInterval(this.refreshInterval);
    const ms = this.settings.refreshIntervalMinutes * 60 * 1000;
    this.refreshInterval = window.setInterval(() => this.refreshEvents(), ms);
    this.registerInterval(this.refreshInterval);
  }

  async activateView(): Promise<void> {
    const existing = this.app.workspace.getLeavesOfType(VIEW_TYPE);
    if (existing.length > 0) {
      this.app.workspace.revealLeaf(existing[0]);
      return;
    }
    const leaf = this.app.workspace.getRightLeaf(false);
    if (leaf) {
      await leaf.setViewState({ type: VIEW_TYPE, active: true });
      this.app.workspace.revealLeaf(leaf);
    }
  }
}
