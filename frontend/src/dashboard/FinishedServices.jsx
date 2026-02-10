import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import "../App.css";

/* TEMP: mock fetch (replace with real API later) */
const fetchFinishedServices = async () => {
  // Later:
  // const res = await fetch("/api/services");
  // return res.json();

  return [
    { id: 1, name: "Landscape Lighting", status: "completed" },
    { id: 2, name: "Maintenance Service", status: "completed" },
    { id: 3, name: "Stormwater Management", status: "completed" },
  ];
};

function FinishedServices() {
  const [open, setOpen] = useState(false);

  const {
    data: services = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["finishedServices"],
    queryFn: fetchFinishedServices,
  });

  const completedServices = services.filter(
    (s) => s.status === "completed"
  );

  return (
    <>
      <div
        className="finishedWrapper clickable"
        onClick={() => setOpen(true)}
      >
        <p>FINISHED SERVICES</p>
        <p>{isLoading ? "—" : completedServices.length}</p>
      </div>

      {open && (
        <div className="overlay" onClick={() => setOpen(false)}>
          <div
            className="overlayContent"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Completed Services</h2>

            {error && <p className="error">Failed to load services</p>}
            {isLoading && <p>Loading…</p>}

            {completedServices.map((service) => (
              <p key={service.id} className="modalItem">
                {service.name}
              </p>
            ))}

            <button
              className="closeBtn"
              onClick={() => setOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default FinishedServices;
