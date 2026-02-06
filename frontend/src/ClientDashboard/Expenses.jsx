import { useState} from "react";
import "../App.css";

function Expenses() {

  const saved = localStorage.getItem("userExpenses");
  const [expenses, setExpenses] = useState(saved ? Number(saved) : 0);
  const [input, setInput] = useState("");
  const [editing, setEditing] = useState(false);


    const saveBudget = () => {
    const value = Number(input);
    if (!value) return alert("Enter a valid number");
    
    setExpenses(value);
    localStorage.setItem("userExpenses", value);
    setInput("");
    setEditing(false);
    };

  return (
    <div className="expensesWrapper clickable" onClick={() => setEditing(true)} >
      <p>TOTAL EXPENSES</p>
      <p className="budgetAmount">${expenses.toLocaleString()}</p>
            {editing && (
        <div className="budgetInputArea" onClick={(e) => e.stopPropagation()}>
          <input
            type="number"
            value={input}
            placeholder="Enter Expenses"
            onChange={(e) => setInput(e.target.value)}
          />
          <button onClick={saveBudget}>Save</button>
        </div>
      )}
    </div>
  );
}

export default Expenses;
