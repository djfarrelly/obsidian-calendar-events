# Obsidian Calendar Events

An [Obsidian](https://obsidian.md) plugin that displays your calendar events from ICS feeds in the sidebar. Click an event to log it as a bullet in your daily note with backlinks to attendees.

![Obsidian](https://img.shields.io/badge/Obsidian-0.15.0+-purple)
![License](https://img.shields.io/badge/license-MIT-blue)

## Features

- **ICS feed support** — Connect any ICS/iCal feed (Google Calendar, iCloud, Outlook, Fastmail, etc.)
- **Sidebar view** — See today's events at a glance, navigate between dates
- **Click to log** — Click an event to append it as a bullet to your daily note
- **Attendee backlinks** — Automatically creates `[[people/Name]]` backlinks for each attendee
- **Name mappings** — Map email addresses or display names to specific note names
- **Self exclusion** — Filter yourself out of attendee lists
- **Multiple feeds** — Color-coded support for multiple calendars
- **Mobile compatible** — Uses Obsidian's `requestUrl` API, works on iOS and Android
- **Auto-refresh** — Configurable refresh interval

## Installation

### Manual Installation

1. Download the latest release (`main.js`, `manifest.json`, `styles.css`)
2. Create a folder: `<your-vault>/.obsidian/plugins/calendar-events/`
3. Copy the three files into that folder
4. Restart Obsidian and enable "Calendar Events" in Settings → Community Plugins

### Build from Source

```bash
git clone https://github.com/djfarrelly/obsidian-calendar-events.git
cd obsidian-calendar-events
npm install
npm run build
```

Then copy `main.js`, `manifest.json`, and `styles.css` to your vault's plugin directory.

## Getting Your ICS Feed URL

### Google Calendar
1. Open [Google Calendar](https://calendar.google.com) → Settings
2. Select your calendar → "Integrate calendar"
3. Copy the "Secret address in iCal format" URL

### iCloud Calendar
1. Open [iCloud Calendar](https://www.icloud.com/calendar/) → Share calendar
2. Enable "Public Calendar"
3. Copy the URL

### Outlook / Office 365
1. Open Outlook → Calendar → Settings
2. Shared calendars → Publish a calendar
3. Copy the ICS link

### Fastmail
1. Open Fastmail → Calendars → Sharing
2. Copy the ICS feed URL

## Configuration

Open Settings → Calendar Events:

| Setting | Description | Default |
|---------|-------------|---------|
| **Feeds** | ICS feed URLs with name and color | — |
| **Daily note folder** | Where your daily notes live | `""` (vault root) |
| **Daily note format** | Date format for daily note filenames | `YYYY-MM-DD` |
| **Meeting heading** | Heading to append events under | `## Meetings` |
| **People folder** | Folder for person notes (backlinks) | `people` |
| **Self emails** | Your email(s) to exclude from attendees | — |
| **Name mappings** | Map emails/names → note names | — |
| **Refresh interval** | Auto-refresh interval in minutes | `30` |
| **Bullet template** | Template for the daily note bullet | `- **{{time}}** {{title}} {{attendees}}` |

### Bullet Template Variables

- `{{time}}` — Event start time (e.g. `9:00 AM`)
- `{{title}}` — Event title
- `{{attendees}}` — Comma-separated backlinks to attendee notes
- `{{location}}` — Event location
- `{{description}}` — Event description
- `{{end}}` — Event end time
- `{{duration}}` — Event duration (e.g. `30m`, `1h`)

## Usage

1. **Add a feed** — Go to Settings → Calendar Events → Add Feed
2. **Open the sidebar** — Click the calendar-clock icon in the ribbon, or use the command palette: "Show calendar events"
3. **Browse events** — Use ‹/› to navigate dates, click "Today" to jump back
4. **Log an event** — Click any event to append it to your daily note

### Example Daily Note Output

```markdown
## Meetings
- **9:00 AM** Sprint Planning [[people/Alice Chen]], [[people/Bob Park]]
- **2:00 PM** 1:1 with Dana [[people/Dana Lee]]
```

## Companion Plugins

This plugin works great alongside:
- [Calendar](https://github.com/liamcain/obsidian-calendar-plugin) — Monthly calendar view in the sidebar
- [Periodic Notes](https://github.com/liamcain/obsidian-periodic-notes) — Daily/weekly/monthly note templates

## Development

```bash
# Install dependencies
npm install

# Build (one-time)
npm run build

# Dev mode (watch for changes)
npm run dev
```

### Project Structure

```
src/
├── main.ts              # Plugin lifecycle, commands
├── types.ts             # Types and settings defaults
├── ics/
│   ├── fetcher.ts       # ICS feed fetching via requestUrl
│   ├── parser.ts        # ical.js parsing with recurrence
│   └── cache.ts         # In-memory event cache
├── notes/
│   └── creator.ts       # Daily note bullet creation
└── ui/
    ├── sidebar.ts       # Sidebar view (ItemView)
    └── settings.ts      # Settings tab
```

## License

MIT — see [LICENSE](LICENSE).
