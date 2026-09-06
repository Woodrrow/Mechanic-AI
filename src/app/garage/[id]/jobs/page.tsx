import type { Metadata } from "next";
import { JobsIndex } from "@/components/jobs-index";

export const metadata: Metadata = { title: "Jobs" };
export const dynamic = "force-dynamic";

export default async function JobsPage(props: PageProps<"/garage/[id]/jobs">) {
  const { id } = await props.params;
  return <JobsIndex vehicleId={id} />;
}
