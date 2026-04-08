import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
} from "@mui/material";
import AxiosInstance from "../../components/AxiosInstance";
import AddEmployeeModal from "../../components/AddEmployeeModal";

const GREEN = "#1c3d37";

const emptyForm = {
  email: "",
  password: "",
  employee_number: "",
  group: "Staff",
};

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState([]);
  const [openAdd, setOpenAdd] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  const fetchEmployees = async () => {
    try {
      const res = await AxiosInstance.get("/core/employees/");
      setEmployees(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Failed to fetch employees:", error);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleOpenAdd = () => setOpenAdd(true);

  const handleCloseAdd = () => {
    setOpenAdd(false);
    setForm(emptyForm);
  };

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleAddEmployee = async () => {
    if (!form.email || !form.password || !form.employee_number || !form.group) {
      alert("Please fill in all fields.");
      return;
    }

    try {
      setLoading(true);
      await AxiosInstance.post("/register/employee/", {
        email: form.email,
        password: form.password,
        employee_number: form.employee_number,
        group: form.group,
      });

      alert("Employee added successfully.");
      fetchEmployees();
      handleCloseAdd();
    } catch (error) {
      console.error("Add employee error:", {
        status: error.response?.status,
        data: error.response?.data,
      });

      alert(
        JSON.stringify(error.response?.data, null, 2) ||
        "Failed to add employee."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEmployee = async (employeeId, employeeName = "this employee") => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${employeeName}? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await AxiosInstance.delete(`/core/employees/${employeeId}/`);
      alert("Employee deleted successfully.");
      fetchEmployees();
    } catch (error) {
      console.error("Delete employee error:", error);
      alert("Failed to delete employee.");
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography
          variant="h4"
          sx={{ fontWeight: 800, color: GREEN }}
        >
          Employee Management
        </Typography>

        <Button
          variant="contained"
          onClick={handleOpenAdd}
          sx={{
            backgroundColor: GREEN,
            "&:hover": { backgroundColor: "#16302b" },
            textTransform: "none",
            fontWeight: 600,
          }}
        >
          Add Employee
        </Button>
      </Box>

      <Paper elevation={1} sx={{ borderRadius: 3, overflow: "hidden" }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><b>ID</b></TableCell>
              <TableCell><b>Email</b></TableCell>
              <TableCell><b>Employee Number</b></TableCell>
              <TableCell><b>Role</b></TableCell>
              <TableCell align="center"><b>Actions</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {employees.length > 0 ? (
              employees.map((employee) => (
                <TableRow key={employee?.id || employee.employeeid}>
                  <TableCell>{employee?.id || employee.employeeid}</TableCell>
                  <TableCell>{employee?.email || "N/A"}</TableCell>
                  <TableCell>{employee?.employee_number || "N/A"}</TableCell>
                  <TableCell>{employee?.group || employee?.group || "N/A"}</TableCell>
                  <TableCell align="center">
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() =>
                        handleDeleteEmployee(
                          employee.id || employee.employeeid,
                          employee.email || "this employee"
                        )
                      }
                      sx={{ textTransform: "none", fontWeight: 600 }}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No employees found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={openAdd} onClose={handleCloseAdd} fullWidth maxWidth="sm">
        <DialogTitle>Add Employee</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            margin="normal"
            label="Email"
            name="email"
            title="Must be a valid email address (e.g., john.doe@example.com)"
            value={form.email}
            onChange={handleChange}
          />

          <TextField
            fullWidth
            margin="normal"
            label="Password"
            name="password"
            type="password"
            title="Must be a valid password (e.g., P@ssw0rd1234)"
            value={form.password}
            onChange={handleChange}
          />

          <TextField
            fullWidth
            margin="normal"
            label="Employee Number"
            name="employee_number"
            title="Must be a valid employee number (e.g., 0001)"
            value={form.employee_number}
            onChange={handleChange}
          />

          <TextField
            select
            fullWidth
            margin="normal"
            label="Group"
            name="group"
            value={form.group}
            onChange={handleChange}
          >
            <MenuItem value="Admin">Admin</MenuItem>
            <MenuItem value="Supervisor">Supervisor</MenuItem>
            <MenuItem value="Staff">Staff</MenuItem>
          </TextField>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseAdd}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddEmployee}
            disabled={loading}
            sx={{
              backgroundColor: GREEN,
              "&:hover": { backgroundColor: "#16302b" },
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            {loading ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}