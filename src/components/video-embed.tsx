"use client";

import { useEffect, useState } from "react";
import type { VideoApiResponse } from "@/app/api/videos/route";
import { Card } from "./ui";

export function VideoEmbed({ guideId, vehicleTitle }: { guideId: string; vehicleTitle: string }) {
  const [state, setState] = useState<VideoApiResponse | null>(null);
  const [play, setPlay] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/videos?guide=${encodeURIComponent(guideId)}`)
      .then((r) => r.json() as Promise<VideoApiResponse>)
      .then((json) => {
        if (!cancelled) setState(json);
      })
      .catch(() => {
        if (!cancelled) setState({ ok: false, error: { code: "network", message: "Could not load the video." } });
      });
    return () => {
      cancelled = true;
    };
  }, [guideId]);

  if (!state) return <p className="text-sm text-muted">Looking for a video…</p>;
  if (!state.ok) return <p className="text-sm text-muted">{state.error.message}</p>;

  if (!state.video) {
    return (
      <Card>
        <p className="text-sm">
          {state.reason === "not_configured"
            ? "Video search is not connected on this server yet."
            : "No suitable video was found automatically."}
        </p>
        <a href={state.searchUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-semibold text-accent">
          Search YouTube for “{state.query}” →
        </a>
      </Card>
    );
  }

  const v = state.video;
  return (
    <Card>
      <p className="text-xs text-muted">Matched for {vehicleTitle} using the search “{state.query}”.</p>
      <div className="mt-2 overflow-hidden rounded-xl border border-border bg-black">
        {play ? (
          <iframe
            src={`${v.embedUrl}?autoplay=1`}
            title={v.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="aspect-video w-full"
          />
        ) : (
          <button type="button" onClick={() => setPlay(true)} className="relative block aspect-video w-full" aria-label={`Play ${v.title}`}>
            {v.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={v.thumbnailUrl} alt="" className="h-full w-full object-cover" />
            ) : null}
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="rounded-full bg-black/70 px-5 py-3 text-sm font-semibold text-white">▶ Play</span>
            </span>
          </button>
        )}
      </div>
      <p className="mt-2 text-sm font-semibold">{v.title}</p>
      <p className="text-xs text-muted">
        {v.channelTitle ?? "YouTube"} ·{" "}
        <a href={v.watchUrl} target="_blank" rel="noreferrer" className="text-accent">
          open on YouTube
        </a>
      </p>
      <p className="mt-2 text-xs text-muted">
        Videos are chosen by search, not checked by us. If the car in the video does not look like yours, stop and compare.
      </p>
    </Card>
  );
}
