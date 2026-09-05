import { supabase } from "../config/database.js";

const fields = "*";

export async function createServiceRequest(request) {
  const { data, error } = await supabase
    .from("service_requests")
    .insert(request)
    .select(fields)
    .single();

  if (error) throw error;
  return data;
}

export async function findServiceRequests() {
  let query = supabase
    .from("service_requests")
    .select(fields)
    .order("created_at", { ascending: false });

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function findServiceRequestById(id) {
  const { data, error } = await supabase
    .from("service_requests")
    .select(fields)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function updateServiceRequest(id, changes) {
  const { data, error } = await supabase
    .from("service_requests")
    .update(changes)
    .eq("id", id)
    .select(fields)
    .single();

  if (error) throw error;
  return data;
}