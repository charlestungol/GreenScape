import { useState, useEffect } from "react";
import "../components/clientCss/Dashboard.css";
import AddLocationAltIcon from "@mui/icons-material/AddLocationAlt";
import CloseIcon from "@mui/icons-material/Close";
import AxiosInstance from "../../src/components/AxiosInstance"; 

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

/* ================= MAP CLICK HANDLER ================= */
function LocationPicker({ setSelectedPosition, setSelectedAddress }) {
  useMapEvents({
    click(e) {
      const pos = e.latlng;
      setSelectedPosition(pos);
      fetchAddress(pos.lat, pos.lng, setSelectedAddress);
    },
  });
  return null;
}

/* ================= REVERSE GEOCODING ================= */
const fetchAddress = async (lat, lng, setSelectedAddress) => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
    );
    const data = await res.json();
    if (data && data.display_name) {
      setSelectedAddress(data.display_name);
    } else {
      setSelectedAddress("Address not found");
    }
  } catch (err) {
    console.error("Reverse geocoding failed", err);
    setSelectedAddress("Error fetching address");
  }
};

/* ================= PARSE ADDRESS FUNCTION ================= */
const parseAddress = (fullAddress) => {
  console.log("Parsing full address:", fullAddress);
  
  let parts = fullAddress.split(',').map(part => part.trim());
  console.log("All parts:", parts);
  if (parts[parts.length - 1].toLowerCase() === "canada") {
    parts.pop();
  }
  
  let street = "";
  let city = "";
  let province = "";
  let postalcode = "";
  
  const lastPart = parts[parts.length - 1];
  const postalMatch = lastPart.match(/[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d/);
  
  if (postalMatch) {
    postalcode = postalMatch[0].replace(/\s+/g, ' ').trim().toUpperCase();
    parts.pop(); 
    
    if (parts.length > 0) {
      province = parts.pop() || "";
    }

    if (parts.length > 0) {
      city = parts.pop() || "";
    }
    street = parts.join(', ');
  } else {
    const provinces = ["alberta", "british columbia", "ontario", "quebec", "manitoba", 
                       "saskatchewan", "nova scotia", "new brunswick", "newfoundland", 
                       "prince edward island", "northwest territories", "yukon", "nunavut"];
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i].toLowerCase();
      if (provinces.some(prov => part.includes(prov))) {
        province = parts[i];
        if (i > 0) {
          city = parts[i - 1];
        }
        street = parts.slice(0, i - 1).join(', ');
        break;
      }
    }
  }
  street = street.replace(/\s+/g, ' ').trim();
  city = city.replace(/\s+/g, ' ').trim();
  province = province.replace(/\s+/g, ' ').trim();
  if (!city && parts.length > 1) {
    city = parts[parts.length - 2] || "";
  }
  if (!province && parts.length > 0) {
    province = parts[parts.length - 1] || "";
  }
  
  const result = { street, city, province, postalcode };
  console.log("Final parsed result:", result);
  
  return result;
};

/* ================= SERVICE SELECTION MODAL ================= */
function ServiceSelectionModal({ isOpen, onClose, onConfirm, locationId }) {
  const [availableServices, setAvailableServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchAvailableServices();
    }
  }, [isOpen]);

  const fetchAvailableServices = async () => {
    setLoading(true);
    try {
      const response = await AxiosInstance.get('core/services/');
      const services = Array.isArray(response.data) ? response.data : response.data.results || [];
      setAvailableServices(services);
    } catch (err) {
      console.error("Error fetching services:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleService = (serviceId) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleConfirm = async () => {
    if (selectedServices.length > 0) {
      setSaving(true);
      try {
        await onConfirm(locationId, selectedServices);
        onClose();
      } catch (err) {
        console.error("Error confirming services:", err);
      } finally {
        setSaving(false);
      }
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="overlay">
      <div className="service-selection-modal">
        <div className="modal-header">
          <h3>Select Services for This Location</h3>
          <button onClick={onClose} className="close-button" disabled={saving}>
            <CloseIcon />
          </button>
        </div>
        
        <div className="modal-content">
          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading services...</p>
            </div>
          ) : availableServices.length === 0 ? (
            <p className="no-services">No services available</p>
          ) : (
            <div className="services-list">
              {availableServices.map(service => (
                <div 
                  key={service.serviceid} 
                  className={`service-item ${selectedServices.includes(service.serviceid) ? 'selected' : ''}`}
                  onClick={() => !saving && toggleService(service.serviceid)}
                >
                  <div className="service-checkbox">
                    {selectedServices.includes(service.serviceid) && <span>✓</span>}
                  </div>
                  <div className="service-info">
                    <div className="service-title">{service.title}</div>
                    <div className="service-description">{service.description}</div>
                    <div className="service-price">${service.baseprice}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="modal-footer">
          <button 
            className="confirm-button" 
            onClick={handleConfirm}
            disabled={selectedServices.length === 0 || saving}
          >
            {saving ? (
              <>
                <span className="spinner-small"></span>
                Adding...
              </>
            ) : (
              `Add Selected Services (${selectedServices.length})`
            )}
          </button>
          <button className="skip-button" onClick={onClose} disabled={saving}>
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================= MAIN COMPONENT ================= */
function Maps() {
  const [showMap, setShowMap] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState("");
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [savedLocationId, setSavedLocationId] = useState(null);

  const defaultCenter = [51.0447, -114.0719]; // Calgary

  /* ================= LOCATION SEARCH ================= */
  const handleSearch = async () => {
    if (!searchQuery) return;

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}`
      );
      const data = await res.json();

      if (data.length > 0) {
        const pos = {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        };
        setSelectedPosition(pos);
        fetchAddress(pos.lat, pos.lng, setSelectedAddress);
      } else {
        alert("Location not found.");
      }
    } catch (err) {
      console.error("Search failed", err);
    }
  };

  /* ================= SAVE LOCATION SERVICES ================= */
  const saveLocationServices = async (locationId, serviceIds) => {
  console.log("Saving services for location ID:", locationId);
  console.log("Service IDs:", serviceIds);
  
  try {
    // Get today's date
    const today = new Date();
    const reqDate = today.toISOString().split('T')[0];
    const redYear = today.getFullYear().toString();
    
    // Create customer service entries for each selected service
    const promises = serviceIds.map(async (serviceId) => {
      const serviceData = {
        serviceid: serviceId,
        reqdate: reqDate,
        redyear: redYear,
        completed: false
      };
      console.log("Creating customer service with data:", serviceData);
      
      const customerServiceResponse = await AxiosInstance.post('core/customer-services/', serviceData);
      console.log("Customer service response:", customerServiceResponse.data);
      
      // IMPORTANT: Check the correct field name for the ID
      // The response might have 'customerserviceid' or 'id' or 'customerServiceId'
      let customerServiceId = customerServiceResponse.data.customerserviceid;
      if (!customerServiceId) {
        customerServiceId = customerServiceResponse.data.id;
      }
      if (!customerServiceId) {
        customerServiceId = customerServiceResponse.data.CustomerServiceId;
      }
      
      console.log("Extracted customer service ID:", customerServiceId);
      
      if (!customerServiceId) {
        throw new Error("Could not get customer service ID from response");
      }
      
      // Then link it to the location
      const linkData = {
        customerserviceid: customerServiceId
      };
      console.log("Linking service to location with data:", linkData);
      
      const linkResponse = await AxiosInstance.post(`core/service-locations/${locationId}/link-service/`, linkData);
      console.log("Link response:", linkResponse.data);
      
      return linkResponse;
    });
    
    const results = await Promise.all(promises);
    console.log("All services saved and linked successfully:", results);
    
    // Dispatch event to refresh services
    window.dispatchEvent(new CustomEvent('servicesUpdated'));
    
    alert(`Successfully added ${serviceIds.length} service(s) to this location!`);
    
  } catch (err) {
    console.error("=== ERROR SAVING SERVICES ===");
    console.error("Error:", err);
    console.error("Error response:", err.response?.data);
    
    let errorMessage = "Failed to save services: ";
    
    if (err.response?.data?.error) {
      errorMessage += err.response.data.error;
    } else if (err.response?.data?.detail) {
      errorMessage += err.response.data.detail;
    } else if (err.message) {
      errorMessage += err.message;
    } else {
      errorMessage += "Please try again.";
    }
    
    alert(errorMessage);
    throw err;
  }
};
  /* ================= HANDLE LOCATION CONFIRMATION ================= */
  const handleConfirmLocation = async () => {
    if (!selectedPosition || !selectedAddress) return;
    
    setIsConfirming(true);
    setError("");
    
    try {
      const { street, city, province, postalcode } = parseAddress(selectedAddress);
      
      const locationData = {
        street: street,
        city: city,
        province: province,
        postalcode: postalcode
      };

      console.log("Saving location:", locationData);
      
      const response = await AxiosInstance.post('core/service-locations/', locationData);
      const savedLocation = response.data;
      const newLocationId = savedLocation.servicelocationid;
      
      console.log("Location saved with ID:", newLocationId);
      console.log("Location customer:", savedLocation.customerid);
      
      setSavedLocationId(newLocationId);
      
      // Dispatch event to notify ServiceLocations component
      window.dispatchEvent(new CustomEvent('locationAdded'));
      
      setShowSuccess(true);
      
      // Close map and show service selection modal
      setTimeout(() => {
        setShowMap(false);
        setSelectedPosition(null);
        setSelectedAddress("");
        setSearchQuery("");
        setShowSuccess(false);
        setIsConfirming(false);
        
        // Open service selection modal
        setShowServiceModal(true);
      }, 1500);
      
    } catch (err) {
      console.error("Error saving location:", err);
      
      if (err.response) {
        if (err.response.status === 401) {
          setError("Please log in to save locations");
        } else if (err.response.status === 400) {
          const errors = err.response.data;
          let errorMsg = "Validation error:\n";
          Object.entries(errors).forEach(([key, val]) => {
            errorMsg += `- ${key}: ${Array.isArray(val) ? val.join(', ') : val}\n`;
          });
          setError(errorMsg);
        } else {
          setError("Failed to save location. Please try again.");
        }
      } else {
        setError("Network error. Please check your connection.");
      }
      
      setIsConfirming(false);
    }
  };

  /* ================= HANDLE SERVICE CONFIRMATION ================= */
  const handleServiceConfirm = async (locationId, selectedServices) => {
    await saveLocationServices(locationId, selectedServices);
    setShowServiceModal(false);
    setSavedLocationId(null);
  };

  /* ================= CLOSE MAP ================= */
  const handleCloseMap = () => {
    if (isConfirming) return;
    
    setShowMap(false);
    setSelectedPosition(null);
    setSelectedAddress("");
    setSearchQuery("");
    setShowSuccess(false);
    setError("");
  };

  return (
    <>
      {/* Open Map Button */}
      <div className="mapsWrapper clickable" onClick={() => setShowMap(true)}>
        <AddLocationAltIcon
          style={{ fontSize: 40, color: "#1c3d37", marginTop: "30px" }}
        />
      </div>

      {/* MAP OVERLAY */}
      {showMap && (
        <div className="overlayMap">
          <div className="overlayMapContent">
            {/* Header with Title and Close Button */}
            <div className="map-header">
              <h3 className="map-title">Select Service Location</h3>
              <button
                onClick={handleCloseMap}
                className="close-button"
                disabled={isConfirming}
              >
                <CloseIcon className="close-icon" />
              </button>
            </div>

            {/* SEARCH BAR */}
            <div className="search-container">
              <input
                type="text"
                placeholder="Search address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="search-input"
                disabled={isConfirming}
              />
              <button 
                className="search-button" 
                onClick={handleSearch}
                disabled={isConfirming}
              >
                Search
              </button>
            </div>

            {/* MAP */}
            <MapContainer
              center={defaultCenter}
              zoom={13}
              className={`map-container ${isConfirming ? 'disabled' : ''}`}
            >
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <LocationPicker
                setSelectedPosition={setSelectedPosition}
                setSelectedAddress={setSelectedAddress}
              />

              {selectedPosition && (
                <Marker position={selectedPosition}>
                  <Popup>{selectedAddress || "Fetching address..."}</Popup>
                </Marker>
              )}
            </MapContainer>

            {/* SELECTED LOCATION DISPLAY */}
            {selectedAddress && (
              <div className="location-display">
                <p className="location-text">
                  {selectedAddress}
                </p>
              </div>
            )}

            {/* ERROR MESSAGE */}
            {error && (
              <div className="error-message">
                ⚠️ {error}
              </div>
            )}

            {/* SUCCESS MESSAGE */}
            {showSuccess && (
              <div className="success-message">
                <span>✓ Location saved successfully!</span>
              </div>
            )}

            {/* ACTION BUTTONS */}
            <div className="action-buttons">
              <button
                className={`confirm-button ${(!selectedPosition || isConfirming) ? 'disabled' : ''}`}
                disabled={!selectedPosition || isConfirming}
                onClick={handleConfirmLocation}
              >
                {isConfirming ? (
                  <>
                    <span className="spinner"></span>
                    Saving...
                  </>
                ) : (
                  "Save Location"
                )}
              </button>

              <button
                className={`reset-button ${isConfirming ? 'disabled' : ''}`}
                onClick={() => {
                  setSelectedPosition(null);
                  setSelectedAddress("");
                  setError("");
                }}
                disabled={isConfirming}
              >
                Reset
              </button>
            </div>

            {/* Close link at bottom */}
            <div className="close-link-container">
              <button
                onClick={handleCloseMap}
                className={`close-link ${isConfirming ? 'disabled' : ''}`}
                disabled={isConfirming}
              >
                Close without saving
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Service Selection Modal */}
      <ServiceSelectionModal
        isOpen={showServiceModal}
        onClose={() => setShowServiceModal(false)}
        onConfirm={handleServiceConfirm}
        locationId={savedLocationId}
      />
    </>
  );
}

export default Maps;