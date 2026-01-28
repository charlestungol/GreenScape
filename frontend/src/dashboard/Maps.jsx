import { useState } from "react";
import "../App.css";
import AddLocationAltIcon from "@mui/icons-material/AddLocationAlt";

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
  const [showMap, setShowMap] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

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

  return (
    <>
      {/* Open Map Button */}
      <div className="mapsWrapper clickable" onClick={() => setShowMap(true)}>
        <AddLocationAltIcon
          style={{ fontSize: 40, color: "#06632b", marginTop: "30px" }}
        />
      </div>

      {/* MAP OVERLAY */}
      {showMap && (
        <div className="overlayMap">
          <div className="overlayMapContent">
            <h3>Select Service Location</h3>

            {/* SEARCH BAR */}
            <div className="mapSearch">
              <input
                type="text"
                placeholder="Search address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ flex: 1, padding: "8px" }}
              />
              <button className="closeMapBtn" onClick={handleSearch}>
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
              <p className="mapLocation">
                📍 Selected Location: {selectedAddress}
              </p>
            )}

            {/* ACTION BUTTONS */}
            <div className="mapButton" >
             <button
              className="closeMapBtn"
              disabled={!selectedPosition}
              onClick={() => {
                setShowMap(false);
              }}
            >
              Confirm Location
            </button>

              <button
                className="closeMapBtn"
                onClick={() => {
                  setSelectedPosition(null);
                  setSelectedAddress("");
                }}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Maps;
