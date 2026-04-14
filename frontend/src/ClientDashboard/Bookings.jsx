import { useState, useEffect, useCallback } from "react";
import "../components/clientCss/Dashboard.css";
import AxiosInstance from "../components/AxiosInstance";
import { useNavigate } from "react-router-dom";

function Bookings() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.body.classList.add("dashboard-open");
    return () => document.body.classList.remove("dashboard-open");
  }, []);
  
  // Helper function to check if booking is confirmed
  const isConfirmed = (status) => {
    return status?.toLowerCase() === "confirmed";
  };

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const bookingsResponse = await AxiosInstance.get("core/bookings/");

      let bookingsData = [];
      if (Array.isArray(bookingsResponse.data)) {
        bookingsData = bookingsResponse.data;
      } else if (bookingsResponse.data?.results) {
        bookingsData = bookingsResponse.data.results;
      }

      // Log one booking so we can see the shape of serviceid and status
      if (bookingsData.length > 0) {
        console.log("Booking sample:", bookingsData[0]);
        console.log("Status value:", bookingsData[0].status);
        console.log("All keys:", Object.keys(bookingsData[0]));
      }

      const enrichedBookings = bookingsData.map((booking) => ({
        ...booking,
        serviceDetails: booking.service,
        date: booking.appointmenttime ? new Date(booking.appointmenttime) : null,
        status: booking.status?.toLowerCase(),
      }));

      enrichedBookings.sort((a, b) => {
        if (!a.date) return 1;
        if (!b.date) return -1;
        return b.date - a.date;
      });

      setBookings(enrichedBookings);
      setError(null);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      setError("Failed to load your bookings. Please try again later.");

      if (error.response?.status === 401) {
        navigate("/client-login");
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const token = localStorage.getItem("access");
    const userId = localStorage.getItem("user_id");

    if (!token || !userId) {
      navigate("/client-login");
      return;
    }

    fetchBookings();
  }, [navigate, fetchBookings]);

  const closeModal = () => {
    setShowModal(false);
    setSelectedBooking(null);
  };

  const getStatusClass = (status) => {
    return isConfirmed(status)
      ? "bookings-status-confirmed"
      : "bookings-status-pending";
  };

  const getStatusIcon = (status) => {
    return status?.toLowerCase() === "confirmed" ? " " : " ";
  };

  const formatDate = (date) => {
    if (!date) return "Date not set";
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (datetime) => {
    if (!datetime) return "Time not set";
    return new Date(datetime).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="bookingsWrapper clickable">
        <div className="bookings-loading-container">
          <div className="bookings-loading-spinner"></div>
          <p className="bookings-loading-text">Loading bookings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bookingsWrapper clickable">
        <div className="bookings-error-container">
          <p className="bookings-error-message">{error}</p>
          <button onClick={fetchBookings} className="bookings-retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className="bookingsWrapper clickable"
        onClick={() => {
          if (bookings.length > 0) {
            setShowModal(true);
            setSelectedBooking(null);
          }
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p>MY BOOKINGS</p>
          <span className="booking-count-badge">{bookings.length}</span>
        </div>
      </div>

      {/* Bookings List Modal */}
      {showModal && (
        <div className="bookings-modal-overlay" onClick={closeModal}>
          <div className="bookings-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="bookings-modal-header">
              <h2>My Bookings</h2>
              <button className="bookings-close-btn" onClick={closeModal}>
                ×
              </button>
            </div>

            <div className="bookings-modal-body bookings-modal-body-scrollable">
              {bookings.length === 0 ? (
                <div className="bookings-empty-state">
                  <p>You don't have any bookings yet.</p>
                  <button
                    onClick={() => {
                      closeModal();
                      navigate("/booking");
                    }}
                    className="bookings-new-booking-btn"
                  >
                    Book an Appointment
                  </button>
                </div>
              ) : (
                <div className="bookings-list-container">
                  {bookings.map((booking) => (
                    <div
                      key={booking.bookingid}
                      className={`booking-list-item ${
                        selectedBooking?.bookingid === booking.bookingid
                          ? "booking-list-item-selected"
                          : ""
                      }`}
                      onClick={() => setSelectedBooking(booking)}
                    >
                      <div className="booking-list-header">
                        <div>
                          <h3 className="booking-list-title">
                            {booking.service?.title || "Unknown Service"}
                          </h3>
                          <div className="booking-list-datetime">
                            {formatDate(booking.date)} at {formatTime(booking.appointmenttime)}
                          </div>
                        </div>
                        <span className={`bookings-status-badge ${getStatusClass(booking.status)}`}>
                          {getStatusIcon(booking.status)} {booking.status || "Pending"}
                        </span>
                      </div>
                      <div className="booking-list-footer">
                        <div className="booking-list-price">
                          {booking.service?.baseprice
                            ? `$${booking.service.baseprice}`
                            : "Price unavailable"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bookings-modal-footer">
              {bookings.length > 0 && (
                <button onClick={() => navigate("/booking")} className="bookings-new-booking-btn">
                  New Booking
                </button>
              )}
              <button onClick={closeModal} className="bookings-cancel-modal-btn">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div
          className="bookings-modal-overlay"
          onClick={() => setSelectedBooking(null)}
        >
          <div
            className="bookings-modal-content bookings-modal-content-small"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bookings-modal-header">
              <h2>Booking Details</h2>
              <button
                className="bookings-close-btn"
                onClick={() => setSelectedBooking(null)}
              >
                ×
              </button>
            </div>

            <div className="bookings-modal-body">
              <div
                className={`bookings-status-large ${
                  isConfirmed(selectedBooking.status)
                    ? "bookings-status-large-confirmed"
                    : "bookings-status-large-pending"
                }`}
              >
                {getStatusIcon(selectedBooking.status)}
                {isConfirmed(selectedBooking.status)
                  ? "CONFIRMED"
                  : "PENDING CONFIRMATION"}
              </div>

              {!isConfirmed(selectedBooking.status) && (
                <div className="bookings-pending-notice">
                  <p>
                    Your booking is pending confirmation. We will notify you once it's confirmed.
                  </p>
                </div>
              )}

              <div className="bookings-detail-section">
                <h3>Service Information</h3>
                <div className="bookings-detail-grid">
                  <div className="bookings-detail-row">
                    <strong>Service:</strong>
                    <span>{selectedBooking.service?.title || "N/A"}</span>
                  </div>
                  <div className="bookings-detail-row">
                    <strong>Price:</strong>
                    <span>
                      {selectedBooking.service?.baseprice
                        ? `$${selectedBooking.service.baseprice}`
                        : "N/A"}
                    </span>
                  </div>
                  {selectedBooking.service?.duration && (
                    <div className="bookings-detail-row">
                      <strong>Duration:</strong>
                      <span>{selectedBooking.service.duration} minutes</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bookings-detail-section">
                <h3>Appointment Details</h3>
                <div className="bookings-detail-grid">
                  <div className="bookings-detail-row">
                    <strong>Date:</strong>
                    <span>{formatDate(selectedBooking.date)}</span>
                  </div>
                  <div className="bookings-detail-row">
                    <strong>Time:</strong>
                    <span>{formatTime(selectedBooking.appointmenttime)}</span>
                  </div>
                </div>
              </div>

              <div className="bookings-detail-section">
                <h3>Contact Information</h3>
                <div className="bookings-detail-grid">
                  <div className="bookings-detail-row">
                    <strong>Email:</strong>
                    <span>{selectedBooking.email || "N/A"}</span>
                  </div>
                  <div className="bookings-detail-row">
                    <strong>Phone:</strong>
                    <span>{selectedBooking.phonenum || "N/A"}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bookings-modal-footer bookings-modal-footer-end">
              <button
                onClick={() => setSelectedBooking(null)}
                className="bookings-close-modal-btn"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Bookings;