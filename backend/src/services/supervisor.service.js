import { findServiceRequests } from "../repositories/serviceRequest.repository.js";
import { findHistoryByRequestId } from "../repositories/history.repository.js";
import { findTechnicians } from "../repositories/technician.repository.js";
import { findUsersByRole } from "../repositories/user.repository.js";

const terminalStatuses = ["COMPLETED", "FAILED", "CANCELLED"];
const statuses = [
  "RECEIVED",
  "ASSIGNED",
  "REPAIRING",
  "WAITING_FOR_PARTS",
  "READY_FOR_DELIVERY",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
];

function isOverdue(request) {
  return (
    request.expected_delivery_at &&
    new Date(request.expected_delivery_at) < new Date() &&
    !["COMPLETED", "CANCELLED"].includes(request.status)
  );
}

export async function getSupervisorOverview() {
  const [requests, technicians, customers, operators] = await Promise.all([
    findServiceRequests(),
    findTechnicians(),
    findUsersByRole("CUSTOMER"),
    findUsersByRole("OPERATOR"),
  ]);
  const completed = requests.filter(
    (request) => request.status === "COMPLETED",
  );
  const active = requests.filter(
    (request) => !terminalStatuses.includes(request.status),
  );
  const revenue = requests.reduce(
    (sum, request) => sum + Number(request.payment_amount || 0),
    0,
  );
  const logs = (
    await Promise.all(
      requests
        .slice(0, 50)
        .map(async (request) => findHistoryByRequestId(request.id)),
    )
  )
    .flat()
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 100);
  return {
    requests,
    technicians,
    customers,
    operators,
    kpis: {
      totalRequests: requests.length,
      activeRepairs: active.length,
      completed: completed.length,
      overdue: requests.filter(isOverdue).length,
      totalRevenue: revenue,
      averageServiceValue: completed.length ? revenue / completed.length : 0,
    },
    statusDistribution: statuses.map((status) => ({
      status,
      value: requests.filter((request) => request.status === status).length,
    })),
    priorityDistribution: ["NORMAL", "HIGH", "URGENT"].map((priority) => ({
      priority,
      value: requests.filter((request) => request.priority === priority).length,
    })),
    revenueByStatus: statuses.map((status) => ({
      status,
      value: requests
        .filter((request) => request.status === status)
        .reduce((sum, request) => sum + Number(request.payment_amount || 0), 0),
    })),
    logs,
  };
}
