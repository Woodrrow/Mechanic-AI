/**
 * Phase 3 guide store: JSON files under data/guides, committed to the repo.
 * Generation is offline, so a file store is enough to prove the flow. The
 * Supabase table in supabase/migrations is the eventual home; the interface
 * is the same.
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { GuideRecordSchema, type GuideRecord } from "./guide-schema";
import { selectGuide, type GuideLookup } from "./match";

export interface GuideStore {
  all(): Promise<GuideRecord[]>;
  find(lookup: GuideLookup, includeDrafts?: boolean): Promise<GuideRecord | null>;
  byId(id: string): Promise<GuideRecord | null>;
}

export const GUIDES_DIR = path.join(process.cwd(), "data", "guides");

export class FileGuideStore implements GuideStore {
  private cache: GuideRecord[] | null = null;

  constructor(private readonly dir: string = GUIDES_DIR) {}

  async all(): Promise<GuideRecord[]> {
    if (this.cache) return this.cache;
    let files: string[] = [];
    try {
      files = (await readdir(this.dir)).filter((f) => f.endsWith(".json"));
    } catch {
      this.cache = [];
      return this.cache;
    }
    const guides: GuideRecord[] = [];
    for (const file of files) {
      try {
        const parsed = GuideRecordSchema.safeParse(JSON.parse(await readFile(path.join(this.dir, file), "utf8")));
        if (parsed.success) guides.push(parsed.data);
        else console.warn(`[guides] skipping ${file}: ${parsed.error.issues[0]?.path.join(".")} ${parsed.error.issues[0]?.message}`);
      } catch (e) {
        console.warn(`[guides] skipping ${file}: ${(e as Error).message}`);
      }
    }
    this.cache = guides;
    return guides;
  }

  async find(lookup: GuideLookup, includeDrafts = false): Promise<GuideRecord | null> {
    return selectGuide(await this.all(), lookup, includeDrafts);
  }

  async byId(id: string): Promise<GuideRecord | null> {
    return (await this.all()).find((g) => g.id === id) ?? null;
  }
}

let store: GuideStore | null = null;

export function getGuideStore(): GuideStore {
  store ??= new FileGuideStore();
  return store;
}
