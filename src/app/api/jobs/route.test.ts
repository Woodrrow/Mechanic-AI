import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import type { JobsApiResponse } from "./route";
import { GET } from "./route";

const get = async (qs: string) => (await GET(new NextRequest(`http://localhost/api/jobs?${qs}`))).json() as Promise<JobsApiResponse>;

function find(body: JobsApiResponse, jobId: string) {
  if (!body.ok) throw new Error("not ok");
  return body.groups.flatMap((g) => g.jobs).find((j) => j.job.id === jobId);
}

describe("GET /api/jobs", () => {
  it("marks each job exact, sibling, none, refer-out or not-applicable for the demo Focus", async () => {
    const body = await get("make=FORD&model=Focus&year=2015&engineCc=1596&fuel=petrol");
    expect(body.ok).toBe(true);
    expect(find(body, "front-brake-pads")?.availability).toBe("exact");
    expect(find(body, "rear-brake-pads")?.availability).toBe("none");
    expect(find(body, "airbag-srs")?.availability).toBe("refer_out");
    expect(find(body, "hybrid-ev-high-voltage"), "an EV job has no place in a petrol car's list").toBeUndefined();
    expect(find(body, "spark-plugs")?.availability).toBe("none");
    if (body.ok) expect(body.platforms[0]?.name).toBe("Ford Global C (C2)");
  });

  it("offers the Golf wiper guide to an Audi A3 as a sibling", async () => {
    const body = await get("make=AUDI&model=A3%20SPORT%20TDI&year=2016&engineCc=1968&fuel=diesel");
    const wipers = find(body, "wiper-blades");
    expect(wipers?.availability).toBe("sibling");
    expect(wipers?.siblingOf).toBe("Golf Mk7");
    if (body.ok) expect(body.platforms[0]?.name).toBe("Volkswagen Group MQB");
  });

  it("hides petrol-only jobs from a diesel and vice versa", async () => {
    const diesel = await get("make=VOLKSWAGEN&model=Golf&year=2016&engineCc=1968&fuel=diesel");
    expect(find(diesel, "spark-plugs")).toBeUndefined();
    expect(find(diesel, "wiper-blades")?.availability).toBe("exact");
    const ev = await get("make=NISSAN&model=Leaf&year=2020&fuel=electric");
    expect(find(ev, "hybrid-ev-high-voltage")?.availability).toBe("refer_out");
    expect(find(ev, "spark-plugs")).toBeUndefined();
    expect(find(ev, "engine-oil-and-filter")).toBeUndefined();
  });

  it("says what it cannot know without a model and year", async () => {
    const body = await get("make=FORD&fuel=petrol");
    expect(find(body, "front-brake-pads")?.availability).toBe("vehicle_incomplete");
    if (body.ok) expect(body.platforms).toEqual([]);
    expect((await GET(new NextRequest("http://localhost/api/jobs"))).status).toBe(400);
  });
});
