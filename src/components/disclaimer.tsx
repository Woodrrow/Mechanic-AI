export function Disclaimer({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <p className="text-xs leading-relaxed text-muted">
        Pocket Mechanic offers general guidance about your car. It is not a substitute for a qualified mechanic or
        the manufacturer&apos;s manual, and you are responsible for your own safety and for checking every figure
        before you rely on it.
      </p>
    );
  }
  return (
    <div className="rounded-xl border border-warn/40 bg-warn-bg p-4 text-sm leading-relaxed">
      <p className="font-semibold text-warn">Before you rely on anything here</p>
      <p className="mt-1">
        Vehicle details come from public DVLA, DVSA and NHTSA records and can be wrong or out of date. Guidance in
        this app is general, not a professional inspection. Working on a car can injure or kill you or others.
        Always check figures against your manual or parts supplier, and stop if you are unsure.
      </p>
    </div>
  );
}
