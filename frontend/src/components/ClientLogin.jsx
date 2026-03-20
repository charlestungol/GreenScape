import '../App.css';
import BackgroundVideo from '../assets/videos/vid_1.mp4'; 
import Logo from '../assets/img/Logo.png'; 
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../components/AxiosInstance';
import GoogleIcon from '@mui/icons-material/Google';


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
    localStorage.removeItem("access");
    await AxiosInstance.get("/csrf/").catch(() => {})
    const response = await AxiosInstance.post('login/client/', {
      email: email,
      password: password
    });
    

    console.log("Client login success:", response.data);
    console.log("Full response structure:", JSON.stringify(response.data, null, 2));
    
    console.log("response.data:", response.data);
    console.log("response.data.user:", response.data.user);
    console.log("response.data.user.first_name:", response.data.user?.first_name);
    
  
    const userId = response.data.user?.id || response.data.user_id || response.data.id;
    const userFirstName = response.data.user?.first_name || response.data.first_name || "";
    const userRole = response.data.user?.role || response.data.role || "client";

  
    const access = response.data?.access || {};

    
    console.log("Extracted values:");
    console.log("userId:", userId);
    console.log("userFirstName:", userFirstName);
    console.log("userRole:", userRole);
    console.log("access:", access);
    
    if (!userId) {
      console.error("No user_id found in response!");
      setError("Login failed: No user ID received");
      return;
    }

    if (!access || typeof access != "string") {
      setError("Login succeeded but no access token received.");
      return;
    }
    
    localStorage.setItem("user_id", userId);
    localStorage.setItem("access", access);
    localStorage.setItem("role", userRole);
    localStorage.setItem("first_name", userFirstName);
    localStorage.setItem(`user_${userId}_first_name`, userFirstName);
    localStorage.setItem(`user_${userId}_role`, userRole);
    
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

const handleGoogleLogin = () => {
  
} 

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

        <button onClick={handleLogin}>LOGIN</button>
        <button onClick={() => navigate('/client-register')}>
          SIGN UP
        </button>
        or
        <button onClick={handleGoogleLogin}><GoogleIcon/></button>

        <p className='errorMsg' >{error}</p>

      </div>
    </div>
  );
};

export default ClientLogin;
