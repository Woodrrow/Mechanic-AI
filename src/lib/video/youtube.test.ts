import { describe, expect, it } from "vitest";
import { decodeEntities, pickBest, searchVideos, youtubeSearchLink, type VideoMatch } from "./youtube";

type Handler = (url: string) => Response;
const fakeFetch = (handler: Handler): typeof fetch =>
  (async (input: string | URL | Request) => handler(typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url)) as unknown as typeof fetch;

const item = (videoId: string, title: string, channelTitle = "Garage Channel") => ({
  id: { kind: "youtube#video", videoId },
  snippet: { title, channelTitle, publishedAt: "2024-01-01T00:00:00Z", thumbnails: { medium: { url: `https://i.ytimg.com/vi/${videoId}/mq.jpg` } } },
});

describe("searchVideos", () => {
  it("builds the request and maps results", async () => {
    let url = "";
    const result = await searchVideos("Ford Focus front brake pads", {
      apiKey: "KEY",
      fetchImpl: fakeFetch((u) => {
        url = u;
        return new Response(JSON.stringify({ items: [item("abc123", "Ford Focus Mk3 Front Brake Pads &amp; Discs")] }), { status: 200 });
      }),
    });
    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe("https://www.googleapis.com/youtube/v3/search");
    expect(parsed.searchParams.get("key")).toBe("KEY");
    expect(parsed.searchParams.get("q")).toBe("Ford Focus front brake pads");
    expect(parsed.searchParams.get("type")).toBe("video");
    expect(parsed.searchParams.get("videoEmbeddable")).toBe("true");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value[0]).toMatchObject({
      videoId: "abc123",
      title: "Ford Focus Mk3 Front Brake Pads & Discs",
      channelTitle: "Garage Channel",
      embedUrl: "https://www.youtube-nocookie.com/embed/abc123",
      watchUrl: "https://www.youtube.com/watch?v=abc123",
      thumbnailUrl: "https://i.ytimg.com/vi/abc123/mq.jpg",
    });
  });

  it("distinguishes a spent quota from a bad key", async () => {
    const quota = await searchVideos("q", {
      apiKey: "k",
      fetchImpl: fakeFetch(() => new Response(JSON.stringify({ error: { errors: [{ reason: "quotaExceeded" }], message: "The request cannot be completed because you have exceeded your quota." } }), { status: 403 })),
    });
    expect(!quota.ok && quota.error.kind).toBe("quota");
    const bad = await searchVideos("q", { apiKey: "k", fetchImpl: fakeFetch(() => new Response("{}", { status: 400 })) });
    expect(!bad.ok && bad.error.kind).toBe("unauthorised");
  });
});

describe("pickBest", () => {
  const v = (id: string, title: string): VideoMatch => ({
    videoId: id,
    title,
    channelTitle: null,
    publishedAt: null,
    thumbnailUrl: null,
    watchUrl: "",
    embedUrl: "",
  });

  it("prefers the model and job words and penalises reviews and adverts", () => {
    const best = pickBest(
      [v("1", "2015 Ford Focus review"), v("2", "Ford Focus Mk3 front brake pads replacement"), v("3", "Focus for sale")],
      { model: "FOCUS", jobWords: ["front", "brake", "pads"] },
    );
    expect(best?.videoId).toBe("2");
    expect(pickBest([], { model: "x", jobWords: [] })).toBeNull();
  });

  it("decodes entities and builds a search link", () => {
    expect(decodeEntities("Pads &amp; Discs &#39;19")).toBe("Pads & Discs '19");
    expect(youtubeSearchLink("a b")).toBe("https://www.youtube.com/results?search_query=a%20b");
  });
});
