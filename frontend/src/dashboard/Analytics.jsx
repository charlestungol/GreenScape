import { useEffect, useState } from "react";
import "../clientCss/Dashboard.css";
import {
  BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from "recharts";

function Analytics() {
  const [showReport, setShowReport] = useState(false);
  const [data, setData] = useState([]);
  const [expenses, setExpenses] = useState([]);

  // Define getExpenses at the top
  const getExpenses = () => {
    try {
      const saved = localStorage.getItem("userExpenses");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  };

  const buildMonthlyData = () => {
    const budget = Number(localStorage.getItem("userBudget")) || 0;
    const expensesData = getExpenses();

    const monthly = {};

    expensesData.forEach(({ amount, date }) => {
      const month = new Date(date).toLocaleString("default", {
        month: "short",
      });

      monthly[month] = (monthly[month] || 0) + amount;
    });

    return Object.keys(monthly).map((month) => ({
      name: month,
      budget,
      expenses: monthly[month],
    }));
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Format time for display
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate totals
  const totalBudget = data.reduce((sum, month) => sum + month.budget, 0);
  const totalExpensesAmount = data.reduce((sum, month) => sum + month.expenses, 0);
  const recentExpenses = expenses.slice().reverse().slice(0, 10);

  useEffect(() => {
    const update = () => {
      setData(buildMonthlyData());
      setExpenses(getExpenses());
    };

    update();

    window.addEventListener("budgetUpdated", update);
    window.addEventListener("expensesUpdated", update);

    return () => {
      window.removeEventListener("budgetUpdated", update);
      window.removeEventListener("expensesUpdated", update);
    };
  }, []);

  return (
    <div className="analyticsWrapper">
      <p>ANALYTICS</p>

      <div
        className="chartsRow clickableChart"
        onClick={() => setShowReport(true)}
      >
        <ResponsiveContainer width="100%" height={190}>
          <BarChart data={data} barCategoryGap="30%">
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="budget" fill="#65be69" barSize={25} />
            <Bar dataKey="expenses" fill="#06632b" barSize={25} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {showReport && (
        <div className="overlay">
          <div className="analyticsOverlayContent">
            <div className="analyticsHeader">
              <h2>Analytics & Transaction History</h2>
            </div>

            {/* Summary Section */}
            <div className="summaryGrid">
              <div className="summaryCard">
                <p className="summaryLabel">Total Budget</p>
                <p className="summaryValue budgetValue">
                  ${totalBudget.toLocaleString()}
                </p>
              </div>
              <div className="summaryCard">
                <p className="summaryLabel">Total Expenses</p>
                <p className="summaryValue expenseValue">
                  ${totalExpensesAmount.toLocaleString()}
                </p>
              </div>
              <div className="summaryCard">
                <p className="summaryLabel">Remaining</p>
                <p className="summaryValue remainingValue">
                  ${(totalBudget - totalExpensesAmount).toLocaleString()}
                </p>
              </div>
              <div className="summaryCard">
                <p className="summaryLabel">Total Transactions</p>
                <p className="summaryValue transactionValue">
                  {expenses.length}
                </p>
              </div>
            </div>

            {/* Recent Transactions Section */}
            <div>
              <h3 className="sectionHeader">Recent Transactions</h3>
              
              {expenses.length === 0 ? (
                <div className="emptyState">
                  <p>No transactions recorded yet</p>
                </div>
              ) : (
                <div className="transactionsList">
                  {recentExpenses.map((expense) => (
                    <div key={expense.id} className="transactionItem">
                      <div className="transactionDetails">
                        <div className="transactionName">
                          {expense.name}
                          <span className="transactionCategory">{expense.category}</span>
                        </div>
                        <div>
                          <span className="transactionDate">
                            {formatDate(expense.date)}
                          </span>
                          <span className="transactionTime">
                            {formatTime(expense.date)}
                          </span>
                        </div>
                      </div>
                      <div className="transactionAmount">
                        {expense.amount.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Monthly Breakdown */}
            <div className="monthlyBreakdown">
              <h3 className="sectionHeader">Monthly Breakdown</h3>
              {data.length === 0 ? (
                <div className="emptyState">
                  <p>No monthly data available</p>
                </div>
              ) : (
                <div>
                  {data.map((month) => {
                    const percentage = ((month.expenses / month.budget) * 100) || 0;
                    const isOverBudget = percentage > 100;
                    
                    return (
                      <div key={month.name} className="monthlyItem">
                        <div className="monthInfo">
                          <div className="monthName">{month.name}</div>
                          <div className="monthStats">
                            ${month.expenses.toLocaleString()} of ${month.budget.toLocaleString()} spent
                          </div>
                        </div>
                        <div className="monthProgress">
                          <div className="progressBar">
                            <div 
                              className={`progressFill ${isOverBudget ? 'overBudget' : ''}`}
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                          </div>
                          <div 
                            className={`monthPercentage ${isOverBudget ? 'overBudget' : 'underBudget'}`}
                          >
                            {percentage.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <button 
              className="analyticsCloseBtn" 
              onClick={() => setShowReport(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Analytics;