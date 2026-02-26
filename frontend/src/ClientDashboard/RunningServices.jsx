import "../App.css";

function RunningServices({ percentage = 85, dayValue = 2 }) {
  const radius = 70;
  const circumference = Math.PI * radius; 
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="runningWrapper clickable">
      <div className="ringWrapper">
        <br/>
        <svg width="160" height="90">
          {/* Background half-circle */}
          <circle
            className="ringBg"
            cx="80"
            cy="80"
            r={radius}
            strokeWidth="12"
            fill="none"
            stroke="#eee"
            strokeDasharray={circumference}
            strokeDashoffset={0}
            transform="rotate(-180 80 80)"
          />

          {/* Progress */}
          <circle
            className="ringProgress"
            cx="80"
            cy="80"
            r={radius}
            strokeWidth="50"
            fill="none"
            stroke="#1c3d37"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-180 80 80)"
          />
        </svg>

        <div className="ringText">{percentage}%</div>
        <div className="detailText">
          <div>Landscape Lighting</div>
          <div>Target: {dayValue} days</div>
        </div>
      </div>
    </div>
  );
}

export default RunningServices;
