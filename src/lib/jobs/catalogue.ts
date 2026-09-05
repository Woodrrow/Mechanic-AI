/**
 * The job catalogue. Phase 3 has exactly one entry. What lives here is
 * generic to the job, not to a car: the vehicle-specific content is the
 * generated (and reviewed) guide.
 */
import type { JobDefinition, JobId } from "./types";

const FRONT_BRAKE_PADS: JobDefinition = {
  id: "front-brake-pads",
  title: "Front brake pads",
  system: "brakes",
  tier: "amber",
  blurb: "Replace the friction pads on both front wheels. No hydraulic parts are opened.",
  typicalTimeMinutes: { min: 60, max: 120 },
  diagram: "disc-brake-corner",
  motRuleIds: ["brakes.pads_thin", "brakes.disc_worn", "brakes.uneven"],
  baseTools: [
    { name: "Trolley jack", why: "To lift the car. It lifts; it never holds.", priceGbp: { min: 30, max: 80 } },
    { name: "Two axle stands", why: "The car sits on these while you work. Non-negotiable.", priceGbp: { min: 25, max: 50 } },
    { name: "Wheel chocks", why: "Stop the car rolling while it is on stands.", priceGbp: { min: 8, max: 20 } },
    {
      name: "Socket set with a breaker bar, or the car's wheel brace",
      why: "Wheel bolts and the caliper bolts.",
      priceGbp: { min: 20, max: 60 },
    },
    {
      name: "Torque wrench",
      why: "The caliper and wheel bolts must be tightened to the manual's figure, not to feel.",
      priceGbp: { min: 25, max: 60 },
    },
    { name: "Torch or head torch", priceGbp: { min: 5, max: 15 } },
    { name: "Gloves and eye protection", why: "Brake dust and brake cleaner are both nasty.", priceGbp: { min: 5, max: 15 } },
    { name: "Cable tie, bungee or wire", why: "To hang the caliper so it never dangles by its hose.", priceGbp: { min: 1, max: 5 } },
  ],
  consumables: [
    { name: "Brake cleaner", priceGbp: { min: 4, max: 8 } },
    { name: "Copper or ceramic brake grease", why: "For the pad backs and ears only, never the friction face.", priceGbp: { min: 3, max: 8 } },
    { name: "Wire brush", why: "To clean the carrier channels the pads slide in.", priceGbp: { min: 2, max: 5 } },
  ],
  safety: {
    dangers: [
      "Cars fall off jacks. People are killed under them every year.",
      "Brakes done wrong can fail on the road and hurt other people, not just you.",
    ],
    requirements: [
      "Level, firm ground. Never a slope, never soft ground.",
      "Axle stands under the car before any part of you goes near it. A jack lifts; it does not hold.",
      "Wheels chocked and the handbrake on.",
      "A torque wrench and the caliper and wheel bolt figures from the manual. This guide will not give you numbers it cannot source.",
      "Time to do both sides and take a slow test drive afterwards. Do not start at dusk.",
    ],
    acknowledgement: "I have read this, I have axle stands and chocks, and I will stop if anything does not match the guide.",
  },
};

export const JOBS: Record<JobId, JobDefinition> = {
  "front-brake-pads": FRONT_BRAKE_PADS,
};

export function getJob(id: string): JobDefinition | null {
  return (JOBS as Record<string, JobDefinition>)[id] ?? null;
}

export function isJobId(id: string): id is JobId {
  return id in JOBS;
}

/** MOT rule id -> the job that addresses it. */
export function jobForRule(ruleId: string | null): JobDefinition | null {
  if (!ruleId) return null;
  return Object.values(JOBS).find((j) => j.motRuleIds.includes(ruleId)) ?? null;
}
