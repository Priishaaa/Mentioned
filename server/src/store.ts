import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { PipelineEvent, Report } from "@mentioned/shared";
import { sampleReports } from "@mentioned/shared/fixtures";
import { config } from "./config";

/* ── Finished reports: JSON files on disk, plus the built-in samples ──────── */

const reportsDir = path.join(config.dataDir, "reports");
const ID_RE = /^[A-Za-z0-9_-]{6,40}$/;

export function newId(): string {
  return randomBytes(9).toString("base64url");
}

/** One Upstash Redis command over its REST API, e.g. ["SET", key, value]. */
async function redis(command: string[]): Promise<unknown> {
  const res = await fetch(config.redisUrl!, {
    method: "POST",
    headers: { Authorization: `Bearer ${config.redisToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
  });
  if (!res.ok) throw new Error(`Upstash ${command[0]} failed: ${res.status} ${await res.text()}`);
  return ((await res.json()) as { result: unknown }).result;
}
const useRedis = () => Boolean(config.redisUrl && config.redisToken);

export async function saveReport(report: Report): Promise<void> {
  if (useRedis()) {
    await redis(["SET", `report:${report.id}`, JSON.stringify(report)]);
    return;
  }
  await mkdir(reportsDir, { recursive: true });
  await writeFile(path.join(reportsDir, `${report.id}.json`), JSON.stringify(report, null, 2), "utf8");
}

export async function loadReport(id: string): Promise<Report | null> {
  if (sampleReports[id]) return sampleReports[id];
  if (!ID_RE.test(id)) return null; // also keeps ids from escaping the folder
  try {
    if (useRedis()) {
      const raw = await redis(["GET", `report:${id}`]);
      return typeof raw === "string" ? (JSON.parse(raw) as Report) : null;
    }
    return JSON.parse(await readFile(path.join(reportsDir, `${id}.json`), "utf8")) as Report;
  } catch (e) {
    if (useRedis()) console.error(`Couldn't load report ${id}:`, e);
    return null;
  }
}

/* ── Running checks: an event log that late subscribers can replay ──────── */

type Listener = (e: PipelineEvent) => void;

export type Job = {
  id: string;
  events: PipelineEvent[];
  listeners: Set<Listener>;
  finished: boolean;
};

const jobs = new Map<string, Job>();
const KEEP_FINISHED_MS = 10 * 60_000;

export function createJob(id: string): Job {
  const job: Job = { id, events: [], listeners: new Set(), finished: false };
  jobs.set(id, job);
  return job;
}

export function getJob(id: string): Job | undefined {
  return jobs.get(id);
}

export function emit(job: Job, event: PipelineEvent): void {
  job.events.push(event);
  for (const listener of job.listeners) listener(event);
  if (event.type === "done" || event.type === "error") {
    job.finished = true;
    setTimeout(() => jobs.delete(job.id), KEEP_FINISHED_MS).unref();
  }
}
