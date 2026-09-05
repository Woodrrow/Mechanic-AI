/**
 * YouTube Data API v3 search. Free quota is 10,000 units a day and a search
 * costs 100, so results are cached per guide and the key stays server-side.
 * Embedding uses the privacy-enhanced youtube-nocookie.com player, which
 * needs no key at all.
 */
import { z } from "zod";
import { err, ok, type Result } from "@/lib/result";

export const YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search";

const SearchResponseSchema = z
  .object({
    items: z
      .array(
        z
          .object({
            id: z.object({ videoId: z.string().optional() }).loose(),
            snippet: z
              .object({
                title: z.string(),
                channelTitle: z.string().optional(),
                publishedAt: z.string().optional(),
                thumbnails: z
                  .object({ medium: z.object({ url: z.string() }).loose().optional(), default: z.object({ url: z.string() }).loose().optional() })
                  .loose()
                  .optional(),
              })
              .loose(),
          })
          .loose(),
      )
      .default([]),
  })
  .loose();

export interface VideoMatch {
  videoId: string;
  title: string;
  channelTitle: string | null;
  publishedAt: string | null;
  thumbnailUrl: string | null;
  watchUrl: string;
  embedUrl: string;
}

export interface VideoSearchError {
  kind: "not_configured" | "quota" | "unauthorised" | "unavailable" | "invalid_response";
  message: string;
}

export function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

/** A plain YouTube results page for when there is no key. */
export function youtubeSearchLink(query: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

export function toVideoMatch(item: z.infer<typeof SearchResponseSchema>["items"][number]): VideoMatch | null {
  const videoId = item.id.videoId;
  if (!videoId) return null;
  return {
    videoId,
    title: decodeEntities(item.snippet.title),
    channelTitle: item.snippet.channelTitle ?? null,
    publishedAt: item.snippet.publishedAt ?? null,
    thumbnailUrl: item.snippet.thumbnails?.medium?.url ?? item.snippet.thumbnails?.default?.url ?? null,
    watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
    embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
  };
}

/**
 * Prefer titles that name the model and the job. YouTube's own ranking is
 * good, but the top hit for a car model is often a review or a for-sale ad.
 */
export function pickBest(matches: VideoMatch[], hints: { model?: string | null; jobWords: string[] }): VideoMatch | null {
  if (matches.length === 0) return null;
  const score = (m: VideoMatch) => {
    const t = m.title.toLowerCase();
    let s = 0;
    if (hints.model && t.includes(hints.model.toLowerCase())) s += 2;
    for (const w of hints.jobWords) if (t.includes(w.toLowerCase())) s += 1;
    if (/for sale|review|test drive|walkaround|walk around/.test(t)) s -= 3;
    return s;
  };
  return [...matches].sort((a, b) => score(b) - score(a))[0];
}

export interface YoutubeSearchOptions {
  apiKey: string;
  fetchImpl?: typeof fetch;
  maxResults?: number;
  timeoutMs?: number;
}

export async function searchVideos(query: string, opts: YoutubeSearchOptions): Promise<Result<VideoMatch[], VideoSearchError>> {
  const url = new URL(YOUTUBE_SEARCH_URL);
  url.searchParams.set("part", "snippet");
  url.searchParams.set("type", "video");
  url.searchParams.set("videoEmbeddable", "true");
  url.searchParams.set("relevanceLanguage", "en");
  url.searchParams.set("regionCode", "GB");
  url.searchParams.set("maxResults", String(opts.maxResults ?? 6));
  url.searchParams.set("q", query);
  url.searchParams.set("key", opts.apiKey);

  const fetchImpl = opts.fetchImpl ?? fetch;
  let res: Response;
  try {
    res = await fetchImpl(url.toString(), { headers: { accept: "application/json" }, signal: AbortSignal.timeout(opts.timeoutMs ?? 8000) });
  } catch {
    return err({ kind: "unavailable", message: "Could not reach YouTube." });
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    if (res.status === 403 && /quota/i.test(body)) return err({ kind: "quota", message: "YouTube search quota used up for today." });
    if (res.status === 400 || res.status === 401 || res.status === 403) {
      return err({ kind: "unauthorised", message: "YouTube rejected the API key." });
    }
    return err({ kind: "unavailable", message: `YouTube returned HTTP ${res.status}.` });
  }
  const parsed = SearchResponseSchema.safeParse(await res.json().catch(() => null));
  if (!parsed.success) return err({ kind: "invalid_response", message: "YouTube returned an unexpected shape." });
  return ok(parsed.data.items.map(toVideoMatch).filter((m): m is VideoMatch => m !== null));
}
