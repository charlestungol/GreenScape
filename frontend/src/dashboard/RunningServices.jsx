import { useState, useEffect } from "react";
import "../App.css";

function RunningServices() {
  const [open, setOpen] = useState(false);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true); // optional, shows loading state

  useEffect(() => {
    // Replace this with your API call later
    async function fetchServices() {
      try {
        setLoading(true);
        // Example API call:
        // const response = await fetch("YOUR_API_ENDPOINT");
        // const data = await response.json();

        // For now, using static data as placeholder
        const data = ["Landscape Lighting", "Maintenance Service"];
        setServices(data);
      } catch (error) {
        console.error("Failed to fetch services:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchServices();
  }, []); // empty dependency array means it runs once on mount

  const completedCount = services.length;

  return (
    <>
      <div className="runningWrapper clickable" onClick={() => setOpen(true)}>
        <p>RUNNING SERVICES</p>
        <p>{completedCount}</p>
      </div>

      {open && (
        <div className="overlay" onClick={() => setOpen(false)}>
          <div
            className="overlayContent"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>In-Progress</h2>

            {loading ? (
              <p>Loading services...</p>
            ) : services.length > 0 ? (
              services.map((service, index) => (
                <p key={index} className="modalItem">
                  {service}
                </p>
              ))
            ) : (
              <p>No services in progress</p>
            )}

            <button className="closeBtn" onClick={() => setOpen(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default RunningServices;
