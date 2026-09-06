/**
 * The symptom library. Each symptom carries a short structured interview and
 * a table of how each answer moves each cause's score. Deterministic and
 * hand-written: no model call, no cost, and the reasoning can be read.
 *
 * Scores are relative weights, not probabilities. A negative weight means the
 * answer argues against a cause.
 */
import type { SymptomDefinition } from "./types";

const SYMPTOM_LIST: SymptomDefinition[] = [
  {
    id: "grinding-when-braking",
    category: "braking",
    label: "Grinding or scraping when I brake",
    aliases: ["grinding brakes", "scraping noise braking", "metal on metal braking", "squealing brakes"],
    blurb: "A noise that appears or changes when you press the brake pedal.",
    priors: { "worn-brake-pads": 6, "worn-brake-discs": 4, "sticking-caliper": 2 },
    questions: [
      {
        id: "when",
        ask: "When exactly do you hear it?",
        options: [
          { id: "only-braking", label: "Only when I press the brake" },
          { id: "always-worse-braking", label: "All the time, worse when braking" },
          { id: "first-stop", label: "Mainly on the first stop of the day" },
        ],
      },
      {
        id: "character",
        ask: "What does it sound like?",
        options: [
          { id: "metallic-grind", label: "Harsh metal grinding" },
          { id: "high-squeal", label: "High-pitched squeal" },
          { id: "rhythmic", label: "A rhythmic scrape, once per wheel turn" },
        ],
      },
      {
        id: "feel",
        ask: "Does anything change in how the car feels?",
        why: "Pulling and pulsing separate a worn pad from a sticking caliper or a distorted disc.",
        options: [
          { id: "nothing", label: "No, it just sounds bad" },
          { id: "pulls", label: "It pulls to one side when I brake" },
          { id: "pulses", label: "The pedal pulses under my foot" },
          { id: "soft-pedal", label: "The pedal feels soft or goes further than it used to" },
        ],
      },
    ],
    effects: {
      "only-braking": { "worn-brake-pads": 3, "worn-brake-discs": 2 },
      "always-worse-braking": { "sticking-caliper": 3, "worn-wheel-bearing": 2, "worn-brake-pads": 1 },
      "first-stop": { "worn-brake-discs": 2, "worn-brake-pads": -1 },
      "metallic-grind": { "worn-brake-pads": 4, "worn-brake-discs": 3 },
      "high-squeal": { "worn-brake-pads": 3, "worn-brake-discs": -1 },
      rhythmic: { "worn-brake-discs": 4, "warped-discs": 2 },
      nothing: {},
      pulls: { "sticking-caliper": 8 },
      pulses: { "warped-discs": 5, "worn-brake-discs": 3 },
      "soft-pedal": { "brake-fluid-leak": 6 },
    },
  },
  {
    id: "juddering-when-braking",
    category: "braking",
    label: "The car judders or shakes when I brake",
    aliases: ["brake judder", "steering wheel shakes braking", "pedal pulses", "vibration when braking"],
    blurb: "A shake through the pedal or the steering wheel that happens while braking.",
    priors: { "warped-discs": 6, "worn-brake-discs": 3, "wheel-balance": 1 },
    questions: [
      {
        id: "where",
        ask: "Where do you feel it?",
        options: [
          { id: "pedal", label: "Through the brake pedal" },
          { id: "wheel", label: "Through the steering wheel" },
          { id: "both", label: "Both" },
        ],
      },
      {
        id: "speed",
        ask: "At what sort of speed?",
        options: [
          { id: "high-speed", label: "Mostly braking from motorway speed" },
          { id: "low-speed", label: "At any speed, even slow" },
        ],
      },
      {
        id: "not-braking",
        ask: "Does the car shake when you are NOT braking?",
        why: "A shake that is there without braking is usually the wheels, not the brakes.",
        options: [
          { id: "only-braking", label: "No, only when braking" },
          { id: "also-cruising", label: "Yes, it shakes at certain speeds anyway" },
        ],
      },
    ],
    effects: {
      pedal: { "warped-discs": 4, "worn-brake-discs": 2 },
      wheel: { "warped-discs": 4, "wheel-balance": 1 },
      both: { "warped-discs": 5 },
      "high-speed": { "warped-discs": 3 },
      "low-speed": { "worn-brake-discs": 2, "worn-suspension-joint": 2 },
      "only-braking": { "warped-discs": 4, "wheel-balance": -4, "worn-tyres": -2 },
      "also-cruising": { "wheel-balance": 6, "worn-tyres": 4, "warped-discs": -3 },
    },
  },
  {
    id: "soft-brake-pedal",
    category: "braking",
    label: "The brake pedal feels soft or goes to the floor",
    aliases: ["spongy brakes", "pedal sinks", "brakes not working properly", "long pedal"],
    blurb: "The pedal travels further than it used to, feels spongy, or slowly sinks under your foot.",
    safetyStop: {
      title: "Stop driving the car",
      body: [
        "A pedal that is soft, sinking, or travelling further than it used to means the hydraulic system is losing pressure. That gets worse without warning.",
        "Do not drive it, including to a garage. Have it recovered or looked at where it stands.",
        "Check the brake fluid reservoir level and look for wet patches inside the wheels and under the car. That is useful information for whoever fixes it.",
      ],
    },
    priors: { "brake-fluid-leak": 10 },
    questions: [],
    effects: {},
  },
  {
    id: "pulls-to-one-side",
    category: "handling",
    label: "The car pulls to one side",
    aliases: ["car pulls left", "car pulls right", "steering wheel off centre", "wanders"],
    blurb: "You have to hold the wheel against a pull on a flat, straight road.",
    priors: { "wheel-alignment": 4, "worn-tyres": 3, "sticking-caliper": 2 },
    questions: [
      {
        id: "when-pulls",
        ask: "When does it pull?",
        options: [
          { id: "all-the-time", label: "All the time" },
          { id: "under-braking", label: "Only when I brake" },
          { id: "under-acceleration", label: "Mainly when accelerating" },
        ],
      },
      {
        id: "tyres",
        ask: "Have you checked the tyre pressures recently?",
        why: "One soft tyre is the commonest cause and it is free to rule out.",
        options: [
          { id: "pressures-fine", label: "Yes, they are all correct" },
          { id: "pressures-unknown", label: "No, or not sure" },
        ],
      },
      {
        id: "hot-wheel",
        ask: "After a drive, is one wheel much hotter than the others?",
        why: "A hot wheel means a brake is dragging on that corner.",
        options: [
          { id: "hot-wheel-yes", label: "Yes, one is noticeably hotter" },
          { id: "hot-wheel-no", label: "No, they feel similar" },
          { id: "hot-wheel-unknown", label: "I have not checked" },
        ],
      },
    ],
    effects: {
      "all-the-time": { "wheel-alignment": 4, "worn-tyres": 2 },
      "under-braking": { "sticking-caliper": 6, "worn-brake-pads": 2, "wheel-alignment": -2 },
      "under-acceleration": { "worn-suspension-joint": 3, "wheel-alignment": 2 },
      "pressures-fine": { "wheel-alignment": 2 },
      "pressures-unknown": { "worn-tyres": 3 },
      "hot-wheel-yes": { "sticking-caliper": 6, "burning-smell-brakes": 3 },
      "hot-wheel-no": { "sticking-caliper": -3 },
      "hot-wheel-unknown": {},
    },
  },
  {
    id: "vibration-at-speed",
    category: "handling",
    label: "Vibration or shaking at speed",
    aliases: ["shakes at 60", "wobble at speed", "steering wheel vibration", "juddering at 70"],
    blurb: "A shake that comes in around a certain speed, whether you are braking or not.",
    priors: { "wheel-balance": 6, "worn-tyres": 4, "worn-suspension-joint": 2 },
    questions: [
      {
        id: "speed-band",
        ask: "Does it come and go with speed?",
        options: [
          { id: "one-band", label: "It appears around one speed and fades above and below" },
          { id: "gets-worse", label: "It just gets worse the faster I go" },
        ],
      },
      {
        id: "braking-effect",
        ask: "Does braking change it?",
        options: [
          { id: "worse-braking", label: "It is much worse when braking" },
          { id: "no-change", label: "Braking makes no difference" },
        ],
      },
      {
        id: "recent",
        ask: "Did it start after anything in particular?",
        options: [
          { id: "after-tyres", label: "After new tyres or a wheel came off" },
          { id: "after-pothole", label: "After hitting a pothole or a kerb" },
          { id: "gradual", label: "It came on gradually" },
        ],
      },
    ],
    effects: {
      "one-band": { "wheel-balance": 5 },
      "gets-worse": { "worn-tyres": 3, "worn-wheel-bearing": 3, "worn-suspension-joint": 2 },
      "worse-braking": { "warped-discs": 6, "wheel-balance": -2 },
      "no-change": { "wheel-balance": 3, "worn-tyres": 2 },
      "after-tyres": { "wheel-balance": 6 },
      "after-pothole": { "wheel-alignment": 4, "worn-tyres": 3, "wheel-balance": 3 },
      gradual: { "worn-tyres": 2, "worn-suspension-joint": 2 },
    },
  },
  {
    id: "knocking-over-bumps",
    category: "noises",
    label: "Knocking or clonking over bumps",
    aliases: ["clunk over bumps", "rattle over speed bumps", "suspension noise", "knocking noise"],
    blurb: "A knock or clonk from the suspension when the road is uneven.",
    priors: { "worn-suspension-joint": 6, "worn-shock-absorber": 2, "loose-heat-shield": 1 },
    questions: [
      {
        id: "where-knock",
        ask: "Where does it seem to come from?",
        options: [
          { id: "front", label: "The front" },
          { id: "rear", label: "The rear" },
          { id: "underneath", label: "Somewhere underneath the middle" },
        ],
      },
      {
        id: "steering-effect",
        ask: "Does it happen when you turn the wheel while stationary?",
        options: [
          { id: "turning-yes", label: "Yes, I can hear it turning on the spot" },
          { id: "turning-no", label: "No, only over bumps" },
        ],
      },
      {
        id: "bounce",
        ask: "If you push down hard on that corner and let go, what happens?",
        why: "A corner that keeps bouncing has a tired damper.",
        options: [
          { id: "settles", label: "It settles straight away" },
          { id: "bounces", label: "It bounces two or three times" },
          { id: "not-tried", label: "I have not tried" },
        ],
      },
    ],
    effects: {
      front: { "worn-suspension-joint": 3, "steering-joint-wear": 2 },
      rear: { "worn-shock-absorber": 3, "worn-suspension-joint": 2 },
      underneath: { "loose-heat-shield": 5, "exhaust-leak": 3 },
      "turning-yes": { "steering-joint-wear": 4, "worn-suspension-joint": 3 },
      "turning-no": { "worn-shock-absorber": 1 },
      settles: { "worn-shock-absorber": -3 },
      bounces: { "worn-shock-absorber": 6 },
      "not-tried": {},
    },
  },
  {
    id: "humming-at-speed",
    category: "noises",
    label: "A hum or drone that rises with speed",
    aliases: ["droning noise", "humming noise", "roaring at speed", "aeroplane noise"],
    blurb: "A noise that tracks road speed rather than engine speed.",
    priors: { "worn-wheel-bearing": 6, "worn-tyres": 4 },
    questions: [
      {
        id: "swerve",
        ask: "On a quiet road, gently weave left and right. Does the noise change?",
        why: "Loading a bearing by turning makes it louder. This is the single best test.",
        options: [
          { id: "changes", label: "Yes, louder one way and quieter the other" },
          { id: "no-change-swerve", label: "No, it stays the same" },
          { id: "not-tried-swerve", label: "I have not tried" },
        ],
      },
      {
        id: "engine-or-road",
        ask: "Does the noise follow road speed or engine speed?",
        options: [
          { id: "road-speed", label: "Road speed: it stays the same if I change gear" },
          { id: "engine-speed", label: "Engine speed: it changes when I rev" },
        ],
      },
    ],
    effects: {
      changes: { "worn-wheel-bearing": 7, "worn-tyres": -1 },
      "no-change-swerve": { "worn-tyres": 4, "worn-wheel-bearing": -2 },
      "not-tried-swerve": {},
      "road-speed": { "worn-wheel-bearing": 3, "worn-tyres": 3 },
      "engine-speed": { "exhaust-leak": 6, "worn-aux-belt": 3, "worn-wheel-bearing": -4 },
    },
  },
  {
    id: "wont-start",
    category: "starting",
    label: "The car will not start",
    aliases: ["wont start", "no start", "clicking when I turn the key", "engine turns but wont fire", "dead"],
    blurb: "Turning the key does not get the engine running.",
    priors: { "flat-battery": 5, "bad-battery-connection": 2, "starter-motor": 1 },
    questions: [
      {
        id: "what-happens",
        ask: "What happens when you turn the key?",
        why: "This one answer separates an electrical problem from a fuel or spark problem.",
        options: [
          { id: "nothing", label: "Nothing at all, no lights, no noise" },
          { id: "rapid-click", label: "Rapid clicking" },
          { id: "single-click", label: "One loud click, then nothing" },
          { id: "turns-not-firing", label: "The engine turns over but never fires" },
          { id: "slow-crank", label: "It turns over slowly, then gives up" },
        ],
      },
      {
        id: "lights",
        ask: "Do the dashboard lights and headlights look normal?",
        options: [
          { id: "lights-bright", label: "Bright and normal" },
          { id: "lights-dim", label: "Dim, or they fade when I turn the key" },
          { id: "lights-none", label: "Nothing lights up at all" },
        ],
      },
      {
        id: "history",
        ask: "Anything else you have noticed lately?",
        multi: true,
        options: [
          { id: "getting-slower", label: "It has been cranking more slowly for a while" },
          { id: "battery-light", label: "The battery warning light has come on while driving" },
          { id: "short-trips", label: "The car mostly does short trips" },
          { id: "left-standing", label: "It has been standing unused for weeks" },
          { id: "key-symbol", label: "There is a key or padlock symbol on the dash" },
        ],
      },
    ],
    effects: {
      nothing: { "flat-battery": 5, "bad-battery-connection": 5 },
      "rapid-click": { "flat-battery": 7, "bad-battery-connection": 4, "starter-motor": -1 },
      "single-click": { "starter-motor": 6, "bad-battery-connection": 3, "flat-battery": 1 },
      "turns-not-firing": { "fuel-delivery": 5, immobiliser: 4, "misfire-ignition": 3, "flat-battery": -4 },
      "slow-crank": { "flat-battery": 6, "bad-battery-connection": 3 },
      "lights-bright": { "starter-motor": 3, immobiliser: 2, "flat-battery": -2 },
      "lights-dim": { "flat-battery": 5, "bad-battery-connection": 3 },
      "lights-none": { "flat-battery": 4, "bad-battery-connection": 6 },
      "getting-slower": { "flat-battery": 4 },
      "battery-light": { "failing-alternator": 10, "flat-battery": -2 },
      "short-trips": { "flat-battery": 3 },
      "left-standing": { "flat-battery": 4 },
      "key-symbol": { immobiliser: 7 },
    },
  },
  {
    id: "engine-warning-light",
    category: "warning_lights",
    label: "The engine warning light is on",
    aliases: ["check engine light", "engine management light", "orange engine symbol", "EML"],
    blurb: "The orange engine-shaped light on the dash is lit or flashing.",
    priors: { "misfire-ignition": 3, "dpf-blocked": 2, "air-leak": 2 },
    questions: [
      {
        id: "steady-or-flashing",
        ask: "Is the light steady or flashing?",
        why: "A flashing engine light means an active misfire that can damage the catalytic converter. That changes how urgent this is.",
        options: [
          { id: "steady", label: "Steady" },
          { id: "flashing", label: "Flashing" },
        ],
      },
      {
        id: "how-drives",
        ask: "How does the car drive?",
        options: [
          { id: "drives-normally", label: "Completely normally" },
          { id: "lumpy", label: "Lumpy or shaking, especially at idle" },
          { id: "no-power", label: "Down on power, or stuck in a limp mode" },
        ],
      },
      {
        id: "usage",
        ask: "What sort of driving does the car mostly do?",
        options: [
          { id: "mostly-short", label: "Short local journeys" },
          { id: "mixed", label: "A mix" },
          { id: "mostly-motorway", label: "Mostly longer motorway runs" },
        ],
      },
    ],
    effects: {
      steady: {},
      flashing: { "misfire-ignition": 7 },
      "drives-normally": { "air-leak": 2, "dpf-blocked": 1 },
      lumpy: { "misfire-ignition": 6, "air-leak": 3 },
      "no-power": { "dpf-blocked": 5, "air-leak": 2 },
      "mostly-short": { "dpf-blocked": 4, "flat-battery": 1 },
      mixed: {},
      "mostly-motorway": { "dpf-blocked": -3 },
    },
  },
  {
    id: "overheating",
    category: "running",
    label: "The engine is overheating",
    aliases: ["temperature gauge high", "steam from bonnet", "running hot", "coolant warning"],
    blurb: "The temperature gauge is climbing past normal, or a coolant warning is lit.",
    safetyStop: {
      title: "Stop and let it cool",
      body: [
        "Pull over safely and switch the engine off. An overheating engine can destroy itself in minutes, and the repair bill goes from a hose to an engine.",
        "Never open the coolant cap while the engine is hot. The system is pressurised and the escaping coolant will scald you badly.",
        "Once it is stone cold, check the coolant level in the expansion tank and look underneath for drips. If it is empty or emptying, do not keep driving it.",
      ],
    },
    priors: { "overheating-cooling": 8, "coolant-leak": 5 },
    questions: [
      {
        id: "when-hot",
        ask: "When does it get hot?",
        options: [
          { id: "in-traffic", label: "Mainly in slow traffic" },
          { id: "at-speed", label: "Mainly at speed or under load" },
          { id: "always-hot", label: "All the time" },
        ],
      },
      {
        id: "coolant-level",
        ask: "What is the coolant level like when the engine is cold?",
        options: [
          { id: "level-ok", label: "Between MIN and MAX" },
          { id: "level-low", label: "Below MIN or empty" },
          { id: "level-unknown", label: "I have not checked" },
        ],
      },
    ],
    effects: {
      "in-traffic": { "overheating-cooling": 4 },
      "at-speed": { "overheating-cooling": 3, "coolant-leak": 2 },
      "always-hot": { "overheating-cooling": 3, "coolant-leak": 3 },
      "level-ok": { "overheating-cooling": 3, "coolant-leak": -2 },
      "level-low": { "coolant-leak": 7 },
      "level-unknown": {},
    },
  },
  {
    id: "loss-of-power",
    category: "running",
    label: "The car feels down on power",
    aliases: ["no power", "sluggish", "wont accelerate", "limp mode", "flat"],
    blurb: "The car will not pull as it used to, or it has gone into a reduced-power mode.",
    priors: { "dpf-blocked": 3, "dirty-air-filter": 3, "misfire-ignition": 3, "clutch-wear": 2 },
    questions: [
      {
        id: "revs",
        ask: "What do the revs do when you accelerate hard?",
        why: "Revs that climb without speed is a clutch. Revs that will not climb is the engine.",
        options: [
          { id: "revs-climb-no-speed", label: "They climb but the car does not speed up" },
          { id: "revs-flat", label: "The engine will not rev freely" },
          { id: "revs-normal", label: "They behave normally, it just feels slow" },
        ],
      },
      {
        id: "onset",
        ask: "How did it come on?",
        options: [
          { id: "suddenly", label: "Suddenly" },
          { id: "gradually", label: "Gradually, over months" },
        ],
      },
      {
        id: "light-on",
        ask: "Is a warning light on?",
        options: [
          { id: "light-yes", label: "Yes" },
          { id: "light-no", label: "No" },
        ],
      },
    ],
    effects: {
      "revs-climb-no-speed": { "clutch-wear": 8, "dpf-blocked": -2 },
      "revs-flat": { "dpf-blocked": 4, "air-leak": 3, "misfire-ignition": 2 },
      "revs-normal": { "dirty-air-filter": 4, "worn-tyres": 1 },
      suddenly: { "misfire-ignition": 3, "dpf-blocked": 2, "dirty-air-filter": -2 },
      gradually: { "dirty-air-filter": 4, "clutch-wear": 2, "dpf-blocked": 2 },
      "light-yes": { "dpf-blocked": 3, "misfire-ignition": 3 },
      "light-no": { "dirty-air-filter": 3, "clutch-wear": 2 },
    },
  },
  {
    id: "puddle-under-car",
    category: "fluids_smells",
    label: "There is a puddle or drip under the car",
    aliases: ["leaking fluid", "oil on the drive", "puddle", "dripping"],
    blurb: "Something is dripping onto the ground where you park.",
    priors: { "engine-oil-leak": 4, "coolant-leak": 3 },
    questions: [
      {
        id: "colour",
        ask: "What colour is it?",
        why: "Colour identifies the fluid faster than anything else.",
        options: [
          { id: "black-brown", label: "Black or dark brown" },
          { id: "pink-green-orange", label: "Pink, green or orange" },
          { id: "clear-water", label: "Clear and watery" },
          { id: "amber-oily", label: "Light amber and oily" },
          { id: "smells-fuel", label: "It smells strongly of fuel" },
        ],
      },
      {
        id: "position",
        ask: "Where under the car is it?",
        options: [
          { id: "front-middle", label: "Front, under the engine" },
          { id: "behind-front-wheel", label: "Just behind a front wheel" },
          { id: "rear", label: "Towards the back" },
        ],
      },
    ],
    effects: {
      "black-brown": { "engine-oil-leak": 7 },
      "pink-green-orange": { "coolant-leak": 8, "overheating-cooling": 2 },
      "clear-water": { "engine-oil-leak": -3, "coolant-leak": -3 },
      "amber-oily": { "brake-fluid-leak": 4, "engine-oil-leak": 2 },
      "smells-fuel": { "fuel-leak": 9 },
      "front-middle": { "engine-oil-leak": 3, "coolant-leak": 3 },
      "behind-front-wheel": { "brake-fluid-leak": 4 },
      rear: { "fuel-leak": 3, "exhaust-leak": 1 },
    },
  },
  {
    id: "burning-smell",
    category: "fluids_smells",
    label: "A burning smell",
    aliases: ["smells of burning", "hot smell", "acrid smell", "smoke"],
    blurb: "Something smells like it is burning, during or after a drive.",
    priors: { "burning-smell-brakes": 4, "engine-oil-leak": 3, "clutch-wear": 2 },
    questions: [
      {
        id: "smell-type",
        ask: "What does it smell like?",
        options: [
          { id: "acrid-sharp", label: "Sharp and acrid, like hot metal" },
          { id: "oily", label: "Hot oil" },
          { id: "sweet", label: "Sweet, almost syrupy" },
          { id: "electrical", label: "Burning plastic or electrical" },
        ],
      },
      {
        id: "smell-when",
        ask: "When do you notice it?",
        options: [
          { id: "after-hills", label: "After a long downhill or heavy braking" },
          { id: "in-traffic-smell", label: "In slow traffic" },
          { id: "pulling-away", label: "When pulling away or on hills" },
        ],
      },
    ],
    effects: {
      "acrid-sharp": { "burning-smell-brakes": 5, "sticking-caliper": 3 },
      oily: { "engine-oil-leak": 6 },
      sweet: { "coolant-leak": 7, "overheating-cooling": 3 },
      electrical: { "failing-alternator": 3 },
      "after-hills": { "burning-smell-brakes": 4 },
      "in-traffic-smell": { "overheating-cooling": 3, "engine-oil-leak": 2 },
      "pulling-away": { "clutch-wear": 6 },
    },
  },
];

export const SYMPTOMS: Record<string, SymptomDefinition> = Object.fromEntries(SYMPTOM_LIST.map((s) => [s.id, s]));
export const SYMPTOM_IDS = SYMPTOM_LIST.map((s) => s.id);

export function getSymptom(id: string): SymptomDefinition | null {
  return SYMPTOMS[id] ?? null;
}

export function symptomsByCategory(): Array<{ category: SymptomDefinition["category"]; symptoms: SymptomDefinition[] }> {
  const groups = new Map<SymptomDefinition["category"], SymptomDefinition[]>();
  for (const symptom of SYMPTOM_LIST) {
    const list = groups.get(symptom.category) ?? [];
    list.push(symptom);
    groups.set(symptom.category, list);
  }
  return [...groups.entries()].map(([category, symptoms]) => ({ category, symptoms }));
}

/** Simple substring search over labels, blurbs and aliases. */
export function searchSymptoms(query: string): SymptomDefinition[] {
  const q = query.toLowerCase().trim();
  if (!q) return SYMPTOM_LIST;
  const words = q.split(/\s+/).filter((w) => w.length > 2);
  return SYMPTOM_LIST.map((symptom) => {
    const haystack = [symptom.label, symptom.blurb, ...symptom.aliases].join(" ").toLowerCase();
    let score = haystack.includes(q) ? 10 : 0;
    for (const word of words) if (haystack.includes(word)) score += 1;
    return { symptom, score };
  })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.symptom);
}
