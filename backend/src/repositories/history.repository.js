import { supabase } from "../config/database.js";
import { findUserById } from "./user.repository.js";

const fields = `
  *,
  changed_by_user:users!service_request_history_changed_by_fkey(id, name, email, role)
`;

export async function createHistory(historyPayload) {
  // DB insertion is handled by PostgreSQL trigger (create_request_update_history)
  // Here we format and return the history object with changed_by_user so WebSocket can push live updates.
  let changedUser = null;
  if (historyPayload.changed_by) {
    try {
      changedUser = await findUserById(historyPayload.changed_by);
    } catch (err) {
      console.warn("Could not fetch user for history push:", err.message);
    }
  }

  return {
    id: "temp-" + Date.now(),
    service_request_id: historyPayload.service_request_id,
    changed_by: historyPayload.changed_by,
    old_status: historyPayload.old_status,
    new_status: historyPayload.new_status,
    old_progress: historyPayload.old_progress,
    new_progress: historyPayload.new_progress,
    note: historyPayload.note || null,
    created_at: new Date().toISOString(),
    changed_by_user: changedUser
      ? {
          id: changedUser.id,
          name: changedUser.name,
          email: changedUser.email,
          role: changedUser.role,
        }
      : null,
  };
}

export async function findHistoryByRequestId(serviceRequestId) {
  const { data, error } = await supabase
    .from("service_request_history")
    .select(fields)
    .eq("service_request_id", serviceRequestId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data;
}

export async function findLatestHistory(limit = 100) {
  const { data, error } = await supabase
    .from("service_request_history")
    .select(fields)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}
