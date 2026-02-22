import { requestUrl } from "obsidian";
import { CalendarFeed } from "../types";

export async function fetchICS(feed: CalendarFeed): Promise<string> {
  const response = await requestUrl({ url: feed.url, method: "GET" });
  return response.text;
}
