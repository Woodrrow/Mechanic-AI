import { NextRequest } from "next/server";
import { afterEach, describe, expect, it } from "vitest";
import { GET } from "./route";

const get = (qs: string) => GET(new NextRequest(`http://localhost/api/videos?${qs}`));

describe("GET /api/videos", () => {
  const original = process.env.YOUTUBE_API_KEY;
  afterEach(() => {
    if (original === undefined) delete process.env.YOUTUBE_API_KEY;
    else process.env.YOUTUBE_API_KEY = original;
  });

  it("falls back to a search link when no key is configured", async () => {
    delete process.env.YOUTUBE_API_KEY;
    const body = await (await get("guide=front-brake-pads__ford__focus__2011-2018__1596__petrol")).json();
    expect(body).toMatchObject({ ok: true, video: null, reason: "not_configured" });
    expect(body.searchUrl).toContain("youtube.com/results?search_query=");
    expect(body.query).toContain("Focus");
  });

  it("only spends quota on known guides", async () => {
    expect((await get("guide=made-up")).status).toBe(404);
    expect((await get("")).status).toBe(400);
  });
});
