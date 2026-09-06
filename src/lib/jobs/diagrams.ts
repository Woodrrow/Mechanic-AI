/**
 * Diagram label keys, kept free of React so the generator and the schema can
 * use them. The drawings live in src/components/diagrams.
 */
import type { DiagramId } from "./types";

export const DIAGRAM_LABELS: Record<DiagramId, Record<string, string>> = {
  "disc-brake-corner": {
    disc: "The brake disc",
    pads: "The inner and outer pads",
    caliper: "The caliper body",
    guidePins: "The caliper guide-pin bolts",
    carrier: "The carrier bracket",
    bleedNipple: "The bleed nipple",
    hub: "The hub and steering knuckle",
  },
  "engine-bay": {
    oilFiller: "The engine oil filler cap",
    dipstick: "The engine oil dipstick",
    coolantTank: "The coolant expansion tank",
    brakeFluid: "The brake fluid reservoir",
    washerBottle: "The screenwash bottle",
    airFilterBox: "The air filter box",
    battery: "The battery",
    fuseBox: "The under-bonnet fuse box",
    engineCover: "The engine cover or the top of the engine",
  },
  "battery-terminals": {
    positiveTerminal: "The positive (+) terminal, usually under a red cover",
    negativeTerminal: "The negative (-) terminal, the one to disconnect first",
    holdDownClamp: "The clamp or bracket holding the battery down",
    vent: "The vent tube, if fitted",
  },
  "suspension-strut": {
    topMount: "The strut top mount, under the bonnet",
    spring: "The coil spring",
    damper: "The damper (shock absorber) body",
    knuckle: "The hub and steering knuckle",
    lowerArm: "The lower suspension arm",
    ballJoint: "The lower ball joint",
    dropLink: "The anti-roll bar drop link",
    trackRodEnd: "The track rod end",
  },
  "serpentine-belt": {
    crankPulley: "The crankshaft pulley, at the bottom",
    alternator: "The alternator pulley",
    acCompressor: "The air-conditioning compressor pulley",
    waterPump: "The water pump or power-steering pump pulley",
    tensioner: "The automatic tensioner",
    idler: "The idler pulley",
    belt: "The belt routing",
  },
};

export function diagramLabelKeys(diagram: DiagramId | null): string[] {
  return diagram ? Object.keys(DIAGRAM_LABELS[diagram]) : [];
}
