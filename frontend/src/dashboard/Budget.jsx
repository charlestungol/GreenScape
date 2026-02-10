import { useState } from "react";
import "../App.css";

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

  return (
    <>
      <div 
        className="budgetWrapper clickable" 
        onClick={() => setShowOverlay(true)}
      >
        <p>BUDGET</p>
        <p className="budgetAmount">${budget.toLocaleString()}</p>
      </div>

      {showOverlay && (
        <div className="budgetOverlay" onClick={cancelEdit}>
          <div 
            className="budgetInputArea" 
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Update Budget</h3>
            
            {/* Mode Selection */}
            <div className="modeSelection">
              <button 
                className={mode === "set" ? "active" : ""}
                onClick={() => setMode("set")}
              >
                Set New
              </button>
              <button 
                className={mode === "add" ? "active" : ""}
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
            
            <div className="buttonGroup">
              <button onClick={handleSave}>
                {mode === "set" ? "Set Budget" : 
                 mode === "add" ? "Add to Budget" : "Subtract from Budget"}
              </button>
              <button onClick={cancelEdit}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Budget;