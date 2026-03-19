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
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import AxiosInstance from "../../components/AxiosInstance";

const GREEN = "#1c3d37";

export default function EmployeeManagement() {
  const navigate = useNavigate();

  const [employees, setEmployees] = useState([]);
  const [savingId, setSavingId] = useState(null);
  const [openAddDialog, setOpenAddDialog] = useState(false);

  const [newEmployee, setNewEmployee] = useState({
    firstname: "",
    lastname: "",
    phonenumber: "",
    staffstatus: "",
  });

  const loadEmployees = async () => {
    try {
      const res = await AxiosInstance.get("core/employees/");
      setEmployees(res.data?.results || res.data || []);
    } catch (error) {
      console.error("EmployeeManagement load error:", error);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const updateEmployeeField = (employeeid, field, value) => {
    setEmployees((prev) =>
      prev.map((e) => (e.employeeid === employeeid ? { ...e, [field]: value } : e))
    );
  };

  const saveEmployee = async (employee) => {
    try {
      setSavingId(employee.employeeid);

      await AxiosInstance.patch(`core/employees/${employee.employeeid}/`, {
        firstname: employee.firstname,
        lastname: employee.lastname,
        phonenumber: employee.phonenumber,
      });

      alert("Employee updated successfully.");
    } catch (err) {
      console.error("Employee save error:", {
        status: err.response?.status,
        data: err.response?.data,
      });
      alert("Update failed.");
    } finally {
      setSavingId(null);
    }
  };

  const handleOpenAddDialog = () => {
    setOpenAddDialog(true);
  };

  const handleCloseAddDialog = () => {
    setOpenAddDialog(false);
    setNewEmployee({
      firstname: "",
      lastname: "",
      phonenumber: "",
      staffstatus: "",
    });
  };

  const handleAddEmployee = async () => {
    if (
      !newEmployee.firstname ||
      !newEmployee.lastname ||
      !newEmployee.phonenumber ||
      !newEmployee.staffstatus
    ) {
      alert("Please fill in all fields.");
      return;
    }

    try {
      await AxiosInstance.post("core/employees/", {
        firstname: newEmployee.firstname,
        lastname: newEmployee.lastname,
        phonenumber: newEmployee.phonenumber,
        staffstatus: newEmployee.staffstatus,
      });

      alert("Employee data added successfully.");
      handleCloseAddDialog();
      loadEmployees();
    } catch (error) {
      console.error("Add employee error:", error);
      alert("Failed to add employee data.");
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2,
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 800, color: GREEN }}>
          Employee Management
        </Typography>

        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button variant="contained" onClick={handleOpenAddDialog}>
            Add Employee Data
          </Button>

          <Button
            variant="contained"
            onClick={() => navigate("/employee/employee-management/timesheets")}
          >
            View Timesheets
          </Button>
        </Box>
      </Box>

      <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><b>ID</b></TableCell>
              <TableCell><b>First Name</b></TableCell>
              <TableCell><b>Last Name</b></TableCell>
              <TableCell><b>Email</b></TableCell>
              <TableCell><b>Phone</b></TableCell>
              <TableCell><b>Status</b></TableCell>
              <TableCell><b>Action</b></TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {employees.map((e) => (
              <TableRow key={e.employeeid}>
                <TableCell>{e.employeeid}</TableCell>

                <TableCell>
                  <TextField
                    size="small"
                    value={e.firstname || ""}
                    onChange={(evt) =>
                      updateEmployeeField(e.employeeid, "firstname", evt.target.value)
                    }
                  />
                </TableCell>

                <TableCell>
                  <TextField
                    size="small"
                    value={e.lastname || ""}
                    onChange={(evt) =>
                      updateEmployeeField(e.employeeid, "lastname", evt.target.value)
                    }
                  />
                </TableCell>

                <TableCell>{e.email || "—"}</TableCell>

                <TableCell>
                  <TextField
                    size="small"
                    value={e.phonenumber || ""}
                    onChange={(evt) =>
                      updateEmployeeField(e.employeeid, "phonenumber", evt.target.value)
                    }
                  />
                </TableCell>

                <TableCell>
                  <TextField
                    size="small"
                    value={e.staffstatus || ""}
                    onChange={(evt) =>
                      updateEmployeeField(e.employeeid, "staffstatus", evt.target.value)
                    }
                  />
                </TableCell>

                <TableCell>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => saveEmployee(e)}
                    disabled={savingId === e.employeeid}
                  >
                    {savingId === e.employeeid ? "Saving..." : "Save"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* ADD EMPLOYEE DATA POPUP */}
      <Dialog open={openAddDialog} onClose={handleCloseAddDialog} fullWidth maxWidth="sm">
        <DialogTitle sx={{ color: GREEN, fontWeight: 800 }}>
          Add Employee Data
        </DialogTitle>

        <DialogContent
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            pt: 2,
          }}
        >
          <TextField
            label="First Name"
            value={newEmployee.firstname}
            onChange={(e) =>
              setNewEmployee((prev) => ({ ...prev, firstname: e.target.value }))
            }
            fullWidth
          />

          <TextField
            label="Last Name"
            value={newEmployee.lastname}
            onChange={(e) =>
              setNewEmployee((prev) => ({ ...prev, lastname: e.target.value }))
            }
            fullWidth
          />

          <TextField
            label="Phone Number"
            value={newEmployee.phonenumber}
            onChange={(e) =>
              setNewEmployee((prev) => ({ ...prev, phonenumber: e.target.value }))
            }
            fullWidth
          />

          <TextField
            label="Staff Status"
            value={newEmployee.staffstatus}
            onChange={(e) =>
              setNewEmployee((prev) => ({ ...prev, staffstatus: e.target.value }))
            }
            fullWidth
          />
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseAddDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleAddEmployee}>
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}