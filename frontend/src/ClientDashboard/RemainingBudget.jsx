import { useEffect, useState } from "react";
import "../App.css";

function RemainingBudget() {
  const getValues = () => {
    const budget = Number(localStorage.getItem("userBudget")) || 0;
    const expenses =
      JSON.parse(localStorage.getItem("userExpenses")) || [];

    const totalExpenses = expenses.reduce(
      (sum, e) => sum + (e.amount || 0),
      0
    );

    return { budget, expenses: totalExpenses };
  };

  const [values, setValues] = useState(getValues);

  useEffect(() => {
    const update = () => setValues(getValues());

    update();

    window.addEventListener("budgetUpdated", update);
    window.addEventListener("expensesUpdated", update);

    return () => {
      window.removeEventListener("budgetUpdated", update);
      window.removeEventListener("expensesUpdated", update);
    };
  }, []);

  const { budget, expenses } = values;
  const remaining = budget - expenses;

  return (
    <div className='remainingWrapper clickable' >
      <p>REMAINING BUDGET</p>
      <p>${remaining.toLocaleString()}</p>
    </div>
  );
}

export default RemainingBudget;
