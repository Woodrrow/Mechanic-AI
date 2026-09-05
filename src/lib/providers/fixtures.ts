/**
 * Demo fixtures, shaped exactly like the live provider responses so the merge
 * layer and UI exercise the same code paths with or without API keys.
 * Values are illustrative. The error plates mirror the DVLA UAT convention
 * (ER19BAD -> 400, ER19NFD -> 404, ER19THR -> 429).
 */
import type { VesVehicle } from "./dvla-ves";
import type { MotVehicle } from "./dvsa-mot";
import type { ProviderErrorKind } from "./errors";
import type { VpicRow } from "./nhtsa-vpic";

export interface RegistrationFixture {
  note: string;
  ves?: VesVehicle;
  mot?: MotVehicle;
  vesError?: ProviderErrorKind;
  motError?: ProviderErrorKind;
}

export interface VinFixture {
  note: string;
  mot?: MotVehicle;
  vpic?: VpicRow;
}

const FOCUS_VES: VesVehicle = {
  registrationNumber: "AB15CDE",
  taxStatus: "Taxed",
  taxDueDate: "2027-03-01",
  motStatus: "Valid",
  motExpiryDate: "2027-02-11",
  make: "FORD",
  yearOfManufacture: 2015,
  engineCapacity: 1596,
  co2Emissions: 136,
  fuelType: "PETROL",
  markedForExport: false,
  colour: "BLUE",
  typeApproval: "M1",
  dateOfLastV5CIssued: "2022-06-14",
  wheelplan: "2 AXLE RIGID BODY",
  monthOfFirstRegistration: "2015-03",
  euroStatus: "EURO5",
};

const FOCUS_MOT: MotVehicle = {
  registration: "AB15CDE",
  make: "FORD",
  model: "FOCUS",
  firstUsedDate: "2015-03-17",
  fuelType: "Petrol",
  primaryColour: "Blue",
  registrationDate: "2015-03-17",
  manufactureDate: "2015-02-25",
  engineSize: "1596",
  hasOutstandingRecall: "No",
  motTests: [
    {
      completedDate: "2026-02-12T09:41:03.000Z",
      testResult: "PASSED",
      expiryDate: "2027-02-11",
      odometerValue: "84210",
      odometerUnit: "MI",
      odometerResultType: "READ",
      motTestNumber: "482619304817",
      dataSource: "DVSA",
      defects: [
        { text: "Front Brake pad(s) wearing thin (1.1.13 (a) (ii))", type: "ADVISORY", dangerous: false },
        {
          text: "Nearside Front Tyre worn close to legal limit/worn on edge (5.2.3 (e))",
          type: "ADVISORY",
          dangerous: false,
        },
        { text: "Oil leak, but not excessive (8.4.1 (a) (i))", type: "ADVISORY", dangerous: false },
      ],
    },
    {
      completedDate: "2025-02-10T14:02:55.000Z",
      testResult: "PASSED",
      expiryDate: "2026-02-09",
      odometerValue: "76455",
      odometerUnit: "MI",
      odometerResultType: "READ",
      motTestNumber: "913377402615",
      dataSource: "DVSA",
      defects: [
        {
          text: "Front Brake disc worn, pitted or scored, but not seriously weakened (1.1.14 (a) (ii))",
          type: "ADVISORY",
          dangerous: false,
        },
      ],
    },
    {
      completedDate: "2024-02-05T15:40:12.000Z",
      testResult: "PASSED",
      expiryDate: "2025-02-04",
      odometerValue: "68995",
      odometerUnit: "MI",
      odometerResultType: "READ",
      motTestNumber: "770214598320",
      dataSource: "DVSA",
      defects: [],
    },
    {
      completedDate: "2024-02-05T10:15:00.000Z",
      testResult: "FAILED",
      odometerValue: "68990",
      odometerUnit: "MI",
      odometerResultType: "READ",
      motTestNumber: "770214598211",
      dataSource: "DVSA",
      defects: [
        { text: "Offside Front Headlamp aim too high (4.1.2 (a))", type: "MAJOR", dangerous: false },
        {
          text: "Windscreen wiper blade defective, not clearing the screen (3.4 (b) (i))",
          type: "MINOR",
          dangerous: false,
        },
      ],
    },
    {
      completedDate: "2023-02-08T11:30:00.000Z",
      testResult: "PASSED",
      expiryDate: "2024-02-07",
      odometerValue: "62110",
      odometerUnit: "MI",
      odometerResultType: "READ",
      motTestNumber: "655102938471",
      dataSource: "DVSA",
      defects: [],
    },
    {
      completedDate: "2022-02-14T09:05:00.000Z",
      testResult: "PASSED",
      expiryDate: "2023-02-13",
      odometerValue: "56800",
      odometerUnit: "MI",
      odometerResultType: "READ",
      motTestNumber: "544019283746",
      dataSource: "DVSA",
      defects: [
        {
          text: "Front Brake disc worn, pitted or scored, but not seriously weakened (1.1.14 (a) (ii))",
          type: "ADVISORY",
          dangerous: false,
        },
      ],
    },
    {
      completedDate: "2021-02-10T15:20:00.000Z",
      testResult: "PASSED",
      expiryDate: "2022-02-09",
      odometerValue: "49200",
      odometerUnit: "MI",
      odometerResultType: "READ",
      motTestNumber: "433928174650",
      dataSource: "DVSA",
      defects: [
        {
          text: "Nearside Rear Tyre worn close to legal limit/worn on edge (5.2.3 (e))",
          type: "ADVISORY",
          dangerous: false,
        },
      ],
    },
    {
      completedDate: "2020-03-02T10:00:00.000Z",
      testResult: "PASSED",
      expiryDate: "2021-03-01",
      odometerValue: "40900",
      odometerUnit: "MI",
      odometerResultType: "READ",
      motTestNumber: "322817364590",
      dataSource: "DVSA",
      defects: [],
    },
    {
      completedDate: "2019-03-06T13:45:00.000Z",
      testResult: "PASSED",
      expiryDate: "2020-03-05",
      odometerValue: "32400",
      odometerUnit: "MI",
      odometerResultType: "READ",
      motTestNumber: "211706253489",
      dataSource: "DVSA",
      defects: [
        { text: "Offside Rear Windscreen wiper blade deteriorated (3.4 (b) (i))", type: "ADVISORY", dangerous: false },
      ],
    },
    // Pre-May-2018 test: legacy manual codes, no defect-type categories beyond advisory.
    {
      completedDate: "2018-03-09T09:15:00.000Z",
      testResult: "PASSED",
      expiryDate: "2019-03-08",
      odometerValue: "24100",
      odometerUnit: "MI",
      odometerResultType: "READ",
      motTestNumber: "100695142378",
      dataSource: "DVSA",
      defects: [
        { text: "Nearside Front Tyre worn close to the legal limit (4.1.E.1)", type: "ADVISORY", dangerous: false },
        { text: "Exhaust has a minor leak of exhaust gases (7.1.2)", type: "ADVISORY", dangerous: false },
      ],
    },
  ],
};

const GOLF_VES: VesVehicle = {
  registrationNumber: "LK66YHC",
  taxStatus: "Taxed",
  taxDueDate: "2027-05-01",
  motStatus: "Valid",
  motExpiryDate: "2027-01-20",
  make: "VOLKSWAGEN",
  yearOfManufacture: 2016,
  engineCapacity: 1968,
  co2Emissions: 106,
  fuelType: "DIESEL",
  markedForExport: false,
  colour: "GREY",
  typeApproval: "M1",
  dateOfLastV5CIssued: "2021-09-30",
  wheelplan: "2 AXLE RIGID BODY",
  monthOfFirstRegistration: "2016-11",
  euroStatus: "EURO6",
};

const GOLF_MOT: MotVehicle = {
  registration: "LK66YHC",
  make: "VOLKSWAGEN",
  model: "GOLF",
  firstUsedDate: "2016-11-04",
  fuelType: "Diesel",
  primaryColour: "Grey",
  registrationDate: "2016-11-04",
  manufactureDate: "2016-10-12",
  engineSize: "1968",
  hasOutstandingRecall: "No",
  motTests: [
    {
      completedDate: "2026-01-21T11:05:44.000Z",
      testResult: "PASSED",
      expiryDate: "2027-01-20",
      odometerValue: "91230",
      odometerUnit: "MI",
      odometerResultType: "READ",
      motTestNumber: "552018377401",
      dataSource: "DVSA",
      defects: [
        { text: "Rear Brake pad(s) wearing thin (1.1.13 (a) (ii))", type: "ADVISORY", dangerous: false },
        {
          text: "Nearside Rear Tyre worn close to legal limit/worn on edge (5.2.3 (e))",
          type: "ADVISORY",
          dangerous: false,
        },
      ],
    },
    {
      completedDate: "2025-01-19T09:20:10.000Z",
      testResult: "PASSED",
      expiryDate: "2026-01-18",
      odometerValue: "83110",
      odometerUnit: "MI",
      odometerResultType: "READ",
      motTestNumber: "301776450922",
      dataSource: "DVSA",
      defects: [
        {
          text: "Front Brake disc worn, pitted or scored, but not seriously weakened (1.1.14 (a) (ii))",
          type: "ADVISORY",
          dangerous: false,
        },
      ],
    },
    {
      completedDate: "2025-01-18T14:48:31.000Z",
      testResult: "FAILED",
      odometerValue: "83105",
      odometerUnit: "MI",
      odometerResultType: "READ",
      motTestNumber: "301776450877",
      dataSource: "DVSA",
      defects: [
        {
          text: "Nearside Front Suspension arm ball joint has excessive play (5.3.4 (a) (i))",
          type: "MAJOR",
          dangerous: false,
        },
        {
          text: "Offside Front Suspension arm ball joint has excessive play (5.3.4 (a) (i))",
          type: "MAJOR",
          dangerous: false,
        },
      ],
    },
  ],
};

const YARIS_VES: VesVehicle = {
  registrationNumber: "LP24ABC",
  taxStatus: "Taxed",
  taxDueDate: "2027-04-01",
  motStatus: "No details held by DVLA",
  make: "TOYOTA",
  yearOfManufacture: 2024,
  engineCapacity: 1490,
  co2Emissions: 92,
  fuelType: "HYBRID ELECTRIC",
  markedForExport: false,
  colour: "WHITE",
  typeApproval: "M1",
  dateOfLastV5CIssued: "2024-04-12",
  wheelplan: "2 AXLE RIGID BODY",
  monthOfFirstRegistration: "2024-04",
  euroStatus: "EURO6",
};

/** The "new vehicle" shape: no motTests, a motTestDueDate instead. */
const YARIS_MOT: MotVehicle = {
  registration: "LP24ABC",
  make: "TOYOTA",
  model: "YARIS",
  manufactureYear: "2024",
  fuelType: "Hybrid Electric (Clean)",
  primaryColour: "White",
  registrationDate: "2024-04-12",
  manufactureDate: "2024-03-20",
  hasOutstandingRecall: "No",
  motTestDueDate: "2027-04-11",
};

/** Shaped like DVLA's documented UAT example for AA19AAA. */
const DVLA_TEST_VES: VesVehicle = {
  registrationNumber: "AA19AAA",
  taxStatus: "Taxed",
  taxDueDate: "2027-08-01",
  motStatus: "Valid",
  motExpiryDate: "2027-07-31",
  make: "FORD",
  yearOfManufacture: 2019,
  engineCapacity: 1498,
  co2Emissions: 110,
  fuelType: "PETROL",
  markedForExport: false,
  colour: "RED",
  typeApproval: "M1",
  dateOfLastV5CIssued: "2019-08-01",
  wheelplan: "2 AXLE RIGID BODY",
  monthOfFirstRegistration: "2019-08",
};

export const REGISTRATION_FIXTURES: Record<string, RegistrationFixture> = {
  AB15CDE: {
    note: "2015 Ford Focus 1.6 petrol with ten MOT tests, one failure, and advisories on brakes, tyres and an oil leak.",
    ves: FOCUS_VES,
    mot: FOCUS_MOT,
  },
  LK66YHC: {
    note: "2016 Volkswagen Golf 2.0 diesel (MQB platform) with a failed-then-passed test on record.",
    ves: GOLF_VES,
    mot: GOLF_MOT,
  },
  LP24ABC: {
    note: "2024 Toyota Yaris hybrid, too new for an MOT: exercises the motTestDueDate response shape.",
    ves: YARIS_VES,
    mot: YARIS_MOT,
  },
  AA19AAA: {
    note: "DVLA's documented test vehicle with no DVSA record, so the model has to be entered by the user.",
    ves: DVLA_TEST_VES,
    motError: "not_found",
  },
  ER19BAD: { note: "400 Bad Request from both providers.", vesError: "bad_request", motError: "bad_request" },
  ER19NFD: { note: "404 Not Found from both providers.", vesError: "not_found", motError: "not_found" },
  ER19THR: { note: "429 Too Many Requests from both providers.", vesError: "rate_limited", motError: "rate_limited" },
};

export const US_FOCUS_VIN = "1FADP3F23FL123456";
export const EU_FOCUS_VIN = "WF0DXXGCBDFE12345";

export const VIN_FIXTURES: Record<string, VinFixture> = {
  [US_FOCUS_VIN]: {
    note: "US-market 2015 Ford Focus: the full decode vPIC gives for a US filing.",
    vpic: {
      VIN: US_FOCUS_VIN,
      Make: "FORD",
      Manufacturer: "FORD MOTOR COMPANY, USA",
      Model: "Focus",
      ModelYear: "2015",
      Series: "SE",
      BodyClass: "Hatchback/Liftback/Notchback",
      Doors: "5",
      VehicleType: "PASSENGER CAR",
      EngineCylinders: "4",
      DisplacementCC: "2000",
      DisplacementL: "2.0",
      EngineModel: "Duratec 2.0L GDI",
      FuelTypePrimary: "Gasoline",
      TransmissionStyle: "",
      PlantCity: "WAYNE",
      PlantState: "MICHIGAN",
      PlantCountry: "UNITED STATES (USA)",
      ErrorCode: "0",
      ErrorText: "0 - VIN decoded clean. Check Digit (9th position) is correct",
    },
  },
  [EU_FOCUS_VIN]: {
    note: "EU-market Ford registered in the UK: DVSA finds it by VIN; vPIC only recognises the manufacturer.",
    mot: FOCUS_MOT,
    vpic: {
      VIN: EU_FOCUS_VIN,
      Make: "FORD",
      Manufacturer: "FORD WERKE GMBH",
      Model: "",
      ModelYear: "",
      BodyClass: "",
      VehicleType: "PASSENGER CAR",
      EngineCylinders: "",
      DisplacementCC: "",
      DisplacementL: "",
      FuelTypePrimary: "",
      TransmissionStyle: "",
      PlantCountry: "GERMANY",
      ErrorCode: "8",
      ErrorText: "8 - No detailed data available currently",
    },
  },
};

export const DEMO_REGISTRATIONS = ["AB15 CDE", "LK66 YHC", "LP24 ABC", "AA19 AAA", "ER19 NFD"];
export const DEMO_VINS = [US_FOCUS_VIN, EU_FOCUS_VIN];
