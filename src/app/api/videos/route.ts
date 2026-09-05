import { NextResponse, type NextRequest } from "next/server";
import { getJob } from "@/lib/jobs/catalogue";
import { getGuideStore } from "@/lib/jobs/guide-store";
import { FixedWindowRateLimiter } from "@/lib/rate-limit";
import { pickBest, searchVideos, youtubeSearchLink, type VideoMatch } from "@/lib/video/youtube";

export const dynamic = "force-dynamic";

export type VideoApiResponse =
  | { ok: true; video: VideoMatch | null; query: string; searchUrl: string; reason?: string }
  | { ok: false; error: { code: string; message: string } };

// The quota is 100 searches a day, so cache per guide and limit callers.
const cache = new Map<string, { value: VideoMatch | null; reason?: string; expires: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const limiter = new FixedWindowRateLimiter({ windowMs: 60_000, max: 10 });

function clientKey(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "anonymous";
}

export async function GET(request: NextRequest): Promise<NextResponse<VideoApiResponse>> {
  const guideId = request.nextUrl.searchParams.get("guide");
  if (!guideId) {
    return NextResponse.json({ ok: false, error: { code: "invalid_request", message: "guide is required." } }, { status: 400 });
  }
  // Only known guides may spend quota, so nobody can burn it with arbitrary queries.
  const guide = await getGuideStore().byId(guideId);
  if (!guide) {
    return NextResponse.json({ ok: false, error: { code: "unknown_guide", message: "No such guide." } }, { status: 404 });
  }
  const query = guide.content.videoQuery;
  const searchUrl = youtubeSearchLink(query);
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ ok: true, video: null, query, searchUrl, reason: "not_configured" });
  }

  const cached = cache.get(guide.id);
  if (cached && cached.expires > Date.now()) {
    return NextResponse.json({ ok: true, video: cached.value, query, searchUrl, reason: cached.reason });
  }

  if (!limiter.check(clientKey(request)).allowed) {
    return NextResponse.json({ ok: false, error: { code: "rate_limited", message: "Too many requests." } }, { status: 429 });
  }

  const result = await searchVideos(query, { apiKey });
  if (!result.ok) {
    // Cache failures briefly so a dead key or a spent quota does not hammer YouTube.
    cache.set(guide.id, { value: null, reason: result.error.kind, expires: Date.now() + 10 * 60 * 1000 });
    return NextResponse.json({ ok: true, video: null, query, searchUrl, reason: result.error.kind });
  }
  const job = getJob(guide.jobId);
  const video = pickBest(result.value, { model: guide.scope.modelRaw, jobWords: job ? job.title.toLowerCase().split(/\s+/) : [] });
  cache.set(guide.id, { value: video, expires: Date.now() + CACHE_TTL_MS });
  return NextResponse.json({ ok: true, video, query, searchUrl }, { headers: { "cache-control": "public, max-age=3600" } });
}
