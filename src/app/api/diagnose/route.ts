import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { diagnose } from "@/lib/diagnose/engine";
import { decodeCodes } from "@/lib/diagnose/obd";
import { getSymptom } from "@/lib/diagnose/symptoms";
import type { DiagnosisResult } from "@/lib/diagnose/types";
import { analyseHistory } from "@/lib/mot/history";
import { MotVehicleSchema } from "@/lib/providers/dvsa-mot";

export const dynamic = "force-dynamic";

const BodySchema = z.object({
  symptomId: z.string().min(1),
  answers: z.record(z.string(), z.union([z.string(), z.array(z.string())])).default({}),
  codes: z.string().max(500).optional(),
  /** The stored DVSA payload, sent from the browser so the server stays stateless. */
  motRecord: z.unknown().optional(),
});

export type DiagnoseApiResponse =
  | { ok: true; result: DiagnosisResult; codes: ReturnType<typeof decodeCodes> }
  | { ok: false; error: { code: string; message: string } };

export async function POST(request: NextRequest): Promise<NextResponse<DiagnoseApiResponse>> {
  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: { code: "invalid_request", message: "symptomId is required." } }, { status: 400 });
  }
  const symptom = getSymptom(parsed.data.symptomId);
  if (!symptom) {
    return NextResponse.json({ ok: false, error: { code: "unknown_symptom", message: "No such symptom." } }, { status: 404 });
  }

  const mot = MotVehicleSchema.safeParse(parsed.data.motRecord);
  const history = mot.success ? analyseHistory(mot.data) : null;
  const codes = decodeCodes(parsed.data.codes ?? "");

  const result = diagnose({ symptom, answers: parsed.data.answers, history, codes: codes.codes });
  return NextResponse.json({ ok: true, result, codes }, { headers: { "cache-control": "no-store" } });
}
