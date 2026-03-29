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
import CompleteProfilePage from './pages/Client/CompleteProfilePage';

// Employee/admin pages
import EmployeeHome from "./pages/EmployeeHome";
import AdminDashboard from "./pages/Employee/AdminDashboard";
import MySchedule from "./pages/Employee/MySchedule";
import EmployeeManagement from "./pages/Employee/EmployeeManagement";
import EmployeeTimesheets from "./pages/Employee/EmployeeTimesheets";
import ServiceSchedule from "./pages/Employee/ServiceSchedule";
import BookingRequests from "./pages/Employee/BookingRequests";
import FinancesBoard from "./pages/Employee/FinancesBoard";
import ClientView from "./pages/Employee/ClientView";
import EmployeeAccount from "./pages/Employee/EmployeeAccount";
import CompleteProfile from "./pages/Employee/Completeprofile";

// Service info pages
import IrrigationInstallation from "./components/services-info/Irrigation";
import LandscapeLighting from "./components/services-info/Landscape";
import MaintenanceManagement from "./components/services-info/Maintenance";
import StormWaterManangement from "./components/services-info/Stormwater";

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

      {/* Complete Profile Page */}
      <Route
          path="/complete-profile"
          element={
            <RouteProtection allowedRole="client">
              <CompleteProfilePage />
            </RouteProtection>
          }
      />

      <Route
        path="/employee/complete-profile"
        element={<RouteProtection allowedRole={["Staff", "Supervisor", "Admin", "SuperAdmin"]}>
              <CompleteProfile />
            </RouteProtection>}
      />

      {/* Pages with Navbar */}
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
              <ClientProfile />
            </RouteProtection>
          }
        />
        <Route
          path="/services"
          element={
            <RouteProtection allowedRole="client"> 
              <Services />
            </RouteProtection>
          }
        />
        <Route
          path="/booking"
          element={
            <RouteProtection allowedRole="client">
              <Booking />
            </RouteProtection>
          }
        />
        <Route
          path="/request-quote"
          element={
            <RouteProtection allowedRole="client">
              <RequestQuote />
            </RouteProtection>
          }
        />
        <Route
          path="/settings"
          element={
            <RouteProtection allowedRole="client">
              <Settings />
            </RouteProtection>
          }
        />

        {/* Employee/Admin */}
        <Route
          path="/employeeHome"
          element={
            <RouteProtection allowedRole={["Staff", "Supervisor", "Admin", "SuperAdmin"]}>
              <EmployeeHome />
            </RouteProtection>
          }
        />
        <Route
          path="/employee/dashboard"
          element={
            <RouteProtection allowedRole={["Staff", "Supervisor", "Admin", "SuperAdmin"]}>
              <AdminDashboard />
            </RouteProtection>
          }
        />
        <Route
          path="/employee/my-schedule"
          element={
            <RouteProtection allowedRole={["Staff", "Supervisor", "Admin", "SuperAdmin"]}>
              <MySchedule />
            </RouteProtection>
          }
        />
        <Route
          path="/employee/employee-management"
          element={
            <RouteProtection allowedRole={["Staff", "Supervisor", "Admin", "SuperAdmin"]}>
              <EmployeeManagement />
            </RouteProtection>
          }
        />
        <Route
          path="/employee/employee-management/timesheets"
          element={
            <RouteProtection allowedRole={["Staff", "Supervisor", "Admin", "SuperAdmin"]}>
              <EmployeeTimesheets />
            </RouteProtection>
          }
        />
        <Route
          path="/employee/service-schedule"
          element={
            <RouteProtection allowedRole={["Staff", "Supervisor", "Admin", "SuperAdmin"]}>
              <ServiceSchedule />
            </RouteProtection>
          }
          />
          <Route 
            path="/employee/booking-requests"
            element={
              <RouteProtection allowedRole={["Staff", "Supervisor", "Admin", "SuperAdmin"]}>
                <BookingRequests />
              </RouteProtection>
            }  
            />
        <Route
          path="/employee/finances"
          element={
            <RouteProtection allowedRole={["Staff", "Supervisor", "Admin", "SuperAdmin"]}>
              <FinancesBoard />
            </RouteProtection>
          }
        />
        <Route
          path="/employee/client-view"
          element={
            <RouteProtection allowedRole={["Staff", "Supervisor", "Admin", "SuperAdmin"]}>
              <ClientView />
            </RouteProtection>
          }
        />
        <Route
          path="/employee/account"
          element={
            <RouteProtection allowedRole={["Staff", "Supervisor", "Admin", "SuperAdmin"]}>
              <EmployeeAccount />
            </RouteProtection>
          }
        />

        {/* Service detail pages */}
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