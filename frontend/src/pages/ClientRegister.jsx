import '../App.css'
import BackgroundVideo from '../assets/videos/vid_1.mp4'; 
import Logo from '../assets/img/Logo.png'; 

import { useState, useRef } from 'react'
import AxiosInstance from '../components/AxiosInstance';
import ReCAPTCHA from "react-google-recaptcha";
import { useNavigate } from "react-router-dom";


const ClientRegister = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const recaptchaRef = useRef(null);

  const navigate = useNavigate();


  const handleRegister = async () => {
  setError('');
  setSuccess('');

  if (!email || !password || !confirmPassword) {
    setError('Please fill in all fields.');
    return;
  }

  if (password !== confirmPassword) {
    setError('Passwords do not match.');
    return;
  }
  
  if (!recaptchaToken) {
    setError('Please verify that you are not a robot.');
    return;
  }


  try {
    const response = await AxiosInstance.post('register/client/', {
      email,
      password,
      recaptchaToken
    });

    console.log(response.data);
    setSuccess('Client account created successfully! Redirecting...');

    setEmail('');
    setPassword('');
    setConfirmPassword('');
    recaptchaRef.current.reset();

    setTimeout(() => {
      navigate("/client-login");
    }, 1200);

  } catch (err) {
    console.error(err.response || err);
    if (err.response) {
      setError(JSON.stringify(err.response.data));
    } else {
      setError('Something went wrong. Please try again.');
    }
  }
};


  return (
    <div className="myBackground">
      <video autoPlay muted loop className="backgroundVideo">
        <source src={BackgroundVideo} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

<div className="registerForm">
  <div className="regFormLogo">
    <img src={Logo} alt="Logo"/>
  </div>

  {/* LEFT COLUMN */}
  <div className="formLeft">
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

    <input
      type="password"
      placeholder="Confirm Password"
      value={confirmPassword}
      onChange={e => setConfirmPassword(e.target.value)}
      maxLength={50}
    />
  </div>
  <ReCAPTCHA
    ref={recaptchaRef}
    sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
    onChange={(token) => setRecaptchaToken(token)}
    onExpired={() => setRecaptchaToken(null)}
  />
  <button onClick={handleRegister}>Create Client Account</button>

  {error && <p className="errorMsg">{error}</p>}
  {success && <p className="successMsg">{success}</p>}
</div>

    </div>
  );
};

export default ClientRegister;
