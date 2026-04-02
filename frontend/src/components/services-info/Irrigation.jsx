import '../clientCss/ServiceInfo.css';  
import { useNavigate } from 'react-router-dom';

const Irrigation = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/services'); 
  };

  return (
    <div>
      <div className="header-section">
      </div>
      <div className="back-button-container">
        <button className="btn-back" onClick={handleBack}>
           BACK TO SERVICES
        </button>
      </div>
      <div className="irrigation-container">
          <div className="installation-card residential">
            <div className="card-header">
              <h2 className="card-title">Residential Installations</h2>
              <div className="title-underline"></div>
            </div>
            <div className="card-content">
              <p className="card-description">
                From a simple front yard to sprawling acreages no job is too big or too small. 
                Typically an underground sprinkler system can be installed in one to two days. 
                After cleaning up your yard we will finish the job with a quick inspection and 
                final adjustment of the sprinkler system. Upon completion a representative from 
                the company will take you through the operation, watering schedule and maintenance 
                requirements of your new system. We will then train you on the controller so you 
                are set to operate and enjoy your new sprinkler system.
              </p>
            </div>
          </div>
          <div className="installation-card commercial">
            <div className="card-header">
              <h2 className="card-title">Commercial Installations</h2>
              <div className="title-underline"></div>
            </div>
            <div className="card-content">
              <p className="card-description">
                Commercial installations can cover a large array of projects. From plazas, 
                apartment buildings, strip malls or office buildings to large industrial properties, 
                parks and golf courses. Each project must be approached independently to analyze 
                the unique requirements needed to complete the project. Changing factors can be 
                size of property, landscaped areas, conduits under roadways, available water (GPM) 
                and water supply. Our certified designers and install technicians have worked on 
                many commercial projects including major systems that incorporate Rainfall harvesting 
                and storm water management. Learn more about commercial sprinklers (irrigation) by 
                contacting us.
              </p>
            </div>
          </div>
        </div>
        <div className="bg-accent"></div>
      </div>
    // </div>
  );
};

export default Irrigation;