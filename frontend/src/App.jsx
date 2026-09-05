import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import DashboardLayout from './components/layout/DashboardLayout'
import OperatorDashboard from './pages/operator/OperatorDashboard'
import ServiceRequests from './pages/operator/ServiceRequests'
import CreateServiceRequest from './pages/operator/CreateServiceRequest'
import ServiceRequestDetails from './pages/operator/ServiceRequestDetails'
import Home from './pages/Home'
import Login from './pages/Login'
import CustomerTracking from './pages/customer/CustomerTracking'
import PublicNavbar from './components/layout/PublicNavbar'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<><PublicNavbar /><Home /></>} />
        <Route path="/login" element={<Login />} />
        <Route path="/track" element={<CustomerTracking />} />
        <Route element={<DashboardLayout />}>
          <Route path="/operator" element={<OperatorDashboard />} />
          <Route path="/operator/requests" element={<ServiceRequests />} />
          <Route path="/operator/requests/new" element={<CreateServiceRequest />} />
          <Route path="/operator/requests/:id" element={<ServiceRequestDetails />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
