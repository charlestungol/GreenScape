import { useState } from "react";
import "../App.css";

function FinishedServices() {
  const [open, setOpen] = useState(false);

  const services = [
    "Landscape Lighting",
    "Maintenance Service"
  ];

  const completedCount = services.length;

  return (
    <>
      <div
        className="runningWrapper clickable"
        onClick={() => setOpen(true)}
      >
        <p>RUNNING SERVICES</p>
        <p>{completedCount}</p>
      </div>

      {open && (
        <div className="overlay" onClick={() => setOpen(false)}>
          <div
            className="overlayContent"
            onClick={(e) => e.stopPropagation()} e
          >
            <h2>In-Progress</h2>
            {services.map((service, index) => (
              <p key={index} className="modalItem">
                {service}
              </p>
            ))}

            <button className="closeBtn" onClick={() => setOpen(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default FinishedServices;
