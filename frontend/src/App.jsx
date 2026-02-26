import './App.css';
import { Routes, Route } from 'react-router-dom';
import NavbarWrapper from './components/NavbarWrapper';
import Home from './pages/ClientHome';
import Services from './pages/Services';
import Booking from './pages/Booking';
import Settings from './pages/Settings';
import Landing from './pages/LandingPage';
import EmployeeRegister from './pages/EmployeeRegister';
import ClientLogin from './components/ClientLogin';
import EmployeeLogin from './components/EmployeeLogin'; 
import EmployeeHome from './pages/EmployeeHome';
import ClientRegister from './pages/ClientRegister';
import RouteProtection from "./components/RouteProtection";
import IrrigationInstallation from './services-info/Irrigation';
import LandscapeLighting from './services-info/Landscape';
import MaintenanceManagement from './services-info/Maintenance';
import StormWaterManangement from './services-info/Stormwater';


function App() {
  return (
    <Routes>
      {/* Public pages without Navbar */}
      <Route path="/" element={<Landing />} />
      <Route path="/client-login" element={<ClientLogin />} />
      <Route path="/employee-login" element={<EmployeeLogin />} />
      <Route path="/employee-register" element={<EmployeeRegister />} />
      <Route path='/client-register' element={<ClientRegister/>}/>

      {/* Pages with Navbar */}
      <Route element={<NavbarWrapper />}>
        <Route path="/home" element={<RouteProtection allowedRole="client"><Home /></RouteProtection>}/>
        <Route path="/employeeHome" element={<RouteProtection allowedRole="employee"><EmployeeHome /></RouteProtection>} />
        <Route path="/services" element={<RouteProtection><Services /></RouteProtection>} />
        <Route path="/booking" element={<RouteProtection><Booking /></RouteProtection>} />
        <Route path="/settings" element={<RouteProtection><Settings /></RouteProtection>} />
        
        {/* Service Detail Pages*/}
        <Route path="/irrigation-installation" element={<RouteProtection><IrrigationInstallation /></RouteProtection>} />
        <Route path="/landscape-lighting" element={<RouteProtection><LandscapeLighting /></RouteProtection>} />
        <Route path="/stormwater-management" element={<RouteProtection><StormWaterManangement /></RouteProtection>} />
        <Route path="/maintenance-service" element={<RouteProtection><MaintenanceManagement /></RouteProtection>} />
      </Route>
    </Routes>
  );
}

export default App;