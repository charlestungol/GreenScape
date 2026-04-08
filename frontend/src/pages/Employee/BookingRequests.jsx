import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import AxiosInstance from "../../components/AxiosInstance";

const GREEN = "#1c3d37";

export default function BookingRequests() {
  const [loading, setLoading] = useState(true);
  const [bookingRequests, setBookingRequests] = useState([]);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [selectedActions, setSelectedActions] = useState({});

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await AxiosInstance.get("/core/bookings/");
      setBookingRequests(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Failed to fetch booking requests:", error);
      setBookingRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleActionChange = (bookingId, value) => {
    setSelectedActions((prev) => ({
      ...prev,
      [bookingId]: value,
    }));
  };

  const handleSubmitAction = async (bookingId) => {
    const selectedAction = selectedActions[bookingId];

    if (!selectedAction) {
      alert("Please select an action first.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to ${selectedAction.toLowerCase()} this booking request?`
    );

    if (!confirmed) return;

    try {
      setActionLoadingId(bookingId);

      if (selectedAction === "Approved") {
        await AxiosInstance.post(`/core/bookings/${bookingId}/approve/`);
      } else if (selectedAction === "Disapproved") {
        await AxiosInstance.post(`/core/bookings/${bookingId}/disapprove/`);
      }

      alert(`Booking request ${selectedAction.toLowerCase()} successfully.`);
      await fetchRequests();
    } catch (error) {
      console.error("Booking action error:", error);
      alert(`Failed to ${selectedAction.toLowerCase()} booking request.`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const renderStatusChip = (status) => {
    const normalized = (status || "").toLowerCase();

    if (normalized === "approved") {
      return <Chip label="Approved" color="success" size="small" />;
    }

    if (normalized === "disapproved") {
      return <Chip label="Disapproved" color="error" size="small" />;
    }

    if (normalized === "pending") {
      return <Chip label="Pending" color="warning" size="small" />;
    }

    return <Chip label={status || "Unknown"} size="small" />;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography
        variant="h4"
        sx={{
          fontWeight: 800,
          color: GREEN,
          mb: 2,
        }}
      >
        Booking Requests
      </Typography>

      <Paper elevation={1} sx={{ borderRadius: 3, overflow: "hidden" }}>
        <Box sx={{ p: 2 }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress sx={{ color: GREEN }} />
            </Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><b>Client</b></TableCell>
                  <TableCell><b>Email</b></TableCell>
                  <TableCell><b>Service</b></TableCell>
                  <TableCell><b>Date</b></TableCell>
                  <TableCell><b>Time</b></TableCell>
                  <TableCell><b>Status</b></TableCell>
                  <TableCell><b>Action</b></TableCell>
                  <TableCell align="center"><b>Submit</b></TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {bookingRequests.length > 0 ? (
                  bookingRequests.map((item) => (
                    <TableRow key={item.bookingid}>
                      <TableCell>{item.client_name || "N/A"}</TableCell>
                      <TableCell>{item.client_email || "N/A"}</TableCell>
                      <TableCell>{item.service_name || "N/A"}</TableCell>
                      <TableCell>{item.booking_date || "N/A"}</TableCell>
                      <TableCell>{item.booking_time || "N/A"}</TableCell>
                      <TableCell>{renderStatusChip(item.status)}</TableCell>

                      <TableCell sx={{ minWidth: 180 }}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Select Action</InputLabel>
                          <Select
                            value={selectedActions[item.bookingid] || ""}
                            label="Select Action"
                            onChange={(e) =>
                              handleActionChange(item.bookingid, e.target.value)
                            }
                            disabled={
                              item.status?.toLowerCase() === "approved" ||
                              item.status?.toLowerCase() === "disapproved"
                            }
                          >
                            <MenuItem value="Approved">Approve</MenuItem>
                            <MenuItem value="Disapproved">Disapprove</MenuItem>
                          </Select>
                        </FormControl>
                      </TableCell>

                      <TableCell align="center">
                        <Button
                          variant="contained"
                          onClick={() => handleSubmitAction(item.bookingid)}
                          disabled={
                            actionLoadingId === item.bookingid ||
                            item.status?.toLowerCase() === "approved" ||
                            item.status?.toLowerCase() === "disapproved"
                          }
                          sx={{
                            backgroundColor: GREEN,
                            "&:hover": { backgroundColor: "#16302b" },
                            textTransform: "none",
                            fontWeight: 600,
                          }}
                        >
                          {actionLoadingId === item.bookingid ? "Saving..." : "Confirm"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      No booking requests found.
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