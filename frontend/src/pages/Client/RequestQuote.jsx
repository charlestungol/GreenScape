import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AxiosInstance from "../../components/AxiosInstance"; 
import "../../components/clientCss/RequestQuote.css";

function RequestQuote() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState({ type: "", text: "" });
  
  const [formData, setFormData] = useState({
    fullName: "",
    street: "",
    city: "",
    province: "",
    postal_code: "",
    phone_number: "",
    product_type: "",
    plumbing: "",
    zones: "",
    lighting: "",
    system: "",
    email: "",
    wifi: "",
    sensor: ""
  });

  // Check authentication and pre-fill user data
  useEffect(() => {
    const token = localStorage.getItem('access');
    
    if (!token) {
      setPopupMessage({ 
        type: "error", 
        text: "Please log in to request a quote." 
      });
      setShowPopup(true);
      setTimeout(() => {
        setShowPopup(false);
        navigate('/client-login');
      }, 3000);
      return;
    }
    
    setIsAuthenticated(true);
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('=== SUBMITTING QUOTE ===');
    
    const token = localStorage.getItem('access');
    const userId = localStorage.getItem('user_id');
    
    console.log('Token exists:', !!token);
    console.log('User ID:', userId);
    console.log('Token first 20 chars:', token?.substring(0, 20) + '...');
    
    if (!token) {
      setPopupMessage({ 
        type: "error", 
        text: "Please log in to request a quote." 
      });
      setShowPopup(true);
      setTimeout(() => {
        setShowPopup(false);
        navigate('/client-login');
      }, 2000);
      return;
    }
    
    setLoading(true);

    try {
      const quoteData = {
        fullname: formData.fullName,
        street: formData.street,
        city: formData.city,
        province: formData.province,
        postalcode: formData.postal_code,
        phonenumber: formData.phone_number,
        email: formData.email,
        producttype: formData.product_type,
        plumbing: formData.plumbing,
        zones: formData.zones ? parseInt(formData.zones) : null,
        lighting: formData.lighting,
        system: formData.system,
        wifi: formData.wifi,
        sensor: formData.sensor,
        status: "pending"
      };
      
      console.log('Sending data:', quoteData);

      const response = await AxiosInstance.post("core/request-quotes/", quoteData);

      console.log('Response status:', response.status);
      console.log('Response data:', response.data);
      
      // Show success popup
      setPopupMessage({
        type: "success",
        text: "Quote request submitted successfully! We'll contact you soon."
      });
      setShowPopup(true);

      // Auto-hide popup after 3 seconds
      setTimeout(() => {
        setShowPopup(false);
      }, 3000);

      // Clear form
      setFormData({
        fullName: formData.fullName,
        street: "",
        city: "",
        province: "",
        postal_code: "",
        phone_number: "",
        product_type: "",
        plumbing: "",
        zones: "",
        lighting: "",
        system: "",
        email: formData.email,
        wifi: "",
        sensor: ""
      });

    } catch (error) {
      console.error('=== ERROR DETAILS ===');
      console.error('Error:', error);
  
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
        
        if (error.response.status === 401 || error.response.status === 403) {
          setPopupMessage({ 
            type: "error", 
            text: `Authentication error: ${error.response.status}. Please log in again.` 
          });
        } else if (error.response.status === 400) {
          const errors = error.response.data;
          let errorMsg = "Please fix the following errors:\n";
          Object.entries(errors).forEach(([key, value]) => {
            errorMsg += `- ${key}: ${Array.isArray(value) ? value.join(', ') : value}\n`;
          });
          setPopupMessage({ type: "error", text: errorMsg });
        } else {
          setPopupMessage({ type: "error", text: `Server error: ${error.response.status}` });
        }
      } else if (error.request) {
        setPopupMessage({ type: "error", text: "No response from server. Please check your connection." });
      } else {
        setPopupMessage({ type: "error", text: `Error: ${error.message}` });
      }
      
      setShowPopup(true);
      setTimeout(() => {
        setShowPopup(false);
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  // If not authenticated, show login message
  if (!isAuthenticated) {
    return (
      <>
        <div className="quoteTitle">REQUEST QUOTE</div>
        <div className="request-quote-container">
          <div className="message-banner error">
            <p>Please log in to request a quote.</p>
            <p>Redirecting to login page...</p>
          </div>
        </div>

        {/* Popup */}
        {showPopup && (
          <div className="popup-overlay">
            <div className={`popup-content ${popupMessage.type}`}>
              <p>{popupMessage.text}</p>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>    
      <div className="quoteTitle">REQUEST QUOTE</div>
      <div className="request-quote-container">
        
        <form onSubmit={handleSubmit} className="quote-form">

          {/* Personal Information Section */}
          <div className="section-header">
            <h2>Personal Information</h2>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleInputChange}
                placeholder="Enter phone number"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Product Type</label>
              <input
                type="text"
                name="product_type"
                value={formData.product_type}
                onChange={handleInputChange}
                placeholder="Enter product type"
                disabled={loading}
              />
            </div>
          </div>

          {/* Address Section */}
          <div className="section-header">
            <h2>Service Address Information</h2>
          </div>

          <div className="form-group">
            <label>Street Address</label>
            <input
              type="text"
              name="street"
              value={formData.street}
              onChange={handleInputChange}
              placeholder="Enter street address"
              required
              disabled={loading}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                placeholder="Enter city"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Province</label>
              <input
                type="text"
                name="province"
                value={formData.province}
                onChange={handleInputChange}
                placeholder="Enter province"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Postal Code</label>
              <input
                type="text"
                name="postal_code"
                value={formData.postal_code}
                onChange={handleInputChange}
                placeholder="Enter postal code"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Plumbing</label>
              <input
                type="text"
                name="plumbing"
                value={formData.plumbing}
                onChange={handleInputChange}
                placeholder="Enter plumbing details"
                disabled={loading}
              />
            </div>
          </div>

          {/* Service Details Section */}
          <div className="section-header">
            <h2>Service Details</h2>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Number of Zones</label>
              <input
                type="number"
                name="zones"
                value={formData.zones}
                onChange={handleInputChange}
                placeholder="Enter number of zones"
                min="0"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Lighting</label>
              <select
                id="lighting"
                name="lighting"
                value={formData.lighting}
                onChange={handleInputChange}
                disabled={loading}
              >
                <option value="">Select an option</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>EZ-FLO System</label>
              <select
                id="system"
                name="system"
                value={formData.system}
                onChange={handleInputChange}
                disabled={loading}
              >
                <option value="">Select an option</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>

            <div className="form-group">
              <label>WiFi</label>
              <select
                id="wifi"
                name="wifi"
                value={formData.wifi}
                onChange={handleInputChange}
                disabled={loading}
              >
                <option value="">Select an option</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Rain/Freeze Sensor</label>
              <select
                id="sensor"
                name="sensor"
                value={formData.sensor}
                onChange={handleInputChange}
                disabled={loading}
              >
                <option value="">Select an option</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
          </div>

          {/* Notes Section */}
          <div className="notes-section">
            <h2>Important Notes</h2>
            <p>WiFi is an option for an additional $200</p>
            <p>Rain/Freeze sensor is an option for an additional $180</p>
          </div>

          <button 
            type="submit" 
            className="submit-button"
            disabled={loading}
          >
            {loading ? "SUBMITTING..." : "REQUEST QUOTE"}
          </button>
          
          <div className="gst-notice">
            * GST NOT INCLUDED
          </div>
        </form>
      </div>

      {/* Popup Modal */}
      {showPopup && (
        <div className="popup-overlay">
          <div className={`popup-content ${popupMessage.type}`}>
            <p>{popupMessage.text}</p>
          </div>
        </div>
      )}
    </>
  );
}

export default RequestQuote;