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

  try {
    const { data, error } = await supabase.rpc(
      "create_overdue_notifications"
    );

    if (error) {
      console.error(
        "overdueCheckTask error:",
        error.message
      );
      return;
    }

    console.log(
      `⏰ [overdue-check] Created ${data || 0} overdue notifications`
    );
  } catch (error) {
    console.error(
      "overdueCheckTask exception:",
      error.message
    );
  } finally {
    console.log(
      `✅ [overdue-check] Task finished at ${new Date().toISOString()}`
    );
  }
}
