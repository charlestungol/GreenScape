import { useState, useEffect, useRef } from "react"; 
import AxiosInstance from "../../components/AxiosInstance";
import "../../components/clientCss/Settings.css";

const Settings = () => {
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [overlayType, setOverlayType] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [message, setMessage] = useState("");
  const [msgType, setMsgType] = useState("");
  
  const [userInfo, setUserInfo] = useState({
    first_name: "",
    last_name: "",
    phone: "", 
    address: {
      street: "",
      city: "",
      province: "",
      postal_code: "",
    }
  });
  
  const [editMode, setEditMode] = useState(false);
  const [userMessage, setUserMessage] = useState("");
  const [userMsgType, setUserMsgType] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const overlayContentRef = useRef(null);

  useEffect(() => {
    fetchUserInfo();
  }, []);

  // Handle click outside overlay
  const handleOverlayClick = (e) => {
    if (overlayContentRef.current && !overlayContentRef.current.contains(e.target)) {
      closeOverlay();
    }
  };

  // Handle ESC key
  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === "Escape" && overlayOpen) {
        closeOverlay();
      }
    };

    if (overlayOpen) {
      document.addEventListener("keydown", handleEscKey);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscKey);
      document.body.style.overflow = "unset";
    };
  }, [overlayOpen]);

  const closeOverlay = () => {
    setOverlayOpen(false);
    setOverlayType("");
    setMessage("");
    setOldPassword("");
    setNewPassword("");
    setNewEmail("");
  };

  // Clean helper (handles undefined/null)
  const clean = (v) => (typeof v === "string" ? v.trim() : v ?? "");

  const fetchUserInfo = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await AxiosInstance.get("client/profile/", {
        headers: { Authorization: `Token ${token}` },
      });

      const userData = response.data.user;
      const customerData = response.data.customer;
      const addressData = customerData?.addressid || {};

      setUserInfo({
        first_name: clean(userData?.first_name),
        last_name: clean(userData?.last_name),
        phone: clean(customerData?.phonenumber),
        address: {
          street: clean(addressData?.street),
          city: clean(addressData?.city),
          province: clean(addressData?.province),
          postal_code: clean(addressData?.postalcode),
        },
      });
    } catch (err) {
      console.error("Error fetching user info:", err);
      setUserMsgType("error");
      setUserMessage("Failed to load user information. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("address.")) {
      const addressField = name.split(".")[1];
      setUserInfo((prev) => ({
        ...prev,
        address: { ...prev.address, [addressField]: value },
      }));
    } else {
      setUserInfo((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleUpdateUserInfo = async () => {
    setUserMessage("");
    setUserMsgType("");
    setSavingProfile(true);
    try {
      const token = localStorage.getItem("token");

      const payload = {
        user: {
          first_name: clean(userInfo.first_name),
          last_name: clean(userInfo.last_name),
        },
        customer: {
          phonenumber: clean(userInfo.phone),
          address: {
            street: userInfo.address.street?.trim() || "",
            city: userInfo.address.city?.trim() || "",
            province: userInfo.address.province?.trim() || "",
            postalcode: (userInfo.address.postal_code || "").replace(/\s+/g, "").toUpperCase(),
          },
        },
      };

      await AxiosInstance.put("client/profile/update/", payload, {
        headers: { Authorization: `Token ${token}` },
      });

      setUserMsgType("success");
      setUserMessage("Profile updated successfully!");
      setEditMode(false);
      await fetchUserInfo();
      setTimeout(() => setUserMessage(""), 3000);
    } catch (err) {
      setUserMsgType("error");
      if (err.response?.data) {
        const errors = err.response.data;
        let formatted = "Update failed:\n";
        const formatErrors = (obj, prefix = "") => {
          Object.keys(obj).forEach((key) => {
            const value = obj[key];
            if (typeof value === "object") {
              formatErrors(value, `${prefix}${key}.`);
            } else {
              formatted += `${prefix}${key.replace(/_/g, " ").toUpperCase()}: ${value}\n`;
            }
          });
        };
        formatErrors(errors);
        setUserMessage(formatted);
      } else {
        setUserMessage("An error occurred. Please try again.");
      }
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    setMessage("");
    setMsgType("");
    setChangingPassword(true);

    if (!oldPassword || !newPassword) {
      setMsgType("error");
      setMessage("Both old and new password are required.");
      setChangingPassword(false);
      return;
    }

    if (newPassword.length < 6) {
      setMsgType("error");
      setMessage("New password must be at least 6 characters long.");
      setChangingPassword(false);
      return;
    }

    try {
      await AxiosInstance.post("/change-password/", {
        old_password: oldPassword,
        new_password: newPassword,
      });

      setMsgType("success");
      setMessage("Password changed successfully!");
      setTimeout(() => closeOverlay(), 1500);
    } catch (err) {
      setMsgType("error");
      if (err.response?.data) {
        const errors = err.response.data;
        let formatted = "Password change failed:\n";
        Object.keys(errors).forEach((key) => {
          const value = errors[key];
          formatted += `${key.replace(/_/g, " ").toUpperCase()}: ${Array.isArray(value) ? value[0] : value}\n`;
        });
        setMessage(formatted);
      } else {
        setMessage("An error occurred. Please try again.");
      }
    } finally {
      setChangingPassword(false);
    }
  };

  const handleChangeEmail = async () => {
    setMessage("");
    setMsgType("");
    setIsLoading(true);

    if (!newEmail) {
      setMsgType("error");
      setMessage("New email is required.");
      setIsLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      setMsgType("error");
      setMessage("Please enter a valid email address.");
      setIsLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const payload = {
        user: {
          email: newEmail,
          first_name: userInfo.first_name,
          last_name: userInfo.last_name,
        },
        customer: {
          phonenumber: userInfo.phone,
          address: userInfo.address,
        },
      };

      await AxiosInstance.put("client/profile/update/", payload, {
        headers: { Authorization: `Token ${token}`, "Content-Type": "application/json" },
      });

      setMsgType("success");
      setMessage("Email changed successfully!");
      setUserInfo((prev) => ({ ...prev, email: newEmail }));
      setTimeout(() => closeOverlay(), 1500);
    } catch (err) {
      setMsgType("error");
      if (err.response?.data) {
        const errors = err.response.data;
        let formatted = "Email change failed:\n";
        if (typeof errors === "object") {
          Object.keys(errors).forEach((key) => {
            const value = errors[key];
            if (typeof value === "object") {
              Object.keys(value).forEach((nestedKey) => {
                formatted += `${nestedKey.replace(/_/g, " ").toUpperCase()}: ${Array.isArray(value[nestedKey]) ? value[nestedKey][0] : value[nestedKey]}\n`;
              });
            } else {
              formatted += `${key.replace(/_/g, " ").toUpperCase()}: ${Array.isArray(value) ? value[0] : value}\n`;
            }
          });
        } else {
          formatted += errors;
        }
        setMessage(formatted);
      } else {
        setMessage("An error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    fetchUserInfo();
    setEditMode(false);
    setUserMessage("");
  };

  const openPasswordOverlay = () => {
    setOverlayType("password");
    setOverlayOpen(true);
  };

  const openEmailOverlay = () => {
    setOverlayType("email");
    setOverlayOpen(true);
  };

  return (
    <div>
      <p className="titleWrapper">SETTINGS</p>
      <div className="settings-page">
        <div className="settingsContainer">
          {/* User Information Section */}
          <div className="settingsSection">
            <div className="sectionHeader">
              <h2 className="sectionTitle">Personal Information</h2>
              {!editMode ? (
                <button className="editBtn" onClick={() => setEditMode(true)} disabled={isLoading}>
                  EDIT INFO
                </button>
              ) : (
                <div className="editActions">
                  <button className="saveBtn" onClick={handleUpdateUserInfo} disabled={savingProfile}>
                    {savingProfile ? "SAVING..." : "SAVE"}
                  </button>
                  <button className="cancelBtn" onClick={handleCancel} disabled={savingProfile}>
                    CANCEL
                  </button>
                </div>
              )}
            </div>

            {isLoading && !editMode ? (
              <div className="loadingState">Loading profile information...</div>
            ) : (
              <div className="infoGrid">
                <div className="infoItem">
                  <label className="infoLabel">First Name</label>
                  {editMode ? (
                    <input type="text" name="first_name" className="infoInput" value={userInfo.first_name} onChange={handleInputChange} placeholder="Enter your first name" disabled={isLoading} />
                  ) : (
                    <p className="infoValue">{userInfo.first_name || "Not set"}</p>
                  )}
                </div>

                <div className="infoItem">
                  <label className="infoLabel">Last Name</label>
                  {editMode ? (
                    <input type="text" name="last_name" className="infoInput" value={userInfo.last_name} onChange={handleInputChange} placeholder="Enter your last name" disabled={isLoading} />
                  ) : (
                    <p className="infoValue">{userInfo.last_name || "Not set"}</p>
                  )}
                </div>

                <div className="infoItem">
                  <label className="infoLabel">Phone Number</label>
                  {editMode ? (
                    <input type="tel" name="phone" className="infoInput" value={userInfo.phone} onChange={handleInputChange} placeholder="Enter your phone number" disabled={isLoading} />
                  ) : (
                    <p className="infoValue">{userInfo.phone || "Not set"}</p>
                  )}
                </div>

                <div className="infoItem fullWidth">
                  <label className="infoLabel">Street Address</label>
                  {editMode ? (
                    <input type="text" name="address.street" className="infoInput" value={userInfo.address.street} onChange={handleInputChange} placeholder="Enter street address" disabled={isLoading} />
                  ) : (
                    <p className="infoValue">{userInfo.address.street || "Not set"}</p>
                  )}
                </div>

                <div className="infoItem">
                  <label className="infoLabel">City</label>
                  {editMode ? (
                    <input type="text" name="address.city" className="infoInput" value={userInfo.address.city} onChange={handleInputChange} placeholder="Enter city" disabled={isLoading} />
                  ) : (
                    <p className="infoValue">{userInfo.address.city || "Not set"}</p>
                  )}
                </div>

                <div className="infoItem">
                  <label className="infoLabel">Province</label>
                  {editMode ? (
                    <input type="text" name="address.province" className="infoInput" value={userInfo.address.province} onChange={handleInputChange} placeholder="Enter province" disabled={isLoading} />
                  ) : (
                    <p className="infoValue">{userInfo.address.province || "Not set"}</p>
                  )}
                </div>

                <div className="infoItem">
                  <label className="infoLabel">Postal Code</label>
                  {editMode ? (
                    <input type="text" name="address.postal_code" className="infoInput" value={userInfo.address.postal_code} onChange={handleInputChange} placeholder="Enter postal code" disabled={isLoading} />
                  ) : (
                    <p className="infoValue">{userInfo.address.postal_code || "Not set"}</p>
                  )}
                </div>
              </div>
            )}

            {userMessage && (
              <div className={`userMsg ${userMsgType === "error" ? "errorMsg" : "successMsg"}`}>
                {userMessage.split("\n").map((line, i) => <p key={i}>{line}</p>)}
              </div>
            )}
          </div>

          {/* Security Section */}
          <div className="securitySettingsSection">
            <h2 className="sectionTitle">Security</h2>
            <button className="changeBtn" onClick={openEmailOverlay} disabled={isLoading}>
              CHANGE EMAIL
            </button>
            <button className="changeBtn" onClick={openPasswordOverlay} disabled={isLoading}>
              CHANGE PASSWORD
            </button>
          </div>
        </div>

        {/* Overlay */}
        {overlayOpen && (
          <div className="overlay" onClick={handleOverlayClick}>
            <div className="overlayContent" ref={overlayContentRef}>
              <h2 className="overlayTitle">
                {overlayType === "password" ? "Change Password" : "Change Email"}
              </h2>

              {overlayType === "password" ? (
                <>
                  <div className="inputGroup">
                    <label>Old Password</label>
                    <input type="password" placeholder="Enter old password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} disabled={changingPassword} />
                  </div>
                  <div className="inputGroup">
                    <label>New Password</label>
                    <input type="password" placeholder="Enter new password (min. 6 characters)" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} disabled={changingPassword} />
                  </div>
                </>
              ) : (
                <div className="inputGroup">
                  <label>New Email Address</label>
                  <input type="email" placeholder="Enter new email address" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} disabled={isLoading} />
                  <p className="inputHint">Your current email: {userInfo.email}</p>
                </div>
              )}

              <button
                className="updateBtn"
                onClick={overlayType === "password" ? handleChangePassword : handleChangeEmail}
                disabled={changingPassword || isLoading}
              >
                {changingPassword || isLoading ? "UPDATING..." : `UPDATE ${overlayType === "password" ? "PASSWORD" : "EMAIL"}`}
              </button>

              {message && (
                <div className={`statusMsg ${msgType === "error" ? "errorMsg" : "successMsg"}`}>
                  {message.split("\n").map((line, i) => <p key={i}>{line}</p>)}
                </div>
              )}

              <p className="closeModal" onClick={closeOverlay}>CLOSE</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;