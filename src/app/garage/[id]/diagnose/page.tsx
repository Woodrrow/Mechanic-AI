import type { Metadata } from "next";
import { DiagnoseFlow } from "@/components/diagnose-flow";

export const metadata: Metadata = { title: "Diagnose" };
export const dynamic = "force-dynamic";

export default async function DiagnosePage(props: PageProps<"/garage/[id]/diagnose">) {
  const { id } = await props.params;
  return <DiagnoseFlow vehicleId={id} />;
}
