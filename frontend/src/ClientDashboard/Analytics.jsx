import { useEffect, useState, useRef } from "react"; 
import "../components/clientCss/Dashboard.css";
import AxiosInstance from "../components/AxiosInstance";
import {
  BarChart, Bar,
  LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, 
  Legend, CartesianGrid
} from "recharts";
import {
  USE_MOCK_DASHBOARD,
  mockBudget,
  mockExpenses,
  mockAnalyticsData,
} from "../mock/dashboardMockData";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="tooltip-label">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="tooltip-value" style={{ color: entry.color }}>
            <span className="tooltip-color-dot" style={{ background: entry.color }} />
            {entry.name}: ${entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

function Analytics() {
  const [showReport, setShowReport] = useState(false);
  const [data, setData] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [chartType, setChartType] = useState('bar');
  const modalContentRef = useRef(null);

  const monthOrder = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  useEffect(() => {
    document.body.classList.add("dashboard-open");
    return () => document.body.classList.remove("dashboard-open");
  }, []);
  
  const fetchData = async () => {
    if (USE_MOCK_DASHBOARD) {
      const totalBudget = Number(mockBudget.amount);
      const expensesData = mockExpenses;

      const monthOrder = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      const monthly = {};

      expensesData.forEach(({ amount, date }) => {
        const month = new Date(date).toLocaleString("default", { month: "short" });
        monthly[month] = (monthly[month] || 0) + Number(amount);
      });

      let runningTotal = totalBudget;

      const chartData = Object.keys(monthly)
        .sort((a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b))
        .map((month) => {
          const expense = monthly[month];
          const budgetBeforeExpense = runningTotal;

          runningTotal -= expense;

          return {
            name: month,
            budget: budgetBeforeExpense,
            expenses: expense,
            remaining: runningTotal,
          };
        });

      setData(chartData);
      setExpenses(expensesData);
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
      const expensesData = Array.isArray(expensesRes.data)
        ? expensesRes.data
        : expensesRes.data.results || [];

      // Keep localStorage in sync
      localStorage.setItem("userBudget", budget);
      localStorage.setItem("userExpenses", JSON.stringify(expensesData));

      // Build monthly data
      const monthly = {};
      expensesData.forEach(({ amount, date }) => {
        const month = new Date(date).toLocaleString("default", { month: "short" });
        monthly[month] = (monthly[month] || 0) + Number(amount);
      });

      const chartData = Object.keys(monthly)
        .map((month) => ({
          name: month,
          budget,
          expenses: monthly[month],
        }))
        .sort((a, b) => monthOrder.indexOf(a.name) - monthOrder.indexOf(b.name));

      setData(chartData);
      setExpenses(expensesData);

    } catch {
      // Fallback to localStorage
      const budget = Number(localStorage.getItem("userBudget")) || 0;
      const expensesData = JSON.parse(localStorage.getItem("userExpenses")) || [];

      const monthly = {};
      expensesData.forEach(({ amount, date }) => {
        const month = new Date(date).toLocaleString("default", { month: "short" });
        monthly[month] = (monthly[month] || 0) + Number(amount);
      });

      const chartData = Object.keys(monthly)
        .map((month) => ({ name: month, budget, expenses: monthly[month] }))
        .sort((a, b) => monthOrder.indexOf(a.name) - monthOrder.indexOf(b.name));

      setData(chartData);
      setExpenses(expensesData);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit'
    });
  };

  const totalBudget = Number(localStorage.getItem("userBudget")) || data[0]?.budget || 0;
  const totalExpensesAmount = data.reduce((sum, month) => sum + month.expenses, 0);
  const recentExpenses = [...expenses]
    .sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at))
    .slice(0, 10);

  const handleOverlayClick = (e) => {
    if (modalContentRef.current && !modalContentRef.current.contains(e.target)) {
      setShowReport(false);
    }
  };

  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === 'Escape' && showReport) setShowReport(false);
    };
    if (showReport) {
      document.addEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'unset';
    };
  }, [showReport]);

  useEffect(() => {
    fetchData();
    window.addEventListener("budgetUpdated", fetchData);
    window.addEventListener("expensesUpdated", fetchData);
    return () => {
      window.removeEventListener("budgetUpdated", fetchData);
      window.removeEventListener("expensesUpdated", fetchData);
    };
  }, []);

  return (
    <div className="analyticsWrapper">
      <div className="analytics-header">   
        <div className="chart-toggle-group">
          <button 
            className={`chart-toggle-btn ${chartType === 'bar' ? 'active' : ''}`}
            onClick={() => setChartType('bar')}
          >
            Bar
          </button>
          <button 
            className={`chart-toggle-btn ${chartType === 'line' ? 'active' : ''}`}
            onClick={() => setChartType('line')}
          >
            Line
          </button>
        </div>
      </div>

      <div className="chartsRow clickableChart" onClick={() => setShowReport(true)}>
        <ResponsiveContainer width="100%" height={300}>
          {chartType === 'bar' ? (
          <BarChart data={data} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e8e5" vertical={false} />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8a9e98' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8a9e98' }} width={40} domain={[0, 'dataMax + 500']}/>
            <Tooltip content={<CustomTooltip />} cursor={false} />
            <Legend wrapperStyle={{ fontSize: '11px', color: '#62ad97', marginTop: '5px' }} iconType="circle" iconSize={8} />
            <Bar dataKey="budget" fill="#6a9c6a" barSize={22} radius={[6, 6, 0, 0]} name="Budget" />
            <Bar dataKey="expenses" fill="#1c3d37" barSize={22} radius={[6, 6, 0, 0]} name="Expenses" />
          </BarChart>
          ) : (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8a9e98' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8a9e98' }} width={30} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '11px', color: '#5a7c6c', marginTop: '5px' }} iconType="circle" iconSize={8} />
            <Line type="monotone" dataKey="budget" stroke="#6a9c6a" strokeWidth={2.5} dot={{ r: 3, fill: '#a8c9b0', strokeWidth: 0 }} activeDot={{ r: 5, fill: '#a8c9b0', stroke: 'white', strokeWidth: 2 }} name="Budget" />
            <Line type="monotone" dataKey="expenses" stroke="#1c3d37" strokeWidth={3} dot={{ r: 3, fill: '#06632b', strokeWidth: 0 }} activeDot={{ r: 5, fill: '#06632b', stroke: 'white', strokeWidth: 2 }} name="Expenses" />
          </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {showReport && (
        <div className="overlay" onClick={handleOverlayClick}>
          <div ref={modalContentRef} className="analyticsOverlayContent">
            <div className="analyticsHeader">
              <h2>Analytics & Transactions</h2>
            </div>
            <div className="summaryGrid">
              <div className="summaryCard">
                <div className="summaryCard-header">
                  <p className="summaryLabel">Total Budget</p>
                </div>
                <p className="summaryValue budgetValue">${totalBudget.toLocaleString()}</p>
              </div>
              <div className="summaryCard">
                <div className="summaryCard-header">
                  <p className="summaryLabel">Total Spent</p>
                </div>
                <p className="summaryValue expenseValue">${totalExpensesAmount.toLocaleString()}</p>
              </div>
              <div className="summaryCard">
                <div className="summaryCard-header">
                  <p className="summaryLabel">Remaining</p>
                </div>
                <p className="summaryValue remainingValue">${(totalBudget - totalExpensesAmount).toLocaleString()}</p>
              </div>
              <div className="summaryCard">
                <div className="summaryCard-header">
                  <p className="summaryLabel">Transactions</p>
                </div>
                <p className="summaryValue transactionValue">{expenses.length}</p>
              </div>
            </div>

            <div>
              <h3 className="sectionHeaderAnalytics">Recent Transactions</h3>
              {expenses.length === 0 ? (
                <div className="emptyState">
                  <span className="emptyState-icon"></span>
                  <p className="emptyState-text">No transactions yet</p>
                </div>
              ) : (
                <div className="transactionsList">
                  {recentExpenses.map((expense) => (
                    <div key={expense.id} className="transactionItem">
                      <div className="transactionDetails">
                        <div className="transactionName">{expense.name}</div>
                        <div className="transactionMeta">
                          <span className="transactionDate">{formatDate(expense.date)}</span>
                          <span className="transactionTime">{formatTime(expense.date)}</span>
                        </div>
                      </div>
                      <div className="transactionAmount">{Number(expense.amount).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="monthlyBreakdown">
              <h3 className="sectionHeader">Monthly Spending</h3>
              {data.length === 0 ? (
                <div className="emptyState">
                  <p className="emptyState-text">No monthly data available</p>
                </div>
              ) : (
                <div>
                  {data.map((month) => {
                    const percentage = ((month.expenses / month.budget) * 100) || 0;
                    const isOverBudget = percentage > 100;
                    return (
                      <div key={month.name} className="monthlyItem">
                        <div className="monthlyHeader">
                          <span className="monthName">{month.name}</span>
                          <span className="monthStats">
                            ${month.expenses.toLocaleString()} <span>/ ${month.budget.toLocaleString()}</span>
                          </span>
                        </div>
                        <div className="progressBarContainer">
                          <div 
                            className={`progressFill ${isOverBudget ? 'overBudget' : ''}`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                        <div className={`percentageIndicator ${isOverBudget ? 'overBudget' : ''}`}>
                          {percentage.toFixed(1)}% spent
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <button className="analyticsCloseBtn" onClick={() => setShowReport(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Analytics;