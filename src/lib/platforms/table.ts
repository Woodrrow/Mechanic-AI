/**
 * Shared-platform table. Hand-curated from public information about which
 * cars share a platform and generation; year ranges are UK model years and
 * deliberately conservative. `confidence` is honest: "medium" means the
 * platform sharing is real but component sharing varies more, or the model
 * naming (BMW, Mercedes) makes matching DVSA model strings less certain.
 *
 * Model patterns run against the DVSA model string upper-cased with
 * whitespace collapsed, e.g. "GOLF SE TSI BLUEMOTION TECHNOLOGY".
 */
export interface PlatformMember {
  make: string;
  model: RegExp;
  yearFrom: number;
  yearTo: number;
  /** Human name with generation, e.g. "Golf Mk7". */
  name: string;
}

export interface Platform {
  id: string;
  name: string;
  confidence: "high" | "medium";
  note?: string;
  members: PlatformMember[];
}

const m = (make: string, model: RegExp, yearFrom: number, yearTo: number, name: string): PlatformMember => ({ make, model, yearFrom, yearTo, name });

export const PLATFORMS: Platform[] = [
  {
    id: "vag-mqb",
    name: "Volkswagen Group MQB",
    confidence: "high",
    members: [
      m("VOLKSWAGEN", /^GOLF(?! PLUS)\b/, 2012, 2020, "Golf Mk7"),
      m("AUDI", /^A3\b/, 2012, 2020, "A3 (8V)"),
      m("SEAT", /^LEON\b/, 2012, 2020, "Leon Mk3"),
      m("SKODA", /^OCTAVIA\b/, 2013, 2020, "Octavia Mk3"),
      m("VOLKSWAGEN", /^PASSAT\b/, 2015, 2023, "Passat B8"),
      m("VOLKSWAGEN", /^TIGUAN\b/, 2016, 2024, "Tiguan Mk2"),
      m("VOLKSWAGEN", /^TOURAN\b/, 2015, 2024, "Touran Mk2"),
      m("VOLKSWAGEN", /^T-ROC\b/, 2017, 2024, "T-Roc"),
      m("VOLKSWAGEN", /^ARTEON\b/, 2017, 2024, "Arteon"),
      m("SKODA", /^SUPERB\b/, 2015, 2023, "Superb Mk3"),
      m("SKODA", /^KAROQ\b/, 2017, 2024, "Karoq"),
      m("SKODA", /^KODIAQ\b/, 2016, 2023, "Kodiaq Mk1"),
      m("SEAT", /^ATECA\b/, 2016, 2024, "Ateca"),
      m("SEAT", /^TARRACO\b/, 2018, 2024, "Tarraco"),
      m("AUDI", /^Q2\b/, 2016, 2024, "Q2"),
      m("AUDI", /^Q3\b/, 2018, 2024, "Q3 (F3)"),
      m("AUDI", /^TT\b/, 2014, 2023, "TT (8S)"),
    ],
  },
  {
    id: "vag-mqb-evo",
    name: "Volkswagen Group MQB Evo",
    confidence: "high",
    members: [
      m("VOLKSWAGEN", /^GOLF(?! PLUS)\b/, 2020, 2025, "Golf Mk8"),
      m("AUDI", /^A3\b/, 2020, 2025, "A3 (8Y)"),
      m("SEAT", /^LEON\b/, 2020, 2025, "Leon Mk4"),
      m("CUPRA", /^(LEON|FORMENTOR)\b/, 2020, 2025, "Cupra Leon / Formentor"),
      m("SKODA", /^OCTAVIA\b/, 2020, 2025, "Octavia Mk4"),
      m("VOLKSWAGEN", /^TIGUAN\b/, 2024, 2025, "Tiguan Mk3"),
      m("VOLKSWAGEN", /^PASSAT\b/, 2024, 2025, "Passat B9"),
    ],
  },
  {
    id: "vag-mqb-a0",
    name: "Volkswagen Group MQB A0",
    confidence: "high",
    members: [
      m("VOLKSWAGEN", /^POLO\b/, 2017, 2025, "Polo Mk6"),
      m("SEAT", /^IBIZA\b/, 2017, 2025, "Ibiza Mk5"),
      m("SEAT", /^ARONA\b/, 2017, 2025, "Arona"),
      m("VOLKSWAGEN", /^T-CROSS\b/, 2019, 2025, "T-Cross"),
      m("VOLKSWAGEN", /^TAIGO\b/, 2021, 2025, "Taigo"),
      m("SKODA", /^SCALA\b/, 2019, 2025, "Scala"),
      m("SKODA", /^KAMIQ\b/, 2019, 2025, "Kamiq"),
      m("SKODA", /^FABIA\b/, 2021, 2025, "Fabia Mk4"),
      m("AUDI", /^A1\b/, 2018, 2025, "A1 (GB)"),
    ],
  },
  {
    id: "vag-pq35",
    name: "Volkswagen Group PQ35 / A5",
    confidence: "high",
    members: [
      m("VOLKSWAGEN", /^GOLF(?! PLUS)\b/, 2003, 2012, "Golf Mk5 / Mk6"),
      m("VOLKSWAGEN", /^GOLF PLUS\b/, 2005, 2014, "Golf Plus"),
      m("AUDI", /^A3\b/, 2003, 2012, "A3 (8P)"),
      m("SEAT", /^LEON\b/, 2005, 2012, "Leon Mk2"),
      m("SEAT", /^ALTEA\b/, 2004, 2015, "Altea"),
      m("SKODA", /^OCTAVIA\b/, 2004, 2013, "Octavia Mk2"),
      m("SKODA", /^YETI\b/, 2009, 2017, "Yeti"),
      m("VOLKSWAGEN", /^TOURAN\b/, 2003, 2015, "Touran Mk1"),
      m("VOLKSWAGEN", /^TIGUAN\b/, 2007, 2016, "Tiguan Mk1"),
      m("VOLKSWAGEN", /^JETTA\b/, 2005, 2010, "Jetta Mk5"),
      m("VOLKSWAGEN", /^SCIROCCO\b/, 2008, 2017, "Scirocco Mk3"),
      m("VOLKSWAGEN", /^EOS\b/, 2006, 2015, "Eos"),
      m("VOLKSWAGEN", /^CADDY\b/, 2004, 2020, "Caddy Mk3 / Mk4"),
      m("VOLKSWAGEN", /^BEETLE\b/, 2011, 2019, "Beetle (A5)"),
      m("AUDI", /^TT\b/, 2006, 2014, "TT (8J)"),
    ],
  },
  {
    id: "vag-pq25",
    name: "Volkswagen Group PQ25 / PQ26",
    confidence: "medium",
    note: "The Fabia Mk3 and Rapid use the updated PQ26 variant; suspension and brake parts still largely correspond.",
    members: [
      m("VOLKSWAGEN", /^POLO\b/, 2009, 2017, "Polo Mk5"),
      m("SEAT", /^IBIZA\b/, 2008, 2017, "Ibiza Mk4"),
      m("SKODA", /^FABIA\b/, 2007, 2014, "Fabia Mk2"),
      m("SKODA", /^FABIA\b/, 2014, 2021, "Fabia Mk3"),
      m("SKODA", /^RAPID\b/, 2012, 2019, "Rapid"),
      m("SEAT", /^TOLEDO\b/, 2012, 2019, "Toledo Mk4"),
      m("AUDI", /^A1\b/, 2010, 2018, "A1 (8X)"),
    ],
  },
  {
    id: "vag-nsf",
    name: "Volkswagen Group NSF (city cars)",
    confidence: "high",
    members: [
      m("VOLKSWAGEN", /^UP\b|^UP!/, 2011, 2023, "up!"),
      m("SKODA", /^CITIGO\b/, 2011, 2020, "Citigo"),
      m("SEAT", /^MII\b/, 2011, 2021, "Mii"),
    ],
  },
  {
    id: "ford-global-c",
    name: "Ford Global C (C2)",
    confidence: "high",
    members: [
      m("FORD", /^FOCUS\b/, 2011, 2018, "Focus Mk3"),
      m("FORD", /^(GRAND )?C-MAX\b/, 2010, 2019, "C-Max Mk2"),
      m("FORD", /^KUGA\b/, 2012, 2019, "Kuga Mk2"),
      m("FORD", /^(TRANSIT|TOURNEO) CONNECT\b/, 2013, 2022, "Transit Connect Mk2"),
    ],
  },
  {
    id: "ford-c2-2018",
    name: "Ford C2 (2018 on)",
    confidence: "high",
    members: [m("FORD", /^FOCUS\b/, 2018, 2025, "Focus Mk4"), m("FORD", /^KUGA\b/, 2019, 2025, "Kuga Mk3")],
  },
  {
    id: "ford-c1",
    name: "Ford C1",
    confidence: "high",
    members: [
      m("FORD", /^FOCUS(?! C-MAX)\b/, 2004, 2011, "Focus Mk2"),
      m("FORD", /^(FOCUS )?C-MAX\b/, 2003, 2010, "C-Max Mk1"),
      m("FORD", /^KUGA\b/, 2008, 2012, "Kuga Mk1"),
      m("VOLVO", /^S40\b/, 2004, 2012, "S40 (P1)"),
      m("VOLVO", /^V50\b/, 2004, 2012, "V50"),
      m("VOLVO", /^C30\b/, 2006, 2013, "C30"),
      m("VOLVO", /^C70\b/, 2006, 2013, "C70 Mk2"),
      m("MAZDA", /^3\b|^MAZDA3\b/, 2003, 2009, "Mazda3 (BK)"),
    ],
  },
  {
    id: "ford-b",
    name: "Ford global B",
    confidence: "high",
    members: [
      m("FORD", /^FIESTA\b/, 2008, 2017, "Fiesta Mk7"),
      m("FORD", /^B-MAX\b/, 2012, 2017, "B-Max"),
      m("FORD", /^ECOSPORT\b/, 2013, 2022, "EcoSport"),
    ],
  },
  {
    id: "ford-b2e",
    name: "Ford B2E",
    confidence: "high",
    members: [m("FORD", /^FIESTA\b/, 2017, 2023, "Fiesta Mk8"), m("FORD", /^PUMA\b/, 2019, 2025, "Puma")],
  },
  {
    id: "ford-eucd",
    name: "Ford EUCD / Volvo P3",
    confidence: "high",
    note: "Land Rover's Freelander 2 and first Evoque are built on this platform too.",
    members: [
      m("FORD", /^MONDEO\b/, 2007, 2014, "Mondeo Mk4"),
      m("FORD", /^S-MAX\b/, 2006, 2015, "S-Max Mk1"),
      m("FORD", /^GALAXY\b/, 2006, 2015, "Galaxy Mk3"),
      m("VOLVO", /^S80\b/, 2006, 2016, "S80 II"),
      m("VOLVO", /^V70\b/, 2007, 2016, "V70 III"),
      m("VOLVO", /^XC70\b/, 2007, 2016, "XC70 II"),
      m("VOLVO", /^XC60\b/, 2008, 2017, "XC60 I"),
      m("VOLVO", /^S60\b/, 2010, 2018, "S60 II"),
      m("VOLVO", /^V60\b/, 2010, 2018, "V60 I"),
      m("LAND ROVER", /^FREELANDER\b/, 2006, 2014, "Freelander 2"),
      m("LAND ROVER", /^(RANGE ROVER )?EVOQUE\b/, 2011, 2018, "Range Rover Evoque (L538)"),
      m("LAND ROVER", /^DISCOVERY SPORT\b/, 2014, 2019, "Discovery Sport (L550)"),
    ],
  },
  {
    id: "psa-emp2",
    name: "PSA EMP2",
    confidence: "high",
    members: [
      m("PEUGEOT", /^308\b/, 2013, 2021, "308 (T9)"),
      m("PEUGEOT", /^3008\b/, 2016, 2024, "3008 II"),
      m("PEUGEOT", /^5008\b/, 2017, 2024, "5008 II"),
      m("PEUGEOT", /^508\b/, 2018, 2024, "508 II"),
      m("CITROEN", /^(GRAND )?C4 (PICASSO|SPACETOURER)\b/, 2013, 2022, "C4 Picasso II / SpaceTourer"),
      m("CITROEN", /^C5 AIRCROSS\b/, 2018, 2024, "C5 Aircross"),
      m("DS", /^(DS ?)?7\b/, 2017, 2024, "DS 7"),
      m("VAUXHALL", /^GRANDLAND\b/, 2017, 2024, "Grandland X"),
      m("VAUXHALL", /^ASTRA\b/, 2021, 2025, "Astra L"),
    ],
  },
  {
    id: "psa-cmp",
    name: "PSA CMP / e-CMP",
    confidence: "high",
    members: [
      m("PEUGEOT", /^(E-)?208\b/, 2019, 2025, "208 II"),
      m("PEUGEOT", /^(E-)?2008\b/, 2019, 2025, "2008 II"),
      m("VAUXHALL", /^CORSA\b/, 2019, 2025, "Corsa F"),
      m("VAUXHALL", /^MOKKA\b/, 2020, 2025, "Mokka B"),
      m("CITROEN", /^(E-)?C4\b(?! PICASSO| SPACETOURER| CACTUS)/, 2020, 2025, "C4 III"),
      m("DS", /^(DS ?)?3( CROSSBACK)?\b/, 2019, 2025, "DS 3 Crossback"),
    ],
  },
  {
    id: "psa-pf1",
    name: "PSA PF1",
    confidence: "high",
    members: [
      m("PEUGEOT", /^207\b/, 2006, 2012, "207"),
      m("PEUGEOT", /^208\b/, 2012, 2019, "208 I"),
      m("PEUGEOT", /^2008\b/, 2013, 2019, "2008 I"),
      m("CITROEN", /^C3(?! PICASSO| AIRCROSS)\b/, 2009, 2016, "C3 II"),
      m("CITROEN", /^C3 PICASSO\b/, 2009, 2017, "C3 Picasso"),
      m("CITROEN", /^DS ?3\b/, 2010, 2015, "DS3"),
      m("DS", /^(DS ?)?3\b(?! CROSSBACK)/, 2015, 2019, "DS 3"),
    ],
  },
  {
    id: "psa-pf2",
    name: "PSA PF2",
    confidence: "high",
    members: [
      m("PEUGEOT", /^308\b/, 2007, 2013, "308 (T7)"),
      m("PEUGEOT", /^3008\b/, 2009, 2016, "3008 I"),
      m("PEUGEOT", /^5008\b/, 2009, 2016, "5008 I"),
      m("PEUGEOT", /^RCZ\b/, 2010, 2015, "RCZ"),
      m("CITROEN", /^C4(?! PICASSO| CACTUS| AIRCROSS)\b/, 2004, 2018, "C4 I / II"),
      m("CITROEN", /^(GRAND )?C4 PICASSO\b/, 2006, 2013, "C4 Picasso I"),
      m("CITROEN", /^DS ?4\b/, 2011, 2015, "DS4"),
      m("CITROEN", /^BERLINGO\b/, 2008, 2018, "Berlingo Mk2"),
      m("PEUGEOT", /^PARTNER\b/, 2008, 2018, "Partner Mk2"),
    ],
  },
  {
    id: "renault-nissan-cmf-cd",
    name: "Renault-Nissan CMF-C/D",
    confidence: "high",
    members: [
      m("NISSAN", /^QASHQAI\b/, 2013, 2021, "Qashqai (J11)"),
      m("NISSAN", /^X-TRAIL\b/, 2014, 2022, "X-Trail (T32)"),
      m("RENAULT", /^KADJAR\b/, 2015, 2022, "Kadjar"),
      m("RENAULT", /^MEGANE\b/, 2016, 2022, "Megane IV"),
      m("RENAULT", /^(GRAND )?SCENIC\b/, 2016, 2022, "Scenic IV"),
      m("RENAULT", /^KOLEOS\b/, 2017, 2022, "Koleos II"),
    ],
  },
  {
    id: "renault-nissan-cmf-b",
    name: "Renault-Nissan CMF-B",
    confidence: "high",
    members: [
      m("RENAULT", /^CLIO\b/, 2019, 2025, "Clio V"),
      m("RENAULT", /^CAPTUR\b/, 2020, 2025, "Captur II"),
      m("RENAULT", /^ARKANA\b/, 2021, 2025, "Arkana"),
      m("NISSAN", /^JUKE\b/, 2019, 2025, "Juke (F16)"),
      m("DACIA", /^SANDERO\b/, 2021, 2025, "Sandero III"),
      m("DACIA", /^JOGGER\b/, 2022, 2025, "Jogger"),
    ],
  },
  {
    id: "renault-nissan-b",
    name: "Renault-Nissan B",
    confidence: "medium",
    note: "A long-lived platform; parts correspond within a generation more than across it.",
    members: [
      m("RENAULT", /^CLIO\b/, 2005, 2019, "Clio III / IV"),
      m("RENAULT", /^CAPTUR\b/, 2013, 2019, "Captur I"),
      m("RENAULT", /^MODUS\b/, 2004, 2012, "Modus"),
      m("NISSAN", /^MICRA\b/, 2003, 2010, "Micra (K12)"),
      m("NISSAN", /^NOTE\b/, 2006, 2013, "Note (E11)"),
      m("NISSAN", /^JUKE\b/, 2010, 2019, "Juke (F15)"),
      m("DACIA", /^SANDERO\b/, 2008, 2020, "Sandero I / II"),
      m("DACIA", /^LOGAN\b/, 2008, 2020, "Logan"),
      m("DACIA", /^DUSTER\b/, 2010, 2024, "Duster I / II"),
    ],
  },
  {
    id: "toyota-tnga-c",
    name: "Toyota TNGA-C",
    confidence: "high",
    members: [
      m("TOYOTA", /^COROLLA\b/, 2019, 2025, "Corolla (E210)"),
      m("TOYOTA", /^C-HR\b/, 2016, 2023, "C-HR I"),
      m("TOYOTA", /^PRIUS\b/, 2016, 2022, "Prius (XW50)"),
      m("LEXUS", /^UX\b/, 2019, 2025, "UX"),
    ],
  },
  {
    id: "toyota-tnga-b",
    name: "Toyota TNGA-B",
    confidence: "high",
    members: [m("TOYOTA", /^YARIS(?! CROSS)\b/, 2020, 2025, "Yaris (XP210)"), m("TOYOTA", /^YARIS CROSS\b/, 2021, 2025, "Yaris Cross")],
  },
  {
    id: "toyota-mc",
    name: "Toyota MC",
    confidence: "medium",
    members: [
      m("TOYOTA", /^AURIS\b/, 2007, 2018, "Auris (E150 / E180)"),
      m("TOYOTA", /^COROLLA\b/, 2007, 2013, "Corolla (E150)"),
      m("TOYOTA", /^VERSO\b/, 2009, 2018, "Verso"),
      m("TOYOTA", /^PRIUS\b/, 2009, 2015, "Prius (XW30)"),
      m("LEXUS", /^CT\b/, 2011, 2020, "CT 200h"),
    ],
  },
  {
    id: "hyundai-kia-i30-ceed-2017",
    name: "Hyundai-Kia i30 / Ceed (2017 on)",
    confidence: "high",
    members: [m("HYUNDAI", /^I30\b/, 2017, 2024, "i30 (PD)"), m("KIA", /^(PRO)?CEE'?D\b|^XCEED\b/, 2018, 2025, "Ceed (CD)")],
  },
  {
    id: "hyundai-kia-i30-ceed-2012",
    name: "Hyundai-Kia i30 / Cee'd (2012 to 2017)",
    confidence: "high",
    members: [m("HYUNDAI", /^I30\b/, 2012, 2017, "i30 (GD)"), m("KIA", /^(PRO)?CEE'?D\b/, 2012, 2018, "Cee'd (JD)")],
  },
  {
    id: "hyundai-kia-suv-2015",
    name: "Hyundai-Kia Tucson / Sportage (2015 on)",
    confidence: "high",
    members: [m("HYUNDAI", /^TUCSON\b/, 2015, 2020, "Tucson (TL)"), m("KIA", /^SPORTAGE\b/, 2016, 2021, "Sportage (QL)")],
  },
  {
    id: "hyundai-kia-suv-2021",
    name: "Hyundai-Kia Tucson / Sportage (2021 on)",
    confidence: "high",
    members: [m("HYUNDAI", /^TUCSON\b/, 2021, 2025, "Tucson (NX4)"), m("KIA", /^SPORTAGE\b/, 2022, 2025, "Sportage (NQ5)")],
  },
  {
    id: "bmw-f-series",
    name: "BMW F-series (rear-drive compact)",
    confidence: "medium",
    note: "DVSA records BMWs by engine badge (320D, 118I). Year ranges separate generations; the 2 Series is left out because coupe and Active Tourer share badges on different platforms.",
    members: [
      m("BMW", /^M?1[12][0-9][DI]?\b/, 2011, 2019, "1 Series (F20 / F21)"),
      m("BMW", /^3[1-4][0-9][DIE]?\b/, 2012, 2019, "3 Series (F30 / F31)"),
      m("BMW", /^4[2-4][0-9][DI]?\b|^M4\b/, 2013, 2020, "4 Series (F32 / F33 / F36)"),
    ],
  },
  {
    id: "bmw-clar",
    name: "BMW CLAR",
    confidence: "medium",
    members: [
      m("BMW", /^3[1-4][0-9][DIE]?\b|^M3\b/, 2019, 2025, "3 Series (G20 / G21)"),
      m("BMW", /^4[2-4][0-9][DIE]?\b|^M4\b/, 2020, 2025, "4 Series (G22 / G23 / G26)"),
      m("BMW", /^5[1-4][0-9][DIE]?\b|^M5\b/, 2017, 2023, "5 Series (G30 / G31)"),
      m("BMW", /^X3\b/, 2017, 2024, "X3 (G01)"),
      m("BMW", /^X4\b/, 2018, 2024, "X4 (G02)"),
      m("BMW", /^X5\b/, 2018, 2025, "X5 (G05)"),
    ],
  },
  {
    id: "bmw-ukl",
    name: "BMW / MINI UKL (front-drive)",
    confidence: "medium",
    members: [
      m("MINI", /^(MINI )?(COOPER|ONE|JOHN COOPER)/, 2014, 2024, "MINI hatch (F55 / F56)"),
      m("MINI", /^(MINI )?CLUBMAN\b/, 2015, 2024, "MINI Clubman (F54)"),
      m("MINI", /^(MINI )?COUNTRYMAN\b/, 2017, 2024, "MINI Countryman (F60)"),
      m("BMW", /^X1\b/, 2015, 2022, "X1 (F48)"),
      m("BMW", /^X2\b/, 2018, 2023, "X2 (F39)"),
      m("BMW", /^M?1[12][0-9][DI]?\b/, 2019, 2025, "1 Series (F40)"),
    ],
  },
  {
    id: "mini-r56",
    name: "MINI R56 generation",
    confidence: "medium",
    members: [m("MINI", /^(MINI )?(COOPER|ONE|JOHN COOPER)/, 2006, 2013, "MINI hatch (R56)"), m("MINI", /^(MINI )?CLUBMAN\b/, 2007, 2014, "MINI Clubman (R55)")],
  },
  {
    id: "gm-gamma-2",
    name: "GM Gamma II / Fiat SCCS",
    confidence: "medium",
    note: "The Corsa D and Fiat Grande Punto were co-developed; the Corsa E is a heavy update of the same car.",
    members: [
      m("VAUXHALL", /^CORSA\b/, 2006, 2014, "Corsa D"),
      m("VAUXHALL", /^CORSA\b/, 2014, 2019, "Corsa E"),
      m("VAUXHALL", /^ADAM\b/, 2013, 2019, "Adam"),
      m("FIAT", /^(GRANDE )?PUNTO\b/, 2005, 2018, "Grande Punto / Punto Evo / Punto"),
    ],
  },
  {
    id: "gm-delta-2",
    name: "GM Delta II",
    confidence: "high",
    members: [
      m("VAUXHALL", /^ASTRA(?! K)\b/, 2009, 2015, "Astra J"),
      m("VAUXHALL", /^ZAFIRA TOURER\b/, 2011, 2018, "Zafira Tourer (C)"),
      m("VAUXHALL", /^CASCADA\b/, 2013, 2018, "Cascada"),
      m("CHEVROLET", /^CRUZE\b/, 2009, 2015, "Cruze"),
    ],
  },
  {
    id: "gm-d2xx",
    name: "GM D2XX",
    confidence: "high",
    members: [m("VAUXHALL", /^ASTRA\b/, 2015, 2021, "Astra K")],
  },
  {
    id: "mercedes-mfa",
    name: "Mercedes-Benz MFA",
    confidence: "medium",
    note: "DVSA records Mercedes by badge (A180, B200, CLA220).",
    members: [
      m("MERCEDES-BENZ", /^A ?(1[5-9]0|2[0-5]0|45)\b/, 2012, 2018, "A-Class (W176)"),
      m("MERCEDES-BENZ", /^B ?(1[5-9]0|2[0-5]0)\b/, 2012, 2018, "B-Class (W246)"),
      m("MERCEDES-BENZ", /^CLA\b/, 2013, 2019, "CLA (C117)"),
      m("MERCEDES-BENZ", /^GLA\b/, 2014, 2020, "GLA (X156)"),
    ],
  },
  {
    id: "mercedes-mfa2",
    name: "Mercedes-Benz MFA2",
    confidence: "medium",
    members: [
      m("MERCEDES-BENZ", /^A ?(1[5-9]0|2[0-5]0|35|45)\b/, 2018, 2025, "A-Class (W177)"),
      m("MERCEDES-BENZ", /^B ?(1[5-9]0|2[0-5]0)\b/, 2019, 2025, "B-Class (W247)"),
      m("MERCEDES-BENZ", /^CLA\b/, 2019, 2025, "CLA (C118)"),
      m("MERCEDES-BENZ", /^GLA\b/, 2020, 2025, "GLA (H247)"),
      m("MERCEDES-BENZ", /^GLB\b/, 2019, 2025, "GLB (X247)"),
    ],
  },
  {
    id: "volvo-spa",
    name: "Volvo SPA",
    confidence: "high",
    members: [
      m("VOLVO", /^XC90\b/, 2015, 2025, "XC90 II"),
      m("VOLVO", /^XC60\b/, 2017, 2025, "XC60 II"),
      m("VOLVO", /^S90\b/, 2016, 2025, "S90"),
      m("VOLVO", /^V90\b/, 2016, 2025, "V90"),
      m("VOLVO", /^S60\b/, 2019, 2025, "S60 III"),
      m("VOLVO", /^V60\b/, 2018, 2025, "V60 II"),
    ],
  },
  {
    id: "volvo-cma",
    name: "Volvo / Geely CMA",
    confidence: "high",
    members: [m("VOLVO", /^XC40\b/, 2017, 2025, "XC40"), m("VOLVO", /^C40\b/, 2021, 2025, "C40"), m("POLESTAR", /^2\b|^POLESTAR 2\b/, 2020, 2025, "Polestar 2")],
  },
  {
    id: "b-zero-1",
    name: "Toyota-PSA B-Zero (2005 to 2014)",
    confidence: "high",
    members: [m("CITROEN", /^C1\b/, 2005, 2014, "C1 Mk1"), m("PEUGEOT", /^107\b/, 2005, 2014, "107"), m("TOYOTA", /^AYGO(?! X)\b/, 2005, 2014, "Aygo Mk1")],
  },
  {
    id: "b-zero-2",
    name: "Toyota-PSA B-Zero (2014 to 2022)",
    confidence: "high",
    members: [m("CITROEN", /^C1\b/, 2014, 2022, "C1 Mk2"), m("PEUGEOT", /^108\b/, 2014, 2021, "108"), m("TOYOTA", /^AYGO(?! X)\b/, 2014, 2022, "Aygo Mk2")],
  },
  {
    id: "fiat-500",
    name: "Fiat 500 / Panda / Ford Ka",
    confidence: "medium",
    note: "The second-generation Ford Ka was built by Fiat alongside the 500.",
    members: [m("FIAT", /^500(?!X| X|L| L)\b/, 2007, 2024, "500"), m("FIAT", /^PANDA\b/, 2012, 2024, "Panda (319)"), m("FORD", /^KA\b/, 2008, 2016, "Ka Mk2")],
  },
  {
    id: "mazda-skyactiv",
    name: "Mazda Skyactiv",
    confidence: "medium",
    note: "Skyactiv is an architecture more than a single platform; component sizes differ between the 2, 3, 6 and CX models.",
    members: [
      m("MAZDA", /^3\b|^MAZDA3\b/, 2013, 2019, "Mazda3 (BM / BN)"),
      m("MAZDA", /^6\b|^MAZDA6\b/, 2012, 2024, "Mazda6 (GJ / GL)"),
      m("MAZDA", /^CX-5\b/, 2012, 2025, "CX-5 (KE / KF)"),
      m("MAZDA", /^CX-3\b/, 2015, 2021, "CX-3"),
      m("MAZDA", /^2\b|^MAZDA2\b/, 2014, 2024, "Mazda2 (DJ)"),
    ],
  },
];
