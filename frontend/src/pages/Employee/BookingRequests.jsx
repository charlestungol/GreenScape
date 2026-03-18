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

  const fetchRequests = async () => {
    try {
      setLoading(true);

      const [bookingsRes, quotesRes] = await Promise.all([
        AxiosInstance.get("/core/booking-requests/"),
        AxiosInstance.get("/core/quote-requests/"),
      ]);

      setBookingRequests(Array.isArray(bookingsRes.data) ? bookingsRes.data : []);
      setQuoteRequests(Array.isArray(quotesRes.data) ? quotesRes.data : []);
    } catch (error) {
      console.error("Failed to fetch booking/quote requests:", error);
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
      await AxiosInstance.post(`/core/booking-requests/${id}/approve/`);
      await fetchRequests();
      alert("Booking request approved and confirmation sent to client.");
    } catch (error) {
      console.error("Error approving booking request:", error);
      alert("Failed to approve booking request.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleApproveQuote = async (id) => {
    try {
      setActionLoadingId(`quote-${id}`);
      await AxiosInstance.post(`/core/quote-requests/${id}/approve/`);
      await fetchRequests();
      alert("Quote request approved and confirmation sent to client.");
    } catch (error) {
      console.error("Error approving quote request:", error);
      alert("Failed to approve quote request.");
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
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
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
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
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
                  bookingRequests.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.client_name || "N/A"}</TableCell>
                      <TableCell>{item.client_email || "N/A"}</TableCell>
                      <TableCell>{item.service_name || "N/A"}</TableCell>
                      <TableCell>{item.booking_date || "N/A"}</TableCell>
                      <TableCell>{item.booking_time || "N/A"}</TableCell>
                      <TableCell>{renderStatusChip(item.status)}</TableCell>
                      <TableCell align="center">
                        <Button
                          variant="contained"
                          size="small"
                          disabled={
                            item.status?.toLowerCase() === "approved" ||
                            actionLoadingId === `booking-${item.id}`
                          }
                          onClick={() => handleApproveBooking(item.id)}
                          sx={{
                            backgroundColor: "#1c3d37",
                            "&:hover": { backgroundColor: "#16302b" },
                            textTransform: "none",
                            fontWeight: 600,
                          }}
                        >
                          {actionLoadingId === `booking-${item.id}` ? "Approving..." : "Approve"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
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
                  quoteRequests.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.client_name || "N/A"}</TableCell>
                      <TableCell>{item.client_email || "N/A"}</TableCell>
                      <TableCell>{item.service_name || "N/A"}</TableCell>
                      <TableCell>{item.quote_amount ? `$${item.quote_amount}` : "N/A"}</TableCell>
                      <TableCell>{renderStatusChip(item.status)}</TableCell>
                      <TableCell align="center">
                        <Button
                          variant="contained"
                          size="small"
                          disabled={
                            item.status?.toLowerCase() === "approved" ||
                            actionLoadingId === `quote-${item.id}`
                          }
                          onClick={() => handleApproveQuote(item.id)}
                          sx={{
                            backgroundColor: "#1c3d37",
                            "&:hover": { backgroundColor: "#16302b" },
                            textTransform: "none",
                            fontWeight: 600,
                          }}
                        >
                          {actionLoadingId === `quote-${item.id}` ? "Approving..." : "Approve"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
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