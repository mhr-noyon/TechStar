import { apiRequest } from "./api";

export const supervisorApi = {
  overview: () => apiRequest("/supervisor/overview"),
  requests: (params) => {
    const queryStr = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiRequest(`/service-requests${queryStr}`);
  },
  technicians: (params) => {
    const queryStr = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiRequest(`/technicians${queryStr}`);
  },
  users: (role, params) => {
    const query = new URLSearchParams(params || {});
    if (role) query.set("role", role);
    const queryStr = query.toString() ? "?" + query.toString() : "";
    return apiRequest(`/users${queryStr}`);
  },
  createOperator: (payload) =>
    apiRequest("/users/operators", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  createTechnician: (payload) =>
    apiRequest("/users/technicians", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateUser: (id, payload) =>
    apiRequest(`/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  updateTechnician: (id, payload) =>
    apiRequest(`/technicians/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
};
