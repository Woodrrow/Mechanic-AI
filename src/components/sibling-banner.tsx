import type { SiblingMatch } from "@/lib/platforms/match";
import { Card } from "./ui";

/**
 * Silently substituting a different car destroys trust, so this says exactly
 * what happened: which platform, which car the guide was written for, and
 * whether the engine differs.
 */
export function SiblingBanner({ sibling, vehicleTitle }: { sibling: Omit<SiblingMatch, "guide"> & { scopeYears: string }; vehicleTitle: string }) {
  return (
    <Card className="border-accent/50 bg-accent/5">
      <p className="font-semibold">This guide is for a closely related car</p>
      <p className="mt-1 text-sm">
        No guide exists for your exact car yet. This one was written for the{" "}
        <span className="font-semibold">{sibling.guideMember}</span> ({sibling.scopeYears}), which shares the{" "}
        <span className="font-semibold">{sibling.platform.name}</span> platform with your {vehicleTitle} ({sibling.vehicleMember}).
      </p>
      {sibling.engineDiffers ? (
        <p className="mt-2 text-sm font-medium text-warn">
          The engine differs from the one this guide was written for, so anything under the bonnet may not match. Suspension, brakes and
          bodywork usually do.
        </p>
      ) : null}
      {sibling.platform.confidence === "medium" ? (
        <p className="mt-2 text-xs text-muted">
          {sibling.platform.note ?? "These cars share a platform, but component sharing varies more than usual here."}
        </p>
      ) : null}
      <p className="mt-2 text-xs text-muted">Compare the parts on your car with the diagram and the photos in the video before you start.</p>
    </Card>
  );
}
