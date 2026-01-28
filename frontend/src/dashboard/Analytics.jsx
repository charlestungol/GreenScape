import { useState } from "react";
import "../clientCss/Dashboard.css";
import {
  BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from "recharts";

function Analytics() {
  const [showReport, setShowReport] = useState(false);

  // Add 'budget' for comparison
  const data = [
    { name: "Jan", budget: 1500, expenses: 1200 },
    { name: "Feb", budget: 1000, expenses: 300 },
    { name: "Mar", budget: 2000, expenses: 270 },
    { name: "Apr", budget: 800, expenses: 570 },
    { name: "May", budget: 1200, expenses: 100 },
  ];

  return (
    <div className="analyticsWrapper">
      <p>BUDGET VS EXPENSE</p>

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
            {/* Budget bars */}
            <Bar dataKey="budget" fill="#65be69" barSize={25} />
            {/* Expense bars */}
            <Bar dataKey="expenses" fill="#06632b" barSize={25} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {showReport && (
        <div className="overlay">
          <div className="overlayContent">
            <h2>Monthly Service Report</h2>

            <p>This report shows the analytics summary for the selected period.</p>

            <ul>
              <li><strong>Total Months:</strong> {data.length}</li>
              <li><strong>Highest Expenses:</strong> ${Math.max(...data.map(d => d.expenses))}</li>
              <li><strong>Lowest Expenses:</strong> ${Math.min(...data.map(d => d.expenses))}</li>
              <li><strong>Total Expenses:</strong> ${data.reduce((sum, d) => sum + d.expenses, 0)}</li>
              <li><strong>Total Budget:</strong> ${data.reduce((sum, d) => sum + d.budget, 0)}</li>
            </ul>

            <button
              className="closeBtn"
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
