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
    email: "",
    first_name: "",
    last_name: "",
    phone: "", 
    address: {
      street: "",
      city: "",
      province: "",
      postal_code: "",
      country: ""
    }
  });
  
  const [editMode, setEditMode] = useState(false);
  const [userMessage, setUserMessage] = useState("");
  const [userMsgType, setUserMsgType] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Ref for overlay content
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
      if (e.key === 'Escape' && overlayOpen) {
        closeOverlay();
      }
    };

    if (overlayOpen) {
      document.addEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'unset';
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

  const fetchUserInfo = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await AxiosInstance.get("client/profile/", {
        headers: { Authorization: `Token ${token}` }
      });
      
      const userData = response.data.user;
      const customerData = response.data.customer;
      const addressData = customerData?.addressid || {};
      
      setUserInfo({
        email: userData?.email || "",
        first_name: userData?.first_name || "",
        last_name: userData?.last_name || "",
        phone: customerData?.phonenumber || "",
        address: {
          street: addressData?.street || "",
          city: addressData?.city || "",
          province: addressData?.province || "",
          postal_code: addressData?.postal_code || "",
          country: addressData?.country || ""
        }
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
    
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setUserInfo(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setUserInfo(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleUpdateUserInfo = async () => {
    setUserMessage("");
    setUserMsgType("");
    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");
      
      const payload = {
        user: {
          email: userInfo.email,
          first_name: userInfo.first_name,
          last_name: userInfo.last_name
        },
        customer: {
          phonenumber: userInfo.phone,
          address: userInfo.address
        }
      };

      await AxiosInstance.put(
        "client/profile/update/",
        payload,
        { 
          headers: { 
            Authorization: `Token ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );

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
        
        const formatErrors = (obj, prefix = '') => {
          Object.keys(obj).forEach(key => {
            const value = obj[key];
            if (typeof value === 'object') {
              formatErrors(value, `${prefix}${key}.`);
            } else {
              formatted += `${prefix}${key.replace(/_/g, ' ').toUpperCase()}: ${value}\n`;
            }
          });
        };
        
        formatErrors(errors);
        setUserMessage(formatted);
      } else {
        setUserMessage("An error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setMessage("");
    setMsgType("");
    setIsLoading(true);

    if (!oldPassword || !newPassword) {
      setMsgType("error");
      setMessage("Both old and new password are required.");
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setMsgType("error");
      setMessage("New password must be at least 6 characters long.");
      setIsLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");

      await AxiosInstance.post(
        "change-password/",
        { 
          old_password: oldPassword, 
          new_password: newPassword 
        },
        { 
          headers: { 
            Authorization: `Token ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );

      setMsgType("success");
      setMessage("Password changed successfully!");

      setTimeout(() => {
        closeOverlay();
      }, 1500);
    } catch (err) {
      setMsgType("error");
      if (err.response?.data) {
        const errors = err.response.data;
        let formatted = "Password change failed:\n";
        
        if (typeof errors === 'object') {
          Object.keys(errors).forEach(key => {
            formatted += `${key.replace(/_/g, ' ').toUpperCase()}: ${Array.isArray(errors[key]) ? errors[key][0] : errors[key]}\n`;
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

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      setMsgType("error");
      setMessage("Please enter a valid email address.");
      setIsLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");

      // Using the same profile update endpoint since change-email might not exist
      const payload = {
        user: {
          email: newEmail,
          first_name: userInfo.first_name,
          last_name: userInfo.last_name
        },
        customer: {
          phonenumber: userInfo.phone,
          address: userInfo.address
        }
      };

      await AxiosInstance.put(
        "client/profile/update/",
        payload,
        { 
          headers: { 
            Authorization: `Token ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );

      setMsgType("success");
      setMessage("Email changed successfully!");

      // Update the userInfo state with new email
      setUserInfo(prev => ({
        ...prev,
        email: newEmail
      }));

      setTimeout(() => {
        closeOverlay();
      }, 1500);
    } catch (err) {
      setMsgType("error");
      if (err.response?.data) {
        const errors = err.response.data;
        let formatted = "Email change failed:\n";
        
        if (typeof errors === 'object') {
          Object.keys(errors).forEach(key => {
            const value = errors[key];
            if (typeof value === 'object') {
              // Handle nested errors (like user.email)
              Object.keys(value).forEach(nestedKey => {
                formatted += `${nestedKey.replace(/_/g, ' ').toUpperCase()}: ${Array.isArray(value[nestedKey]) ? value[nestedKey][0] : value[nestedKey]}\n`;
              });
            } else {
              formatted += `${key.replace(/_/g, ' ').toUpperCase()}: ${Array.isArray(value) ? value[0] : value}\n`;
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
                <button 
                  className="editBtn"
                  onClick={() => setEditMode(true)}
                  disabled={isLoading}
                >
                  EDIT INFO
                </button>
              ) : (
                <div className="editActions">
                  <button 
                    className="saveBtn"
                    onClick={handleUpdateUserInfo}
                    disabled={isLoading}
                  >
                    {isLoading ? "SAVING..." : "SAVE"}
                  </button>
                  <button 
                    className="cancelBtn"
                    onClick={handleCancel}
                    disabled={isLoading}
                  >
                    CANCEL
                  </button>
                </div>
              )}
            </div>

            {isLoading && !editMode ? (
              <div className="loadingState">Loading profile information...</div>
            ) : (
              <div className="infoGrid">
                {/* Email Field - Added back */}
                <div className="infoItem fullWidth">
                  <label className="infoLabel">Email Address</label>
                  {editMode ? (
                    <input
                      type="email"
                      name="email"
                      className="infoInput"
                      value={userInfo.email}
                      onChange={handleInputChange}
                      placeholder="Enter your email"
                      disabled={isLoading}
                    />
                  ) : (
                    <p className="infoValue">{userInfo.email || "Not set"}</p>
                  )}
                </div>

                <div className="infoItem">
                  <label className="infoLabel">First Name</label>
                  {editMode ? (
                    <input
                      type="text"
                      name="first_name"
                      className="infoInput"
                      value={userInfo.first_name}
                      onChange={handleInputChange}
                      placeholder="Enter your first name"
                      disabled={isLoading}
                    />
                  ) : (
                    <p className="infoValue">{userInfo.first_name || "Not set"}</p>
                  )}
                </div>

                <div className="infoItem">
                  <label className="infoLabel">Last Name</label>
                  {editMode ? (
                    <input
                      type="text"
                      name="last_name"
                      className="infoInput"
                      value={userInfo.last_name}
                      onChange={handleInputChange}
                      placeholder="Enter your last name"
                      disabled={isLoading}
                    />
                  ) : (
                    <p className="infoValue">{userInfo.last_name || "Not set"}</p>
                  )}
                </div>

                <div className="infoItem">
                  <label className="infoLabel">Phone Number</label>
                  {editMode ? (
                    <input
                      type="tel"
                      name="phone"
                      className="infoInput"
                      value={userInfo.phone}
                      onChange={handleInputChange}
                      placeholder="Enter your phone number"
                      disabled={isLoading}
                    />
                  ) : (
                    <p className="infoValue">{userInfo.phone || "Not set"}</p>
                  )}
                </div>

                <div className="infoItem fullWidth">
                  <label className="infoLabel">Street Address</label>
                  {editMode ? (
                    <input
                      type="text"
                      name="address.street"
                      className="infoInput"
                      value={userInfo.address.street}
                      onChange={handleInputChange}
                      placeholder="Enter street address"
                      disabled={isLoading}
                    />
                  ) : (
                    <p className="infoValue">{userInfo.address.street || "Not set"}</p>
                  )}
                </div>

                <div className="infoItem">
                  <label className="infoLabel">City</label>
                  {editMode ? (
                    <input
                      type="text"
                      name="address.city"
                      className="infoInput"
                      value={userInfo.address.city}
                      onChange={handleInputChange}
                      placeholder="Enter city"
                      disabled={isLoading}
                    />
                  ) : (
                    <p className="infoValue">{userInfo.address.city || "Not set"}</p>
                  )}
                </div>

                <div className="infoItem">
                  <label className="infoLabel">Province</label>
                  {editMode ? (
                    <input
                      type="text"
                      name="address.province"
                      className="infoInput"
                      value={userInfo.address.province}
                      onChange={handleInputChange}
                      placeholder="Enter province"
                      disabled={isLoading}
                    />
                  ) : (
                    <p className="infoValue">{userInfo.address.province || "Not set"}</p>
                  )}
                </div>

                <div className="infoItem">
                  <label className="infoLabel">Postal Code</label>
                  {editMode ? (
                    <input
                      type="text"
                      name="address.postal_code"
                      className="infoInput"
                      value={userInfo.address.postal_code}
                      onChange={handleInputChange}
                      placeholder="Enter postal code"
                      disabled={isLoading}
                    />
                  ) : (
                    <p className="infoValue">{userInfo.address.postal_code || "Not set"}</p>
                  )}
                </div>

                <div className="infoItem">
                  <label className="infoLabel">Country</label>
                  {editMode ? (
                    <input
                      type="text"
                      name="address.country"
                      className="infoInput"
                      value={userInfo.address.country}
                      onChange={handleInputChange}
                      placeholder="Enter country"
                      disabled={isLoading}
                    />
                  ) : (
                    <p className="infoValue">{userInfo.address.country || "Not set"}</p>
                  )}
                </div>
              </div>
            )}

            {userMessage && (
              <div className={`userMsg ${userMsgType === "error" ? "errorMsg" : "successMsg"}`}>
                {userMessage.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            )}
          </div>

          {/* Security Section */}
          <div className="securitySettingsSection">
            <h2 className="sectionTitle">Security</h2>
            <button
              className="changeBtn"
              onClick={openEmailOverlay}
              disabled={isLoading}
            >
              CHANGE EMAIL
            </button>
            <button 
              className="changeBtn"
              onClick={openPasswordOverlay}
              disabled={isLoading}
            >
              CHANGE PASSWORD
            </button>
          </div>
        </div>

        {/* Change Password/Email Overlay */}
        {overlayOpen && (
          <div 
            className="overlay" 
            onClick={handleOverlayClick}
          >
            <div 
              className="overlayContent" 
              ref={overlayContentRef}
            >
              <h2 className="overlayTitle">
                {overlayType === "password" ? "Change Password" : "Change Email"}
              </h2>

              {overlayType === "password" ? (
                <>
                  <div className="inputGroup">
                    <label>Old Password</label>
                    <input
                      type="password"
                      placeholder="Enter old password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="inputGroup">
                    <label>New Password</label>
                    <input
                      type="password"
                      placeholder="Enter new password (min. 6 characters)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </>
              ) : (
                <div className="inputGroup">
                  <label>New Email Address</label>
                  <input
                    type="email"
                    placeholder="Enter new email address"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    disabled={isLoading}
                  />
                  <p className="inputHint">Your current email: {userInfo.email}</p>
                </div>
              )}

              <button 
                className="updateBtn"
                onClick={overlayType === "password" ? handleChangePassword : handleChangeEmail}
                disabled={isLoading}
              >
                {isLoading ? "UPDATING..." : `UPDATE ${overlayType === "password" ? "PASSWORD" : "EMAIL"}`}
              </button>

              {message && (
                <div className={`statusMsg ${msgType === "error" ? "errorMsg" : "successMsg"}`}>
                  {message.split('\n').map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              )}

              <p className="closeModal" onClick={closeOverlay}>
                CLOSE
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;