import { apiRequest } from "./api";

export const userApi = {
  findCustomerByPhone: (phone) =>
    apiRequest(`/users/customers?phone=${encodeURIComponent(phone)}`),
  createCustomer: (payload) =>
    apiRequest("/users/customers", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
