import { apiRequest } from "./api";

export const technicianApi = {
  list: () => apiRequest("/technicians"),
  available: () => apiRequest("/technicians/available"),
};
