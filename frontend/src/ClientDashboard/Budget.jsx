import { useState, useEffect } from "react";
import "../App.css";
import "../components/clientCss/Dashboard.css";
import AxiosInstance from "../components/AxiosInstance";
import { USE_MOCK_DASHBOARD, mockBudget } from "../mock/dashboardMockData";

function Budget() {
  const [budget, setBudget] = useState(0);
  const [input, setInput] = useState("");
  const [showOverlay, setShowOverlay] = useState(false);
  const [mode, setMode] = useState("set");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.body.classList.add("dashboard-open");
    return () => document.body.classList.remove("dashboard-open");
  }, []);
  
  // Fetch budget from backend on mount
  const fetchBudget = async () => {
    if (USE_MOCK_DASHBOARD) {
      setBudget(Number(mockBudget.amount));
      localStorage.setItem("userBudget", mockBudget.amount);
      return;
    }

    try {
      const response = await AxiosInstance.get('core/budgets/');
      const data = Array.isArray(response.data)
        ? response.data
        : response.data.results || [];

      if (data.length > 0) {
        setBudget(Number(data[0].amount));
        localStorage.setItem("userBudget", data[0].amount);
      }
    } catch {
      const savedBudget = localStorage.getItem("userBudget");
      if (savedBudget) setBudget(Number(savedBudget) || 0);
    }
  };
  useEffect(() => {
    fetchBudget();
  }, []);

  const handleSave = async () => {
    const value = Number(input);
    if (!value || value <= 0) {
      alert("Please enter a valid positive number");
      return;
    }

    setLoading(true);
    try {
      await AxiosInstance.patch('core/budgets/update_budget/', {
        amount: value,
        mode: mode  // 'set' or 'add'
      });

      // Refresh from backend
      await fetchBudget();
      window.dispatchEvent(new Event("budgetUpdated"));
      setInput("");
      setShowOverlay(false);
    } catch (err) {
      console.error("Error saving budget:", err);
      alert("Failed to save budget. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setInput("");
    setShowOverlay(false);
  };

  const handleReset = async () => {
    if (window.confirm("Are you sure you want to reset your budget to $0?")) {
      setLoading(true);
      try {
        await AxiosInstance.patch('core/budgets/update_budget/', {
          amount: 0,
          mode: 'set'
        });

        // Refresh from backend
        await fetchBudget();
        window.dispatchEvent(new Event("budgetUpdated"));
        setInput("");
        setShowOverlay(false);
      } catch (err) {
        console.error("Error resetting budget:", err);
        alert("Failed to reset budget. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <>
      <div
        className="budgetWrapper clickable"
        onClick={() => setShowOverlay(true)}
      >
        <p>BUDGET</p>
        <p>${budget.toLocaleString()}</p>
      </div>

      {showOverlay && (
        <div className="budgetOverlay" onClick={cancelEdit}>
          <div
            className="budgetForm"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="budgetFormTitle">Budget Settings</h3>

            <div className="modeSelection categoryChips">
              <button
                className={`categoryChip ${mode === "set" ? "active" : ""}`}
                onClick={() => setMode("set")}
                disabled={loading}
              >
                Set New
              </button>
              <button
                className={`categoryChip ${mode === "add" ? "active" : ""}`}
                onClick={() => setMode("add")}
                disabled={loading}
              >
                Add
              </button>
            </div>

            <input
              type="number"
              value={input}
              placeholder={`Amount to ${mode}`}
              onChange={(e) => setInput(e.target.value)}
              autoFocus
              disabled={loading}
            />

            <p className="currentBudget">
              Current: ${budget.toLocaleString()}
            </p>

            <div className="budgetFormButtons">
              <button
                className="budgetFormButton add"
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? "Saving..." : mode === "set" ? "Set Budget" : "Add to Budget"}
              </button>
              <button
                className="budgetFormButton cancel"
                onClick={cancelEdit}
                disabled={loading}
              >
                Cancel
              </button>
            </div>

            {budget > 0 && (
              <div className="budgetActions">
                <button
                  className="budgetButton reset"
                  onClick={handleReset}
                  disabled={loading}
                >
                  {loading ? "Resetting..." : "Reset Budget"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default Budget;