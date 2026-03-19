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

    if (!employeeNumber || !email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      const response = await AxiosInstance.post("login/employee/", {
        employee_number: employeeNumber,
        email,
        password,
      });

      const user = response.data?.user || {};

      localStorage.setItem("access", response.data?.access || "");
      localStorage.setItem("user_id", user.id || "");
      localStorage.setItem("email", user.email || "");
      localStorage.setItem("role", user.role || "employee");
      localStorage.setItem("employee_number", user.employee_number || "");
      localStorage.setItem("employee_id", user.employee_id || "");
      localStorage.setItem("first_name", user.first_name || "");
      localStorage.setItem("last_name", user.last_name || "");
      localStorage.setItem("group", user.group || "");

      navigate("/employee/dashboard");
    } catch (err) {
      console.error(err.response || err);

      if (err.response) {
        setError(
          typeof err.response.data === "string"
            ? err.response.data
            : JSON.stringify(err.response.data)
        );
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
          onChange={(e) => setEmployeeNumber(e.target.value)}
        />

        <input
          type="text"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button onClick={handleLogin}>Login</button>

        <button onClick={() => navigate("/employee-register")}>
          Sign Up
        </button>

        {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}
      </div>
    </div>
  );
};

export default EmployeeLogin;