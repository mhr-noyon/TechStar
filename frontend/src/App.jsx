import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import DashboardLayout from "./components/layout/DashboardLayout";
import OperatorDashboard from "./pages/operator/OperatorDashboard";
import ServiceRequests from "./pages/operator/ServiceRequests";
import CreateServiceRequest from "./pages/operator/CreateServiceRequest";
import ServiceRequestDetails from "./pages/operator/ServiceRequestDetails";
import ChatPage from "./pages/chat/ChatPage";
import Home from "./pages/Home";
import Login from "./pages/Login";
import CustomerTracking from "./pages/customer/CustomerTracking";
import PublicNavbar from "./components/layout/PublicNavbar";
import SupervisorLayout from "./components/supervisor/SupervisorLayout";
import SupervisorDashboard from "./pages/supervisor/SupervisorDashboard";
import SupervisorServiceRequests from "./pages/supervisor/SupervisorServiceRequests";
import SupervisorDirectory from "./pages/supervisor/SupervisorDirectory";
import SupervisorLogs from "./pages/supervisor/SupervisorLogs";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import "./App.css";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <>
                <PublicNavbar />
                <Home />
              </>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/track" element={<CustomerTracking />} />

          {/* Operator Protected Routes */}
          <Route
            element={
              <ProtectedRoute allowedRoles={["OPERATOR"]}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/operator" element={<OperatorDashboard />} />
            <Route path="/operator/requests" element={<ServiceRequests />} />
            <Route
              path="/operator/requests/new"
              element={<CreateServiceRequest />}
            />
            <Route
              path="/operator/requests/:id"
              element={<ServiceRequestDetails />}
            />
            <Route path="/operator/chat" element={<ChatPage />} />
          </Route>

          {/* Supervisor Protected Routes */}
          <Route
            element={
              <ProtectedRoute allowedRoles={["SUPERVISOR"]}>
                <SupervisorLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/supervisor" element={<SupervisorDashboard />} />
            <Route
              path="/supervisor/service-requests"
              element={<SupervisorServiceRequests />}
            />
            <Route
              path="/supervisor/service-requests/:id"
              element={<ServiceRequestDetails />}
            />
            <Route
              path="/supervisor/customers"
              element={<SupervisorDirectory type="customers" />}
            />
            <Route
              path="/supervisor/customers/:id"
              element={<SupervisorDirectory type="customers" />}
            />
            <Route
              path="/supervisor/operators"
              element={<SupervisorDirectory type="operators" />}
            />
            <Route
              path="/supervisor/operators/:id"
              element={<SupervisorDirectory type="operators" />}
            />
            <Route
              path="/supervisor/technicians"
              element={<SupervisorDirectory type="technicians" />}
            />
            <Route
              path="/supervisor/technician"
              element={<SupervisorDirectory type="technicians" />}
            />
            <Route
              path="/supervisor/technicians/:id"
              element={<SupervisorDirectory type="technicians" />}
            />
            <Route
              path="/supervisor/technician/:id"
              element={<SupervisorDirectory type="technicians" />}
            />
            <Route
              path="/supervisors/technician"
              element={<Navigate to="/supervisor/technicians" replace />}
            />
            <Route
              path="/supervisors/technicians"
              element={<Navigate to="/supervisor/technicians" replace />}
            />
            <Route
              path="/supervisors/*"
              element={<Navigate to="/supervisor" replace />}
            />
            <Route
              path="/supervisor/analytics"
              element={<Navigate to="/supervisor" replace />}
            />
            <Route
              path="/supervisor/sales"
              element={<Navigate to="/supervisor" replace />}
            />
            <Route path="/supervisor/logs" element={<SupervisorLogs />} />
            <Route path="/supervisor/chat" element={<ChatPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
