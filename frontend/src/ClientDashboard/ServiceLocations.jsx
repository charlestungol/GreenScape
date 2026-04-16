import "../App.css";
import { useState, useEffect, useRef } from "react";
import AxiosInstance from "../../src/components/AxiosInstance";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import { CircularProgress } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import {
  USE_MOCK_DASHBOARD,
  mockLocations,
  mockLocationServices,
} from "../mock/dashboardMockData";

function ServiceLocations() {
  const [showOverlay, setShowOverlay] = useState(false);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [deleteSuccess, setDeleteSuccess] = useState("");
  const [expandedLocation, setExpandedLocation] = useState(null);
  const [locationServices, setLocationServices] = useState({});
  const [loadingServices, setLoadingServices] = useState({});
  const modalContentRef = useRef(null);

  const fetchLocations = async () => {
    if (USE_MOCK_DASHBOARD) {
      setLocations(mockLocations);
      setError("");
      setLoading(false);
      return;
    }
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

  const fetchServicesForLocation = async (locationId) => {
    if (USE_MOCK_DASHBOARD) {
      if (expandedLocation === locationId) {
        setExpandedLocation(null);
        return;
      }

      setLocationServices((prev) => ({
        ...prev,
        [locationId]: mockLocationServices[locationId] || [],
      }));
      setExpandedLocation(locationId);
      return;
    }
    // If already expanded, just collapse
    if (expandedLocation === locationId) {
      setExpandedLocation(null);
      return;
    }
    
    // If services are already loaded, just expand
    if (locationServices[locationId]) {
      setExpandedLocation(locationId);
      return;
    }
    
    // Fetch services
    setLoadingServices(prev => ({ ...prev, [locationId]: true }));
    
    try {
      const response = await AxiosInstance.get(`core/service-locations/${locationId}/services/`);
      const services = response.data || [];
      
      setLocationServices(prev => ({ ...prev, [locationId]: services }));
      setExpandedLocation(locationId);
    } catch (err) {
      console.error("Error fetching services:", err);
      setLocationServices(prev => ({ ...prev, [locationId]: [] }));
      
      // Show error message
      alert("Failed to load services for this location. Please try again.");
    } finally {
      setLoadingServices(prev => ({ ...prev, [locationId]: false }));
    }
  };

  const deleteLocation = async (id) => {
    if (!window.confirm("Are you sure you want to delete this location?")) {
      return;
    }

    setDeletingId(id);
    setDeleteSuccess("");
    
    try {
      const url = `core/service-locations/${id}/`;
      await AxiosInstance.delete(url);
      
      setDeleteSuccess("Location deleted successfully!");
      
      const updatedLocations = locations.filter(location => {
        return location.servicelocationid !== id;
      });
      
      setLocations(updatedLocations);
      
      // Clean up services for deleted location
      setLocationServices(prev => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
      
      // If expanded location was deleted, close expansion
      if (expandedLocation === id) {
        setExpandedLocation(null);
      }
      
      setTimeout(() => {
        setDeleteSuccess("");
      }, 3000);
      
    } catch (err) {
      console.error("Delete error:", err);
      let errorMessage = "Failed to delete location. ";
      
      if (err.response?.status === 401) {
        errorMessage += "Please log in again.";
      } else if (err.response?.status === 403) {
        errorMessage += "You don't have permission to delete this location.";
      } else if (err.response?.status === 404) {
        errorMessage += `Location not found.`;
        fetchLocations();
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

  // Refresh locations when overlay opens
  useEffect(() => {
    fetchLocations();
  }, []); 

  useEffect(() => {
    if (showOverlay) {
      fetchLocations();
    }
  }, [showOverlay]);

  // Listen for locationAdded events
  useEffect(() => {
    const handleLocationAdded = () => {
      fetchLocations();
    };
    
    window.addEventListener('locationAdded', handleLocationAdded);
    
    return () => {
      window.removeEventListener('locationAdded', handleLocationAdded);
    };
  }, []);

  // Listen for servicesUpdated events to refresh services when new services are added
  useEffect(() => {
    const handleServicesUpdated = () => {
      // Clear cached services for all locations to force refresh
      setLocationServices({});
      // If a location is expanded, refresh its services
      if (expandedLocation) {
        fetchServicesForLocation(expandedLocation);
      }
    };
    
    window.addEventListener('servicesUpdated', handleServicesUpdated);
    
    return () => {
      window.removeEventListener('servicesUpdated', handleServicesUpdated);
    };
  }, [expandedLocation]); // Re-run when expandedLocation changes

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

  const formatCurrency = (amount) => {
    if (!amount) return "N/A";
    return `$${parseFloat(amount).toLocaleString()}`;
  };

  return (
    <>
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

      {showOverlay && (
        <div className="overlay" onClick={handleOverlayClick}>
          <div ref={modalContentRef} className="service-locations-overlay-content">
            <div className="service-locations-header">
              <div className="header-title-section">
                <h2>My Service Locations</h2>
              </div>
              <button onClick={() => setShowOverlay(false)} className="close-overlay-button">
                <CloseIcon />
              </button>
            </div>

            {deleteSuccess && (
              <div className="success-message">
                <span>{deleteSuccess}</span>
              </div>
            )}

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
                    const isExpanded = expandedLocation === locationId;
                    const services = locationServices[locationId] || [];
                    const isLoadingServices = loadingServices[locationId];
                    
                    return (
                      <div key={locationId || index} className="location-item-wrapper">
                        <div className="location-item">
                          <div className="location-main-info">
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
                            
                            <div className="location-actions">
                              <button
                                onClick={() => fetchServicesForLocation(locationId)}
                                className="view-services-btn"
                              >
                                {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                {isExpanded ? "Hide Services" : "View Services"}
                              </button>
                              
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
                          </div>
                          
                          {isExpanded && (
                            <div className="location-services-section">
                              <h4>Services at this location</h4>
                              {isLoadingServices ? (
                                <div className="loading-services">
                                  <CircularProgress size={24} />
                                  <p>Loading services...</p>
                                </div>
                              ) : services.length === 0 ? (
                                <p className="no-services">No services found for this location</p>
                              ) : (
                                <div className="services-list">
                                  {services.map((service) => (
                                    <div key={service.id} className="service-item">
                                      <div className="service-title">
                                        <strong>{service.title || "Service"}</strong>
                                        {service.completed && (
                                          <span className="completed-badge">Completed</span>
                                        )}
                                      </div>
                                      
                                      {service.description && (
                                        <p className="service-description">{service.description}</p>
                                      )}
                                      
                                      <div className="service-meta">
                                        {service.base_price && (
                                          <span className="service-price">
                                            Price: {formatCurrency(service.base_price)}
                                          </span>
                                        )}
                                        {service.red_year && (
                                          <span>Year: {service.red_year}</span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

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