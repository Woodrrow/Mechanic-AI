/**
 * Plain-English explanations for common MOT items. Curated by hand, matched by
 * pattern on the normalised defect text, checked against the manual section
 * where one is present. Nothing here states a torque figure, capacity or
 * part number; job summaries say what is involved and how risky it is.
 *
 * Tier: GREEN beginner-safe, AMBER needs stands/chocks/care, RED refer out.
 * Venue: where the job realistically happens.
 */
import { normaliseForMatching } from "./parse";
import type { DefectLocation, Explanation, MotCategory, ParsedDefect, SuggestedJob, Urgency } from "./types";

interface Rule {
  id: string;
  category: MotCategory;
  match: RegExp;
  /** Only apply when the manual section starts with one of these (current format). */
  sections?: string[];
  title: string;
  meaning: string;
  whyItMatters: string;
  wearItem: boolean;
  urgency: Urgency;
  job: Omit<SuggestedJob, "name"> & { name: string };
}

const AXLE_STANDS = "Car on axle stands with the wheels chocked and the ground level, never on a jack alone.";

export const RULES: Rule[] = [
  // ---------------- Brakes ----------------
  {
    id: "brakes.pads_thin",
    category: "brakes",
    match: /brake pads? .*thin|pads? wearing thin|pads? worn/,
    title: "Brake pads wearing thin",
    meaning:
      "Brake pads are the friction blocks that squeeze the brake disc when you press the pedal. The tester saw they were getting low but still legal.",
    whyItMatters:
      "Once the friction material is gone the metal backing grinds the disc: braking suffers and a cheap pad change becomes pads and discs.",
    wearItem: true,
    urgency: "soon",
    job: {
      name: "Replace {position}brake pads",
      tier: "amber",
      where: "home",
      summary: `Wheel off, caliper unbolted, old pads out, new pads in. ${AXLE_STANDS} Pump the pedal before moving and test gently at low speed.`,
    },
  },
  {
    id: "brakes.disc_worn",
    category: "brakes",
    match: /disc.*(worn|pitted|scored|lipped|corrod)|drum.*(worn|scored)/,
    title: "Brake disc worn, pitted or scored",
    meaning:
      "The disc is the metal plate the pads grip. Light scoring and pitting are normal ageing; \"not seriously weakened\" means it was still safe at the test.",
    whyItMatters: "Worn discs reduce braking and chew through pads faster. Discs and pads are normally replaced together.",
    wearItem: true,
    urgency: "soon",
    job: {
      name: "Replace {position}brake discs and pads",
      tier: "amber",
      where: "home",
      summary: `Same access as a pad change plus the caliper carrier bolts, which are tight and need the correct torque figure from a manual. ${AXLE_STANDS}`,
    },
  },
  {
    id: "brakes.pipe_hose",
    category: "brakes",
    match: /brake (pipe|hose|flexible hose).*(corrod|deteriorat|chaf|damag|ferrous|perish)|brake.*pipe.*corrod/,
    title: "Brake pipe or hose deteriorating",
    meaning: "Metal brake pipes corrode and rubber hoses perish. \"Slightly corroded\" or \"deteriorated\" is an early warning.",
    whyItMatters: "A failed pipe or hose means losing the brakes on that circuit.",
    wearItem: true,
    urgency: "soon",
    job: {
      name: "Replace brake pipe or hose",
      tier: "amber",
      where: "home",
      summary:
        "At the hard end of home brake work: the system must be bled afterwards and new pipes need flaring tools. Many owners have a garage do this one.",
    },
  },
  {
    id: "brakes.handbrake",
    category: "brakes",
    match: /(parking brake|handbrake|hand brake).*(efficien|imbalance|travel|excessive|adjust|inoperative|lever)/,
    title: "Handbrake needs attention",
    meaning: "The parking brake was not holding as well or as evenly as it should.",
    whyItMatters: "A weak handbrake lets the car roll.",
    wearItem: true,
    urgency: "soon",
    job: {
      name: "Adjust or repair the parking brake",
      tier: "amber",
      where: "home",
      summary: "Often a cable adjustment; sometimes rear pads or shoes. Chock the wheels before you start.",
    },
  },
  {
    id: "brakes.uneven",
    category: "brakes",
    match: /brake.*(binding|imbalance|fluctuat|grab|judder|excessive travel|slow to release)/,
    title: "Brakes uneven or binding",
    meaning: "One brake was working harder than its partner, or dragging when it should have released.",
    whyItMatters: "Uneven brakes pull the car to one side under braking and overheat one wheel.",
    wearItem: true,
    urgency: "soon",
    job: {
      name: "Inspect brakes for a sticking caliper or worn pads",
      tier: "amber",
      where: "home",
      summary: `Look for a hot wheel after a drive and a caliper piston or slider pins that do not move freely. ${AXLE_STANDS}`,
    },
  },
  {
    id: "brakes.abs_lamp",
    category: "brakes",
    match: /\babs\b|anti lock|brake.*warning lamp/,
    title: "ABS warning light",
    meaning: "The anti-lock system reported a fault. Ordinary braking usually still works, but the anti-skid function may not.",
    whyItMatters: "It is a fail while the light is on, and you lose the safety net in an emergency stop.",
    wearItem: false,
    urgency: "soon",
    job: {
      name: "Read the fault codes",
      tier: "green",
      where: "home",
      summary: "A cheap OBD reader names the sensor. Most ABS faults are a wheel-speed sensor or its wiring.",
    },
  },

  // ---------------- Wheels & tyres ----------------
  {
    id: "tyres.near_limit",
    category: "wheels_tyres",
    match: /tyre.*(close to.*legal|worn close|worn on edge|worn to.*edge|legal limit|tread)/,
    title: "Tyre close to the legal tread limit",
    meaning:
      "UK law requires at least 1.6 mm of tread across the central three-quarters of the tyre, all the way round. This tyre was legal at the test but close to that line, or wearing unevenly on one edge.",
    whyItMatters:
      "Below the limit the tyre grips poorly in the wet, and it is an offence that carries penalty points and a fine for each tyre.",
    wearItem: true,
    urgency: "now",
    job: {
      name: "Check the tread and replace the tyre",
      tier: "green",
      where: "tyre_shop",
      summary:
        "Check the depth yourself with a tread gauge or the 20p test. Fitting and balancing is a tyre-shop job, usually done while you wait. Uneven edge wear points to alignment, so ask for that too.",
    },
  },
  {
    id: "tyres.damage",
    category: "wheels_tyres",
    match: /tyre.*(damag|crack|perish|bulge|cut|lump|deteriorat|cord|exposed)/,
    title: "Tyre damage or ageing",
    meaning: "Cracks, cuts, perishing or a bulge in the tyre.",
    whyItMatters: "A damaged sidewall can fail suddenly at speed.",
    wearItem: true,
    urgency: "now",
    job: {
      name: "Have the tyre inspected and replaced",
      tier: "green",
      where: "tyre_shop",
      summary: "Do not wait on a bulge. A tyre shop can tell you in a minute whether it is safe.",
    },
  },
  {
    id: "tyres.valve",
    category: "wheels_tyres",
    match: /valve.*(damag|deteriorat|perish|misaligned)/,
    title: "Tyre valve deteriorating",
    meaning: "The rubber valve stem was cracked or perished.",
    whyItMatters: "A failed valve is a flat tyre, usually slowly.",
    wearItem: true,
    urgency: "monitor",
    job: {
      name: "Replace the valve when the tyre is next off",
      tier: "green",
      where: "tyre_shop",
      summary: "Pennies when done with a tyre change.",
    },
  },
  {
    id: "wheels.bearing",
    category: "wheels_tyres",
    match: /wheel bearing.*(play|rough|noise|slack|excessive)/,
    title: "Wheel bearing wearing",
    meaning: "The bearing lets the wheel spin freely on the hub. Slight play or roughness is the start of it wearing out.",
    whyItMatters: "A worn bearing hums, then roars, then can seize or let the wheel wobble.",
    wearItem: true,
    urgency: "soon",
    job: {
      name: "Replace {position}wheel bearing",
      tier: "amber",
      where: "home",
      summary:
        "Manageable on cars with a bolt-on hub unit; needs a press or a garage where the bearing is pressed into the hub. Check which type yours is first.",
    },
  },
  {
    id: "wheels.damaged",
    category: "wheels_tyres",
    match: /(road )?wheel.*(corrod|damag|distort|bent|crack)/,
    title: "Wheel damaged or corroded",
    meaning: "The rim was bent, cracked or corroding.",
    whyItMatters: "Cracks and heavy corrosion at the bead can let the tyre lose air.",
    wearItem: false,
    urgency: "monitor",
    job: {
      name: "Have the wheel inspected",
      tier: "green",
      where: "tyre_shop",
      summary: "Ask when the tyre is next off.",
    },
  },

  // ---------------- Suspension ----------------
  {
    id: "suspension.arb",
    category: "suspension",
    match: /anti ?roll bar.*(link|bush|play|worn|deteriorat|insecure|excessive)/,
    title: "Anti-roll bar link or bush worn",
    meaning: "The anti-roll bar limits body roll in corners. Its links and rubber bushes wear and start to knock.",
    whyItMatters: "Mostly noise and sloppier cornering rather than danger, but it fails the test once the play is bad.",
    wearItem: true,
    urgency: "monitor",
    job: {
      name: "Replace anti-roll bar drop links or bushes",
      tier: "amber",
      where: "home",
      summary: `One of the easier suspension jobs: two bolts per link. ${AXLE_STANDS}`,
    },
  },
  {
    id: "suspension.joint",
    category: "suspension",
    match: /(ball joint|suspension arm|suspension joint|lower arm|upper arm|wishbone|bush|pin).*(play|worn|deteriorat|movement|slack|excessive|split)/,
    title: "Suspension joint or bush wearing",
    meaning: "Suspension arms pivot on rubber bushes and ball joints. Slight play or deterioration means they are loosening up.",
    whyItMatters:
      "Worn joints make the steering vague and wear tyres unevenly. A ball joint that separates lets the wheel fold under the car.",
    wearItem: true,
    urgency: "soon",
    job: {
      name: "Replace {position}suspension arm or ball joint",
      tier: "amber",
      where: "home",
      summary: `Doable with a ball-joint splitter; some joints only come as a complete arm. ${AXLE_STANDS} Have the wheel alignment checked afterwards.`,
    },
  },
  {
    id: "suspension.shock",
    category: "suspension",
    match: /shock absorber.*(leak|misting|damp|oil|corrod|insecure|ineffective)/,
    title: "Shock absorber leaking",
    meaning: "\"Light misting of oil\" is a shock absorber just starting to leak. A wet one has lost its damping.",
    whyItMatters: "Worn dampers lengthen braking distances and let the wheel bounce over bumps.",
    wearItem: true,
    urgency: "soon",
    job: {
      name: "Replace {position}shock absorbers in pairs",
      tier: "amber",
      where: "home",
      summary:
        "Straightforward on separate rear shocks. On a front strut the coil spring sits on the damper: swap the complete strut assembly or have a garage do it. Never compress a coil spring at home.",
    },
  },
  {
    id: "suspension.spring",
    category: "suspension",
    match: /spring.*(corrod|fractur|broken|pitted|deteriorat|cracked)/,
    title: "Coil spring corroded or damaged",
    meaning: "The coil spring holds the car up. Surface corrosion is common with age; a fractured spring is a fail.",
    whyItMatters: "A broken spring can drop the car on one corner and cut into the tyre.",
    wearItem: true,
    urgency: "soon",
    job: {
      name: "Replace coil springs",
      tier: "red",
      where: "garage",
      summary:
        "A compressed coil spring stores enough energy to kill if the compressor slips. This is a garage job, or a complete strut assembly swap where the car allows it.",
    },
  },
  {
    id: "suspension.corrosion",
    category: "suspension",
    match: /(suspension|subframe|arm|spring seat|mounting|beam).*corro/,
    title: "Suspension component corroded",
    meaning: "Surface rust on a suspension part. \"Not seriously weakened\" means it was still sound at the test.",
    whyItMatters: "Corrosion on a load-bearing part becomes a fail once it weakens the metal.",
    wearItem: true,
    urgency: "monitor",
    job: {
      name: "Have the corrosion assessed",
      tier: "amber",
      where: "garage",
      summary: "Worth a proper look on a ramp before the next test, so it can be treated or replaced in time.",
    },
  },

  // ---------------- Steering ----------------
  {
    id: "steering.joint",
    category: "steering",
    match: /(track rod|tie rod|steering rack|rack gaiter|rack boot|steering joint|steering linkage|steering arm|drag link|inner joint|outer joint|ball joint).*(play|worn|split|damag|deteriorat|leak|movement|excessive)/,
    title: "Steering joint or gaiter wearing",
    meaning: "Track rod ends and rack joints connect the steering to the wheels. The rubber gaiters keep dirt out of the rack.",
    whyItMatters: "A split gaiter lets grit destroy the rack; a worn joint makes the steering vague and can eventually let go.",
    wearItem: true,
    urgency: "soon",
    job: {
      name: "Replace {position}track rod end or rack gaiter",
      tier: "amber",
      where: "home",
      summary: "Track rod ends are a common home job with a splitter and a tracking check afterwards. Rack gaiters are fiddlier.",
    },
  },
  {
    id: "steering.power",
    category: "steering",
    match: /power steering.*(leak|fluid|pipe|hose|noisy)|steering.*fluid.*leak/,
    title: "Power steering leak",
    meaning: "The hydraulic power steering was losing fluid.",
    whyItMatters: "Run it dry and the pump fails and the steering becomes very heavy without warning.",
    wearItem: true,
    urgency: "monitor",
    job: {
      name: "Check the power steering fluid and find the leak",
      tier: "green",
      where: "home",
      summary: "Check the reservoir level weekly and look for the wet pipe or hose.",
    },
  },
  {
    id: "steering.play",
    category: "steering",
    match: /steering.*(play|free play|excessive movement|notchy|tight spot)/,
    title: "Play in the steering",
    meaning: "The steering wheel moved before the road wheels did, which points to a worn joint somewhere in the linkage.",
    whyItMatters: "Vague steering gets worse and is a fail once the play is excessive.",
    wearItem: true,
    urgency: "soon",
    job: {
      name: "Inspect the steering joints",
      tier: "amber",
      where: "home",
      summary: `With the front on axle stands, have a helper rock the wheel while you feel each joint for movement. ${AXLE_STANDS}`,
    },
  },

  // ---------------- Visibility ----------------
  {
    id: "visibility.wiper",
    category: "visibility",
    match: /wiper.*(defective|deteriorat|smear|split|perish|not clear|damag)/,
    title: "Wiper blade worn",
    meaning: "The rubber has hardened or split and is not clearing the glass properly.",
    whyItMatters: "Poor wipers are a fail and a real hazard in rain and at night.",
    wearItem: true,
    urgency: "soon",
    job: {
      name: "Replace the wiper blades",
      tier: "green",
      where: "home",
      summary: "Five minutes, no tools. Measure the old blades or use the shop's lookup for your car.",
    },
  },
  {
    id: "visibility.washer",
    category: "visibility",
    match: /washer.*(inoperative|not |insufficient|jet|provid|blocked)/,
    title: "Windscreen washer not working properly",
    meaning: "A jet was blocked or the washers did not reach the screen.",
    whyItMatters: "It is a fail on its own, and you need it the moment a lorry sprays you.",
    wearItem: false,
    urgency: "soon",
    job: {
      name: "Fix the windscreen washer",
      tier: "green",
      where: "home",
      summary: "Usually an empty bottle, a blocked jet you can clear with a pin, or a split pipe under the bonnet.",
    },
  },
  {
    id: "visibility.windscreen",
    category: "visibility",
    match: /windscreen.*(damag|chip|crack|scratch|discolour|delaminat)/,
    title: "Windscreen chip or crack",
    meaning: "Damage in the glass. The tester judges its size and whether it sits in the area swept in front of the driver.",
    whyItMatters: "Chips spread into cracks with temperature changes, and then the whole screen has to be replaced.",
    wearItem: true,
    urgency: "monitor",
    job: {
      name: "Windscreen chip repair",
      tier: "green",
      where: "windscreen",
      summary: "Repair early: a chip can often be filled in twenty minutes, and many insurance policies cover it with little or no excess.",
    },
  },
  {
    id: "visibility.mirror",
    category: "visibility",
    match: /mirror.*(damag|insecure|missing|deteriorat|glass)/,
    title: "Mirror damaged or insecure",
    meaning: "A mirror was cracked, loose or missing its glass.",
    whyItMatters: "Obligatory mirrors are a fail if you cannot see out of them.",
    wearItem: false,
    urgency: "soon",
    job: {
      name: "Replace or secure the mirror",
      tier: "green",
      where: "home",
      summary: "Glass-only replacements clip in; a whole unit is a few screws behind the door card.",
    },
  },

  // ---------------- Lights & electrics ----------------
  {
    id: "lamps.headlamp_aim",
    category: "lamps_electrics",
    match: /headlamp aim|headlamp.*(aim|too high|too low|beam image)/,
    title: "Headlamp aim off",
    meaning: "The beam pointed too high or too low.",
    whyItMatters: "Too high dazzles oncoming drivers; too low leaves you short of light at night.",
    wearItem: false,
    urgency: "soon",
    job: {
      name: "Adjust the headlamp aim",
      tier: "green",
      where: "home",
      summary:
        "Adjuster screws on the back of the lamp. Check against a wall on level ground, or have a garage set it with a beam setter before the test.",
    },
  },
  {
    id: "lamps.bulb",
    category: "lamps_electrics",
    match: /(lamp|light|bulb|indicator|reflector|lens).*(inoperative|not working|not illuminat|deteriorat|discolour|damag|insecure|obscured|missing|faded|dim|colour|flicker)/,
    title: "Lamp or bulb faulty",
    meaning: "A bulb was out or dim, or the lens was faded, cracked or loose.",
    whyItMatters: "Any obligatory lamp not working is a fail, and other drivers cannot see what you are doing.",
    wearItem: false,
    urgency: "soon",
    job: {
      name: "Replace the bulb or lamp unit",
      tier: "green",
      where: "home",
      summary: "Most bulbs are a two-minute job. Some cars hide them behind the bumper or a wheel-arch liner, so check a video for your model first.",
    },
  },
  {
    id: "lamps.battery",
    category: "lamps_electrics",
    match: /battery.*(insecure|leak|not secure|terminal|corrod|loose)/,
    title: "Battery insecure or terminals corroding",
    meaning: "The battery clamp was loose, or the terminals were furring up.",
    whyItMatters: "A loose battery can short against the bonnet; corroded terminals cause no-starts.",
    wearItem: false,
    urgency: "soon",
    job: {
      name: "Secure the battery and clean the terminals",
      tier: "green",
      where: "home",
      summary: "Tighten the clamp and clean corrosion with a wire brush. Negative lead off first, back on last.",
    },
  },
  {
    id: "lamps.wiring",
    category: "lamps_electrics",
    match: /wiring.*(insecure|damag|chaf|exposed|deteriorat|loose)/,
    title: "Wiring insecure or damaged",
    meaning: "A cable was loose or its insulation was chafed.",
    whyItMatters: "Chafed wiring shorts out and can start a fire.",
    wearItem: false,
    urgency: "soon",
    job: {
      name: "Secure or repair the wiring",
      tier: "amber",
      where: "home",
      summary: "Disconnect the battery first. Re-route and cable-tie loose runs; repair damaged insulation properly, not with tape alone.",
    },
  },
  {
    id: "lamps.horn",
    category: "lamps_electrics",
    match: /horn/,
    title: "Horn faulty",
    meaning: "The horn did not sound, or not consistently.",
    whyItMatters: "It is a legal requirement and a fail.",
    wearItem: false,
    urgency: "soon",
    job: {
      name: "Fix the horn",
      tier: "green",
      where: "home",
      summary: "Check the fuse first, then the connector at the horn itself.",
    },
  },

  // ---------------- Body & structure ----------------
  {
    id: "body.structural_corrosion",
    category: "body_structure",
    match: /(structure|structural|sill|chassis|subframe|prescribed area|floor|crossmember|suspension mounting|seat belt mounting).*(corro|rust)|(corro|rust).*(prescribed area|structure|sill|chassis|floor)/,
    title: "Corrosion on the structure",
    meaning: "Rust on the body structure or within a \"prescribed area\" around a seat-belt or suspension mounting.",
    whyItMatters: "Structural corrosion weakens the shell. Past a point it is a fail and needs welding.",
    wearItem: true,
    urgency: "soon",
    job: {
      name: "Structural rust repair",
      tier: "red",
      where: "garage",
      summary: "Welding on the structure is a professional job. Ask a body shop or MOT garage to assess it before it spreads.",
    },
  },
  {
    id: "body.exhaust",
    category: "body_structure",
    match: /exhaust.*(leak|corro|insecure|mounting|deteriorat|blow|damag|missing|hole)|silencer/,
    title: "Exhaust leak or corrosion",
    meaning: "A joint or silencer was blowing, rusty, or hanging on a broken mounting.",
    whyItMatters: "Exhaust fumes in the cabin are dangerous, and a hanging exhaust can drop onto the road.",
    wearItem: true,
    urgency: "soon",
    job: {
      name: "Replace the exhaust section or mounting",
      tier: "amber",
      where: "home",
      summary: `Rubber mountings are easy. Sections are bolt-on but rusted clamps fight back. ${AXLE_STANDS} Exhaust cold.`,
    },
  },
  {
    id: "body.engine_mount",
    category: "body_structure",
    match: /(engine|gearbox|transmission) mount/,
    title: "Engine or gearbox mounting worn",
    meaning: "The rubber mounts that hold the engine were cracked or sagging.",
    whyItMatters: "Worn mounts thud on take-off and strain pipes and exhaust joints.",
    wearItem: true,
    urgency: "monitor",
    job: {
      name: "Replace the engine mounting",
      tier: "amber",
      where: "home",
      summary: "The engine has to be supported while the mount is out. Manageable on some cars, awkward on others.",
    },
  },
  {
    id: "body.fuel_cap",
    category: "body_structure",
    match: /fuel (filler )?cap/,
    title: "Fuel filler cap faulty",
    meaning: "The cap did not seal or was missing.",
    whyItMatters: "Fumes escape and water gets in.",
    wearItem: false,
    urgency: "soon",
    job: {
      name: "Replace the fuel filler cap",
      tier: "green",
      where: "home",
      summary: "A parts-store item; check whether yours is a locking type.",
    },
  },
  {
    id: "body.fuel_leak",
    category: "body_structure",
    match: /fuel.*(leak|pipe|hose|tank)/,
    title: "Fuel system leak or damage",
    meaning: "Fuel was escaping, or a fuel line or the tank was damaged or insecure.",
    whyItMatters: "Petrol and diesel leaks are a fire risk.",
    wearItem: true,
    urgency: "now",
    job: {
      name: "Fuel system repair",
      tier: "red",
      where: "garage",
      summary: "Fuel work is a fire risk and not a home job. Have it looked at promptly.",
    },
  },
  {
    id: "body.panel",
    category: "body_structure",
    match: /(bumper|panel|wing|bonnet|boot|door|tailgate|trim|spoiler|arch liner|undertray|number plate).*(insecure|damag|sharp|loose|catch|missing|not secure)/,
    title: "Body part insecure or damaged",
    meaning: "A panel, bumper or trim piece was loose or had a sharp edge.",
    whyItMatters: "Sharp edges and loose panels fail the test and can catch pedestrians.",
    wearItem: false,
    urgency: "soon",
    job: {
      name: "Secure or replace the part",
      tier: "green",
      where: "home",
      summary: "Usually clips or a bracket. Replacement clips cost pennies.",
    },
  },
  {
    id: "body.surface_corrosion",
    category: "body_structure",
    match: /corro|rust/,
    title: "Surface corrosion",
    meaning: "Rust that had not weakened anything yet.",
    whyItMatters: "Left alone it spreads; caught early it is cosmetic.",
    wearItem: true,
    urgency: "monitor",
    job: {
      name: "Treat the surface rust",
      tier: "green",
      where: "home",
      summary: "Clean back to bare metal, treat and paint, or have a body shop do it.",
    },
  },

  // ---------------- Seat belts & equipment ----------------
  {
    id: "other.airbag",
    category: "other_equipment",
    match: /airbag|srs|supplementary restraint/,
    title: "Airbag warning light or fault",
    meaning: "The airbag system reported a fault, or the warning light stayed on.",
    whyItMatters: "The airbags may not deploy in a crash, and it is a fail.",
    wearItem: false,
    urgency: "soon",
    job: {
      name: "Airbag fault diagnosis",
      tier: "red",
      where: "garage",
      summary: "Airbag systems contain explosive charges and are dangerous to work on. A garage reads the fault code and repairs it.",
    },
  },
  {
    id: "other.seatbelt",
    category: "other_equipment",
    match: /seat ?belt/,
    title: "Seat belt wear or fault",
    meaning: "Fraying webbing, a slow retractor or a stiff buckle.",
    whyItMatters: "A frayed belt can fail in a crash.",
    wearItem: true,
    urgency: "soon",
    job: {
      name: "Replace the seat belt",
      tier: "red",
      where: "garage",
      summary: "Modern belts have pyrotechnic pretensioners wired into the airbag system. Not a home job.",
    },
  },
  {
    id: "other.engine_lamp",
    category: "other_equipment",
    match: /(malfunction indicator|engine management|engine mil|mil ).*(illuminat|on|lit|indicat)/,
    title: "Engine warning light on",
    meaning: "The engine management system had logged a fault.",
    whyItMatters: "It is a fail while lit, and the underlying fault may hurt economy or emissions.",
    wearItem: false,
    urgency: "soon",
    job: {
      name: "Read the fault codes",
      tier: "green",
      where: "home",
      summary: "A cheap OBD reader shows why the light is on. Diagnose before buying parts.",
    },
  },

  // ---------------- Leaks, exhaust & emissions ----------------
  {
    id: "nuisance.oil_leak",
    category: "nuisance_emissions",
    match: /oil leak|engine.*leak.*oil|leak.*oil/,
    title: "Oil leak",
    meaning: "Oil was escaping somewhere. \"Not excessive\" means a weep or a drip, not a pour.",
    whyItMatters: "Oil on a hot exhaust smokes, on brakes it is dangerous, and a low level wrecks the engine.",
    wearItem: true,
    urgency: "monitor",
    job: {
      name: "Find the leak and keep the oil topped up",
      tier: "green",
      where: "home",
      summary:
        "Check the level weekly. Clean the underside of the engine and look again after a drive to find the source: sump plug, oil filter, rocker cover gasket.",
    },
  },
  {
    id: "nuisance.fluid_leak",
    category: "nuisance_emissions",
    match: /(coolant|fluid|water|antifreeze).*leak|leak.*(coolant|fluid|antifreeze)/,
    title: "Coolant or other fluid leak",
    meaning: "A fluid other than oil was escaping.",
    whyItMatters: "Low coolant overheats the engine, which is expensive.",
    wearItem: true,
    urgency: "monitor",
    job: {
      name: "Check the coolant level and find the leak",
      tier: "green",
      where: "home",
      summary: "Check the level cold, never open a hot system. Look for pink or green staining around hoses and the radiator.",
    },
  },
  {
    id: "nuisance.emissions",
    category: "nuisance_emissions",
    match: /emission|smoke|lambda|catalyst|dpf|particulate/,
    title: "Exhaust emissions high or smoke",
    meaning: "The exhaust gas test was near or over the limit, or the engine was smoking.",
    whyItMatters: "Usually a worn engine, a tired catalyst or a diesel particulate filter problem. It is a fail once over the limit.",
    wearItem: true,
    urgency: "soon",
    job: {
      name: "Emissions diagnosis",
      tier: "red",
      where: "garage",
      summary: "Needs a gas analyser and diagnostic kit to pin down. Get a diagnosis before buying parts.",
    },
  },
  {
    id: "nuisance.noise",
    category: "nuisance_emissions",
    match: /noise|noisy|rattle|knock/,
    title: "Noise noted",
    meaning: "The tester heard a knock, rattle or noise they thought worth recording.",
    whyItMatters: "Noises are early warnings; the cause decides how urgent it is.",
    wearItem: true,
    urgency: "monitor",
    job: {
      name: "Track down the noise",
      tier: "green",
      where: "home",
      summary: "Note when it happens: speed bumps, braking, turning, cold starts. That narrows it down before anything comes apart.",
    },
  },
];

function positionPrefix(location: DefectLocation): string {
  return location.position ? `${location.position} ` : "";
}

function sentenceCase(text: string): string {
  const t = text.trim();
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : t;
}

/** Find the rule for a parsed defect: category-matching rules first, then any. */
export function findRule(defect: ParsedDefect): Rule | null {
  const norm = normaliseForMatching(defect.text || defect.raw);
  const candidates = [...RULES.filter((r) => r.category === defect.category), ...RULES.filter((r) => r.category !== defect.category)];
  return (
    candidates.find((r) => {
      if (!r.match.test(norm)) return false;
      if (r.sections && defect.reference?.format === "current") {
        return r.sections.some((s) => defect.reference!.section.startsWith(s));
      }
      return true;
    }) ?? null
  );
}

export function explainDefect(defect: ParsedDefect): Explanation {
  const rule = findRule(defect);
  if (!rule) {
    return {
      ruleId: null,
      title: sentenceCase(defect.text || defect.raw),
      meaning: "We do not have a plain-English note for this item yet, so the tester's wording is shown as written.",
      whyItMatters: defect.reference
        ? `It sits in the MOT manual's "${defect.category.replace(/_/g, " ")}" section (${defect.reference.code}). A mechanic can explain it in a minute.`
        : "A mechanic can explain it in a minute.",
      wearItem: false,
      urgency: defect.type === "advisory" ? "info" : "soon",
      job: null,
    };
  }
  return {
    ruleId: rule.id,
    title: rule.title,
    meaning: rule.meaning,
    whyItMatters: rule.whyItMatters,
    wearItem: rule.wearItem,
    urgency: rule.urgency,
    job: { ...rule.job, name: rule.job.name.replace("{position}", positionPrefix(defect.location)) },
  };
}
