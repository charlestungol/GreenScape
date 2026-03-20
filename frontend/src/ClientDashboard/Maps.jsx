import { useState } from "react";
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

/* ================= MAIN COMPONENT ================= */
function Maps() {
  const [showMap, setShowMap] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState("");

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

  /* ================= HANDLE LOCATION CONFIRMATION ================= */
  const handleConfirmLocation = async () => {
    if (!selectedPosition || !selectedAddress) return;
    
    setIsConfirming(true);
    setError("");
    
    try {
      // Parse the address into components
      const { street, city, province, postalcode } = parseAddress(selectedAddress);
      
      // Get user info from localStorage
      const firstName = localStorage.getItem('first_name') || '';
      const lastName = localStorage.getItem('last_name') || '';
      const userName = `${firstName} ${lastName}`.trim() || 'Customer';
      
      // Prepare the location data
      const locationData = {
        name: userName,
        street: street,
        city: city,
        province: province,
        postalcode: postalcode
      };

      console.log("Saving location:", locationData);
      
      // Send to your ServiceLocation API
      const response = await AxiosInstance.post('core/service-locations/', locationData);
      
      console.log("Location saved successfully:", response.data);
      
      // Show success message
      setShowSuccess(true);
      
      // Close after 2 seconds
      setTimeout(() => {
        setShowMap(false);
        setSelectedPosition(null);
        setSelectedAddress("");
        setSearchQuery("");
        setShowSuccess(false);
        setIsConfirming(false);
      }, 2000);
      
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
                  📍 {selectedAddress}
                </p>
              </div>
            )}

            {/* ERROR MESSAGE */}
            {error && (
              <div className="error-message">
                s {error}
              </div>
            )}

            {/* SUCCESS MESSAGE */}
            {showSuccess && (
              <div className="success-message">
                <span>Location saved successfully!</span>
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
    </>
  );
}

export default Maps;