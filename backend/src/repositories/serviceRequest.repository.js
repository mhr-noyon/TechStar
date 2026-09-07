import { supabase } from "../config/database.js";

const fields = `
  *,
  customer:users!service_requests_customer_id_fkey(id, name, email, phone),
  technician:users!service_requests_technician_id_fkey(id, name, email, phone)
`;

export async function createServiceRequest(request) {
  const { data, error } = await supabase
    .from("service_requests")
    .insert(request)
    .select(fields)
    .single();

  if (error) throw error;
  return data;
}

export async function findServiceRequests(options = {}) {
  const {
    sortBy = "created_at",
    sortOrder = "desc",
    status,
    priority,
    search,
    page,
    limit,
  } = options;

  let query = supabase.from("service_requests").select(fields);

  if (status && status !== "ALL") {
    query = query.eq("status", status);
  }

  if (priority && priority !== "ALL") {
    query = query.eq("priority", priority);
  }

  if (options.technicianId) {
    query = query.eq("technician_id", options.technicianId);
  }

  if (options.customerId) {
    query = query.eq("customer_id", options.customerId);
  }

  if (search) {
    query = query.or(`device_brand.ilike.%${search}%,device_model.ilike.%${search}%,problem_description.ilike.%${search}%,customer_access_code.ilike.%${search}%`);
  }

  const isAscending = sortOrder.toLowerCase() === "asc";
  const validSortColumns = ["created_at", "updated_at", "priority", "progress", "expected_delivery_date", "status", "payment_amount"];
  const sortCol = validSortColumns.includes(sortBy) ? sortBy : "created_at";

  query = query.order(sortCol, { ascending: isAscending });

  if (page && limit) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);
  }

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

export async function findTrackableServiceRequest(id, accessCode) {
  const { data, error } = await supabase
    .from("service_requests")
    .select(fields)
    .eq("id", id)
    .eq("customer_access_code", accessCode)
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
