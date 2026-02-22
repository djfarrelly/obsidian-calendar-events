import { App, PluginSettingTab, Setting } from "obsidian";
import type CalendarEventsPlugin from "../main";

export class CalendarEventsSettingTab extends PluginSettingTab {
  plugin: CalendarEventsPlugin;

  constructor(app: App, plugin: CalendarEventsPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "Calendar Events" });

    // --- Feeds ---
    containerEl.createEl("h3", { text: "ICS Feeds" });

    for (let i = 0; i < this.plugin.settings.feeds.length; i++) {
      const feed = this.plugin.settings.feeds[i];
      const feedDiv = containerEl.createDiv({ cls: "calendar-events-feed-setting" });

      new Setting(feedDiv)
        .setName(`Feed: ${feed.name || "Unnamed"}`)
        .addText(text => text.setPlaceholder("Name").setValue(feed.name)
          .onChange(async v => { feed.name = v; await this.plugin.saveSettings(); }))
        .addText(text => text.setPlaceholder("ICS URL").setValue(feed.url)
          .onChange(async v => { feed.url = v; await this.plugin.saveSettings(); }))
        .addColorPicker(cp => cp.setValue(feed.color)
          .onChange(async v => { feed.color = v; await this.plugin.saveSettings(); }))
        .addToggle(t => t.setValue(feed.enabled)
          .onChange(async v => { feed.enabled = v; await this.plugin.saveSettings(); }))
        .addButton(btn => btn.setButtonText("Remove").setWarning()
          .onClick(async () => {
            this.plugin.settings.feeds.splice(i, 1);
            await this.plugin.saveSettings();
            this.display();
          }));
    }

    new Setting(containerEl).addButton(btn =>
      btn.setButtonText("Add Feed").onClick(async () => {
        this.plugin.settings.feeds.push({ name: "", url: "", color: "#4a9eff", enabled: true });
        await this.plugin.saveSettings();
        this.display();
      })
    );

    // --- Daily notes ---
    containerEl.createEl("h3", { text: "Daily Notes" });

    new Setting(containerEl)
      .setName("Daily note folder")
      .setDesc("Folder where daily notes are stored")
      .addText(t => t.setValue(this.plugin.settings.dailyNoteFolder)
        .onChange(async v => { this.plugin.settings.dailyNoteFolder = v; await this.plugin.saveSettings(); }));

    new Setting(containerEl)
      .setName("Meeting heading")
      .setDesc("Heading to insert events under")
      .addText(t => t.setValue(this.plugin.settings.meetingHeading)
        .onChange(async v => { this.plugin.settings.meetingHeading = v; await this.plugin.saveSettings(); }));

    new Setting(containerEl)
      .setName("People folder")
      .setDesc("Folder for person backlinks")
      .addText(t => t.setValue(this.plugin.settings.peopleFolder)
        .onChange(async v => { this.plugin.settings.peopleFolder = v; await this.plugin.saveSettings(); }));

    new Setting(containerEl)
      .setName("Bullet template")
      .setDesc("Template: {{time}}, {{title}}, {{attendees}}, {{location}}")
      .addText(t => t.setValue(this.plugin.settings.bulletTemplate)
        .onChange(async v => { this.plugin.settings.bulletTemplate = v; await this.plugin.saveSettings(); }));

    // --- Self ---
    containerEl.createEl("h3", { text: "Self Exclusion" });

    new Setting(containerEl)
      .setName("Your email addresses")
      .setDesc("Comma-separated. These will be excluded from attendee lists.")
      .addText(t => t.setValue(this.plugin.settings.selfEmails.join(", "))
        .onChange(async v => {
          this.plugin.settings.selfEmails = v.split(",").map(s => s.trim()).filter(Boolean);
          await this.plugin.saveSettings();
        }));

    // --- Name mappings ---
    containerEl.createEl("h3", { text: "Name Mappings" });
    containerEl.createEl("p", {
      cls: "setting-item-description",
      text: "Map email addresses or display names to Obsidian note names."
    });

    for (let i = 0; i < this.plugin.settings.nameMappings.length; i++) {
      const mapping = this.plugin.settings.nameMappings[i];
      new Setting(containerEl)
        .addText(t => t.setPlaceholder("Email or name").setValue(mapping.from)
          .onChange(async v => { mapping.from = v; await this.plugin.saveSettings(); }))
        .addText(t => t.setPlaceholder("Note name").setValue(mapping.to)
          .onChange(async v => { mapping.to = v; await this.plugin.saveSettings(); }))
        .addButton(btn => btn.setButtonText("✕").setWarning()
          .onClick(async () => {
            this.plugin.settings.nameMappings.splice(i, 1);
            await this.plugin.saveSettings();
            this.display();
          }));
    }

    new Setting(containerEl).addButton(btn =>
      btn.setButtonText("Add Mapping").onClick(async () => {
        this.plugin.settings.nameMappings.push({ from: "", to: "" });
        await this.plugin.saveSettings();
        this.display();
      })
    );

    // --- Refresh ---
    new Setting(containerEl)
      .setName("Refresh interval (minutes)")
      .addText(t => t.setValue(String(this.plugin.settings.refreshIntervalMinutes))
        .onChange(async v => {
          const n = parseInt(v);
          if (!isNaN(n) && n > 0) {
            this.plugin.settings.refreshIntervalMinutes = n;
            await this.plugin.saveSettings();
          }
        }));
  }
}
