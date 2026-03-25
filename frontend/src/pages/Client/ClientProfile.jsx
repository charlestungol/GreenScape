import { useState, useEffect } from 'react'; 
import '../../components/clientCss/ClientProfile.css';
import DefaultProfilePic from '../../assets/img/Profile.webp'; 
import AxiosInstance from '../../components/AxiosInstance';

function ClientProfile() {
  // Profile image state
  const [selectedImage, setSelectedImage] = useState(() => {
    const savedImage = localStorage.getItem('profileImage');
    return savedImage || DefaultProfilePic;
  });
  
  // Personal information state (display only)
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
    }
  });

  // UI states
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  
  // Image upload states
  const [fileError, setFileError] = useState('');
  const [fileSize, setFileSize] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    setIsLoading(true);
    try {
      const response = await AxiosInstance.get("core/customers/me/");
      const customer = response.data || {};
      const address = customer.address || {};

      setUserInfo({
        email: customer?.email || "",
        first_name: customer?.firstname || "",
        last_name: customer?.lastname || "",
        phone: customer?.phonenumber || "",
        address: {
          street: address?.street || "",
          city: address?.city || "",
          province: address?.province || "",
          postal_code: address?.postalcode || "",
        },
      });
    } catch (err) {
      console.error("Error fetching user info:", err);
      setMessage({ 
        type: "error", 
        text: "Failed to load user information. Please try again." 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        setFileError(`File too large! Maximum size is ${formatFileSize(MAX_FILE_SIZE)}. Your file: ${formatFileSize(file.size)}`);
        setFileSize(file.size);
        return;
      }

      setFileError('');
      setFileSize(file.size);
      setIsUploading(true);

      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target.result);
        setIsUploading(false);
      };
      reader.onerror = () => {
        setFileError('Error reading file. Please try again.');
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveImage = () => {
    if (selectedImage && selectedImage !== DefaultProfilePic) {
      localStorage.setItem('profileImage', selectedImage);
      window.dispatchEvent(new Event('storage'));
      setMessage({ type: "success", text: "Profile image saved!" });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    }
  };

  const handleRemoveImage = () => {
    if (window.confirm('Are you sure you want to remove your profile picture?')) {
      localStorage.removeItem('profileImage');
      window.dispatchEvent(new Event('storage'));
      setSelectedImage(DefaultProfilePic);
      setFileError('');
      setFileSize(null);
      setMessage({ type: "success", text: "Profile picture removed!" });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    }
  };

  const isDefaultImage = () => selectedImage === DefaultProfilePic;
  const hasImageChanged = () => {
    const savedImage = localStorage.getItem('profileImage');
    return selectedImage !== (savedImage || DefaultProfilePic);
  };

  if (isLoading) {
    return (
      <div className="profile-page">
        <div className="profile-title">PROFILE</div>
        <div className="profile-container">
          <div className="profile-card loading-card">
            <p>Loading profile information...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
    <div className="profile-title">PROFILE</div>
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-card">
          {/* Message Alert */}
          {message.text && (
            <div className={`message-alert ${message.type}`}>
              <span>{message.text}</span>
              <button className="close-alert" onClick={() => setMessage({ type: "", text: "" })}>×</button>
            </div>
          )}

          <div className="profile-layout">
            {/* Left Column - Profile Image - Centered */}
            <div className="profile-image-column">
              <div className="profile-image-section">
                <div className="profile-image-wrapper">
                  <img src={selectedImage} alt="Profile" className="profile-avatar" />
                </div>

                {fileSize && !fileError && (
                  <div className="profile-file-info">
                    <span>File size: {formatFileSize(fileSize)}</span>
                  </div>
                )}

                {fileError && (
                  <div className="profile-error">
                    <span>{fileError}</span>
                  </div>
                )}

                {isUploading && (
                  <div className="profile-upload-progress">
                    <p>Uploading...</p>
                    <div className="progress-bar">
                      <div className="progress-fill"></div>
                    </div>
                  </div>
                )}

                <div className="profile-image-actions">
                  <label className={`profile-choose-btn ${isUploading ? 'disabled' : ''}`}>
                    CHOOSE IMAGE
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageUpload} 
                      disabled={isUploading}
                      style={{ display: 'none' }}
                    />
                  </label>

                  {!isDefaultImage() && (
                    <button 
                      className={`profile-remove-btn ${isUploading ? 'disabled' : ''}`}
                      onClick={handleRemoveImage}
                      disabled={isUploading}
                    >
                      REMOVE
                    </button>
                  )}
                </div>

                {hasImageChanged() && (
                  <button 
                    className={`profile-save-image-btn ${isUploading || fileError ? 'disabled' : ''}`}
                    onClick={handleSaveImage}
                    disabled={isUploading || fileError}
                  >
                    SAVE IMAGE
                  </button>
                )}

                <div className="profile-size-note">
                  <span>Max size: 5MB. Formats: JPG, PNG, WEBP</span>
                </div>
              </div>
            </div>

            {/* Right Column - Personal Information - Settings Style */}
            <div className="profile-info-column">
              <div className="profile-info-section">
                <h2 className="profile-info-title">PERSONAL INFORMATION</h2>

                <div className="profile-info-grid">
                  {/* Email */}
                  <div className="profile-info-item">
                    <span className="profile-info-label">EMAIL</span>
                    <span className="profile-info-value">{userInfo.email || "—"}</span>
                  </div>

                  {/* Phone Number */}
                  <div className="profile-info-item">
                    <span className="profile-info-label">PHONE NUMBER</span>
                    <span className="profile-info-value">{userInfo.phone || "—"}</span>
                  </div>

                  {/* First Name */}
                  <div className="profile-info-item">
                    <span className="profile-info-label">FIRST NAME</span>
                    <span className="profile-info-value">{userInfo.first_name || "—"}</span>
                  </div>

                  {/* Last Name */}
                  <div className="profile-info-item">
                    <span className="profile-info-label">LAST NAME</span>
                    <span className="profile-info-value">{userInfo.last_name || "—"}</span>
                  </div>

                  {/* Street Address - Full Width */}
                  <div className="profile-info-item full-width">
                    <span className="profile-info-label">STREET ADDRESS</span>
                    <span className="profile-info-value">{userInfo.address.street || "—"}</span>
                  </div>

                  {/* City */}
                  <div className="profile-info-item">
                    <span className="profile-info-label">CITY</span>
                    <span className="profile-info-value">{userInfo.address.city || "—"}</span>
                  </div>

                  {/* Province */}
                  <div className="profile-info-item">
                    <span className="profile-info-label">PROVINCE</span>
                    <span className="profile-info-value">{userInfo.address.province || "—"}</span>
                  </div>

                  {/* Postal Code */}
                  <div className="profile-info-item">
                    <span className="profile-info-label">POSTAL CODE</span>
                    <span className="profile-info-value">{userInfo.address.postal_code || "—"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

export default ClientProfile;