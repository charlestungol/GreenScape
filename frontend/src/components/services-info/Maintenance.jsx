import '../clientCss/ServiceInfo.css';  
import { useNavigate } from 'react-router-dom';

const Maintenance= () =>{
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
        <div>
          <div className="installation-card residential">
            <div className="card-header">
              <h2 className="card-title">Irrigation Service</h2>
              <div className="title-underline"></div>
            </div>
            <div className="card-content">
              <p className="card-description">
                At Greenscape, we pride ourselves on delivering top-notch service through our friendly, experienced technicians.
                Whether you have a residential or commercial irrigation system, we have the expertise to keep it running smoothly. 
                Our team is well-equipped to service a wide range of systems, including brands like Toro, Rain Bird, Irritrol, Hunter, and more.
                We do Backflow testing and send all information to the City.
              </p>
            </div>
          </div>
        </div>
        <div className="bg-accent"></div>
      </div>
    </div>
    )
}

export default Maintenance;