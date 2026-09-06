import { parse } from "pg-connection-string";
import { run, quickAddJob } from "graphile-worker";
import { env } from "../config/env.js";
import overdueCheckTask from "../tasks/overdueCheck.task.js";
import sendServiceRequestEmailTask from "../tasks/sendServiceRequestEmail.task.js";
import { supabase } from "../config/database.js";

const tasks = {
  "overdue-check": overdueCheckTask,
  "send-service-request-email": sendServiceRequestEmailTask,
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

  // Poll every 6 seconds (6000ms) for scheduled tasks and any unsent emails
  fallbackTimer = setInterval(async () => {
    try {
      // 1. Run periodic overdue check task
      await overdueCheckTask({});

      // 2. Poll DB for service requests without a sent confirmation email
      const { data: unsentRequests, error } = await supabase
        .from("service_requests")
        .select("id")
        .order("created_at", { ascending: false })
        .limit(20);

      if (!error && Array.isArray(unsentRequests) && unsentRequests.length > 0) {
        // Find IDs that are not in service_request_emails table
        const reqIds = unsentRequests.map((r) => r.id);
        const { data: sentRecords } = await supabase
          .from("service_request_emails")
          .select("service_id")
          .in("service_id", reqIds);

        const sentIds = new Set((sentRecords || []).map((s) => Number(s.service_id)));
        const pendingIds = reqIds.filter((id) => !sentIds.has(Number(id)));

        // Process pending email jobs for any unsent service request
        for (const pendingId of pendingIds) {
          await sendServiceRequestEmailTask({ requestId: pendingId, attempt: 1 });
        }
      }
    } catch (err) {
      console.error("Fallback worker polling error:", err.message);
    }
  }, 6000);
}
