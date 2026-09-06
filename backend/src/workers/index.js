import { parse } from "pg-connection-string";
import { run, quickAddJob } from "graphile-worker";
import { env } from "../config/env.js";
import overdueCheckTask from "../tasks/overdueCheck.task.js";
import { supabase } from "../config/database.js";

const tasks = {
  "overdue-check": overdueCheckTask,
};

let workerInstance = null;

export function getDatabaseConnectionString() {
  if (env.databaseUrl) return env.databaseUrl;

  // Extract project ref from Supabase URL (e.g. https://eecejiatgpxmquciihcr.supabase.co -> eecejiatgpxmquciihcr)
  const supabaseUrl = env.supabaseUrl || "";
  const match = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/);
  const projectRef = match ? match[1] : "";
  const dbPassword = process.env.DATABASE_PASSWORD || process.env.SUPABASE_DB_PASSWORD || "";

  if (projectRef && dbPassword) {
    return `postgres://postgres:${encodeURIComponent(dbPassword)}@db.${projectRef}.supabase.co:5432/postgres`;
  }
  return null;
}

export async function startWorker() {
  const connectionString = getDatabaseConnectionString();
  if (connectionString) {
    try {
      console.log("🔄 Starting Graphile Worker...");
      console.log("📅 Scheduled job: overdue-check (every minute)");
      workerInstance = await run({
        connectionString,
        concurrency: 5,
        noHandleSignals: false,
        pollInterval: 2000,
        tasks,
        crontab: `* * * * * overdue-check`,
      });

      console.log("🚀 Graphile Worker started successfully (running scheduled jobs)");
      return workerInstance;
    } catch (err) {
      console.warn("Graphile Worker connection notice:", err.message);
    }
  }

  console.log("⚡ Worker Engine running in background mode (processing scheduled tasks using supabase connection)");
  startFallbackPolling();
  return null;
}

export async function enqueueJob(taskName, payload = {}, options = {}) {
  const connectionString = getDatabaseConnectionString();
  if (connectionString && workerInstance) {
    try {
      await quickAddJob({ connectionString }, taskName, payload, options);
      return true;
    } catch (err) {
      console.warn(`Graphile Worker quickAddJob fallback for ${taskName}:`, err.message);
    }
  }

  // Fallback: run task directly in background
  if (tasks[taskName]) {
    setTimeout(async () => {
      try {
        await tasks[taskName](payload);
      } catch (err) {
        console.error(`Task ${taskName} execution error:`, err);
      }
    }, 0);
  }
}

let fallbackTimer = null;
function startFallbackPolling() {
  if (fallbackTimer) return;
  fallbackTimer = setInterval(async () => {
    try {
      await overdueCheckTask({});
    } catch (err) {
      console.error("Fallback overdue check error:", err.message);
    }
  }, 60000);
}
