import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Chip,
  CircularProgress,
} from "@mui/material";
import AxiosInstance from "../../components/AxiosInstance";

export default function BookingRequests() {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [bookingRequests, setBookingRequests] = useState([]);
  const [quoteRequests, setQuoteRequests] = useState([]);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const getBookingId = (item) => item.bookingid || item.id;
  const getQuoteId = (item) => item.quoteid || item.quotesid || item.id;

  const getClientName = (item) => {
    if (item.client_name) return item.client_name;

    if (item.customer) {
      const first = item.customer.firstname || "";
      const last = item.customer.lastname || "";
      const fullName = `${first} ${last}`.trim();
      if (fullName) return fullName;
    }

    return "N/A";
  };

  const getClientEmail = (item) => {
    if (item.client_email) return item.client_email;
    if (item.customer?.email) return item.customer.email;
    return "N/A";
  };

  const getServiceName = (item) => {
    if (item.service_name) return item.service_name;
    if (item.service?.title) return item.service.title;
    return "N/A";
  };

  const getBookingDate = (item) => {
    if (item.booking_date) return item.booking_date;
    if (item.bookingdate) return item.bookingdate;

    if (item.appointmenttime) {
      const date = new Date(item.appointmenttime);
      if (!isNaN(date)) {
        return date.toLocaleDateString();
      }
    }

    return "N/A";
  };

  const getBookingTime = (item) => {
    if (item.booking_time) return item.booking_time;
    if (item.bookingtime) return item.bookingtime;

    if (item.appointmenttime) {
      const date = new Date(item.appointmenttime);
      if (!isNaN(date)) {
        return date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
      }
    }

    return "N/A";
  };

  const getQuoteAmount = (item) => {
    if (item.quote_amount) return item.quote_amount;
    if (item.amount) return item.amount;
    if (item.totalamount) return item.totalamount;
    return null;
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);

      const [bookingsRes, quotesRes] = await Promise.all([
        AxiosInstance.get("/core/bookings/"),
        AxiosInstance.get("/core/quotes/"),
      ]);

      setBookingRequests(Array.isArray(bookingsRes.data) ? bookingsRes.data : []);
      setQuoteRequests(Array.isArray(quotesRes.data) ? quotesRes.data : []);
    } catch (error) {
      console.error("Failed to fetch bookings/quotes:", error);
      alert("Failed to load booking and quote data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApproveBooking = async (id) => {
    try {
      setActionLoadingId(`booking-${id}`);

      await AxiosInstance.patch(`/core/bookings/${id}/`, {
        status: "approved",
      });

      await fetchRequests();
      alert("Booking approved successfully.");
    } catch (error) {
      console.error("Error approving booking:", error);
      alert("Failed to approve booking.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleApproveQuote = async (id) => {
    try {
      setActionLoadingId(`quote-${id}`);

      await AxiosInstance.patch(`/core/quotes/${id}/`, {
        status: "approved",
      });

      await fetchRequests();
      alert("Quote approved successfully.");
    } catch (error) {
      console.error("Error approving quote:", error);
      alert("Failed to approve quote.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const renderStatusChip = (status) => {
    const normalized = (status || "").toLowerCase();

    if (normalized === "approved") {
      return <Chip label="Approved" color="success" size="small" />;
    }

    if (normalized === "pending") {
      return <Chip label="Pending" color="warning" size="small" />;
    }

    if (normalized === "rejected") {
      return <Chip label="Rejected" color="error" size="small" />;
    }

    if (normalized === "confirmed") {
      return <Chip label="Confirmed" color="info" size="small" />;
    }

    return <Chip label={status || "Unknown"} size="small" />;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography
        variant="h4"
        sx={{
          fontWeight: 800,
          color: "#1c3d37",
          mb: 2,
          fontFamily:
            '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        Booking & Quote Requests
      </Typography>

      <Paper elevation={1} sx={{ borderRadius: 3, overflow: "hidden" }}>
        <Tabs
          value={tab}
          onChange={(_, newValue) => setTab(newValue)}
          sx={{
            px: 2,
            pt: 1,
            "& .MuiTab-root": {
              fontFamily:
                '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontWeight: 600,
              color: "#1c3d37",
            },
            "& .Mui-selected": {
              color: "#1c3d37 !important",
            },
            "& .MuiTabs-indicator": {
              backgroundColor: "#1c3d37",
            },
          }}
        >
          <Tab label="BOOKING REQUESTS" />
          <Tab label="QUOTE REQUESTS" />
        </Tabs>

        <Box sx={{ p: 2 }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress sx={{ color: "#1c3d37" }} />
            </Box>
          ) : tab === 0 ? (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><b>Client</b></TableCell>
                  <TableCell><b>Email</b></TableCell>
                  <TableCell><b>Service</b></TableCell>
                  <TableCell><b>Date</b></TableCell>
                  <TableCell><b>Time</b></TableCell>
                  <TableCell><b>Status</b></TableCell>
                  <TableCell align="center"><b>Action</b></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bookingRequests.length > 0 ? (
                  bookingRequests.map((item) => {
                    const bookingId = getBookingId(item);
                    const status = item.status || "";

                    return (
                      <TableRow key={bookingId}>
                        <TableCell>{getClientName(item)}</TableCell>
                        <TableCell>{getClientEmail(item)}</TableCell>
                        <TableCell>{getServiceName(item)}</TableCell>
                        <TableCell>{getBookingDate(item)}</TableCell>
                        <TableCell>{getBookingTime(item)}</TableCell>
                        <TableCell>{renderStatusChip(status)}</TableCell>
                        <TableCell align="center">
                          <Button
                            variant="contained"
                            size="small"
                            disabled={
                              status.toLowerCase() === "approved" ||
                              actionLoadingId === `booking-${bookingId}`
                            }
                            onClick={() => handleApproveBooking(bookingId)}
                            sx={{
                              backgroundColor: "#1c3d37",
                              "&:hover": { backgroundColor: "#16302b" },
                              textTransform: "none",
                              fontWeight: 600,
                            }}
                          >
                            {actionLoadingId === `booking-${bookingId}`
                              ? "Approving..."
                              : "Approve"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No booking requests found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><b>Client</b></TableCell>
                  <TableCell><b>Email</b></TableCell>
                  <TableCell><b>Service</b></TableCell>
                  <TableCell><b>Requested Quote</b></TableCell>
                  <TableCell><b>Status</b></TableCell>
                  <TableCell align="center"><b>Action</b></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {quoteRequests.length > 0 ? (
                  quoteRequests.map((item) => {
                    const quoteId = getQuoteId(item);
                    const status = item.status || "";
                    const quoteAmount = getQuoteAmount(item);

                    return (
                      <TableRow key={quoteId}>
                        <TableCell>{getClientName(item)}</TableCell>
                        <TableCell>{getClientEmail(item)}</TableCell>
                        <TableCell>{getServiceName(item)}</TableCell>
                        <TableCell>
                          {quoteAmount !== null ? `$${quoteAmount}` : "N/A"}
                        </TableCell>
                        <TableCell>{renderStatusChip(status)}</TableCell>
                        <TableCell align="center">
                          <Button
                            variant="contained"
                            size="small"
                            disabled={
                              status.toLowerCase() === "approved" ||
                              actionLoadingId === `quote-${quoteId}`
                            }
                            onClick={() => handleApproveQuote(quoteId)}
                            sx={{
                              backgroundColor: "#1c3d37",
                              "&:hover": { backgroundColor: "#16302b" },
                              textTransform: "none",
                              fontWeight: 600,
                            }}
                          >
                            {actionLoadingId === `quote-${quoteId}`
                              ? "Approving..."
                              : "Approve"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No quote requests found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </Box>
      </Paper>
    </Box>
  );
}