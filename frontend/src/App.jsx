import "./App.css";
import { Routes, Route } from "react-router-dom";
import NavbarWrapper from "./components/NavbarWrapper";

// Public pages
import Landing from "./pages/LandingPage";
import ClientLogin from "./components/ClientLogin";
import EmployeeLogin from "./components/EmployeeLogin";
import EmployeeRegister from "./pages/EmployeeRegister";
import ClientRegister from "./pages/ClientRegister";

// Client pages
import Home from "./pages/ClientHome";
import Services from "./pages/Services";
import Booking from "./pages/Booking";
import Settings from "./pages/Settings";

// Employee/admin pages
import EmployeeHome from "./pages/EmployeeHome";
import AdminDashboard from "./pages/employee/AdminDashboard";
import MySchedule from "./pages/employee/MySchedule";
import EmployeeManagement from "./pages/employee/EmployeeManagement";
import EmployeeTimesheets from "./pages/Employee/EmployeeTimesheets";
import ServiceSchedule from "./pages/Employee/ServiceSchedule";
import FinancesBoard from "./pages/Employee/FinancesBoard";

// Account
import EmployeeAccount from "./pages/Employee/EmployeeAccount";

// Service info pages
import IrrigationInstallation from "./services-info/Irrigation";
import LandscapeLighting from "./services-info/Landscape";
import MaintenanceManagement from "./services-info/Maintenance";
import StormWaterManangement from "./services-info/Stormwater";

import RouteProtection from "./components/RouteProtection";

function App() {
  return (
    <Routes>
      {/* Public pages (no Navbar) */}
      <Route path="/" element={<Landing />} />
      <Route path="/client-login" element={<ClientLogin />} />
      <Route path="/employee-login" element={<EmployeeLogin />} />
      <Route path="/employee-register" element={<EmployeeRegister />} />
      <Route path="/client-register" element={<ClientRegister />} />

      {/* Pages that should render with the Navbar */}
      <Route element={<NavbarWrapper />}>
        {/* Client */}
        <Route
          path="/home"
          element={
            <RouteProtection allowedRole="client">
              <Home />
            </RouteProtection>
          }
        />
        <Route
          path="/services"
          element={
            <RouteProtection>
              <Services />
            </RouteProtection>
          }
        />
        <Route
          path="/booking"
          element={
            <RouteProtection>
              <Booking />
            </RouteProtection>
          }
        />
        <Route
          path="/settings"
          element={
            <RouteProtection>
              <Settings />
            </RouteProtection>
          }
        />

        {/* Employee/Admin */}
        <Route
          path="/employeeHome"
          element={
            <RouteProtection allowedRole="employee">
              <EmployeeHome />
            </RouteProtection>
          }
        />
        <Route
          path="/employee/dashboard"
          element={
            <RouteProtection allowedRole="employee">
              <AdminDashboard />
            </RouteProtection>
          }
        />
        <Route
          path="/employee/my-schedule"
          element={
            <RouteProtection allowedRole="employee">
              <MySchedule />
            </RouteProtection>
          }
        />
        <Route
          path="/employee/employee-management"
          element={
            <RouteProtection allowedRole="employee">
              <EmployeeManagement />
            </RouteProtection>
          }
        />
        <Route
          path="/employee/employee-management/timesheets"
          element={
            <RouteProtection allowedRole="employee">
              <EmployeeTimesheets />
            </RouteProtection>
          }
        />
        <Route
          path="/employee/service-schedule"
          element={
            <RouteProtection allowedRole="employee">
              <ServiceSchedule />
            </RouteProtection>
          }
        />
        <Route
          path="/employee/finances"
          element={
            <RouteProtection allowedRole="employee">
              <FinancesBoard />
            </RouteProtection>
          }
        />

        {/* Employee Account (profile + change password + logout) */}
        <Route
          path="/employee/account"
          element={
            <RouteProtection allowedRole="employee">
              <EmployeeAccount />
            </RouteProtection>
          }
        />

        {/* Service detail pages (client visible) */}
        <Route
          path="/irrigation-installation"
          element={
            <RouteProtection>
              <IrrigationInstallation />
            </RouteProtection>
          }
        />
        <Route
          path="/landscape-lighting"
          element={
            <RouteProtection>
              <LandscapeLighting />
            </RouteProtection>
          }
        />
        <Route
          path="/stormwater-management"
          element={
            <RouteProtection>
              <StormWaterManangement />
            </RouteProtection>
          }
        />
        <Route
          path="/maintenance-service"
          element={
            <RouteProtection>
              <MaintenanceManagement />
            </RouteProtection>
          }
        />
      </Route>
    </Routes>
  );
}

export default App;