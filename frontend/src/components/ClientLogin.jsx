import '../App.css';
import BackgroundVideo from '../assets/videos/vid_1.mp4'; 
import Logo from '../assets/img/Logo.png'; 

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../components/AxiosInstance';

const ClientLogin = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');

  const handleLogin = async () => {
  setError('');

  if (!email || !password) {
    setError("Please fill in all fields.");
    return;
  }

  try {
    const response = await AxiosInstance.post('login/client/', {
      email: email,
      password: password
    });

    console.log("Client login success:", response.data);
    console.log("Full response structure:", JSON.stringify(response.data, null, 2));
    
    // DEBUG: Check the exact structure
    console.log("response.data:", response.data);
    console.log("response.data.user:", response.data.user);
    console.log("response.data.user.first_name:", response.data.user?.first_name);
    
    // Store user ID - check different possible locations
    const userId = response.data.user?.id || response.data.user_id || response.data.id;
    const userFirstName = response.data.user?.first_name || response.data.first_name || "";
    const userRole = response.data.user?.role || response.data.role || "client";
    const token = response.data.token || response.data.key;
    
    console.log("Extracted values:");
    console.log("userId:", userId);
    console.log("userFirstName:", userFirstName);
    console.log("userRole:", userRole);
    console.log("token:", token);
    
    if (!userId) {
      console.error("No user_id found in response!");
      setError("Login failed: No user ID received");
      return;
    }
    
    // Store data
    localStorage.setItem("user_id", userId);
    localStorage.setItem("token", token);
    localStorage.setItem("role", userRole);
    localStorage.setItem("first_name", userFirstName);
    
    // Also store with user-specific prefix for safety
    localStorage.setItem(`user_${userId}_first_name`, userFirstName);
    localStorage.setItem(`user_${userId}_role`, userRole);
    
    // Verify storage
    console.log("Storage verification:");
    console.log("Stored user_id:", localStorage.getItem("user_id"));
    console.log("Stored first_name:", localStorage.getItem("first_name"));
    console.log("Stored role:", localStorage.getItem("role"));
    
    navigate('/home');

  } catch (err) {
    console.error("Login error:", err.response || err);

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
      </video>

      <div className="loginForm">
        <div className="landingContent">
          <img src={Logo} alt="Logo" className="landingLogo" />
        </div>

        <input
          type="text"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        <button onClick={handleLogin}>Login</button>

        <button onClick={() => navigate('/client-register')}>
          Sign Up
        </button>

        <p className='errorMsg' >{error}</p>

      </div>
    </div>
  );
};

export default ClientLogin;
