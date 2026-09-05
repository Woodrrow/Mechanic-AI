import type { Metadata } from "next";
import { AddVehicleFlow } from "@/components/add-vehicle-flow";
import { DEMO_REGISTRATIONS, DEMO_VINS } from "@/lib/providers/fixtures";
import { lookupAvailability, lookupDepsFromEnv } from "@/lib/vehicle/lookup";

export const metadata: Metadata = { title: "Add your car" };

// Read the provider configuration per request rather than baking it in at build time.
export const dynamic = "force-dynamic";

export default function AddVehiclePage() {
  const availability = lookupAvailability(lookupDepsFromEnv());
  return (
    <AddVehicleFlow availability={availability} demoRegistrations={DEMO_REGISTRATIONS} demoVins={DEMO_VINS} />
  );
}
