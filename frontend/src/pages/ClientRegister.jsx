import '../App.css';
import BackgroundVideo from '../assets/videos/vid_1.mp4'; 
import Logo from '../assets/img/Logo.png'; 

import { useState } from 'react';
import AxiosInstance from '../components/AxiosInstance';
import { useNavigate } from "react-router-dom";


const ClientRegister = () => {
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [phoneNum, setPhoneNum] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const navigate = useNavigate();


  const handleRegister = async () => {
  setError('');
  setSuccess('');

  if (!email || !password || !confirmPassword || !firstName || !lastName) {
    setError('Please fill in all fields.');
    return;
  }

  if (password !== confirmPassword) {
    setError('Passwords do not match.');
    return;
  }

  try {
    const response = await AxiosInstance.post('register/client/', {
      email,
      password,
      first_name: firstName,
      last_name: lastName,
      address,
      phoneNum
    });

    console.log(response.data);
    setSuccess('Client account created successfully! Redirecting...');

    setEmail('');
    setPassword('');
    setFirstName('');
    setLastName('');
    setAddress('');
    setPhoneNum('');
    setConfirmPassword('');

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
        <div className="landingContent">
          <img src={Logo} alt="Logo" className="landingLogo" />
        </div>

        <input
          type="text"
          placeholder="First Name"
          value={firstName}
          onChange={e => setFirstName(e.target.value)}
        />

        <input
          type="text"
          placeholder="Last Name"
          value={lastName}
          onChange={e => setLastName(e.target.value)}
        />

        <input
          type="text"
          placeholder="Address"
          value={lastName}
          onChange={e => setAddress(e.target.value)}
        />

        <input
          type="text"
          placeholder="Phone Number"
          value={lastName}
          onChange={e => setPhoneNum(e.target.value)}
        />

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

        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
        />

        <button onClick={handleRegister}>Create Client Account</button>

        {error && <p className='errorMsg'>{error}</p>}
        {success && <p className='successMsg'>{success}</p>}


      </div>
    </div>
  );
};

export default ClientRegister;
