import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import AxiosInstance from "../../components/AxiosInstance";

const roles = ["Admin", "Supervisor", "Staff"];

export default function EmployeeManagement() {
  const navigate = useNavigate();

  const [employees, setEmployees] = useState([]);
  const [savingId, setSavingId] = useState(null);

  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    firstname: "",
    lastname: "",
    phonenumber: "",
    role: "",
  });

  const loadEmployees = async () => {
    try {
      const res = await AxiosInstance.get("core/employees/");
      setEmployees(res.data?.results ?? res.data ?? []);
    } catch (err) {
      console.error("Error loading employees:", err);
      alert("Failed to load employees.");
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const updateEmployeeField = (id, field, value) => {
    setEmployees((prev) =>
      prev.map((emp) =>
        emp.employeeid === id ? { ...emp, [field]: value } : emp
      )
    );
  };

  const saveEmployee = async (employee) => {
    try {
      setSavingId(employee.employeeid);

      // Update role separately
      await AxiosInstance.patch(
        `core/employees/${employee.employeeid}/role/`,
        {
          role: employee.role,
        }
      );

      alert("Role updated successfully.");
    } catch (err) {
      console.error("Error updating role:", err);
      alert("Failed to update role.", employee.role);
    } finally {
      setSavingId(null);
    }
  };

  const handleAddEmployee = async () => {
    const { firstname, lastname, phonenumber, role } = newEmployee;

    if (!firstname || !lastname || !phonenumber || !role) {
      alert("Please fill all fields.");
      return;
    }

    try {
      await AxiosInstance.post("core/employees/", {
        firstname,
        lastname,
        phonenumber,
        role,
      });

      alert("Employee added successfully.");
      setOpenAddDialog(false);
      setNewEmployee({
        firstname: "",
        lastname: "",
        phonenumber: "",
        role: "",
      });
      loadEmployees();
    } catch (err) {
      console.error("Error adding employee:", err);
      alert("Failed to add employee.");
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
        Employee Management
      </Typography>

      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
        <Button
          variant="contained"
          onClick={() => setOpenAddDialog(true)}
        >
          Add Employee
        </Button>

        <Button
          variant="outlined"
          onClick={() => navigate("/employee/timesheets")}
        >
          View Timesheets
        </Button>
      </Box>

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><b>ID</b></TableCell>
              <TableCell><b>First Name</b></TableCell>
              <TableCell><b>Last Name</b></TableCell>
              <TableCell><b>Email</b></TableCell>
              <TableCell><b>Phone</b></TableCell>
              <TableCell><b>Role</b></TableCell>
              <TableCell><b>Action</b></TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {employees.map((emp) => (
              <TableRow key={emp.employeeid}>
                <TableCell>{emp.employeeid}</TableCell>

                <TableCell>{emp.firstname}</TableCell>
                <TableCell>{emp.lastname}</TableCell>
                <TableCell>{emp.email}</TableCell>
                <TableCell>{emp.phonenumber}</TableCell>

                {/* ROLE DROPDOWN */}
                <TableCell>
                  <TextField
                    select
                    size="small"
                    value={emp.role || ""}
                    onChange={(e) =>
                      updateEmployeeField(
                        emp.employeeid,
                        "role",
                        e.target.value
                      )
                    }
                  >
                    {roles.map((r) => (
                      <MenuItem key={r} value={r}>
                        {r}
                      </MenuItem>
                    ))}
                  </TextField>
                </TableCell>

                <TableCell>
                  <Button
                    variant="contained"
                    size="small"
                    disabled={savingId === emp.employeeid}
                    onClick={() => saveEmployee(emp)}
                  >
                    {savingId === emp.employeeid ? "Saving..." : "Save"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}

            {employees.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No employees found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* ADD EMPLOYEE DIALOG */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)}>
        <DialogTitle>Add Employee</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="First Name"
            margin="dense"
            value={newEmployee.firstname}
            onChange={(e) =>
              setNewEmployee({ ...newEmployee, firstname: e.target.value })
            }
          />

          <TextField
            fullWidth
            label="Last Name"
            margin="dense"
            value={newEmployee.lastname}
            onChange={(e) =>
              setNewEmployee({ ...newEmployee, lastname: e.target.value })
            }
          />

          <TextField
            fullWidth
            label="Phone"
            margin="dense"
            value={newEmployee.phonenumber}
            onChange={(e) =>
              setNewEmployee({ ...newEmployee, phonenumber: e.target.value })
            }
          />

          <TextField
            select
            fullWidth
            label="Role"
            margin="dense"
            value={newEmployee.role}
            onChange={(e) =>
              setNewEmployee({ ...newEmployee, role: e.target.value })
            }
          >
            {roles.map((r) => (
              <MenuItem key={r} value={r}>
                {r}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddEmployee}>
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}