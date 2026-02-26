import { useState} from "react";
import "../App.css";

function Budget() {

  const saved = localStorage.getItem("userBudget");
  const [budget, setBudget] = useState(saved ? Number(saved) : 0);
  const [input, setInput] = useState("");
  const [editing, setEditing] = useState(false);


    const saveBudget = () => {
    const value = Number(input);
    if (!value) return alert("Enter a valid number");
    
    setBudget(value);
    localStorage.setItem("userBudget", value);
    setInput("");
    setEditing(false);
    };

  return (
    <div className="budgetWrapper clickable" onClick={() => setEditing(true)} >
      <p>BUDGET</p>
      <p className="budgetAmount">${budget.toLocaleString()}</p>
            {editing && (
        <div className="budgetInputArea" onClick={(e) => e.stopPropagation()}>
          <input
            type="number"
            value={input}
            placeholder="Enter Budget"
            onChange={(e) => setInput(e.target.value)}
          />
          <button onClick={saveBudget}>Save</button>
        </div>
      )}
    </div>
  );
}

export default Budget;
