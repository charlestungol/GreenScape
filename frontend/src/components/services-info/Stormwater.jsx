import '../clientCss/ServiceInfo.css';  
import { useNavigate } from 'react-router-dom';

const Stormwater= () =>{
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
              <h2 className="card-title">STORMWATER MANAGEMENT</h2>
              <div className="title-underline"></div>
            </div>
            <div className="card-content">
              <p className="card-description">
                Certified Stormwater Management Designs
                Stormwater – Leading the Way in Stormwater Harvesting & Recycling
                Create architectural and emotional interest with the soft glow of carefully crafted shapes and subtle lines. Our lighting systems are designed to infuse your outdoor spaces with a serene atmosphere, fostering a sense of peace and tranquility. From accent lighting for your home to landscape and pathway lighting, we enhance the beauty of your property while adding a layer of security. Let us design and install a lighting solution that elevates your space, creating an inviting and secure environment that you’ll enjoy day and night.
                With the rapid advancement of technology, we now incorporate cutting-edge solutions like Wi-Fi integration, flow sensors, and soil sensors to optimize the performance and efficiency of our stormwater systems. These technologies allow for real-time monitoring and management, ensuring that irrigation is both effective and environmentally responsible. Our systems are intelligent, responsive, and adaptive to changing weather conditions, helping to reduce operational costs and maximize water savings.
                Our in-house, accredited designer has extensive experience in creating custom stormwater management systems. From residential and commercial installations to large-scale projects like golf courses, our designer has completed comprehensive drawings and plans that meet the highest industry standards.
                Whether you’re looking to harvest rainwater for irrigation or develop a complete stormwater management strategy, Greenscape is here to provide the expertise and technology to meet your needs.
              </p>
            </div>
          </div>     
        </div>
        <div className="bg-accent"></div>
      </div>
    </div>
    )
}

export default Stormwater;