import { NextRequest } from "next/server";
import { beforeAll, describe, expect, it } from "vitest";
import { POST } from "./route";

function request(body: unknown, ip = "203.0.113.10"): NextRequest {
  return new NextRequest("http://localhost/api/vehicles/lookup", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("POST /api/vehicles/lookup", () => {
  beforeAll(() => {
    process.env.POCKET_MECHANIC_USE_FIXTURES = "1";
  });

  it("returns a candidate for a demo registration", async () => {
    const res = await POST(request({ registration: "ab15 cde" }));
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.demo).toBe(true);
    expect(body.candidate.model).toBe("Focus");
  });

  it("returns 404 for an unknown plate and 400 for junk", async () => {
    const notFound = await POST(request({ registration: "ER19NFD" }));
    expect(notFound.status).toBe(404);
    expect((await notFound.json()).error.code).toBe("vehicle_not_found");

    const junk = await POST(request("{not json"));
    expect(junk.status).toBe(400);

    const wrongShape = await POST(request({ plate: "AB15CDE" }));
    expect(wrongShape.status).toBe(400);
  });

  it("sets retry-after on throttled upstreams", async () => {
    const res = await POST(request({ registration: "ER19THR" }));
    expect(res.status).toBe(503);
    expect(res.headers.get("retry-after")).toBe("30");
  });

  it("rate limits a single client", async () => {
    const ip = "198.51.100.7";
    let last: Response | null = null;
    for (let i = 0; i < 13; i++) last = await POST(request({ registration: "AB15CDE" }, ip));
    expect(last?.status).toBe(429);
    expect(last?.headers.get("retry-after")).toBeTruthy();
  });
});
