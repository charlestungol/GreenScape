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
      console.log("LOGIN RESPONSE:", response.data);
      
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("role", response.data.user.role);
      localStorage.setItem("first_name", response.data.user.first_name);
      navigate('/home');

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
