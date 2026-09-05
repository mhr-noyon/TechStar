import { supabase } from "../config/database.js";

export async function findTechnicians() {
  const { data, error } = await supabase.from("technicians").select("*").order("id");
  if (error) throw error;
  return data;
}

export async function findAvailableTechnicians() {
  const { data, error } = await supabase
    .from("technicians")
    .select("*")
    .eq("is_available", true)
    .order("id");
  if (error) throw error;
  return data;
}

export async function findTechnicianById(id) {
  const { data, error } = await supabase
    .from("technicians")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function findAvailableTechnician(userId) {
  const { data, error } = await supabase
    .from("technicians")
    .select("*")
    .eq("user_id", userId)
    .eq("is_available", true)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function changeActiveJobs(userId, amount) {
  const { data: technician, error: findError } = await supabase
    .from("technicians")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (findError) throw findError;
  if (!technician) return null;

  const activeJobs = technician.active_jobs + amount;
  if (activeJobs < 0 || activeJobs > technician.max_capacity) return null;

  const { data, error } = await supabase
    .from("technicians")
    .update({
      active_jobs: activeJobs,
      is_available: activeJobs < technician.max_capacity,
    })
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}