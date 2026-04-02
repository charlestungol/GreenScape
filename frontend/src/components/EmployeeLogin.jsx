import "../App.css";
import BackgroundVideo from "../assets/videos/vid_1.mp4";
import Logo from "../assets/img/Logo.png";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AxiosInstance from "../components/AxiosInstance";

const EmployeeLogin = () => {
  const navigate = useNavigate();

  const [employeeNumber, setEmployeeNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      //Login (single flow for all internal users)
      const response = await AxiosInstance.post("login/employee/", {
        email,
        password,
        employee_number: employeeNumber || null,
      });

      const { access, user } = response.data;
      const group = user?.group;

      //Store auth/session info
      localStorage.setItem("access", access);
      localStorage.setItem("user_id", user.id);
      localStorage.setItem("email", user.email);
      localStorage.setItem("role", user.role);
      localStorage.setItem("group", group || "");
      console.log("Logged in user group:", group);
    // Employee roles → enforce profile completion
    if (group === "Staff" || group === "Supervisor") {
      try {
        const meRes = await AxiosInstance.get("core/employees/me/");
        const employee = meRes.data;

        const profileComplete =
          employee.firstname &&
          employee.lastname &&
          employee.phonenumber &&
          employee.address;

        if (!profileComplete) {
          navigate("/employee/complete-profile");
          return;
        }

        navigate("/employeeHome");
        return;

      } catch (err) {
        if (err.response?.status === 404) {
          // New employee → no profile yet
          navigate("/employee/complete-profile");
          return;
        }

        // Any other error really is a problem
        console.error("Employee profile check failed:", err);
        throw err;
      }
    }
      //Fallback (misconfigured account)
      setError("Your account has no assigned role. Please contact support.");

    } catch (err) {
      console.error(err.response || err);
      setError("Login failed. Please check your credentials.");
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

        {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}
      </div>
    </div>
  );
};

export default EmployeeLogin;