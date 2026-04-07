import { useState, useEffect, useRef } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "../../components/clientCss/Booking.css";
import AxiosInstance from "../../components/AxiosInstance";
import { useNavigate } from "react-router-dom";

const Booking = () => {
  const navigate = useNavigate();
  const [date, setDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);
  const [services, setServices] = useState([]);
  const [customers, setCustomers] = useState(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState({ type: "", text: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [blockedSlots, setBlockedSlots] = useState([]);

  const submitLock = useRef(false);
  const availabilityInterval = useRef(null);

  const [formData, setFormData] = useState({
    fullName: "",
    address: "",
    phone: "",
    email: "",
    service: "",
    time: "",
  });

  const timeSlots = [
    "9:00 AM",
    "10:00 AM",
    "11:00 AM",
    "1:00 PM",
    "2:00 PM",
    "3:00 PM",
    "4:00 PM",
  ];

  // ─── helpers ────────────────────────────────────────────────────────────────

  const showMessage = (type, text, duration = 3000) => {
    setPopupMessage({ type, text });
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), duration);
  };

  const resetSubmitState = () => {
    setLoading(false);
    setIsSubmitting(false);
    submitLock.current = false;
  };

  const formatPhoneNumber = (value) => {
    const phoneNumber = value.replace(/\D/g, "");
    if (phoneNumber.length <= 3) return phoneNumber;
    if (phoneNumber.length <= 6)
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
  };

  const cleanPhoneNumber = (phone) => phone.replace(/\D/g, "");

  const convertTo24Hour = (timeStr) => {
    const [time, modifier] = timeStr.split(" ");
    let [hours, minutes] = time.split(":");
    if (modifier === "PM" && hours !== "12") hours = parseInt(hours, 10) + 12;
    if (modifier === "AM" && hours === "12") hours = "00";
    return `${String(hours).padStart(2, "0")}:${minutes}:00`;
  };

  const formatDateParam = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const timeStringFromUTC = (utcString) => {
    const dt = new Date(utcString);
    const h = dt.getHours();
    const m = dt.getMinutes();
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
  };

  const getServiceTitle = (serviceId) => {
    if (!Array.isArray(services)) return "Selected";
    const service = services.find((s) => s?.serviceid === parseInt(serviceId));
    return service?.title || "Selected";
  };

  // ─── data loading ────────────────────────────────────────────────────────────

  const loadUserData = async () => {
    try {
      const response = await AxiosInstance.get("core/customers/me/");
      setCustomers(response.data);
      setFormData((prev) => ({
        ...prev,
        fullName: `${response.data.firstname || ""} ${response.data.lastname || ""}`.trim(),
        email: response.data.email || "",
        phone: response.data.phonenumber || "",
        address: response.data.addressid?.street || "",
      }));
    } catch (error) {
      console.error("Error loading customer:", error);
    }
  };

  const loadServices = async () => {
    setLoadingServices(true);
    try {
      const response = await AxiosInstance.get("core/services/");
      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.results ?? [];
      setServices(data);
    } catch (error) {
      console.error("Error loading services:", error);
      showMessage("error", "Failed to load services. Please refresh the page.");
    } finally {
      setLoadingServices(false);
    }
  };

  // ─── availability (uses /core/bookings/) ─────────────────────────────────────

  /**
   * Fetch booked time slots for a given date + service from the bookings endpoint.
   * Returns an array of time-label strings, e.g. ["9:00 AM", "2:00 PM"]
   */
  const getBookedSlots = async (selectedDate, selectedService) => {
    if (!selectedDate || !selectedService) return [];
    try {
      const response = await AxiosInstance.get("core/bookings/", {
        params: {
          date: formatDateParam(selectedDate),
          service: selectedService,
        },
      });

      const bookings = Array.isArray(response.data)
        ? response.data
        : response.data?.results ?? [];

      return bookings
        .map((b) => (b.appointmenttime ? timeStringFromUTC(b.appointmenttime) : null))
        .filter(Boolean);
    } catch (error) {
      console.error("Error fetching booked slots:", error);
      return [];
    }
  };

  const checkAvailability = async (selectedDate = date, selectedService = formData.service) => {
    if (!selectedDate || !selectedService || !isAuthenticated) return;

    setCheckingAvailability(true);
    try {
      const booked = await getBookedSlots(selectedDate, selectedService);
      setBlockedSlots(booked);

      const available = timeSlots.filter((slot) => !booked.includes(slot));
      setAvailableTimeSlots(available);

      // Clear selected time if it just became unavailable
      if (formData.time && !available.includes(formData.time)) {
        setFormData((prev) => ({ ...prev, time: "" }));
        showMessage("warning", "Your selected time is no longer available. Please choose another.");
      }

      return available;
    } finally {
      setCheckingAvailability(false);
    }
  };

  /** One final check right before submitting */
  const finalAvailabilityCheck = async (selectedTime, selectedDate, selectedService) => {
    const booked = await getBookedSlots(selectedDate, selectedService);
    return !booked.includes(selectedTime);
  };

  // ─── effects ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    const token = localStorage.getItem("access");
    const userId = localStorage.getItem("user_id");

    if (!token || !userId) {
      navigate("/client-login");
      return;
    }

    setIsAuthenticated(true);
    loadUserData();
    loadServices();

    return () => {
      if (availabilityInterval.current) clearInterval(availabilityInterval.current);
    };
  }, [navigate]);

  // Re-check whenever date or service changes
  useEffect(() => {
    if (date && formData.service && isAuthenticated) {
      checkAvailability(date, formData.service);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, formData.service, isAuthenticated]);

  // Poll every 30 s while user has a time selected
  useEffect(() => {
    if (formData.time && formData.service && date && isAuthenticated) {
      if (availabilityInterval.current) clearInterval(availabilityInterval.current);
      availabilityInterval.current = setInterval(() => {
        checkAvailability(date, formData.service);
      }, 30000);
    } else {
      if (availabilityInterval.current) clearInterval(availabilityInterval.current);
    }
    return () => {
      if (availabilityInterval.current) clearInterval(availabilityInterval.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.time, formData.service, date, isAuthenticated]);

  // ─── handlers ────────────────────────────────────────────────────────────────

  const handleDateChange = (newDate) => {
    setDate(newDate);
    setFormData((prev) => ({ ...prev, time: "" }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "phone" ? formatPhoneNumber(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (submitLock.current || isSubmitting) return;

    if (!isAuthenticated) {
      navigate("/client-login");
      return;
    }

    setLoading(true);
    setIsSubmitting(true);
    submitLock.current = true;

    // ── validation ──────────────────────────────────────────────────────────
    if (!formData.service || !formData.time || !date) {
      showMessage("error", "Please select a service, date, and time.");
      resetSubmitState();
      return;
    }

    if (!formData.email) {
      showMessage("error", "Please enter your email address.");
      resetSubmitState();
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      showMessage("error", "Please enter a valid email address.");
      resetSubmitState();
      return;
    }

    const cleanPhone = cleanPhoneNumber(formData.phone);
    if (cleanPhone.length < 10) {
      showMessage("error", "Please enter a valid phone number with at least 10 digits.");
      resetSubmitState();
      return;
    }
    if (cleanPhone.length > 11) {
      showMessage("error", "Please enter a valid phone number (max 11 digits).");
      resetSubmitState();
      return;
    }

    if (!customers?.customerid) {
      showMessage("error", "Customer profile not found. Please complete your profile first.");
      resetSubmitState();
      return;
    }

    // ── final availability check ─────────────────────────────────────────────
    try {
      const isStillAvailable = await finalAvailabilityCheck(
        formData.time,
        date,
        formData.service
      );

      if (!isStillAvailable) {
        showMessage(
          "error",
          "Sorry, this time slot was just booked by someone else. Please select another time.",
          4000
        );
        await checkAvailability(date, formData.service);
        setFormData((prev) => ({ ...prev, time: "" }));
        resetSubmitState();
        return;
      }

      // ── build payload ──────────────────────────────────────────────────────
      const formattedDate = formatDateParam(date);
      const formattedTime = convertTo24Hour(formData.time);
      const localDate = new Date(`${formattedDate}T${formattedTime}`);
      const utcDateTime = localDate.toISOString();

      const bookingData = {
        customerid: customers.customerid,
        serviceid: parseInt(formData.service),
        appointmenttime: utcDateTime,
        status: "pending",
        email: formData.email.trim(),
        phonenum: cleanPhone,
      };

      await AxiosInstance.post("core/bookings/", bookingData);

      showMessage("success", "Booking created successfully! We will confirm your appointment soon.");

      setTimeout(() => checkAvailability(date, formData.service), 3000);

      // Reset service/time selection, keep personal info
      setFormData((prev) => ({ ...prev, service: "", time: "" }));
      setDate(new Date());
    } catch (error) {
      console.error("Booking error:", error);

      let errorMsg = "Failed to create booking. Please try again.";

      if (error.response) {
        const { status: httpStatus, data: errorData } = error.response;

        if (httpStatus === 400) {
          if (errorData?.appointmenttime) {
            errorMsg = Array.isArray(errorData.appointmenttime)
              ? errorData.appointmenttime[0]
              : errorData.appointmenttime;
            await checkAvailability(date, formData.service);
            setFormData((prev) => ({ ...prev, time: "" }));
          } else if (errorData?.non_field_errors) {
            errorMsg = Array.isArray(errorData.non_field_errors)
              ? errorData.non_field_errors[0]
              : errorData.non_field_errors;
            await checkAvailability(date, formData.service);
            setFormData((prev) => ({ ...prev, time: "" }));
          } else if (typeof errorData === "object") {
            errorMsg = Object.entries(errorData)
              .map(([key, val]) => {
                const msg = Array.isArray(val) ? val.join(", ") : val;
                if (key === "appointmenttime") return "Time slot is already booked";
                return `${key}: ${msg}`;
              })
              .join(" | ");
          } else if (typeof errorData === "string") {
            errorMsg = errorData;
          }
        } else if (httpStatus === 403) {
          errorMsg = "You do not have permission to create bookings. Please log in again.";
        } else if (httpStatus === 409) {
          errorMsg = "This time slot is no longer available. Please select another time.";
          await checkAvailability(date, formData.service);
          setFormData((prev) => ({ ...prev, time: "" }));
        } else {
          errorMsg = `Server error (${httpStatus}): ${errorData?.detail || "Please try again"}`;
        }
      } else if (error.request) {
        errorMsg = "No response from server. Please check your connection.";
      }

      showMessage("error", errorMsg, 4000);
    } finally {
      setLoading(false);
      setIsSubmitting(false);
      setTimeout(() => {
        submitLock.current = false;
      }, 1000);
    }
  };

  // ─── render ───────────────────────────────────────────────────────────────

  if (!isAuthenticated) {
    return <div>Redirecting to login...</div>;
  }

  return (
    <div>
      <div className="titleWrapper">BOOKING PORTAL</div>

      <div className="booking-page">
        {/* Left Column - Booking Form */}
        <div className="booking-form-container">
          <form onSubmit={handleSubmit} className="booking-form">
            <div className="form-group">
              <label htmlFor="fullName">Full Name</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                disabled={true}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="(123) 456-7890"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="service">Service</label>
                <select
                  id="service"
                  name="service"
                  value={formData.service}
                  onChange={handleInputChange}
                  required
                  disabled={loading || loadingServices}
                >
                  <option value="">
                    {loadingServices ? "Loading services..." : "Select a service"}
                  </option>
                  {Array.isArray(services) &&
                    services.map((service) => (
                      <option key={service?.serviceid} value={service?.serviceid}>
                        {service?.title || "Unknown"} - ${service?.baseprice || "0"}
                      </option>
                    ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="time">
                  Preferred Time
                  {checkingAvailability && <span className="loading-spinner-small"> ⟳</span>}
                </label>
                <select
                  id="time"
                  name="time"
                  value={formData.time}
                  onChange={handleInputChange}
                  required
                  disabled={checkingAvailability || loading}
                >
                  <option value="">
                    {checkingAvailability
                      ? "Checking availability..."
                      : availableTimeSlots.length === 0 && formData.service
                      ? "No slots available"
                      : "Select a time"}
                  </option>
                  {timeSlots.map((time) => {
                    const isBlocked = blockedSlots.includes(time);
                    return (
                      <option
                        key={time}
                        value={time}
                        disabled={isBlocked}
                        style={{
                          backgroundColor: isBlocked ? "#f0f0f0" : "white",
                          color: isBlocked ? "#999" : "black",
                        }}
                      >
                        {time} {isBlocked ? " Booked" : " Available"}
                      </option>
                    );
                  })}
                </select>

                {availableTimeSlots.length === 0 && formData.service && !checkingAvailability && (
                  <small className="warning-text">
                    No available slots for this date. Please select another date.
                  </small>
                )}
              </div>
            </div>

            <div className="booking-summary">
              <h4>Booking Summary</h4>
              {formData.service && formData.time && date ? (
                <div className="summary-details">
                  <p><strong>Service:</strong> {getServiceTitle(formData.service)}</p>
                  <p>
                    <strong>Date:</strong>{" "}
                    {date.toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  <p><strong>Time:</strong> {formData.time}</p>
                  <p><strong>Email:</strong> {formData.email || "Not provided"}</p>
                  <p><strong>Phone:</strong> {formData.phone || "Not provided"}</p>
                </div>
              ) : (
                <p className="no-selection">Please select a service, date, and time</p>
              )}
            </div>

            <button
              type="submit"
              className="btn-book-appointment"
              disabled={
                loading ||
                isSubmitting ||
                !formData.service ||
                !formData.time ||
                !date ||
                !formData.email ||
                !formData.phone ||
                checkingAvailability
              }
            >
              {loading || isSubmitting ? "PROCESSING..." : "BOOK APPOINTMENT"}
            </button>
          </form>
        </div>

        {/* Right Column - Calendar */}
        <div className="calendar-container">
          <div className="availability-badge">SELECT DATE</div>
          <div className="calendar-wrapper">
            <h3 className="calendar-month">
              {date.toLocaleString("default", { month: "long" })} {date.getFullYear()}
            </h3>
            <Calendar
              onChange={handleDateChange}
              value={date}
              minDate={new Date()}
              className="custom-calendar"
              tileDisabled={({ date: tileDate }) =>
                tileDate < new Date().setHours(0, 0, 0, 0)
              }
            />
          </div>
        </div>
      </div>

      {/* Popup */}
      {showPopup && (
        <div className="popup-overlay">
          <div className={`popup-content ${popupMessage.type}`}>
            <p>{popupMessage.text}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Booking;