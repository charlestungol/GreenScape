import './App.css';
import { Routes, Route } from 'react-router-dom';
import NavbarWrapper from './components/NavbarWrapper';
import Home from './pages/Client/ClientHome';
import ClientProfile from './pages/Client/ClientProfile';
import Services from './pages/Client/Services';
import Booking from './pages/Client/Booking';
import Settings from './pages/Client/Settings';
import Landing from './pages/LandingPage';
import EmployeeRegister from './pages/EmployeeRegister';
import ClientLogin from './components/ClientLogin';
import EmployeeLogin from './components/EmployeeLogin'; 
import EmployeeHome from './pages/EmployeeHome';
import ClientRegister from './pages/ClientRegister';
import RouteProtection from "./components/RouteProtection";
import IrrigationInstallation from './components/services-info/Irrigation';
import LandscapeLighting from './components/services-info/Landscape';
import MaintenanceManagement from './components/services-info/Maintenance';
import StormWaterManangement from './components/services-info/Stormwater';


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
        <Route path="/client-profile" element={<RouteProtection><ClientProfile/></RouteProtection>}></Route>
        
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