import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Country,
  FuelType,
  Provenance,
  RawSources,
  Transmission,
  UkVehicleDetails,
  Vehicle,
  VehicleCore,
} from "@/lib/vehicle/types";
import type { GarageStore } from "./types";

const TABLE = "garage_vehicles";

/** Mirrors supabase/migrations/*_garage.sql */
interface GarageRow {
  id: string;
  user_id: string;
  country: Country;
  registration: string | null;
  vin: string | null;
  make: string;
  make_raw: string;
  model: string | null;
  year: number | null;
  engine_cc: number | null;
  fuel: FuelType;
  transmission: Transmission;
  colour: string | null;
  uk: UkVehicleDetails | null;
  provenance: Provenance[];
  sources: RawSources;
  created_at: string;
  updated_at: string;
}

function rowToVehicle(row: GarageRow): Vehicle {
  return {
    id: row.id,
    country: row.country,
    registration: row.registration,
    vin: row.vin,
    make: row.make,
    makeRaw: row.make_raw,
    model: row.model,
    year: row.year,
    engineCc: row.engine_cc,
    fuel: row.fuel,
    transmission: row.transmission,
    colour: row.colour,
    uk: row.uk,
    provenance: row.provenance ?? [],
    sources: row.sources ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function vehicleToRow(core: VehicleCore): Omit<GarageRow, "id" | "user_id" | "created_at" | "updated_at"> {
  return {
    country: core.country,
    registration: core.registration,
    vin: core.vin,
    make: core.make,
    make_raw: core.makeRaw,
    model: core.model,
    year: core.year,
    engine_cc: core.engineCc,
    fuel: core.fuel,
    transmission: core.transmission,
    colour: core.colour,
    uk: core.uk,
    provenance: core.provenance,
    sources: core.sources,
  };
}

export class SupabaseGarageStore implements GarageStore {
  readonly kind = "supabase" as const;

  constructor(private readonly client: SupabaseClient) {}

  /**
   * Anonymous sign-in gives every device its own auth.uid() so RLS scopes rows
   * without a signup wall. Converting to a permanent account later is a
   * `updateUser`/`linkIdentity` call, not a migration.
   */
  private async ensureSession(): Promise<void> {
    const { data } = await this.client.auth.getSession();
    if (data.session) return;
    const { error } = await this.client.auth.signInAnonymously();
    if (error) throw new Error(`Could not start an anonymous session: ${error.message}`);
  }

  async list(): Promise<Vehicle[]> {
    await this.ensureSession();
    const { data, error } = await this.client
      .from(TABLE)
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data as GarageRow[]).map(rowToVehicle);
  }

  async get(id: string): Promise<Vehicle | null> {
    await this.ensureSession();
    const { data, error } = await this.client.from(TABLE).select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(error.message);
    return data ? rowToVehicle(data as GarageRow) : null;
  }

  async add(core: VehicleCore): Promise<Vehicle> {
    await this.ensureSession();
    const { data, error } = await this.client
      .from(TABLE)
      .insert(vehicleToRow(core))
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return rowToVehicle(data as GarageRow);
  }

  async remove(id: string): Promise<void> {
    await this.ensureSession();
    const { error } = await this.client.from(TABLE).delete().eq("id", id);
    if (error) throw new Error(error.message);
  }
}
