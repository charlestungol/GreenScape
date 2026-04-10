import '../App.css';
import BackgroundVideo from '../assets/videos/vid_1.mp4'; 
import Logo from '../assets/img/Logo.png'; 
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../components/AxiosInstance';
import ReCAPTCHA from "react-google-recaptcha";
import { useState, useEffect, useRef } from "react";


const ClientLogin = () => {
  const navigate = useNavigate();
  const [failedAttempts, setFailedAttempts] = useState(0);
  const needsCaptcha = failedAttempts >= 2;
  const [loading, setLoading] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const recaptchaRef = useRef(null)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

const handleLogin = async () => {
  setError('');
  setLoading(true);

  if (!email || !password) {
    setError("Please fill in all fields.");
    setLoading(false);
    return;
  }

  if (needsCaptcha && !recaptchaToken) {
    setError("Please verify that you are not a robot.");
    setLoading(false);
    return;
  }

  try {
    localStorage.removeItem("access");
    await AxiosInstance.get("/csrf/").catch(() => {});

    const response = await AxiosInstance.post("login/client/", {
      email,
      password,
      ...(needsCaptcha && { recaptchaToken }),
    });

    //SUCCESS → reset state
    setFailedAttempts(0);
    setRecaptchaToken(null);
    recaptchaRef.current?.reset();

    const user = response.data.user;
    const access = response.data.access;
    localStorage.setItem("user_id", user.id);
    localStorage.setItem("access", access);
    localStorage.setItem("role", user.role);
    localStorage.setItem(
      "profile_ready",
      response.data.profile_ready ? "true" : "false"
    );

    if (user.role === "client" && !response.data.profile_ready) {
      navigate("/complete-profile");
    } else {
      navigate("/home");
    }

  } catch (err) {
    console.error("Login error:", err.response || err);

    //FAILURE → increment counter
    setFailedAttempts(prev => prev + 1);

    if (recaptchaRef.current) {
      recaptchaRef.current.reset();
    }
    setRecaptchaToken(null);

    setError(
      err.response?.data?.detail || "Invalid email or password."
    );

  } finally {
    setLoading(false);
  }
};

// Initialize Google Sign-In button after component mounts
  const googleInitialized = useRef(false);

  useEffect(() => {
    if (!window.google) return;
    if (googleInitialized.current) return;

    googleInitialized.current = true;

    google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: handleGoogleCredential,
    });

    google.accounts.id.renderButton(
      document.getElementById("google-signin"),
      { theme: "outline", size: "large", width: 300 }
    );
  }, []);

const handleGoogleCredential = async (response) => {
  try {
    // The Google Identity Services library returns a credential string directly in the response
    const credential = response.credential;

    // If credential is missing, fail gracefully
    if (!credential) {
      setError("Google login failed. No credential received.");
      return;
    }
    // Send the credential to the backend for verification and JWT issuance
    const res = await AxiosInstance.post("google/", {
      credential
    });
    console.log("Google login response:", res);
    // Expecting access token, user info, and profile status from backend
    const { access, user, profile_ready } = res.data;

    // Basic validation of response data
    if (!access || typeof access !== "string") {
      setError("Google login succeeded but no access token received.");
      return;
    }
    // Persist auth state
    localStorage.setItem("access", access);
    localStorage.setItem("user_id", user.id);
    localStorage.setItem("role", user.role);
    localStorage.setItem(
      "profile_ready",
      profile_ready ? "true" : "false"
    );

    // Route user based on profile completion
    if (user.role === "client" && !profile_ready) {
      navigate("/complete-profile");
    } else {
      navigate("/home");
    }
  } catch (err) {
    console.error(err);
    setError("Google sign-in failed.");
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
          maxLength={254}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          maxLength={50}
        />
        {needsCaptcha && (
          <ReCAPTCHA
            ref={recaptchaRef}
            sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
            onChange={(token) => setRecaptchaToken(token)}
            onExpired={() => setRecaptchaToken(null)}
          />
        )}
        <button onClick={handleLogin} disabled={loading}>
          {loading ? "Logging in…" : "LOGIN"}
        </button>
        <button onClick={() => navigate('/client-register')}>
          SIGN UP
        </button>
        or
        <div id="google-signin"></div>

        <p className='errorMsg' >{error}</p>

      </div>
    </div>
  );
};

export default ClientLogin;
