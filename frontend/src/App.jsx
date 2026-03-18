import './App.css';
import { Routes, Route } from 'react-router-dom';
import NavbarWrapper from './components/NavbarWrapper';
import ScrollToTop from './components/ScrollToTop';

// Public pages
import Landing from "./pages/LandingPage";
import ClientLogin from "./components/ClientLogin";
import EmployeeLogin from "./components/EmployeeLogin";
import EmployeeRegister from "./pages/EmployeeRegister";
import ClientRegister from "./pages/ClientRegister";

// Client pages
import Home from './pages/Client/ClientHome';
import ClientProfile from './pages/Client/ClientProfile';
import Services from './pages/Client/Services';
import Booking from './pages/Client/Booking';
import RequestQuote from './pages/Client/RequestQuote';
import Settings from './pages/Client/Settings';

// Employee/admin pages
import EmployeeHome from "./pages/EmployeeHome";
import AdminDashboard from "./pages/employee/AdminDashboard";
import MySchedule from "./pages/employee/MySchedule";
import EmployeeManagement from "./pages/employee/EmployeeManagement";
import EmployeeTimesheets from "./pages/Employee/EmployeeTimesheets";
import ServiceSchedule from "./pages/Employee/ServiceSchedule";
import FinancesBoard from "./pages/Employee/FinancesBoard";
import ClientView from "./pages/Employee/ClientView";

// Account
import EmployeeAccount from "./pages/Employee/EmployeeAccount";

// Service info pages
import IrrigationInstallation from './components/services-info/Irrigation';
import LandscapeLighting from './components/services-info/Landscape';
import MaintenanceManagement from './components/services-info/Maintenance';
import StormWaterManangement from './components/services-info/Stormwater';

import RouteProtection from "./components/RouteProtection";

function App() {
  return (
    <>
    <ScrollToTop />
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
          path="/client-profile"
          element={
            <RouteProtection allowedRole="client">
              <ClientProfile/>
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
          path="/request-quote"
          element={
            <RouteProtection>
              <RequestQuote />
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
        <Route
          path="/employee/client-view"
          element={
            <RouteProtection allowedRole="employee">
              <ClientView />
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
    </>
  );
}

export default App;