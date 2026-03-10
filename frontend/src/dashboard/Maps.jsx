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
  const navigate = useNavigate(); // Initialize navigation
  const [showMap, setShowMap] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isConfirming, setIsConfirming] = useState(false); // Loading state
  const [showSuccess, setShowSuccess] = useState(false); // Success message

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
    
    // Simulate API call to save location
    try {
      // You can save the location to your backend here
      // await saveUserLocation(selectedPosition, selectedAddress);
      
      // Show success message
      setShowSuccess(true);
      
      // Wait 1.5 seconds then navigate to services page
      setTimeout(() => {
        setShowMap(false);
        setShowSuccess(false);
        setIsConfirming(false);
        
        // Navigate to services page with the location data
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
    if (isConfirming) return; // Prevent closing while confirming
    
    // Reset all states when closing
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
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center",
              marginBottom: "15px"
            }}>
              <h3 style={{ margin: 0 }}>Select Service Location</h3>
              <button
                onClick={handleCloseMap}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "5px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "50%",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f0f0f0";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
                disabled={isConfirming}
              >
                <CloseIcon style={{ fontSize: 24, color: "#666" }} />
              </button>
            </div>

            {/* SEARCH BAR */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "15px" }}>
              <input
                type="text"
                placeholder="Search address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                style={{ 
                  flex: 1, 
                  padding: "10px",
                  borderRadius: "8px",
                  border: "2px solid #ddd",
                  fontSize: "14px"
                }}
                disabled={isConfirming}
              />
              <button 
                className="closeMapBtn" 
                onClick={handleSearch}
                style={{ 
                  padding: "10px 20px",
                  background: "#1c3d37",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer"
                }}
                disabled={isConfirming}
              >
                Search
              </button>
            </div>

            {/* MAP */}
            <MapContainer
              center={defaultCenter}
              zoom={13}
              style={{
                height: "320px",
                width: "100%",
                borderRadius: "10px",
                marginBottom: "15px",
                opacity: isConfirming ? 0.7 : 1,
                pointerEvents: isConfirming ? "none" : "auto"
              }}
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
              <div style={{
                padding: "12px",
                background: "#e8f5e9",
                borderRadius: "8px",
                marginBottom: "15px"
              }}>
                <p className="mapLocation" style={{ margin: 0, color: "#2e7d32" }}>
                  📍 {selectedAddress}
                </p>
              </div>
            )}

            {/* SUCCESS MESSAGE */}
            {showSuccess && (
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "12px",
                background: "#4caf50",
                color: "white",
                borderRadius: "8px",
                marginBottom: "15px",
                animation: "fadeIn 0.3s ease"
              }}>
                <CheckCircleIcon />
                <span>Location confirmed! Redirecting to services...</span>
              </div>
            )}

            {/* ACTION BUTTONS */}
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                style={{
                  flex: 2,
                  padding: "12px",
                  background: selectedPosition && !isConfirming ? "#1c3d37" : "#ccc",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: selectedPosition && !isConfirming ? "pointer" : "not-allowed",
                  transition: "all 0.2s ease",
                  opacity: isConfirming ? 0.7 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px"
                }}
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
                style={{
                  flex: 1,
                  padding: "12px",
                  background: "#f5f5f5",
                  color: "#666",
                  border: "2px solid #ddd",
                  borderRadius: "8px",
                  cursor: isConfirming ? "not-allowed" : "pointer",
                  transition: "all 0.2s ease",
                  opacity: isConfirming ? 0.5 : 1
                }}
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
            <div style={{ textAlign: "center", marginTop: "15px" }}>
              <button
                onClick={handleCloseMap}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#666",
                  textDecoration: "underline",
                  cursor: isConfirming ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  opacity: isConfirming ? 0.5 : 1
                }}
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