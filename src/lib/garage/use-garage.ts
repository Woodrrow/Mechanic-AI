"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Vehicle, VehicleCore } from "@/lib/vehicle/types";
import { getGarageStore } from "./index";

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong reading your garage.";
}

export function useGarage() {
  const store = useMemo(() => getGarageStore(), []);
  const [vehicles, setVehicles] = useState<Vehicle[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  // Re-runs whenever `version` is bumped after a write.
  useEffect(() => {
    let cancelled = false;
    store
      .list()
      .then((list) => {
        if (cancelled) return;
        setVehicles(list);
        setError(null);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(describeError(e));
      });
    return () => {
      cancelled = true;
    };
  }, [store, version]);

  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  const add = useCallback(
    async (core: VehicleCore) => {
      const saved = await store.add(core);
      refresh();
      return saved;
    },
    [store, refresh],
  );

  const remove = useCallback(
    async (id: string) => {
      await store.remove(id);
      refresh();
    },
    [store, refresh],
  );

  return {
    vehicles,
    loading: vehicles === null && error === null,
    error,
    add,
    remove,
    refresh,
    storeKind: store.kind,
  };
}

export function useVehicle(id: string) {
  const store = useMemo(() => getGarageStore(), []);
  const [vehicle, setVehicle] = useState<Vehicle | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    store
      .get(id)
      .then((v) => {
        if (!cancelled) setVehicle(v);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(describeError(e));
      });
    return () => {
      cancelled = true;
    };
  }, [store, id]);

  const remove = useCallback(async () => {
    await store.remove(id);
  }, [store, id]);

  return { vehicle, loading: vehicle === undefined && error === null, error, remove, storeKind: store.kind };
}
