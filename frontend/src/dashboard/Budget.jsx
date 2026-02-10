import { useState } from "react";
import "../App.css";

function Budget() {
  const getInitialBudget = () => {
    const saved = localStorage.getItem("userBudget");
    if (saved === null) return 0;
    return Number(saved) || 0;
  };

  const [budget, setBudget] = useState(getInitialBudget());
  const [input, setInput] = useState("");
  const [showOverlay, setShowOverlay] = useState(false);
  const [mode, setMode] = useState("set"); // "set", "add", "subtract"

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
    
    setBudget(newBudget);
    localStorage.setItem("userBudget", newBudget.toString());
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