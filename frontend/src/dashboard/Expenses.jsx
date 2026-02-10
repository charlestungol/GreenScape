import { useState} from "react";
import "../App.css";

function Expenses() {
  // Services as expense categories
  const services = [
    "Landscape Lighting", 
    "Irrigation Installations",
    "Stormwater Management",
    "Maintenance Service",
    "Spring Startup",
    "Winterization"
  ];

  // Get initial expenses from localStorage
  const getInitialExpenses = () => {
    try {
      const saved = localStorage.getItem("userExpenses");
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error("Error loading expenses:", error);
      return [];
    }
  };

  const [expenses, setExpenses] = useState(getInitialExpenses());
  const [showAddOverlay, setShowAddOverlay] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    category: services[0]
  });

  // Add new expense
  const addExpense = () => {
    const amount = Number(formData.amount);
    
    // Validate input
    if (!amount || amount <= 0) {
      alert("Please enter a valid positive number");
      return;
    }

    // Use category as the expense name
    const expenseName = formData.category;

    const newExpense = {
      id: Date.now(),
      name: expenseName,
      amount: amount,
      category: formData.category,
      date: new Date().toISOString()
    };

    const updatedExpenses = [...expenses, newExpense];
    setExpenses(updatedExpenses);
    
    try {
      localStorage.setItem("userExpenses", JSON.stringify(updatedExpenses));
    } catch (error) {
      console.error("Error saving expense:", error);
      alert("Failed to save expense. Please try again.");
    }

    // Close overlay AND reset form
    setShowAddOverlay(false);
    setFormData({
      amount: "",
      category: services[0]
    });
    
    window.dispatchEvent(new Event("expensesUpdated"));
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle category selection via chips
  const handleCategorySelect = (category) => {
    setFormData(prev => ({
      ...prev,
      category
    }));
  };

  // Handle keyboard events
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      addExpense();
    } else if (e.key === "Escape") {
      setShowAddOverlay(false);
      setFormData({
        amount: "",
        category: services[0]
      });
    }
  };

  // Calculate total expenses
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <>
      {/* Main Expenses Card - Click anywhere to add expense */}
      <div 
        className="expensesWrapper clickable"
        onClick={() => {
          setShowAddOverlay(true);
          // Reset form when opening overlay
          setFormData({
            amount: "",
            category: services[0]
          });
        }}
      >
        <div className="expensesContent">
          <p className="expensesTitle">TOTAL EXPENSES</p>
          <p className="expensesTotal">${totalExpenses.toLocaleString()}</p>
        </div>
      </div>

      {/* Add Expense Overlay */}
      {showAddOverlay && (
        <div className="expenseOverlay" onClick={() => {
          setShowAddOverlay(false);
          setFormData({
            amount: "",
            category: services[0]
          });
        }}>
          <div 
            className="expenseForm" 
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="expenseFormTitle">Add New Expense</h3>
            
            {/* Amount Input */}
            <input
              type="number"
              name="amount"
              value={formData.amount}
              placeholder="Amount ($)"
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              autoFocus
            />
            
            {/* Service Selection */}
            <div style={{ marginBottom: '15px' }}>
              <p style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                Select Service:
              </p>
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
              >
                Add Expense
              </button>
              <button 
                className="expenseFormButton cancel"
                onClick={() => {
                  setShowAddOverlay(false);
                  setFormData({
                    amount: "",
                    category: services[0]
                  });
                }}
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