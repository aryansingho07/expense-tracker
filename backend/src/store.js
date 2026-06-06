import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DEFAULT_BUDGETS } from "./constants.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, "..", "data");
const dbPath = path.join(dataDir, "db.json");

async function ensureDb() {
  await mkdir(dataDir, { recursive: true });

  try {
    await readFile(dbPath, "utf8");
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }

    await writeFile(
      dbPath,
      JSON.stringify({ expenses: [], budgets: DEFAULT_BUDGETS }, null, 2)
    );
  }
}

export async function readDb() {
  await ensureDb();
  const raw = await readFile(dbPath, "utf8");
  const parsed = JSON.parse(raw);

  return {
    expenses: Array.isArray(parsed.expenses) ? parsed.expenses : [],
    budgets: { ...DEFAULT_BUDGETS, ...(parsed.budgets ?? {}) }
  };
}

export async function writeDb(nextDb) {
  await ensureDb();
  await writeFile(dbPath, JSON.stringify(nextDb, null, 2));
}
