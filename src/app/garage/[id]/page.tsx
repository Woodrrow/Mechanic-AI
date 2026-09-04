import type { Metadata } from "next";
import { VehicleDetail } from "@/components/vehicle-detail";

export const metadata: Metadata = { title: "Your car" };

export default async function VehiclePage(props: PageProps<"/garage/[id]">) {
  const { id } = await props.params;
  return <VehicleDetail id={id} />;
}
