import { supabase } from "../config/database.js";
import { createAndDistributeNotification } from "../services/notification.service.js";

/**
 * Graphile Worker task: overdue-check
 * - Finds service requests whose `expected_delivery_at` has passed and status is not COMPLETED/CANCELLED/FAILED/DELIVERED.
 * - Checks if an OVERDUE notification has already been processed for this request to avoid duplicate notifications.
 * - Sends notification to creator (operator) + all supervisors.
 */
export default async function overdueCheckTask(payload = {}) {

  console.log(
    `⏰ [overdue-check] Task started at ${new Date().toISOString()}`
  );
  const now = new Date().toISOString();

  // Query service requests that are past expected_delivery_at and active
  const { data: overdueRequests, error } = await supabase
    .from("service_requests")
    .select("id, created_by, expected_delivery_at, status, problem_description, device_info")
    .lt("expected_delivery_at", now)
    .not("status", "in", '("COMPLETED","CANCELLED","FAILED","READY_FOR_DELIVERY")');

  if (error) {
    console.warn("overdueCheckTask query error:", error.message);
    return;
  }

  if (!overdueRequests || overdueRequests.length === 0) {
    return;
  }

  for (const request of overdueRequests) {
    try {
      // Check if an overdue notification for this service request has already been created
      const { data: existingNotifs, error: notifErr } = await supabase
        .from("notifications")
        .select("id")
        .eq("type", "OVERDUE")
        .filter("metadata->>service_request_id", "eq", String(request.id))
        .limit(1);

      if (notifErr) {
        // Fallback check if filter metadata query failed
        console.warn("Metadata query notice:", notifErr.message);
      }

      if (existingNotifs && existingNotifs.length > 0) {
        // Already notified for this overdue event
        continue;
      }

      const targetUserIds = [];
      if (request.created_by) {
        targetUserIds.push(request.created_by);
      }

      // Send overdue notification to creator (operator) + all supervisors
      await createAndDistributeNotification({
        title: `OVERDUE: Service Request #SR-${request.id}`,
        message: `Service request for ${request.device_info || "device"} was expected by ${new Date(request.expected_delivery_at).toLocaleString()}`,
        type: "OVERDUE",
        link_url: `/requests/${request.id}`,
        targetUserIds,
        targetRoles: ["SUPERVISOR"],
        metadata: {
          service_request_id: String(request.id),
          overdue_at: request.expected_delivery_at,
        },
      });

      console.log(`⏰ Overdue notification sent for Service Request #SR-${request.id}`);
    } catch (reqErr) {
      console.error(`Error processing overdue check for #SR-${request.id}:`, reqErr.message);
    }

  console.log(
    `✅ [overdue-check] Task finished at ${new Date().toISOString()}`)

  }
}
