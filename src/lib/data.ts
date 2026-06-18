import { readFileSync } from "fs";
import path from "path";

const DATA_DIR = path.resolve(process.cwd(), "public", "data", "api_data");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function readJson<T = any>(filename: string): T {
  const file = path.join(DATA_DIR, filename);
  return JSON.parse(readFileSync(file, "utf-8")) as T;
}
