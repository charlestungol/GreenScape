import '../App.css';
import BackgroundVideo from '../assets/videos/vid_1.mp4'; 
import Logo from '../assets/img/Logo.png'; 

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../components/AxiosInstance';

const EmployeeLogin = () => {
  const navigate = useNavigate();

  const [employeeNumber, setEmployeeNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');

  const handleLogin = async () => {
  setError('');

  if (!employeeNumber || !email || !password) {
    setError("Please fill in all fields.");
    return;
  }

  try {
    const response = await AxiosInstance.post('login/employee/', {
      employee_number: employeeNumber,
      email: email,
      password: password
    });

    console.log("Employee login success:", response.data);
    console.log("Full response structure:", JSON.stringify(response.data, null, 2));
    
    // Extract data carefully
    const userId = response.data.user?.id || response.data.user_id || response.data.id;
    const userFirstName = response.data.user?.first_name || response.data.first_name || "Employee";
    const userRole = response.data.user?.role || response.data.role || "employee";
    const access = response.data?.access || {}
    
    // Store data
    localStorage.setItem("user_id", userId);
    localStorage.setItem("access", access);
    localStorage.setItem("role", userRole);
    localStorage.setItem("first_name", userFirstName);
    
    // User-specific storage
    localStorage.setItem(`user_${userId}_first_name`, userFirstName);
    localStorage.setItem(`user_${userId}_role`, userRole);
    
    navigate('/employeeHome');

  } catch (err) {
    console.error(err.response || err);

    if (err.response) {
      setError(JSON.stringify(err.response.data));
    } else {
      setError("Something went wrong. Please try again.");
    }
  }
};

  return (
    <div className="myBackground">

      <video autoPlay muted loop className="backgroundVideo">
        <source src={BackgroundVideo} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      <div className="loginForm">
        <div className="landingContent">
          <img src={Logo} alt="Logo" className="landingLogo" />
        </div>

        <input
          type="text"
          placeholder="Employee Number"
          value={employeeNumber}
          onChange={e => setEmployeeNumber(e.target.value)}
          maxLength={20}
        />

        <input
          type="text"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          maxLength={254}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          maxLength={50}
        />

        <button onClick={handleLogin}>LOGIN</button>

        <button onClick={() => navigate('/employee-register')}>
          SIGN UP
        </button>

        {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
   
      </div>
    </div>
  );
};

export default EmployeeLogin;
