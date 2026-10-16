import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Load the repo-root .env (if there is one) before anything reads process.env.
// Imported first in index.ts. Variables already set in the environment win.
const file = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../.env");
if (existsSync(file)) process.loadEnvFile(file);
