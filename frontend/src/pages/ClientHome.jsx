import "../clientCss/Dashboard.css";
import Budget from "../ClientDashboard/Budget.jsx";
import Expenses from "../ClientDashboard/Expenses.jsx";
import FinishedServices from "../ClientDashboard/FinishedServices.jsx";
import Quote from "../ClientDashboard/Quote.jsx";
import RunningServices from "../ClientDashboard/RunningServices.jsx";
import Time from '../ClientDashboard/Timeboard.jsx';
import Report from '../ClientDashboard/Report.jsx';
import Progress from '../ClientDashboard/Progress.jsx';
import Analytics from "../ClientDashboard/Analytics.jsx";
import Maps from "../ClientDashboard/Maps.jsx";

const Home = () => {
  return (
      <div className="dashboardContainer">
          <div className="titleWrapper">
            CLIENT DASHBOARD
          </div>
          <div className="firstLayerBoard">
            <div className="leftColumn">
              <Budget/>
              <Expenses/>
              <Remain/>
              <div className="timeRow">
                <Time/>
                <Maps/>
              </div>
              <Quote/>
            </div>
            <div className="rightColumn">
              <Analytics/>
              {/* <Progress/> */}
              <div className="topServicesRow">
                <RunningServices/>
                <FinishedServices/>
              </div>
            </div>
          </div>
        </div>
  );
};

export default Home;
