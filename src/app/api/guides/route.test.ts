import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { GET } from "./route";

const get = (qs: string) => GET(new NextRequest(`http://localhost/api/guides?${qs}`));

describe("GET /api/guides", () => {
  it("returns the reviewed reference guide for the demo Focus, trim and all", async () => {
    const res = await get("job=front-brake-pads&make=FORD&model=FOCUS%20ZETEC&year=2015&engineCc=1596&fuel=petrol");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ ok: true, kind: "exact", sibling: null });
    expect(body.guide?.id).toBe("front-brake-pads__ford__focus__2011-2018__1596__petrol");
    expect(body.job.tier).toBe("amber");
  });

  it("returns a platform sibling with both cars named", async () => {
    const body = await (await get("job=wiper-blades&make=SKODA&model=OCTAVIA%20SE&year=2017&engineCc=1598&fuel=diesel")).json();
    expect(body.kind).toBe("sibling");
    expect(body.guide?.jobId).toBe("wiper-blades");
    // The guide's scope has engineCc null (all engines), so only a fuel change counts as a different engine.
    expect(body.sibling).toMatchObject({ guideMember: "Golf Mk7", vehicleMember: "Octavia Mk3", engineDiffers: false });
    expect(body.sibling.platform.name).toBe("Volkswagen Group MQB");
  });

  it("refuses RED jobs without a guide, and skips jobs that do not apply", async () => {
    const red = await (await get("job=airbag-srs&make=FORD&model=Focus&year=2015&fuel=petrol")).json();
    expect(red).toMatchObject({ ok: true, kind: "refer_out", guide: null });
    expect(red.job.refusal.professional.priceGbp.min).toBeGreaterThan(0);
    const plugs = await (await get("job=spark-plugs&make=VOLKSWAGEN&model=Golf&year=2016&engineCc=1968&fuel=diesel")).json();
    expect(plugs.kind).toBe("not_applicable");
  });

  it("says so when there is no guide and no sibling", async () => {
    const body = await (await get("job=front-brake-pads&make=KIA&model=Ceed&year=2019&engineCc=1400&fuel=petrol")).json();
    expect(body).toMatchObject({ ok: true, kind: "none", guide: null });
    const incomplete = await (await get("job=front-brake-pads&make=FORD&fuel=petrol")).json();
    expect(incomplete).toMatchObject({ ok: true, kind: "vehicle_incomplete", guide: null });
  });

  it("rejects bad requests", async () => {
    expect((await get("make=FORD")).status).toBe(400);
    expect((await get("job=nope&make=FORD")).status).toBe(404);
  });
});
