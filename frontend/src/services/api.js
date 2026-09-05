const API_BASE_URL = import.meta.env.API_URL || "http://localhost:5000/api";

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(body.message || body.error || "Request failed");
  return Object.prototype.hasOwnProperty.call(body, "data") ? body.data : body;
}

export { API_BASE_URL };
