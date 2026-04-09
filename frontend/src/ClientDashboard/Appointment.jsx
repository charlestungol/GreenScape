import React, { useState, useEffect } from 'react';
import AxiosInstance from '../components/AxiosInstance';
import { useNavigate } from 'react-router-dom';

const Appointments = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("access");
    const userId = localStorage.getItem("user_id");

    if (!token || !userId) {
      navigate("/client-login");
      return;
    }

    fetchConfirmedAppointments();
  }, [navigate]);

  const fetchConfirmedAppointments = async () => {
    try {
      setLoading(true);
      
      const customerResponse = await AxiosInstance.get("core/customers/me/");
      const customerId = customerResponse.data.customerid;
      const response = await AxiosInstance.get("core/bookings/", {
        params: {
          customerid: customerId
        }
      });
      
      const data = Array.isArray(response.data) ? response.data : response.data?.results ?? [];
      const now = new Date();

      // Filter to ONLY confirmed bookings that are in the future
      const confirmedOnly = data.filter(booking => {
        const isConfirmed = booking.status?.toLowerCase() === 'confirmed';
        const isFuture = booking.appointmenttime && new Date(booking.appointmenttime) > now;
        return isConfirmed && isFuture;
      });
      
      // Sort by date (closest first)
      confirmedOnly.sort((a, b) => new Date(a.appointmenttime) - new Date(b.appointmenttime));
      
      // Enrich with service details
      const enrichedAppointments = await Promise.all(
        confirmedOnly.map(async (booking) => {
          try {
            const serviceResponse = await AxiosInstance.get(`core/services/${booking.serviceid}/`);
            return {
              ...booking,
              serviceDetails: serviceResponse.data
            };
          } catch (error) {
            console.error(`Error fetching service ${booking.serviceid}:`, error);
            return booking;
          }
        })
      );
      
      setAppointments(enrichedAppointments);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (datetime) => {
    const date = new Date(datetime);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDaysUntil = (datetime) => {
    const now = new Date();
    const then = new Date(datetime);
    const diff = Math.ceil((then - now) / (1000 * 60 * 60 * 24));
    if (diff === 0) return "Today";
    if (diff === 1) return "Tomorrow";
    return `In ${diff} days`;
  };

  if (loading) {
    return (
      <div className="appointmentsWrapper">
        <div className="appointments-loading">
          <div className="appointments-spinner"></div>
          <p>Loading appointments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="appointmentsWrapper">
        <div className="appointments-error">
          <p>⚠️ {error}</p>
          <button onClick={fetchConfirmedAppointments} className="appointments-retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="appointmentsWrapper clickable" onClick={() => navigate("/booking")}>
        <div className="appointments-empty">
          <p>No upcoming appointments</p>
        </div>
      </div>
    );
  }

  const nextAppointment = appointments[0];
  const remainingCount = appointments.length - 1;

  return (
    <div className="appointmentsWrapper clickable">
      <div className="appointments-header">
        <span className="appointments-title"> NEXT APPOINTMENT</span>
        {appointments.length > 1 && (
          <span className="appointments-count-badge">+{remainingCount}</span>
        )}
      </div>

      <div className="appointment-main">
        <div className="appointment-date-badge">
          <div className="appointment-day">
            {new Date(nextAppointment.appointmenttime).getDate()}
          </div>
          <div className="appointment-month">
            {new Date(nextAppointment.appointmenttime).toLocaleString('default', { month: 'short' })}
          </div>
        </div>

        <div className="appointment-info">
          <div className="appointment-service">
            {nextAppointment.service?.title || "Service"}
          </div>
          <div className="appointment-time">
            {formatTime(nextAppointment.appointmenttime)}
          </div>
          <div className="appointment-countdown">
            {getDaysUntil(nextAppointment.appointmenttime)}
          </div>
        </div>
      </div>

      {appointments.length > 1 && (
        <div className="appointments-more">
          + {remainingCount} more upcoming appointment{remainingCount > 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};

export default Appointments;