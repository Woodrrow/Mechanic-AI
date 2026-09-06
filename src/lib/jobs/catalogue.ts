/**
 * The job catalogue. Generic to the job, never to a car: vehicle-specific
 * content is the generated, reviewed guide. Tiers follow the brief:
 * GREEN beginner-safe, AMBER stands-and-chocks work, RED refuse and refer out.
 * Prices are indicative UK ranges for planning, not quotes.
 */
import type { DefectLocation } from "@/lib/mot/types";
import type { JobDefinition, JobSafety, ToolItem } from "./types";

// ---- shared tool groups ----
const JACK: ToolItem = { name: "Trolley jack", why: "To lift the car. It lifts; it never holds.", priceGbp: { min: 30, max: 80 } };
const STANDS: ToolItem = { name: "Two axle stands", why: "The car sits on these while you work. Non-negotiable.", priceGbp: { min: 25, max: 50 } };
const CHOCKS: ToolItem = { name: "Wheel chocks", why: "Stop the car rolling while it is on stands.", priceGbp: { min: 8, max: 20 } };
const SOCKETS: ToolItem = { name: "Socket set with a breaker bar", why: "Wheel bolts and most fasteners.", priceGbp: { min: 20, max: 60 } };
const SPANNERS: ToolItem = { name: "Metric spanner set", priceGbp: { min: 10, max: 40 } };
const TORQUE: ToolItem = { name: "Torque wrench", why: "Bolts that hold the car together are tightened to the manual's figure, not to feel.", priceGbp: { min: 25, max: 60 } };
const TORCH: ToolItem = { name: "Torch or head torch", priceGbp: { min: 5, max: 15 } };
const PPE: ToolItem = { name: "Gloves and eye protection", priceGbp: { min: 5, max: 15 } };
const SCREWDRIVERS: ToolItem = { name: "Screwdrivers and a trim tool", priceGbp: { min: 5, max: 20 } };
const DRAIN_PAN: ToolItem = { name: "Drain pan (larger than you think)", priceGbp: { min: 8, max: 20 } };
const FUNNEL: ToolItem = { name: "Funnel", priceGbp: { min: 2, max: 6 } };
const OBD: ToolItem = { name: "OBD-II reader or Bluetooth dongle with a phone app", why: "Reads the fault codes the car has stored.", priceGbp: { min: 10, max: 40 } };
const BALL_JOINT_SPLITTER: ToolItem = { name: "Ball-joint splitter", priceGbp: { min: 8, max: 25 } };
const BRAKE_CLEANER: ToolItem = { name: "Brake cleaner", priceGbp: { min: 4, max: 8 } };
const BRAKE_GREASE: ToolItem = { name: "Copper or ceramic brake grease", why: "For the pad backs and ears only, never the friction face.", priceGbp: { min: 3, max: 8 } };
const WIRE_BRUSH: ToolItem = { name: "Wire brush", priceGbp: { min: 2, max: 5 } };
const RAGS: ToolItem = { name: "Rags and hand cleaner", priceGbp: { min: 3, max: 8 } };
const LIFT_KIT = [JACK, STANDS, CHOCKS];
const WHEEL_KIT = [SOCKETS, TORQUE];

// ---- safety templates ----
const GREEN_SAFETY: JobSafety = {
  dangers: ["A hot engine burns, and a running engine has moving belts and fans that take fingers."],
  requirements: [
    "Engine off, keys out of the ignition, handbrake on.",
    "Let the engine cool before opening anything that holds hot fluid.",
    "Good light and a clear space around the car.",
  ],
  acknowledgement: "I have read this and will stop if anything does not match the guide.",
};

const AMBER_LIFT_SAFETY: JobSafety = {
  dangers: [
    "Cars fall off jacks. People are killed under them every year.",
    "Work on brakes, suspension or steering done wrong can fail on the road and hurt other people, not just you.",
  ],
  requirements: [
    "Level, firm ground. Never a slope, never soft ground.",
    "Axle stands under the car before any part of you goes near it. A jack lifts; it does not hold.",
    "Wheels chocked and the handbrake on.",
    "A torque wrench and the bolt figures from the manual. This guide will not give you numbers it cannot source.",
    "Time to finish and test slowly afterwards. Do not start at dusk.",
  ],
  acknowledgement: "I have read this, I have axle stands and chocks, and I will stop if anything does not match the guide.",
};

const AMBER_BONNET_SAFETY: JobSafety = {
  dangers: [
    "A pressurised cooling system scalds. Never open it hot.",
    "Batteries can spark and belts can trap fingers; disconnect the battery where the guide says so.",
  ],
  requirements: [
    "Engine stone cold for anything involving coolant.",
    "Battery negative lead disconnected before touching the alternator or any live cable.",
    "The manual's figures for any bolt you torque and any fluid you fill. This guide will not guess them.",
  ],
  acknowledgement: "I have read this and I will stop if anything does not match the guide.",
};

function withExtra(base: JobSafety, extra: Partial<JobSafety>): JobSafety {
  return {
    dangers: [...base.dangers, ...(extra.dangers ?? [])],
    requirements: [...base.requirements, ...(extra.requirements ?? [])],
    acknowledgement: extra.acknowledgement ?? base.acknowledgement,
  };
}

const RED_SAFETY: JobSafety = {
  dangers: ["This job is on the list we do not give procedures for."],
  requirements: [],
  acknowledgement: "",
};

// ---- the catalogue ----
const JOB_LIST: JobDefinition[] = [
  // ================= BRAKES =================
  {
    id: "front-brake-pads",
    title: "Front brake pads",
    system: "brakes",
    tier: "amber",
    blurb: "Replace the friction pads on both front wheels. No hydraulic parts are opened.",
    typicalTimeMinutes: { min: 60, max: 120 },
    diagram: "disc-brake-corner",
    motRuleIds: ["brakes.pads_thin", "brakes.uneven"],
    engineSensitive: false,
    baseTools: [...LIFT_KIT, ...WHEEL_KIT, TORCH, PPE, { name: "Cable tie, bungee or wire", why: "To hang the caliper so it never dangles by its hose.", priceGbp: { min: 1, max: 5 } }],
    consumables: [BRAKE_CLEANER, BRAKE_GREASE, WIRE_BRUSH],
    safety: AMBER_LIFT_SAFETY,
    promptNotes: ["Say how the caliper is retained on this car (guide-pin bolts, slider bolts, spring clips) and what drives them."],
  },
  {
    id: "rear-brake-pads",
    title: "Rear brake pads",
    system: "brakes",
    tier: "amber",
    blurb: "Replace the rear pads. Rear calipers often carry the handbrake, which changes the piston step.",
    typicalTimeMinutes: { min: 60, max: 150 },
    diagram: "disc-brake-corner",
    motRuleIds: [],
    engineSensitive: false,
    baseTools: [...LIFT_KIT, ...WHEEL_KIT, TORCH, PPE, { name: "Rear caliper wind-back tool", why: "Many rear pistons must be turned, not pushed, because the handbrake works through them.", priceGbp: { min: 10, max: 25 } }],
    consumables: [BRAKE_CLEANER, BRAKE_GREASE, WIRE_BRUSH],
    safety: withExtra(AMBER_LIFT_SAFETY, {
      requirements: [
        "If the car has an electronic parking brake, the rear calipers must be put into service mode with a diagnostic tool first. Without that tool, this is not a home job.",
      ],
    }),
    promptNotes: [
      "State whether this car's rear brakes are discs or drums for the given years, and whether the piston winds back or pushes back.",
      "If the car may have an electronic parking brake, say so and make service mode a hard requirement.",
    ],
  },
  {
    id: "front-brake-discs-and-pads",
    title: "Front brake discs and pads",
    system: "brakes",
    tier: "amber",
    blurb: "Replace worn or scored front discs together with the pads.",
    typicalTimeMinutes: { min: 90, max: 180 },
    diagram: "disc-brake-corner",
    motRuleIds: ["brakes.disc_worn"],
    engineSensitive: false,
    baseTools: [...LIFT_KIT, ...WHEEL_KIT, TORCH, PPE, { name: "Large socket or hex bit for the carrier bolts", why: "The carrier bolts are big and tight.", priceGbp: { min: 5, max: 15 } }, { name: "Hammer and a block of wood", why: "Old discs rust to the hub.", priceGbp: { min: 8, max: 20 } }],
    consumables: [BRAKE_CLEANER, BRAKE_GREASE, WIRE_BRUSH],
    safety: withExtra(AMBER_LIFT_SAFETY, { requirements: ["Thread lock for the carrier bolts if the manual calls for it, and the carrier-bolt torque figure."] }),
    promptNotes: ["Include removing and refitting the carrier bracket, and cleaning the hub face before the new disc goes on."],
  },
  {
    id: "handbrake-adjustment",
    title: "Handbrake adjustment",
    system: "brakes",
    tier: "amber",
    blurb: "Take up cable slack so the handbrake holds on a slope.",
    typicalTimeMinutes: { min: 30, max: 60 },
    diagram: null,
    motRuleIds: ["brakes.handbrake"],
    engineSensitive: false,
    baseTools: [...LIFT_KIT, SOCKETS, SPANNERS, TORCH],
    consumables: [],
    safety: withExtra(AMBER_LIFT_SAFETY, { requirements: ["Not applicable to an electronic parking brake; those self-adjust or need a diagnostic tool."] }),
  },
  {
    id: "brake-pipe-or-hose",
    title: "Brake hose replacement",
    system: "brakes",
    tier: "amber",
    blurb: "Replace a perished flexible brake hose. At the hard end of home brake work: the system must be bled.",
    typicalTimeMinutes: { min: 90, max: 180 },
    diagram: null,
    motRuleIds: ["brakes.pipe_hose"],
    engineSensitive: false,
    baseTools: [...LIFT_KIT, ...WHEEL_KIT, { name: "Flare nut (brake pipe) spanners", why: "Ordinary spanners round off brake pipe nuts.", priceGbp: { min: 8, max: 20 } }, { name: "Brake bleeding kit", priceGbp: { min: 8, max: 30 } }, PPE],
    consumables: [{ name: "New brake fluid of the type on the reservoir cap", priceGbp: { min: 6, max: 15 } }, BRAKE_CLEANER],
    safety: withExtra(AMBER_LIFT_SAFETY, {
      dangers: ["Air left in the system means a pedal that goes to the floor."],
      requirements: ["A helper for bleeding, or a one-person bleed kit.", "Rigid metal pipe replacement needs flaring tools and is a garage job."],
    }),
  },

  // ================= SUSPENSION & STEERING =================
  {
    id: "anti-roll-bar-drop-links",
    title: "Anti-roll bar drop links",
    system: "suspension_steering",
    tier: "amber",
    blurb: "Replace the knocking links between the anti-roll bar and the struts. One of the easier suspension jobs.",
    typicalTimeMinutes: { min: 45, max: 90 },
    diagram: "suspension-strut",
    motRuleIds: ["suspension.arb"],
    engineSensitive: false,
    baseTools: [...LIFT_KIT, ...WHEEL_KIT, SPANNERS, { name: "Hex or Torx bit to hold the link stud", why: "The ball-stud spins unless held.", priceGbp: { min: 5, max: 15 } }, TORCH, PPE],
    consumables: [{ name: "Penetrating oil", priceGbp: { min: 4, max: 8 } }],
    safety: AMBER_LIFT_SAFETY,
  },
  {
    id: "shock-absorbers",
    title: "Shock absorbers",
    system: "suspension_steering",
    tier: "amber",
    blurb: "Replace rear shock absorbers, or a front strut as a complete assembly. Never compress a coil spring at home.",
    typicalTimeMinutes: { min: 60, max: 180 },
    diagram: "suspension-strut",
    motRuleIds: ["suspension.shock"],
    engineSensitive: false,
    baseTools: [...LIFT_KIT, ...WHEEL_KIT, SPANNERS, TORCH, PPE],
    consumables: [{ name: "Penetrating oil", priceGbp: { min: 4, max: 8 } }],
    safety: withExtra(AMBER_LIFT_SAFETY, {
      dangers: ["A compressed coil spring stores enough energy to kill if the compressor slips."],
      requirements: ["Front struts only as a complete assembly with the spring already fitted. If that is not available for this car, the front is a garage job."],
    }),
    promptNotes: ["Cover rear shocks in full. For the front, describe the complete-assembly swap only and say plainly that spring compression is not a home job."],
  },
  {
    id: "track-rod-end",
    title: "Track rod end",
    system: "suspension_steering",
    tier: "amber",
    blurb: "Replace a worn outer steering joint. Needs a wheel alignment check afterwards.",
    typicalTimeMinutes: { min: 45, max: 90 },
    diagram: "suspension-strut",
    motRuleIds: ["steering.joint", "steering.play"],
    engineSensitive: false,
    baseTools: [...LIFT_KIT, ...WHEEL_KIT, SPANNERS, BALL_JOINT_SPLITTER, TORCH, PPE],
    consumables: [{ name: "Penetrating oil", priceGbp: { min: 4, max: 8 } }],
    safety: withExtra(AMBER_LIFT_SAFETY, { requirements: ["Count the turns off the old joint and match them on the new one, then book a tracking check. Steering geometry is not optional."] }),
  },
  {
    id: "suspension-arm-ball-joint",
    title: "Lower suspension arm or ball joint",
    system: "suspension_steering",
    tier: "amber",
    blurb: "Replace a worn lower arm, bush or ball joint.",
    typicalTimeMinutes: { min: 90, max: 180 },
    diagram: "suspension-strut",
    motRuleIds: ["suspension.joint", "suspension.corrosion"],
    engineSensitive: false,
    baseTools: [...LIFT_KIT, ...WHEEL_KIT, SPANNERS, BALL_JOINT_SPLITTER, { name: "Long breaker bar", why: "Arm bolts are big and tight.", priceGbp: { min: 15, max: 30 } }, TORCH, PPE],
    consumables: [{ name: "Penetrating oil", priceGbp: { min: 4, max: 8 } }],
    safety: withExtra(AMBER_LIFT_SAFETY, { requirements: ["Rubber bush bolts are torqued with the car at ride height, or they tear. Follow the manual on this.", "A wheel alignment check afterwards."] }),
    promptNotes: ["Say whether the ball joint comes separately or only with the arm on this car."],
  },
  {
    id: "wheel-bearing",
    title: "Wheel bearing",
    system: "suspension_steering",
    tier: "amber",
    blurb: "Replace a humming or rough wheel bearing. Easy with a bolt-on hub unit, a press job otherwise.",
    typicalTimeMinutes: { min: 90, max: 240 },
    diagram: "suspension-strut",
    motRuleIds: ["wheels.bearing"],
    engineSensitive: false,
    baseTools: [...LIFT_KIT, ...WHEEL_KIT, { name: "Large socket for the hub nut", why: "Hub nuts are very tight; a long breaker bar is essential.", priceGbp: { min: 8, max: 20 } }, TORCH, PPE],
    consumables: [{ name: "Penetrating oil", priceGbp: { min: 4, max: 8 } }],
    safety: withExtra(AMBER_LIFT_SAFETY, { requirements: ["Hub nuts are often single-use and always torqued to a large figure. Have the figure and a new nut before starting."] }),
    promptNotes: ["State whether this car uses a bolt-on hub unit or a pressed-in bearing, and stop the guide at the press step if it is pressed."],
  },

  // ================= ENGINE & SERVICING =================
  {
    id: "engine-oil-and-filter",
    title: "Engine oil and filter",
    system: "engine_service",
    tier: "green",
    blurb: "Drain the old oil, fit a new filter, refill. The most useful job you can learn.",
    typicalTimeMinutes: { min: 45, max: 90 },
    diagram: "engine-bay",
    motRuleIds: ["nuisance.oil_leak"],
    engineSensitive: true,
    fuels: ["petrol", "diesel", "hybrid", "plug_in_hybrid", "other"],
    baseTools: [...LIFT_KIT, SOCKETS, { name: "Oil filter wrench or cap-type socket", priceGbp: { min: 6, max: 15 } }, DRAIN_PAN, FUNNEL, TORQUE, PPE, RAGS],
    consumables: [
      { name: "Engine oil of the grade in the handbook", why: "The grade and the quantity are in the handbook; the guide will not guess either.", priceGbp: { min: 25, max: 60 } },
      { name: "Oil filter for this engine", priceGbp: { min: 5, max: 15 } },
      { name: "Sump plug washer", priceGbp: { min: 1, max: 3 } },
    ],
    safety: withExtra(GREEN_SAFETY, {
      dangers: ["Draining oil from a warm engine is hot enough to burn."],
      requirements: ["If you have to get under the car, it goes on axle stands, never a jack: that makes this an AMBER job on cars you cannot reach the sump plug on from the ground."],
    }),
    promptNotes: ["Describe where the filter and sump plug are on this engine and whether the car must be lifted to reach them. Capacity and grade must be listed as figures with value null."],
  },
  {
    id: "engine-air-filter",
    title: "Engine air filter",
    system: "engine_service",
    tier: "green",
    blurb: "Swap the paper element in the air box. Ten minutes on most cars.",
    typicalTimeMinutes: { min: 10, max: 30 },
    diagram: "engine-bay",
    motRuleIds: [],
    engineSensitive: true,
    fuels: ["petrol", "diesel", "hybrid", "plug_in_hybrid", "other"],
    baseTools: [SCREWDRIVERS, SOCKETS],
    consumables: [{ name: "Air filter element for this engine", priceGbp: { min: 8, max: 25 } }],
    safety: GREEN_SAFETY,
  },
  {
    id: "cabin-pollen-filter",
    title: "Cabin (pollen) filter",
    system: "engine_service",
    tier: "green",
    blurb: "Replace the filter behind the glovebox or under the scuttle so the heater stops smelling.",
    typicalTimeMinutes: { min: 15, max: 40 },
    diagram: null,
    motRuleIds: [],
    engineSensitive: false,
    baseTools: [SCREWDRIVERS, TORCH],
    consumables: [{ name: "Cabin filter for this car", priceGbp: { min: 6, max: 20 } }],
    safety: GREEN_SAFETY,
    promptNotes: ["Say exactly where the filter lives on this car (glovebox, scuttle, footwell) and which way the airflow arrow points."],
  },
  {
    id: "top-up-fluids",
    title: "Check and top up fluids",
    system: "engine_service",
    tier: "green",
    blurb: "Oil level, coolant, brake fluid level, screenwash and power steering fluid, and what each reading means.",
    typicalTimeMinutes: { min: 15, max: 30 },
    diagram: "engine-bay",
    motRuleIds: ["nuisance.fluid_leak", "steering.power", "visibility.washer"],
    engineSensitive: true,
    baseTools: [RAGS, FUNNEL, TORCH],
    consumables: [
      { name: "Engine oil of the handbook grade", priceGbp: { min: 8, max: 20 } },
      { name: "Coolant of the type in the handbook, pre-mixed", priceGbp: { min: 6, max: 15 } },
      { name: "Screenwash", priceGbp: { min: 2, max: 6 } },
    ],
    safety: withExtra(GREEN_SAFETY, { dangers: ["Brake fluid strips paint and must never be topped up with anything else. A falling brake fluid level means worn pads or a leak, not a top-up."] }),
    promptNotes: ["Never state a capacity. Describe the dipstick and reservoir markings and what a low reading means for each fluid."],
  },
  {
    id: "spark-plugs",
    title: "Spark plugs",
    system: "engine_service",
    tier: "green",
    blurb: "Replace the spark plugs on an engine where they are reachable from the top.",
    typicalTimeMinutes: { min: 30, max: 90 },
    diagram: "engine-bay",
    motRuleIds: ["nuisance.emissions"],
    engineSensitive: true,
    fuels: ["petrol", "hybrid", "plug_in_hybrid"],
    baseTools: [SOCKETS, { name: "Spark plug socket with a rubber insert", priceGbp: { min: 5, max: 12 } }, TORQUE, { name: "Feeler gauge", optional: true, priceGbp: { min: 3, max: 8 } }],
    consumables: [{ name: "Spark plugs of the type the handbook lists", priceGbp: { min: 12, max: 60 } }, { name: "Dielectric grease", optional: true, priceGbp: { min: 3, max: 6 } }],
    safety: withExtra(GREEN_SAFETY, { requirements: ["Engine cold: plugs removed from a hot alloy head can strip the threads.", "Ignition coils unplugged, and the plug torque figure from the manual."] }),
    promptNotes: ["Say whether the plugs are reachable from the top on this engine; if the inlet manifold must come off, say so and mark the job as not beginner-friendly for this car."],
  },
  {
    id: "auxiliary-drive-belt",
    title: "Auxiliary (serpentine) drive belt",
    system: "engine_service",
    tier: "amber",
    blurb: "Replace the belt that drives the alternator, water pump and air-con. Not the timing belt.",
    typicalTimeMinutes: { min: 45, max: 120 },
    diagram: "serpentine-belt",
    motRuleIds: ["nuisance.noise"],
    engineSensitive: true,
    fuels: ["petrol", "diesel", "hybrid", "plug_in_hybrid", "other"],
    baseTools: [SOCKETS, { name: "Long breaker bar or serpentine belt tool", why: "To hold the tensioner back.", priceGbp: { min: 15, max: 30 } }, TORCH, PPE, { name: "Phone camera", why: "Photograph the routing before the belt comes off." }],
    consumables: [{ name: "Auxiliary belt for this engine", priceGbp: { min: 10, max: 35 } }],
    safety: withExtra(AMBER_BONNET_SAFETY, { requirements: ["Wheel arch liner or engine undertray may have to come off, which can mean lifting the car: then stands and chocks apply."] }),
    promptNotes: ["Describe the tensioner type on this engine and where the routing diagram is (often a sticker under the bonnet). This is not the timing belt; say so."],
  },
  {
    id: "coolant-drain-and-refill",
    title: "Coolant drain and refill",
    system: "engine_service",
    tier: "amber",
    blurb: "Replace old coolant. Straightforward, but air locks and the wrong coolant type damage engines.",
    typicalTimeMinutes: { min: 60, max: 120 },
    diagram: "engine-bay",
    motRuleIds: ["nuisance.fluid_leak"],
    engineSensitive: true,
    fuels: ["petrol", "diesel", "hybrid", "plug_in_hybrid", "other"],
    baseTools: [DRAIN_PAN, FUNNEL, { name: "Pliers for hose clips", priceGbp: { min: 6, max: 15 } }, SOCKETS, PPE, RAGS],
    consumables: [{ name: "Coolant of the type and colour in the handbook", why: "Mixing types turns to sludge. The quantity is in the handbook.", priceGbp: { min: 10, max: 30 } }],
    safety: withExtra(AMBER_BONNET_SAFETY, { requirements: ["Old coolant is poisonous to animals and must go to a recycling centre, never a drain."] }),
    promptNotes: ["Explain bleeding air on this engine (bleed screws, heater on, running with the cap off). Capacity and coolant type are figures with value null."],
  },
  {
    id: "alternator",
    title: "Alternator",
    system: "engine_service",
    tier: "amber",
    blurb: "Replace a failed alternator. Access varies from easy to miserable by engine.",
    typicalTimeMinutes: { min: 90, max: 240 },
    diagram: "serpentine-belt",
    motRuleIds: [],
    engineSensitive: true,
    baseTools: [SOCKETS, SPANNERS, { name: "Long breaker bar or belt tool", priceGbp: { min: 15, max: 30 } }, TORQUE, TORCH, PPE],
    consumables: [{ name: "Alternator, new or reconditioned, for this engine", priceGbp: { min: 90, max: 300 } }],
    safety: withExtra(AMBER_BONNET_SAFETY, { dangers: ["The alternator's main cable is live even with the ignition off. Disconnect the battery first or you will weld a spanner to the bodywork."] }),
    promptNotes: ["Say whether the alternator comes out from the top or the bottom on this engine and what has to move to get it out."],
  },
  {
    id: "read-fault-codes",
    title: "Read the fault codes",
    system: "engine_service",
    tier: "green",
    blurb: "Plug in a cheap OBD reader and find out why the warning light is on before buying anything.",
    typicalTimeMinutes: { min: 10, max: 20 },
    diagram: null,
    motRuleIds: ["other.engine_lamp", "brakes.abs_lamp"],
    engineSensitive: false,
    baseTools: [OBD],
    consumables: [],
    safety: withExtra(GREEN_SAFETY, { requirements: ["Do not clear a code until you have written it down. The code is the evidence."] }),
    promptNotes: ["Say where the OBD socket is on this car. Explain that codes point at a circuit, not at a part to buy."],
  },

  // ================= ELECTRICAL & LIGHTS =================
  {
    id: "battery-replacement",
    title: "Battery replacement",
    system: "electrical",
    tier: "green",
    blurb: "Fit a new battery, in the right order, without losing the car's settings if you can help it.",
    typicalTimeMinutes: { min: 20, max: 45 },
    diagram: "battery-terminals",
    motRuleIds: ["lamps.battery"],
    engineSensitive: false,
    baseTools: [SOCKETS, SPANNERS, WIRE_BRUSH, PPE, { name: "Memory saver", optional: true, why: "Keeps radio codes and window settings.", priceGbp: { min: 8, max: 20 } }],
    consumables: [{ name: "Battery of the size and type the handbook lists", why: "Stop-start cars need an AGM or EFB battery, and some need the new battery registered with a diagnostic tool.", priceGbp: { min: 70, max: 200 } }, { name: "Terminal grease", priceGbp: { min: 3, max: 6 } }],
    safety: withExtra(GREEN_SAFETY, {
      dangers: ["A spanner across both terminals, or from the positive to the body, is a short circuit with welding-level current."],
      requirements: ["Negative lead off first and on last, every time."],
    }),
    promptNotes: ["State whether this car needs the new battery coded or registered, and whether it uses a stop-start (AGM/EFB) battery."],
  },
  {
    id: "exterior-bulb",
    title: "Headlamp or exterior bulb",
    system: "electrical",
    tier: "green",
    blurb: "Replace a failed bulb. Two minutes on some cars, bumper off on others.",
    typicalTimeMinutes: { min: 10, max: 60 },
    diagram: null,
    motRuleIds: ["lamps.bulb"],
    engineSensitive: false,
    baseTools: [SCREWDRIVERS, TORCH, { name: "Nitrile gloves", why: "Skin oil on a halogen bulb shortens its life.", priceGbp: { min: 3, max: 8 } }],
    consumables: [{ name: "Bulb of the fitting in the handbook", priceGbp: { min: 3, max: 25 } }],
    safety: GREEN_SAFETY,
    promptNotes: ["Say which lamps on this car are reachable from under the bonnet and which need the wheel-arch liner or bumper off. LED units that are not user-replaceable must be called out."],
  },
  {
    id: "headlamp-aim",
    title: "Headlamp aim",
    system: "electrical",
    tier: "green",
    blurb: "Adjust a beam that points too high or too low.",
    typicalTimeMinutes: { min: 20, max: 40 },
    diagram: null,
    motRuleIds: ["lamps.headlamp_aim"],
    engineSensitive: false,
    baseTools: [SCREWDRIVERS, { name: "Tape measure", priceGbp: { min: 3, max: 8 } }],
    consumables: [],
    safety: GREEN_SAFETY,
    promptNotes: ["Describe the adjuster positions on this car's headlamps and the wall-check method. A beam setter at a garage is the accurate check."],
  },
  {
    id: "wiper-blades",
    title: "Wiper blades",
    system: "body_visibility",
    tier: "green",
    blurb: "Fit new blades. Five minutes, no tools.",
    typicalTimeMinutes: { min: 5, max: 15 },
    diagram: null,
    motRuleIds: ["visibility.wiper"],
    engineSensitive: false,
    baseTools: [{ name: "A towel over the windscreen", why: "A wiper arm that springs back cracks the glass." }],
    consumables: [{ name: "Wiper blades of the lengths and fitting for this car", priceGbp: { min: 8, max: 30 } }],
    safety: withExtra(GREEN_SAFETY, { dangers: [] }),
    promptNotes: ["State the fitting type on this car (hook, pinch tab, bayonet) if you are confident, and say the lengths differ between the driver's and passenger's sides."],
  },
  {
    id: "exhaust-section",
    title: "Exhaust section or mounting",
    system: "body_visibility",
    tier: "amber",
    blurb: "Replace a blowing rear silencer, a section, or a broken rubber mounting.",
    typicalTimeMinutes: { min: 45, max: 120 },
    diagram: null,
    motRuleIds: ["body.exhaust"],
    engineSensitive: false,
    baseTools: [...LIFT_KIT, SOCKETS, SPANNERS, { name: "Exhaust hanger removal tool or a pry bar", priceGbp: { min: 6, max: 15 } }, TORCH, PPE],
    consumables: [{ name: "Exhaust section, clamp and gasket for this car", priceGbp: { min: 30, max: 150 } }, { name: "Exhaust paste", priceGbp: { min: 3, max: 8 } }, { name: "Penetrating oil", priceGbp: { min: 4, max: 8 } }],
    safety: withExtra(AMBER_LIFT_SAFETY, { requirements: ["Exhaust cold. Rusted clamps and studs will fight back; cutting is often the answer, so eye protection is not optional."] }),
  },

  // ================= RED: REFER OUT =================
  {
    id: "airbag-srs",
    title: "Airbag or seat-belt pretensioner",
    system: "safety_systems",
    tier: "red",
    blurb: "Airbags and pretensioners are explosive devices. We do not give a procedure.",
    typicalTimeMinutes: { min: 0, max: 0 },
    diagram: null,
    motRuleIds: ["other.airbag", "other.seatbelt"],
    engineSensitive: false,
    baseTools: [],
    consumables: [],
    safety: RED_SAFETY,
    refusal: {
      why: [
        "An airbag fires with enough force to break an arm or kill a child. Pretensioners are the same charge in a seat-belt reel.",
        "The system stays armed after the battery is disconnected until its reserve drains, and the wiring is designed to be hard to probe safely.",
        "A fault code in this system needs the manufacturer's diagnostic tool to read properly.",
      ],
      professional: { priceGbp: { min: 60, max: 150 }, note: "for a diagnostic read; a replacement pretensioner or airbag module is usually £150 to £500 fitted. Indicative UK ranges." },
      whatYouCanDo: [
        "Note when the warning light comes on and whether anything has been disturbed under the seats recently (a loose connector after cleaning is a common cause).",
        "Get two quotes with the fault code in hand.",
      ],
    },
  },
  {
    id: "hybrid-ev-high-voltage",
    title: "Hybrid or EV high-voltage system",
    system: "safety_systems",
    tier: "red",
    blurb: "Orange cables mean several hundred volts. Not a home job, ever.",
    typicalTimeMinutes: { min: 0, max: 0 },
    diagram: null,
    motRuleIds: [],
    engineSensitive: false,
    fuels: ["hybrid", "plug_in_hybrid", "electric"],
    baseTools: [],
    consumables: [],
    safety: RED_SAFETY,
    refusal: {
      why: [
        "The traction battery runs at hundreds of volts DC and can kill on contact. Orange cables and connectors are the warning.",
        "Safe work needs the service disconnect procedure, insulated tools and a technician trained for it.",
      ],
      professional: { priceGbp: { min: 80, max: 200 }, note: "for diagnosis at a hybrid-trained garage; repairs vary widely. Indicative UK ranges." },
      whatYouCanDo: ["The 12-volt battery, wipers, bulbs, filters and brakes are normal jobs on these cars. Leave anything orange alone."],
    },
  },
  {
    id: "fuel-injectors-rail",
    title: "Fuel injectors and fuel rail",
    system: "safety_systems",
    tier: "red",
    blurb: "High-pressure fuel systems can injure, and a leak is a fire.",
    typicalTimeMinutes: { min: 0, max: 0 },
    diagram: null,
    motRuleIds: ["body.fuel_leak"],
    engineSensitive: true,
    fuels: ["petrol", "diesel", "hybrid", "plug_in_hybrid", "other"],
    baseTools: [],
    consumables: [],
    safety: RED_SAFETY,
    refusal: {
      why: [
        "Diesel common-rail and petrol direct-injection systems hold fuel at pressures that can inject it through skin.",
        "Injector seals and hold-down torques are precise, and a leak under the bonnet is a fire risk you may not see until it is alight.",
      ],
      professional: { priceGbp: { min: 150, max: 400 }, note: "per injector fitted, depending on the engine. Indicative UK ranges." },
      whatYouCanDo: ["Read the fault codes and note which cylinder is flagged. That narrows the quote."],
    },
  },
  {
    id: "structural-welding",
    title: "Structural corrosion repair",
    system: "safety_systems",
    tier: "red",
    blurb: "Rust in the sills, chassis or seat-belt mountings needs welding by someone who does it every day.",
    typicalTimeMinutes: { min: 0, max: 0 },
    diagram: null,
    motRuleIds: ["body.structural_corrosion"],
    engineSensitive: false,
    baseTools: [],
    consumables: [],
    safety: RED_SAFETY,
    refusal: {
      why: [
        "Structural steel holds the car together in a crash. A weak repair is invisible until it fails.",
        "Welding near fuel lines, brake pipes and underseal starts fires, and the MOT tester judges repairs to a standard.",
      ],
      professional: { priceGbp: { min: 150, max: 600 }, note: "per area, depending on extent. Indicative UK ranges; a body shop will quote after seeing it on a ramp." },
      whatYouCanDo: ["Treat surface rust elsewhere on the car before it spreads, and ask the garage to photograph the affected area so the quote is concrete."],
    },
  },
  {
    id: "timing-belt",
    title: "Timing belt or chain",
    system: "safety_systems",
    tier: "red",
    blurb: "Get it a tooth out on an interference engine and the pistons meet the valves.",
    typicalTimeMinutes: { min: 0, max: 0 },
    diagram: null,
    motRuleIds: [],
    engineSensitive: true,
    fuels: ["petrol", "diesel", "hybrid", "plug_in_hybrid", "other"],
    baseTools: [],
    consumables: [],
    safety: RED_SAFETY,
    refusal: {
      why: [
        "Most modern engines are interference designs: a belt fitted one tooth out, or a tensioner set wrong, destroys the engine on first start.",
        "The job needs locking tools specific to the engine and the manufacturer's procedure.",
      ],
      professional: { priceGbp: { min: 350, max: 800 }, note: "for a belt kit and water pump fitted; chains cost more. Indicative UK ranges." },
      whatYouCanDo: ["Find the change interval in the handbook and check the service history for the last change. That is the question to ask the garage."],
    },
  },
  {
    id: "coil-springs",
    title: "Coil spring replacement",
    system: "safety_systems",
    tier: "red",
    blurb: "A compressed spring stores enough energy to kill if the compressor slips.",
    typicalTimeMinutes: { min: 0, max: 0 },
    diagram: null,
    motRuleIds: ["suspension.spring"],
    engineSensitive: false,
    baseTools: [],
    consumables: [],
    safety: RED_SAFETY,
    refusal: {
      why: ["Cheap spring compressors slip. When they do, the spring lets go with lethal force.", "Garages use a wall-mounted compressor for this for a reason."],
      professional: { priceGbp: { min: 150, max: 350 }, note: "per pair fitted. Indicative UK ranges. A complete strut assembly with the spring already fitted is the safe home alternative on some cars: see Shock absorbers." },
      whatYouCanDo: ["If a complete strut assembly is sold for your car, the shock absorbers guide covers swapping it without touching the spring."],
    },
  },
  {
    id: "emissions-diagnosis",
    title: "Emissions failure diagnosis",
    system: "safety_systems",
    tier: "red",
    blurb: "Not dangerous, but not doable without a gas analyser. Refer out rather than guess.",
    typicalTimeMinutes: { min: 0, max: 0 },
    diagram: null,
    motRuleIds: ["nuisance.emissions"],
    engineSensitive: true,
    fuels: ["petrol", "diesel", "hybrid", "plug_in_hybrid", "other"],
    baseTools: [],
    consumables: [],
    safety: RED_SAFETY,
    refusal: {
      why: ["An emissions fail can be plugs, a sensor, a catalyst, a particulate filter or a tired engine. Buying parts without a gas reading is guessing with money."],
      professional: { priceGbp: { min: 60, max: 120 }, note: "for a diagnosis with a gas analyser and a code read. Indicative UK ranges." },
      whatYouCanDo: ["Read the fault codes yourself first. A long motorway run before the retest genuinely helps on diesels with a particulate filter."],
    },
  },
];

export const JOBS: Record<string, JobDefinition> = Object.fromEntries(JOB_LIST.map((j) => [j.id, j]));

export const JOB_IDS = JOB_LIST.map((j) => j.id);

export function getJob(id: string): JobDefinition | null {
  return JOBS[id] ?? null;
}

export function isJobId(id: string): boolean {
  return id in JOBS;
}

export function isGuideable(job: JobDefinition): boolean {
  return job.tier !== "red";
}

export function jobAppliesToFuel(job: JobDefinition, fuel: string): boolean {
  return !job.fuels || fuel === "unknown" || job.fuels.includes(fuel as (typeof job.fuels)[number]);
}

/** Jobs grouped by system in catalogue order. */
export function jobsBySystem(): Array<{ system: JobDefinition["system"]; jobs: JobDefinition[] }> {
  const groups = new Map<JobDefinition["system"], JobDefinition[]>();
  for (const job of JOB_LIST) {
    const list = groups.get(job.system) ?? [];
    list.push(job);
    groups.set(job.system, list);
  }
  return [...groups.entries()].map(([system, jobs]) => ({ system, jobs }));
}

/** The job that addresses an MOT item, taking the corner into account. */
export function jobForDefect(ruleId: string | null, location?: Pick<DefectLocation, "position"> | null): JobDefinition | null {
  if (!ruleId) return null;
  if (ruleId === "brakes.pads_thin") return location?.position === "rear" ? JOBS["rear-brake-pads"] : JOBS["front-brake-pads"];
  if (ruleId === "brakes.disc_worn") return location?.position === "rear" ? null : JOBS["front-brake-discs-and-pads"];
  return JOB_LIST.find((j) => j.motRuleIds.includes(ruleId)) ?? null;
}

export function jobForRule(ruleId: string | null): JobDefinition | null {
  return jobForDefect(ruleId, null);
}
