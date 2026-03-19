import '../clientCss/ServiceInfo.css';  
import { useNavigate } from 'react-router-dom';

const Landscape= () =>{
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
              <div className="title-underline"></div>
            </div>
            <div className="card-content">
              <p className="card-description">
                Landscape lighting serves three major functions. Security, visual (pathway lighting) and beauty (home and landscape accent lighting). 
                The latter being the most popular as it serves to encompass all major functions according to design.
                Landscape lighting is low voltage (12 volt) which makes it less expensive to install and run as well as safer than conventional 120 volt lighting. 
                Lighting is controlled by a timer which can be preset to turn on and off at specific times. 
                Timers also have photo cells that will only allow the timer to turn lights on when it starts to get dark.Motion sensors can also be added to systems for added security.
                Enhance your homes curb appeal and showcase your property while spending more time enjoying the beauty of your landscaping well into the night.
              </p>
            </div>
            </div>
          </div>
    </div>
    </div>
    )
}

export default Landscape;