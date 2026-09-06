import { apiRequest } from "./api";

export const serviceRequestApi = {
  list: (params) => {
    const queryStr = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiRequest(`/service-requests${queryStr}`);
  },
  track: (requestId, accessCode) =>
    apiRequest(
      `/service-requests/track?requestId=${encodeURIComponent(requestId)}&accessCode=${encodeURIComponent(accessCode)}`,
    ),
  get: (id) => apiRequest(`/service-requests/${id}`),
  history: (id) => apiRequest(`/service-requests/${id}/history`),
  create: (payload) =>
    apiRequest("/service-requests", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  assign: (id, payload) =>
    apiRequest(`/service-requests/${id}/assign`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  status: (id, payload) =>
    apiRequest(`/service-requests/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  progress: (id, payload) =>
    apiRequest(`/service-requests/${id}/progress`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  update: (id, payload) =>
    apiRequest(`/service-requests/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
};
