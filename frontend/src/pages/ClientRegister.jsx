import '../App.css'
import BackgroundVideo from '../assets/videos/vid_1.mp4'; 
import Logo from '../assets/img/Logo.png'; 

import { useState } from 'react';
import AxiosInstance from '../components/AxiosInstance';
import { useNavigate } from "react-router-dom";


const ClientRegister = () => {
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState({street: '', city:'',province:'',postalcode:''});
  const [phonenumber, setPhoneNum] = useState('');
  const [firstname, setFirstName] = useState('');
  const [lastname, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const navigate = useNavigate();


  const handleRegister = async () => {
  setError('');
  setSuccess('');

  if (!email || !password || !confirmPassword || !firstname || !lastname) {
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
      first_name: firstname,
      last_name: lastname,
      phone: phonenumber,
      address:{
        street: address.street,
        city: address.city,
        province: address.province,
        postalcode: address.postalcode,
      },
      phoneNum: phonenumber
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
  <div className="regFormLogo">
    <img src={Logo} alt="Logo"/>
  </div>

  {/* LEFT COLUMN */}
  <div className="formLeft">
    <input
      type="text"
      placeholder="First Name"
      value={firstname}
      onChange={e => setFirstName(e.target.value)}
    />

    <input
      type="text"
      placeholder="Last Name"
      value={lastname}
      onChange={e => setLastName(e.target.value)}
    />

    <input
      type="text"
      placeholder="Email"
      value={email}
      onChange={e => setEmail(e.target.value)}
    />

    <input
      type="text"
      placeholder="Phone Number"
      value={phonenumber}
      onChange={e => setPhoneNum(e.target.value)}
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
  </div>

  {/* ADDRESS SECTION */}
  <div className="addressSection">
    <input
      type="text"
      placeholder="Street"
      value={address.street}
      onChange={e =>
        setAddress({ ...address, street: e.target.value })
      }
    />

    <input
      type="text"
      placeholder="City"
      value={address.city}
      onChange={e =>
        setAddress({ ...address, city: e.target.value })
      }
    />

    <input
      type="text"
      placeholder="Province"
      value={address.province}
      onChange={e =>
        setAddress({ ...address, province: e.target.value })
      }
    />

    <input
      type="text"
      placeholder="Postal Code"
      value={address.postalcode}
      onChange={e =>
        setAddress({ ...address, postalcode: e.target.value })
      }
    />
  </div>

  <button onClick={handleRegister}>Create Client Account</button>

  {error && <p className="errorMsg">{error}</p>}
  {success && <p className="successMsg">{success}</p>}
</div>

    </div>
  );
};

export default ClientRegister;
