import "../../App.css";
import BackgroundVideo from "../../assets/videos/vid_1.mp4";
import Logo from "../../assets/img/Logo.png";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AxiosInstance from "../../components/AxiosInstance";

const CompleteProfile = () => {
  const navigate = useNavigate();

  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [phonenumber, setPhonenumber] = useState("");

  const [address, setAddress] = useState({
    street: "",
    city: "",
    province: "",
    postalcode: "",
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // ───────────────────────────────
  // Load employee profile
  // ───────────────────────────────
  useEffect(() => {
    AxiosInstance.get("core/employees/me/")
      .then(({ data }) => {
        setFirstname(data.firstname || "");
        setLastname(data.lastname || "");
        setPhonenumber(data.phonenumber || "");

        if (data.address) {
          setAddress({
            street: data.address.street || "",
            city: data.address.city || "",
            province: data.address.province || "",
            postalcode: data.address.postalcode || "",
          });
        }
      })
      .catch(() => {
        setError("Failed to load employee profile.");
      })
      .finally(() => setLoading(false));
  }, []);

  // ───────────────────────────────
  // Submit profile
  // ───────────────────────────────
  const handleSubmit = async () => {
    setError("");

    if (
      !firstname ||
      !lastname ||
      !phonenumber ||
      !address.street ||
      !address.city ||
      !address.province ||
      !address.postalcode
    ) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      setSubmitting(true);

      await AxiosInstance.patch("core/employees/me/", {
        firstname,
        lastname,
        phonenumber,
        address,
      });

      navigate("/employee/dashboard");
    } catch (err) {
      console.error(err.response || err);
      setError(
        err.response?.data
          ? JSON.stringify(err.response.data)
          : "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="myBackground">
        <video autoPlay muted loop className="backgroundVideo">
          <source src={BackgroundVideo} type="video/mp4" />
        </video>
        <div className="loginForm">
          <p>Loading profile…</p>
        </div>
      </div>
    );
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

        <h3 style={{ marginBottom: "10px" }}>
          Complete Your Profile
        </h3>
        <p style={{ fontSize: "14px", textAlign: "center" }}>
          We just need a few more details to finish setting up your employee account.
        </p>

        <input
          type="text"
          placeholder="First Name"
          value={firstname}
          onChange={(e) => setFirstname(e.target.value)}
          maxLength={25}
        />

        <input
          type="text"
          placeholder="Last Name"
          value={lastname}
          onChange={(e) => setLastname(e.target.value)}
          maxLength={25}
        />

        <input
          type="text"
          placeholder="Phone Number"
          value={phonenumber}
          onChange={(e) => setPhonenumber(e.target.value)}
          maxLength={10}
        />

        <input
          type="text"
          placeholder="Street Address"
          value={address.street}
          onChange={(e) =>
            setAddress({ ...address, street: e.target.value })
          }
          maxLength={50}
        />

        <input
          type="text"
          placeholder="City"
          value={address.city}
          onChange={(e) =>
            setAddress({ ...address, city: e.target.value })
          }
          maxLength={25}
        />

        <input
          type="text"
          placeholder="Province"
          value={address.province}
          onChange={(e) =>
            setAddress({ ...address, province: e.target.value })
          }
          maxLength={2}
        />

        <input
          type="text"
          placeholder="Postal Code"
          value={address.postalcode}
          onChange={(e) =>
            setAddress({ ...address, postalcode: e.target.value })
          }
          maxLength={6}
        />

        <button onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Saving..." : "Complete Profile"}
        </button>

        {error && <p className="errorMsg">{error}</p>}
      </div>
    </div>
  );
};

export default CompleteProfile;