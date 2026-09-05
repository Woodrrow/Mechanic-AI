import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JobGuide } from "@/components/job-guide";
import { getJob } from "@/lib/jobs/catalogue";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: PageProps<"/garage/[id]/jobs/[jobId]">): Promise<Metadata> {
  const { jobId } = await props.params;
  return { title: getJob(jobId)?.title ?? "Job guide" };
}

export default async function JobGuidePage(props: PageProps<"/garage/[id]/jobs/[jobId]">) {
  const { id, jobId } = await props.params;
  if (!getJob(jobId)) notFound();
  return <JobGuide vehicleId={id} jobId={jobId} />;
}
