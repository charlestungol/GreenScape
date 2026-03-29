import { useState, useEffect } from "react";
import {
  Box,
  Modal,
  Fade,
  Typography,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  Divider,
  TextField,
  Button,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AxiosInstance from "./AxiosInstance";

const GREEN = "#1c3d37";
const GREEN_MID = "#2e6b5e";

const STEPS = ["Account", "Done"];

export default function AddEmployeeModal({ open, onClose, onCreated }) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [userId, setUserId] = useState(null);

  const [accountForm, setAccountForm] = useState({
    email: "",
    password: "",
    employee_number: "",
    group: "Staff",
  });

  useEffect(() => {
    if (open) {
      setStep(0);
      setError(null);
      setUserId(null);
      setAccountForm({
        email: "",
        password: "",
        employee_number: "",
        group: "Staff",
      });
    }
  }, [open]);

  /* ─── Step 0: Create User ─── */
  const handleCreateAccount = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await AxiosInstance.post(
        "register/employee/",
        accountForm
      );
      setUserId(data.id);
      setStep(1);
    } catch (err) {
      setError(
        err.response?.data
          ? JSON.stringify(err.response.data)
          : err.message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={step < 2 ? onClose : undefined}>
      <Fade in={open}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 520,
            bgcolor: "background.paper",
            borderRadius: 3,
            boxShadow: 24,
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <Box
            sx={{
              bgcolor: GREEN,
              px: 3,
              py: 2.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
              <PersonAddIcon sx={{ color: "#fff" }} />
              <Typography sx={{ color: "#fff", fontWeight: 800 }}>
                Add Employee
              </Typography>
            </Box>

            {step < 2 && (
              <IconButton onClick={onClose} sx={{ color: "#fff" }}>
                <CloseIcon />
              </IconButton>
            )}
          </Box>

          {/* Stepper */}
          <Box sx={{ px: 3, pt: 2 }}>
            <Stepper activeStep={step}>
              {STEPS.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* STEP 0 ─ Account */}
          {step === 0 && (
            <Box sx={{ px: 3, pb: 3 }}>
              <TextField
                fullWidth
                label="Employee Number (ex: 0001)"
                margin="dense"
                value={accountForm.employee_number}
                onChange={(e) =>
                  setAccountForm({
                    ...accountForm,
                    employee_number: e.target.value,
                  })
                }
              />

              <TextField
                fullWidth
                label="Email (ex: user@example.com)"
                margin="dense"
                value={accountForm.email}
                onChange={(e) =>
                  setAccountForm({ ...accountForm, email: e.target.value })
                }
              />

              <TextField
                fullWidth
                label="Password (8+ characters)"
                type="password"
                margin="dense"
                value={accountForm.password}
                onChange={(e) =>
                  setAccountForm({ ...accountForm, password: e.target.value })
                }
              />

              <Button
                fullWidth
                variant="contained"
                sx={{ mt: 2, bgcolor: GREEN }}
                disabled={loading}
                onClick={handleCreateAccount}
              >
                {loading ? "Creating…" : "Next"}
              </Button>

              {error && (
                <Typography color="error" sx={{ mt: 1 }}>
                  {error}
                </Typography>
              )}
            </Box>
          )}

          {/* STEP 1 ─ Done */}
          {step === 1 && (
            <Box sx={{ px: 3, py: 4, textAlign: "center" }}>
              <CheckCircleIcon sx={{ fontSize: 56, color: GREEN }} />
              <Typography sx={{ mt: 1, fontWeight: 800 }}>
                Employee Created!
              </Typography>

              <Button
                onClick={onClose}
                variant="contained"
                sx={{ mt: 3, bgcolor: GREEN }}
              >
                Done
              </Button>
            </Box>
          )}
        </Box>
      </Fade>
    </Modal>
  );
}