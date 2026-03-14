import { useState } from "react";
import { useNavigate } from "react-router-dom"; 
import "../components/clientCss/Dashboard.css";
import AddLocationAltIcon from "@mui/icons-material/AddLocationAlt";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle"; 

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

/* ================= MAIN COMPONENT ================= */
function Maps() {
  const navigate = useNavigate();
  const [showMap, setShowMap] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

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
    if (!selectedPosition) return;
    
    setIsConfirming(true);
    
    try {
      setShowSuccess(true);
      
      setTimeout(() => {
        setShowMap(false);
        setShowSuccess(false);
        setIsConfirming(false);
        
        navigate("/services", {
          state: {
            location: {
              position: selectedPosition,
              address: selectedAddress
            }
          }
        });
      }, 1500);
      
    } catch (error) {
      console.error("Error saving location:", error);
      setIsConfirming(false);
      alert("Failed to save location. Please try again.");
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

            {/* SUCCESS MESSAGE */}
            {showSuccess && (
              <div className="success-message">
                <CheckCircleIcon />
                <span>Location confirmed! Redirecting to services...</span>
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
                    Confirming...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon />
                    Confirm Location & Continue
                  </>
                )}
              </button>

              <button
                className={`reset-button ${isConfirming ? 'disabled' : ''}`}
                onClick={() => {
                  setSelectedPosition(null);
                  setSelectedAddress("");
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