import { useEffect, useState } from "react";
import "../App.css";
import AxiosInstance from "../components/AxiosInstance";
import {
  USE_MOCK_DASHBOARD,
  mockBudget,
  mockExpenses,
} from "../mock/dashboardMockData";

function RemainingBudget() {
  const [values, setValues] = useState({ budget: 0, expenses: 0 });

  const fetchValues = async () => {
    if (USE_MOCK_DASHBOARD) {
      const budget = Number(mockBudget.amount);
      const totalExpenses = mockExpenses.reduce(
        (sum, e) => sum + Number(e.amount || 0),
        0
      );

      localStorage.setItem("userBudget", budget);
      localStorage.setItem("userExpenses", JSON.stringify(mockExpenses));
      setValues({ budget, expenses: totalExpenses });
      return;
    }
    try {
      const [budgetRes, expensesRes] = await Promise.all([
        AxiosInstance.get('core/budgets/'),
        AxiosInstance.get('core/expenses/')
      ]);

      // Handle both array and paginated responses for budget
      const budgetArray = Array.isArray(budgetRes.data)
        ? budgetRes.data
        : budgetRes.data.results || [];

      const budget = budgetArray.length > 0
        ? Number(budgetArray[0].amount)
        : 0;

      // Handle both array and paginated responses for expenses
      const expensesArray = Array.isArray(expensesRes.data)
        ? expensesRes.data
        : expensesRes.data.results || [];

      const totalExpenses = expensesArray.reduce(
        (sum, e) => sum + Number(e.amount || 0), 0
      );

      // Update localStorage
      localStorage.setItem("userBudget", budget);
      localStorage.setItem("userExpenses", JSON.stringify(expensesArray));

      // Update state once
      setValues({ budget, expenses: totalExpenses });

    } catch {
      // Fallback to localStorage if API fails
      const budget = Number(localStorage.getItem("userBudget")) || 0;
      const expenses = JSON.parse(localStorage.getItem("userExpenses")) || [];
      const totalExpenses = expenses.reduce(
        (sum, e) => sum + Number(e.amount || 0), 0
      );
      setValues({ budget, expenses: totalExpenses });
    }
  };

  useEffect(() => {
    fetchValues();
    window.addEventListener("budgetUpdated", fetchValues);
    window.addEventListener("expensesUpdated", fetchValues);
    return () => {
      window.removeEventListener("budgetUpdated", fetchValues);
      window.removeEventListener("expensesUpdated", fetchValues);
    };
  }, []);

  const { budget, expenses } = values;
  const remaining = budget - expenses;

  return (
    <div className='remainingWrapper clickable'>
      <p>REMAINING BUDGET</p>
      <p>${remaining.toLocaleString()}</p>
    </div>
  );
}

export default RemainingBudget;