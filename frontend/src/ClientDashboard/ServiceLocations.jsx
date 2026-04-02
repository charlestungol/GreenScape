import "../App.css";
import { useState, useEffect, useRef } from "react";
import AxiosInstance from "../../src/components/AxiosInstance";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import { CircularProgress } from "@mui/material";

function ServiceLocations() {
  const [showOverlay, setShowOverlay] = useState(false);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [deleteSuccess, setDeleteSuccess] = useState("");
  const modalContentRef = useRef(null);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const response = await AxiosInstance.get('core/service-locations/');
      
      let locationsArray = [];
      
      if (Array.isArray(response.data)) {
        locationsArray = response.data;
      } else if (response.data && typeof response.data === 'object') {
        if (Array.isArray(response.data.results)) {
          locationsArray = response.data.results;
        } else if (Array.isArray(response.data.data)) {
          locationsArray = response.data.data;
        } else {
          locationsArray = [response.data];
        }
      }
      
      setLocations(locationsArray);
      setError("");
    } catch (err) {
      console.error("Error fetching locations:", err);
      if (err.response?.status === 401) {
        setError("Please log in to view your locations");
      } else if (err.response?.status === 404) {
        setError("Location service not found");
      } else {
        setError("Failed to load locations. Please try again.");
      }
      setLocations([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteLocation = async (id) => {
    console.log("=== DELETE BUTTON CLICKED ===");
    console.log("Location ID to delete:", id);
    
    if (!window.confirm("Are you sure you want to delete this location?")) {
      return;
    }

    setDeletingId(id);
    setDeleteSuccess("");
    
    try {
      // Use servicelocationid in the URL
      const url = `core/service-locations/${id}/`;
      console.log("DELETE URL:", url);
      
      const response = await AxiosInstance.delete(url);
      console.log("Delete response status:", response.status);
      
      setDeleteSuccess("Location deleted successfully!");
      
      // Update local state by removing the deleted location
      const updatedLocations = locations.filter(location => {
        // Use servicelocationid to match the location
        return location.servicelocationid !== id;
      });
      
      setLocations(updatedLocations);
      console.log("Updated locations count:", updatedLocations.length);
      
      setTimeout(() => {
        setDeleteSuccess("");
      }, 3000);
      
    } catch (err) {
      console.error("=== DELETE ERROR ===");
      console.error("Status:", err.response?.status);
      console.error("Data:", err.response?.data);
      
      let errorMessage = "Failed to delete location. ";
      
      if (err.response?.status === 401) {
        errorMessage += "Please log in again.";
      } else if (err.response?.status === 403) {
        errorMessage += "You don't have permission to delete this location.";
      } else if (err.response?.status === 404) {
        errorMessage += `Location with ID ${id} not found.`;
        fetchLocations(); // Refresh the list
      } else if (err.response?.data?.detail) {
        errorMessage += err.response.data.detail;
      } else {
        errorMessage += "Please try again.";
      }
      
      alert(errorMessage);
    } finally {
      setDeletingId(null);
    }
  };

  const handleOverlayClick = (e) => {
    if (modalContentRef.current && !modalContentRef.current.contains(e.target)) {
      setShowOverlay(false);
    }
  };

  // Fetch locations when component mounts
  useEffect(() => {
    fetchLocations();
  }, []); 

  // Refresh locations when overlay opens
  useEffect(() => {
    if (showOverlay) {
      fetchLocations();
    }
  }, [showOverlay]);

  // Listen for locationAdded events from Maps component
  useEffect(() => {
    const handleLocationAdded = () => {
      console.log("New location added, refreshing...");
      fetchLocations();
    };
    
    window.addEventListener('locationAdded', handleLocationAdded);
    
    return () => {
      window.removeEventListener('locationAdded', handleLocationAdded);
    };
  }, []);

  // Listen for ESC key to close overlay
  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === 'Escape' && showOverlay) {
        setShowOverlay(false);
      }
    };

    if (showOverlay) {
      document.addEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'unset';
    };
  }, [showOverlay]);

  return (
    <>
      {/* Card - Click to open overlay */}
      <div className="service-locations-card clickable" onClick={() => setShowOverlay(true)}>
        <div className="service-locations-card-header">
          <p className="locationWrapper p">SERVICE LOCATIONS</p>
        </div>
        <div className="service-locations-card-content">
          <p className="locations-count">
            {locations.length}
          </p>
        </div>
      </div>

      {/* Overlay */}
      {showOverlay && (
        <div className="overlay" onClick={handleOverlayClick}>
          <div ref={modalContentRef} className="service-locations-overlay-content">
            {/* Header */}
            <div className="service-locations-header">
              <div className="header-title-section">
                <h2>My Service Locations</h2>
              </div>
              <button onClick={() => setShowOverlay(false)} className="close-overlay-button">
                <CloseIcon />
              </button>
            </div>

            {/* Success Message */}
            {deleteSuccess && (
              <div className="success-message">
                <span>{deleteSuccess}</span>
              </div>
            )}

            {/* Content */}
            <div className="service-locations-content">
              {loading ? (
                <div className="loading-container">
                  <CircularProgress size={40} style={{ color: "#1c3d37" }} />
                  <p>Loading your locations...</p>
                </div>
              ) : error ? (
                <div className="error-container">
                  <div className="error-message">
                    <span>⚠️ {error}</span>
                  </div>
                  <button onClick={fetchLocations} className="retry-button">
                    Try Again
                  </button>
                </div>
              ) : locations.length === 0 ? (
                <div className="empty-locations">
                  <p>No saved locations yet</p>
                  <p className="empty-subtext">Click the map icon to add your first service location</p>
                </div>
              ) : (
                <div className="locations-list">
                  {locations.map((location, index) => {
                    const locationId = location.servicelocationid;
                    const isDeleting = deletingId === locationId;
                    
                    return (
                      <div key={locationId || index} className="location-item">
                        <div className="location-details">
                          <p className="location-street">{location.street || "No street address"}</p>
                          <p className="location-city-province">
                            {location.city || ""}
                            {location.city && location.province ? ", " : ""}
                            {location.province || ""}
                          </p>
                          {location.postalcode && (
                            <p className="location-postal-code">{location.postalcode}</p>
                          )}
                        </div>
                        
                        <button
                          onClick={() => deleteLocation(locationId)}
                          className={`delete-location-btn ${isDeleting ? 'deleting' : ''}`}
                          disabled={isDeleting}
                        >
                          {isDeleting ? (
                            <>
                              <span className="spinner-small"></span>
                              Deleting...
                            </>
                          ) : (
                            <>
                              <DeleteIcon />
                              Delete
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="service-locations-footer">
              <button onClick={() => setShowOverlay(false)} className="close-footer-btn">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ServiceLocations;