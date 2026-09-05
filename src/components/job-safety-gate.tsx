"use client";

import { useState } from "react";
import type { JobDefinition } from "@/lib/jobs/types";
import { Badge, Button, Card } from "./ui";

const TIER = {
  green: { label: "Green", tone: "ok" as const, hint: "Beginner-safe" },
  amber: { label: "Amber", tone: "warn" as const, hint: "Doable at home with care and the right kit" },
  red: { label: "Red", tone: "danger" as const, hint: "Leave this to a professional" },
};

export function JobSafetyGate({ job, onAcknowledge }: { job: JobDefinition; onAcknowledge: () => void }) {
  const [checked, setChecked] = useState(false);
  const tier = TIER[job.tier];
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge tone={tier.tone}>{tier.label}</Badge>
        <span className="text-sm text-muted">{tier.hint}</span>
      </div>
      <Card className="border-warn/50 bg-warn-bg">
        <h2 className="text-lg font-bold text-warn">Read this before the guide unlocks</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          {job.safety.dangers.map((d) => (
            <li key={d} className="font-medium">
              {d}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm font-semibold">You need all of these:</p>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
          {job.safety.requirements.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </Card>
      <label className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-sm">
        <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} className="mt-0.5 h-5 w-5" />
        <span>{job.safety.acknowledgement}</span>
      </label>
      <Button onClick={onAcknowledge} disabled={!checked}>
        Open the guide
      </Button>
    </div>
  );
}
