import { supabase } from "../config/database.js";

const publicUserFields = "id, name, email, phone, role, created_at, updated_at";
const authenticatedUserFields = `${publicUserFields}, password_hash`;

export async function findUserByEmail(email) {
  const { data, error } = await supabase
    .from("users")
    .select(authenticatedUserFields)
    .eq("email", email)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function findUserById(id) {
  const { data, error } = await supabase
    .from("users")
    .select(publicUserFields)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createUser({ name, email, phone, passwordHash }) {
  const { data, error } = await supabase
    .from("users")
    .insert({
      name,
      email,
      phone,
      password_hash: passwordHash,
      role: "CUSTOMER",
    })
    .select(publicUserFields)
    .single();

  if (error) throw error;
  return data;
}

export async function createStaffUser({
  name,
  email,
  phone,
  passwordHash,
  role,
}) {
  const { data, error } = await supabase
    .from("users")
    .insert({
      name,
      email,
      phone,
      password_hash: passwordHash,
      role,
    })
    .select(publicUserFields)
    .single();

  if (error) throw error;
  return data;
}

export async function updateUser(id, changes) {
  const { data, error } = await supabase
    .from("users")
    .update(changes)
    .eq("id", id)
    .select(publicUserFields)
    .single();

  if (error) throw error;
  return data;
}

export async function createTechnicianProfile({
  userId,
  specialization,
  maxCapacity,
}) {
  const { data, error } = await supabase
    .from("technicians")
    .insert({
      user_id: userId,
      specialization: specialization || null,
      max_capacity: maxCapacity,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function findUserByPhone(phone) {
  const { data, error } = await supabase
    .from("users")
    .select(publicUserFields)
    .eq("phone", phone)
    .eq("role", "CUSTOMER")
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function findUsersByRole(role, options = {}) {
  const { sortBy = "created_at", sortOrder = "desc", search } = options;

  let query = supabase.from("users").select(publicUserFields);

  if (role) {
    query = query.eq("role", role);
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
  }

  const isAscending = sortOrder.toLowerCase() === "asc";
  const validColumns = ["name", "created_at", "email", "phone"];
  const sortCol = validColumns.includes(sortBy) ? sortBy : "created_at";

  query = query.order(sortCol, { ascending: isAscending });

  const { data, error } = await query;
  if (error) throw error;
  return data;
}
