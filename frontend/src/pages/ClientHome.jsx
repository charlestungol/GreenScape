import "../clientCss/Dashboard.css";
import Budget from "../dashboard/Budget.jsx";
import Expenses from "../dashboard/Expenses.jsx";
import FinishedServices from "../dashboard/FinishedServices.jsx";
import Quote from "../dashboard/Quote.jsx";
import RunningServices from "../dashboard/RunningServices.jsx";
import Time from '../dashboard/Timeboard.jsx';
import Remain from '../dashboard/RemainingBudget.jsx';
import Progress from '../dashboard/Progress.jsx';
import Analytics from "../dashboard/Analytics.jsx";
import Maps from "../dashboard/Maps.jsx";

const Home = () => {
  return (
    <div className="mainArea">
      <div className="dashboardContainer">
        <div className="dashboardWrapper">
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
      </div>
    </div>
  );
};

export default Home;
