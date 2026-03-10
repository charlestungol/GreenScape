import '../App.css';
import BackgroundVideo from '../assets/videos/vid_1.mp4'; 
import Logo from '../assets/img/Logo.png'; 

import { useState } from 'react';
import { useNavigate } from "react-router-dom";   
import AxiosInstance from '../components/AxiosInstance'; 

const Register = () => {

  const [email, setEmail] = useState('');
  const [employeeNumber, setEmployeeNumber] = useState('');
  const [group, setGroup] = useState('staff');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const navigate = useNavigate();  

  const handleRegister = async () => {
    setError('');
    setSuccess('');

    if (!email || !password || !confirmPassword || !employeeNumber || !group){
      setError('Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      const response = await AxiosInstance.post('register/employee/', {
        email,
        password,
        employee_number: employeeNumber,
        group
      });

      console.log(response.data);

      setSuccess('Employee account created successfully! Redirecting...');

      setEmail('');
      setEmployeeNumber('');
      setGroup('staff');
      setPassword('');
      setConfirmPassword('');

      setTimeout(() => {
        navigate("/employee-login");
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

      <div className="loginForm">

        <div className="landingContent">
          <img src={Logo} alt="Logo" className="landingLogo" />
        </div>

        <input
          type="text"
          placeholder="Employee Number"
          value={employeeNumber}
          onChange={e => setEmployeeNumber(e.target.value)}
        />

        <input
          type="text"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />

        <select
          value={group}
          onChange={(e) => setGroup(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "10px",
            borderRadius: "8px"
          }}
        >
          <option value="admin">Admin</option>
          <option value="supervisor">Supervisor</option>
          <option value="staff">Staff</option>
        </select>

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

        <button onClick={handleRegister}>
          Create Employee Account
        </button>

        {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
        {success && <p style={{ color: 'green', marginTop: '10px' }}>{success}</p>}

      </div>
    </div>
  );
};

export default Register;