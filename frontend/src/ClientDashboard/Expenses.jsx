import { useState, useEffect } from "react";
import "../App.css";
import AxiosInstance from "../components/AxiosInstance";

function Expenses() {
  const services = [
    "Irrigation",
    "Sesonal",
    "Winterize"
  ];

  const [expenses, setExpenses] = useState([]);
  const [showAddOverlay, setShowAddOverlay] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    category: services[0]
  });

  // Fetch expenses from backend on mount
  const fetchExpenses = async () => {
  try {
    const response = await AxiosInstance.get('core/expenses/');
    // Handle both array and paginated responses
    const data = Array.isArray(response.data)
      ? response.data
      : response.data.results || [];
    setExpenses(data);
    localStorage.setItem("userExpenses", JSON.stringify(data));
  } catch (err) {
    console.error("Error fetching expenses:", err);
    const saved = localStorage.getItem("userExpenses");
    if (saved) setExpenses(JSON.parse(saved) || []);
  }
};
  useEffect(() => {
    fetchExpenses();
  }, []);

  const addExpense = async () => {
    const amount = Number(formData.amount);
    if (!amount || amount <= 0) {
      alert("Please enter a valid positive number");
      return;
    }

    setLoading(true);
    try {
      await AxiosInstance.post('core/expenses/', {
        name: formData.category,
        amount: amount,
        category: formData.category,
      });

      // Refresh from backend
      await fetchExpenses();
      window.dispatchEvent(new Event("expensesUpdated"));
      setShowAddOverlay(false);
      setFormData({ amount: "", category: services[0] });
    } catch (err) {
      console.error("Error adding expense:", err);
      alert("Failed to save expense. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCategorySelect = (category) => {
    setFormData(prev => ({ ...prev, category }));
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") addExpense();
    else if (e.key === "Escape") {
      setShowAddOverlay(false);
      setFormData({ amount: "", category: services[0] });
    }
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);

  return (
    <>
      <div
        className="expensesWrapper clickable"
        onClick={() => {
          setShowAddOverlay(true);
          setFormData({ amount: "", category: services[0] });
        }}
      >
        <div className="expensesContent">
          <p className="expensesTitle">TOTAL EXPENSES</p>
          <p className="expensesTotal">${totalExpenses.toLocaleString()}</p>
        </div>
      </div>

      {showAddOverlay && (
        <div className="expenseOverlay" onClick={() => {
          setShowAddOverlay(false);
          setFormData({ amount: "", category: services[0] });
        }}>
          <div
            className="expenseForm"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="expenseFormTitle">Add New Expense</h3>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              placeholder="Amount ($)"
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              autoFocus
              min="0"
              step="0.01"
              disabled={loading}
            />
            <div className="categoryChis">
              <p>Select Service:</p>
              <div className="categoryChips">
                {services.map(service => (
                  <div
                    key={service}
                    className={`categoryChip ${formData.category === service ? 'active' : ''}`}
                    onClick={() => handleCategorySelect(service)}
                  >
                    {service}
                  </div>
                ))}
              </div>
            </div>

            <div className="expenseFormButtons">
              <button
                className="expenseFormButton add"
                onClick={addExpense}
                disabled={loading}
              >
                {loading ? "Saving..." : "Add Expense"}
              </button>
              <button
                className="expenseFormButton cancel"
                onClick={() => {
                  setShowAddOverlay(false);
                  setFormData({ amount: "", category: services[0] });
                }}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Expenses;