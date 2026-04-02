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
import AddEmployeeModal from "../../components/AddEmployeeModal";

const roles = ["Admin", "Supervisor", "Staff"];

export default function EmployeeManagement() {
  const navigate = useNavigate();

  const [employees, setEmployees] = useState([]);
  const [savingId, setSavingId] = useState(null);

  const [openAddDialog, setOpenAddDialog] = useState(false);
  // const [newEmployee, setNewEmployee] = useState({
  //   firstname: "",
  //   lastname: "",
  //   phonenumber: "",
  //   role: "",
  // });

  function mapEmployee(raw) {
    return {
      employeeid: raw.employeeid,
      user_id: raw.user_id,           
      firstname: raw.firstname ?? "",
      lastname: raw.lastname ?? "",
      name: `${raw.firstname ?? ""} ${raw.lastname ?? ""}`.trim(),
      email: raw.email ?? "",
      employee_number: raw.employee_number ?? "",
      phonenumber: raw.phonenumber ?? "",
      role: raw.role ?? "Staff",
    };
  }
  const loadEmployees = async () => { 
    try {
      // Fetch both endpoints in parallel
      const [empRes, usersRes] = await Promise.all([
        AxiosInstance.get("core/employees/"),
        AxiosInstance.get("users/"),
      ]);
      
      const rawEmployees =
        empRes.data?.results ?? empRes.data ?? [];

      const users = usersRes.data?.results ?? usersRes.data ?? [];

      // Build a lookup table: user_id → role
      const roleByUserId = users.reduce((acc, user) => {
        acc[user.id] = user.role;
        return acc;
      }, {});

      // Merge role into employee objects
      const merged = rawEmployees.map((emp) => ({
        ...mapEmployee(emp),
        role: roleByUserId[emp.user_id] ?? "Staff", //safe fallback
      }));

      setEmployees(merged);
    } catch (err) {
      console.error("Error loading employees:", err.response?.status);
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

      await AxiosInstance.patch(
        `/users/${employee.user_id}/group/`,
        { group: employee.role }          // ✅ FIX
      );

      alert("Role updated successfully.");
    } catch (err) {
      console.error("Error updating role:", err);
      alert("Failed to update role.");
    } finally {
      setSavingId(null);
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
                    value={emp.role}
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
      <AddEmployeeModal
        open={openAddDialog}
        onClose={() => setOpenAddDialog(false)}
        onCreated={() => loadEmployees()}
      />
    </Box>
  );
}