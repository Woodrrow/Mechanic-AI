/**
 * Mark a draft guide as reviewed (or take a reviewed one back to draft).
 *   npm run guide:review -- --file data/guides/<file>.json --by "Your name"
 *   npm run guide:review -- --file data/guides/<file>.json --unreview
 */
import { readFile, writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { GuideRecordSchema } from "../src/lib/jobs/guide-schema";

const { values } = parseArgs({
  options: {
    file: { type: "string" },
    by: { type: "string" },
    unreview: { type: "boolean", default: false },
  },
  strict: true,
});

async function main(): Promise<void> {
  if (!values.file) throw new Error("--file is required");
  const parsed = GuideRecordSchema.safeParse(JSON.parse(await readFile(values.file, "utf8")));
  if (!parsed.success) throw new Error(`Not a valid guide file: ${parsed.error.issues[0]?.path.join(".")} ${parsed.error.issues[0]?.message}`);
  const record = parsed.data;

  if (values.unreview) {
    record.status = record.specCheck.ok ? "draft" : "blocked";
    record.reviewedAt = null;
    record.reviewedBy = null;
  } else {
    if (!values.by) throw new Error("--by <name> is required to mark a guide reviewed");
    if (!record.specCheck.ok) {
      throw new Error("This guide is BLOCKED by the figure check. Edit the text to remove unsourced figures and clear specCheck first.");
    }
    record.status = "reviewed";
    record.reviewedAt = new Date().toISOString();
    record.reviewedBy = values.by;
  }
  await writeFile(values.file, JSON.stringify(record, null, 2) + "\n");
  console.log(`${values.file}: ${record.status}${record.reviewedBy ? ` by ${record.reviewedBy}` : ""}`);
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
