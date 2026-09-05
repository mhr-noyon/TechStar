import { supabase } from "../config/database.js";

export async function createHistory(history) {
  const { data, error } = await supabase
    .from("service_request_history")
    .insert(history)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function findHistoryByRequestId(serviceRequestId) {
  const { data, error } = await supabase
    .from("service_request_history")
    .select("*")
    .eq("service_request_id", serviceRequestId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data;
}