import { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import '../../components/clientCss/Booking.css';

const Booking = () => {
  const [date, setDate] = useState(new Date());
  const [formData, setFormData] = useState({
    fullName: '',
    address: '',
    phone: '',
    email: '',
    service: '',
    time: ''
  });

  const handleDateChange = (newDate) => {
    setDate(newDate);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle booking submission
    console.log('Booking submitted:', { ...formData, date });
    alert('Appointment booked successfully!');
  };

  const services = [
    'Irrigation Installation',
    'Landscape Lighting',
    'Stormwater Management',
    'Maintenance Service',
    'Spring Startup',
    'Winterization',
    'Consultation'
  ];

  const timeSlots = [
    '9:00 AM', '10:00 AM', '11:00 AM', 
    '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'
  ];

  return (
    <div>
    <div className="titleWrapper">
        BOOKING PORTAL
     </div>
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
              required
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
              >
                <option value="">Select a service</option>
                {services.map((service) => (
                  <option key={service} value={service}>
                    {service}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="time">Time</label>
              <select
                id="time"
                name="time"
                value={formData.time}
                onChange={handleInputChange}
                required
              >
                <option value="">Select a time</option>
                {timeSlots.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="booking-summary">
          <h4>Selected Appointment</h4>
          {formData.service && formData.time && date ? (
            <div className="summary-details">
              <p><strong>Service:</strong> {formData.service}</p>
              <p><strong>Date:</strong> {date.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</p>
              <p><strong>Time:</strong> {formData.time}</p>
            </div>
          ) : (
            <p className="no-selection">Please select a service, date, and time</p>
          )}
        </div>
          <button type="submit" className="btn-book-appointment">
            BOOK APPOINTMENT
          </button>
        </form>
      </div>

      {/* Right Column - Calendar & Welcome */}
      <div className="calendar-container">
        <div className="availability-badge">AVAILABILITY</div>
        <div className="calendar-wrapper">
          <h3 className="calendar-month">
            {date.toLocaleString('default', { month: 'long' })} {date.getFullYear()}
          </h3>
          <Calendar
            onChange={handleDateChange}
            value={date}
            locale="en-US"
            minDate={new Date()}
            className="custom-calendar"
          />
        </div>
      </div>
    </div>
 </div>
  );
};

export default Booking;