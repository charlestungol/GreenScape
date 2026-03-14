import { useState } from "react";
import "../App.css";
import "../components/clientCss/Dashboard.css";

function Budget() {
  const getInitialBudget = () => {
    const userId = localStorage.getItem("user_id");
    let savedBudget = 0;
    
    // Try to get from user-specific storage first
    if (userId) {
      const userBudget = localStorage.getItem(`user_${userId}_userBudget`);
      if (userBudget !== null) {
        savedBudget = Number(userBudget) || 0;
        // Also set it in current session for compatibility
        localStorage.setItem("userBudget", userBudget);
      } else {
        // Fallback to global storage
        const globalBudget = localStorage.getItem("userBudget");
        if (globalBudget !== null) {
          savedBudget = Number(globalBudget) || 0;
        }
      }
    } else {
      // No user ID, use global storage
      const globalBudget = localStorage.getItem("userBudget");
      if (globalBudget !== null) {
        savedBudget = Number(globalBudget) || 0;
      }
    }
    
    return savedBudget;
  };

  const [budget, setBudget] = useState(getInitialBudget());
  const [input, setInput] = useState("");
  const [showOverlay, setShowOverlay] = useState(false);
  const [mode, setMode] = useState("set"); // "set", "add"

  const handleSave = () => {
    const value = Number(input);
    if (!value || value <= 0) {
      alert("Please enter a valid positive number");
      return;
    }
    
    let newBudget;
    switch(mode) {
      case "add":
        newBudget = budget + value;
        break;
      default: // "set"
        newBudget = value;
    }
    
    const userId = localStorage.getItem("user_id");
    
    // Save to current session
    localStorage.setItem("userBudget", newBudget.toString());
    
    // Also save with user ID prefix for persistence
    if (userId) {
      localStorage.setItem(`user_${userId}_userBudget`, newBudget.toString());
      console.log(`Budget saved for user ${userId}: $${newBudget}`);
    } else {
      console.log(`Budget saved (no user ID): $${newBudget}`);
    }
    
    setBudget(newBudget);
    window.dispatchEvent(new Event("budgetUpdated"));

    setInput("");
    setShowOverlay(false);
  };

  const cancelEdit = () => {
    setInput("");
    setShowOverlay(false);
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset your budget to $0?")) {
      setInput("");
      setBudget(0);
      const userId = localStorage.getItem("user_id");
      localStorage.setItem("userBudget", "0");
      if (userId) {
        localStorage.setItem(`user_${userId}_userBudget`, "0");
      }
      window.dispatchEvent(new Event("budgetUpdated"));
      setShowOverlay(false);
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
            
            {/* Mode Selection - styled like category chips */}
            <div className="modeSelection categoryChips">
              <button 
                className={`categoryChip ${mode === "set" ? "active" : ""}`}
                onClick={() => setMode("set")}
              >
                Set New
              </button>
              <button 
                className={`categoryChip ${mode === "add" ? "active" : ""}`}
                onClick={() => setMode("add")}
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
            />
            
            <p className="currentBudget">
              Current: ${budget.toLocaleString()}
            </p>
            
            <div className="budgetFormButtons">
              <button 
                className="budgetFormButton add" 
                onClick={handleSave}
              >
                {mode === "set" ? "Set Budget" : "Add to Budget"}
              </button>
              <button 
                className="budgetFormButton cancel" 
                onClick={cancelEdit}
              >
                Cancel
              </button>
            </div>

            {/* Additional Budget Actions */}
            {budget > 0 && (
              <div className="budgetActions">
                <button 
                  className="budgetButton reset"
                  onClick={handleReset}
                >
                  Reset Budget
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