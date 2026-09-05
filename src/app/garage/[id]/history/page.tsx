import type { Metadata } from "next";
import { VehicleHistory } from "@/components/vehicle-history";
import { lookupAvailability, lookupDepsFromEnv } from "@/lib/vehicle/lookup";

export const metadata: Metadata = { title: "Your car's history" };

export const dynamic = "force-dynamic";

export default async function VehicleHistoryPage(props: PageProps<"/garage/[id]/history">) {
  const { id } = await props.params;
  const availability = lookupAvailability(lookupDepsFromEnv());
  return <VehicleHistory id={id} canRefresh={availability.registration} />;
}
