import { useState, useEffect } from "react";
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
  }, [navigate]);

  const loadUserData = async () => {
    try {
      const response = await AxiosInstance.get("core/customers/me/");
      console.log("Customer data:", response.data);
      setCustomers(response.data);
      setFormData((prev) => ({
        ...prev,
        fullName: `${response.data.firstname || ""} ${
          response.data.lastname || ""
        }`.trim(),
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
      console.log("Services loaded:", response.data);

      if (Array.isArray(response.data)) {
        setServices(response.data);
      } else if (response.data && response.data.results) {
        setServices(response.data.results);
      } else {
        setServices([]);
      }
    } catch (error) {
      console.error("Error loading services:", error);
      setPopupMessage({ 
        type: "error", 
        text: "Failed to load services. Please refresh the page." 
      });
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 3000);
    } finally {
      setLoadingServices(false);
    }
  };
  useEffect(() => {
    if (date && formData.service && isAuthenticated) {
      checkAvailability();
    }
  }, [date, formData.service, isAuthenticated]);

  const checkAvailability = async () => {
    setCheckingAvailability(true);
    try {
      const formattedDate = date.toISOString().split("T")[0];

      const response = await AxiosInstance.get("core/schedules/", {
        params: {
          date: formattedDate,
          service: formData.service,
        },
      });

      console.log("Schedules for date:", response.data);
      let schedules = [];
      if (Array.isArray(response.data)) {
        schedules = response.data;
      } else if (response.data && response.data.results) {
        schedules = response.data.results;
      }

      const bookedSlots = schedules
        .map((schedule) => {
          if (schedule.starttime) {
            const startTime = new Date(schedule.starttime);
            const hours = startTime.getHours();
            const minutes = startTime.getMinutes();
            const ampm = hours >= 12 ? "PM" : "AM";
            const hour12 = hours % 12 || 12;
            return `${hour12}:${minutes.toString().padStart(2, "0")} ${ampm}`;
          }
          return null;
        })
        .filter((slot) => slot !== null);

      const available = timeSlots.filter(
        (slot) => !bookedSlots.includes(slot)
      );
      
      setAvailableTimeSlots(available);
      if (formData.time && !available.includes(formData.time)) {
        setFormData((prev) => ({ ...prev, time: "" }));
      }
    } catch (error) {
      console.error("Error checking availability:", error);
      setAvailableTimeSlots(timeSlots);
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleDateChange = (newDate) => {
    setDate(newDate);
  };

  const formatPhoneNumber = (value) => {
    const phoneNumber = value.replace(/\D/g, "");
    if (phoneNumber.length <= 3) {
      return phoneNumber;
    } else if (phoneNumber.length <= 6) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    } else {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "phone") {
      const formattedPhone = formatPhoneNumber(value);
      setFormData({
        ...formData,
        [name]: formattedPhone,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const convertTo24Hour = (timeStr) => {
    const [time, modifier] = timeStr.split(" ");
    let [hours, minutes] = time.split(":");
    if (modifier === "PM" && hours !== "12") {
      hours = parseInt(hours, 10) + 12;
    }
    if (modifier === "AM" && hours === "12") {
      hours = "00";
    }
    return `${hours.toString().padStart(2, "0")}:${minutes}:00`;
  };
  const cleanPhoneNumber = (phone) => {
    return phone.replace(/\D/g, "");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate("/client-login");
      return;
    }

    setLoading(true);
    if (!formData.service || !formData.time || !date) {
      setPopupMessage({ 
        type: "error", 
        text: "Please select a service, date, and time." 
      });
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 3000);
      setLoading(false);
      return;
    }
    if (!formData.email) {
      setPopupMessage({ 
        type: "error", 
        text: "Please enter your email address." 
      });
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 3000);
      setLoading(false);
      return;
    }
    if (!formData.phone) {
      setPopupMessage({ 
        type: "error", 
        text: "Please enter your phone number." 
      });
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 3000);
      setLoading(false);
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setPopupMessage({ 
        type: "error", 
        text: "Please enter a valid email address." 
      });
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 3000);
      setLoading(false);
      return;
    }
    const cleanPhone = cleanPhoneNumber(formData.phone);
    if (cleanPhone.length < 10) {
      setPopupMessage({ 
        type: "error", 
        text: "Please enter a valid phone number with at least 10 digits." 
      });
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 3000);
      setLoading(false);
      return;
    }

    if (cleanPhone.length > 11) {
      setPopupMessage({ 
        type: "error", 
        text: "Please enter a valid phone number (max 11 digits)." 
      });
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 3000);
      setLoading(false);
      return;
    }

    // Validate that we have customer data
    if (!customers?.customerid) {
      setPopupMessage({ 
        type: "error", 
        text: "Customer profile not found. Please complete your profile first." 
      });
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 3000);
      setLoading(false);
      return;
    }

    try {
      // Format date as YYYY-MM-DD
      const formattedDate = date.toISOString().split("T")[0];
      const formattedTime = convertTo24Hour(formData.time);

      // Combine into single datetime string
      const appointmentDateTime = `${formattedDate}T${formattedTime}:00Z`;

      // Prepare booking data with cleaned phone number
      const bookingData = {
        customerid: customers.customerid,
        serviceid: parseInt(formData.service),
        appointmenttime: appointmentDateTime,
        status: "pending",
        email: formData.email.trim(),
        phonenum: cleanPhone, 
      };

      console.log("Sending booking data:", bookingData);

      const response = await AxiosInstance.post("core/bookings/", bookingData);

      console.log("Booking created:", response.data);
      
      // Show success popup
      setPopupMessage({
        type: "success",
        text: "Booking created successfully! We will confirm your appointment soon."
      });
      setShowPopup(true);
      
      // Auto-hide popup after 3 seconds
      setTimeout(() => {
        setShowPopup(false);
      }, 3000);

      // Clear form (keep user data if logged in)
      setFormData({
        fullName: customers ? formData.fullName : "",
        address: customers ? formData.address : "",
        phone: customers ? formData.phone : "",
        email: customers ? formData.email : "",
        service: "",
        time: "",
      });

      // Reset date to today
      setDate(new Date());
      setAvailableTimeSlots([]);
    } catch (error) {
      console.error("Error creating booking:", error);

      if (error.response) {
        console.error("Status:", error.response.status);
        console.error("Data:", error.response.data);

        let errorMsg = "";

        if (error.response.status === 400) {
          // Validation error
          if (typeof error.response.data === "object") {
            const errors = Object.entries(error.response.data)
              .map(([key, val]) => {
                if (key === "appointmenttime") {
                  return "Invalid date/time format";
                }
                if (key === "email") {
                  return "Email: " + (Array.isArray(val) ? val.join(", ") : val);
                }
                if (key === "phonenum") {
                  return "Phone: " + (Array.isArray(val) ? val.join(", ") : val);
                }
                return `${key}: ${Array.isArray(val) ? val.join(', ') : val}`;
              })
              .join(" | ");
            errorMsg = errors;
          } else {
            errorMsg = error.response.data;
          }
        } else if (error.response.status === 403) {
          errorMsg = "You do not have permission to create bookings. Please log in again.";
        } else {
          errorMsg = `Server error (${error.response.status})`;
        }

        setPopupMessage({ type: "error", text: errorMsg });
      } else if (error.request) {
        setPopupMessage({ type: "error", text: "No response from server. Please check your connection." });
      } else {
        setPopupMessage({ type: "error", text: "Failed to create booking. Please try again." });
      }
      
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 3000);
    } finally {
      setLoading(false);
    }
  };

  const getServiceTitle = (serviceId) => {
    if (!Array.isArray(services)) return "Selected";
    const service = services.find(
      (s) => s && s.serviceid === parseInt(serviceId)
    );
    return service?.title || "Selected";
  };

  // If not authenticated, show loading or nothing (will redirect)
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
                    {loadingServices
                      ? "Loading services..."
                      : "Select a service"}
                  </option>
                  {Array.isArray(services) &&
                    services.map((service) => (
                      <option
                        key={service?.serviceid}
                        value={service?.serviceid}
                      >
                        {service?.title || "Unknown"} - $
                        {service?.baseprice || "0"}
                      </option>
                    ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="time">
                  Preferred Time
                  {checkingAvailability && (
                    <span className="loading-spinner">⏳</span>
                  )}
                </label>
                <select
                  id="time"
                  name="time"
                  value={formData.time}
                  onChange={handleInputChange}
                  required
                  disabled={checkingAvailability}
                >
                  <option value="">
                    {checkingAvailability
                      ? "Checking availability..."
                      : availableTimeSlots.length === 0 && formData.service
                      ? "No slots available"
                      : "Select a time"}
                  </option>
                  {availableTimeSlots.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
                {availableTimeSlots.length === 0 &&
                  formData.service &&
                  !checkingAvailability && (
                    <small className="warning-text">
                      No available slots for this date. Please select another
                      date.
                    </small>
                  )}
              </div>
            </div>

            <div className="booking-summary">
              <h4>Booking Summary</h4>
              {formData.service && formData.time && date ? (
                <div className="summary-details">
                  <p>
                    <strong>Service:</strong> {getServiceTitle(formData.service)}
                  </p>
                  <p>
                    <strong>Date:</strong>{" "}
                    {date.toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  <p>
                    <strong>Time:</strong> {formData.time}
                  </p>
                  <p>
                    <strong>Email:</strong> {formData.email || "Not provided"}
                  </p>
                  <p>
                    <strong>Phone:</strong> {formData.phone || "Not provided"}
                  </p>
                </div>
              ) : (
                <p className="no-selection">
                  Please select a service, date, and time
                </p>
              )}
            </div>

            <button
              type="submit"
              className="btn-book-appointment"
              disabled={
                loading ||
                !formData.service ||
                !formData.time ||
                !date ||
                !formData.email ||
                !formData.phone
              }
            >
              {loading ? "CREATING BOOKING..." : "BOOK APPOINTMENT"}
            </button>
          </form>
        </div>

        {/* Right Column - Calendar */}
        <div className="calendar-container">
          <div className="availability-badge">SELECT DATE</div>
          <div className="calendar-wrapper">
            <h3 className="calendar-month">
              {date.toLocaleString("default", { month: "long" })}{" "}
              {date.getFullYear()}
            </h3>
            <Calendar
              onChange={handleDateChange}
              value={date}
              minDate={new Date()}
              className="custom-calendar"
              tileDisabled={({ date }) => {
                return date < new Date().setHours(0, 0, 0, 0);
              }}
            />
          </div>
        </div>
      </div>

      {/* Popup Modal */}
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