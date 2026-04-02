import "../../components/clientCss/Dashboard.css";
import Budget from "../../ClientDashboard/Budget.jsx";
import Expenses from "../../ClientDashboard/Expenses.jsx";
import ServiceLocations from "../../ClientDashboard/ServiceLocations.jsx";
import Quote from "../../ClientDashboard/Quote.jsx";
import RunningServices from "../../ClientDashboard/RunningServices.jsx";
import Time from '../../ClientDashboard/Timeboard.jsx';
import Remain from '../../ClientDashboard/RemainingBudget.jsx';
import Analytics from "../../ClientDashboard/Analytics.jsx";
import Maps from "../../ClientDashboard/Maps.jsx";
import ChatbotWidget from "../../components/ChatbotWidget";

const Home = () => {
  return (
    <div>
      <div className="titleWrapper">DASHBOARD</div>
      <div className="dashboardContainer">
        <div>
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
              <div className="topServicesRow">
                <ServiceLocations/>
                <RunningServices/>
              </div>
            </div>
          </div>
        </div>

        <ChatbotWidget />
      </div>
      </div>
  );
};

export default Home;