import Card from '../../components/ServicesCard';
import { useNavigate } from 'react-router-dom';
import '../../components/clientCss/Services.css';
import serviceImage1 from '../../assets/img/service-img-1.jpg';
import serviceImage2 from '../../assets/img/service-img-2.jpg';
import serviceImage3 from '../../assets/img/service-img-3.png';
import serviceImage4 from '../../assets/img/service-img-4.jpg';

const Services = () => {
  const navigate = useNavigate();
  const handleBookNow = () => {
    navigate('/booking');
  };

  const generateQuote = () => {
    navigate('/request-quote')
  };

  return (
    <div>
      <div>
        <p className="servicesTitle">SERVICES</p>
      </div>
      <div className='serviceContainer'>
        <div className="cards-grid">
          <Card 
            title="IRRIGATION INSTALLATIONS"
            description="Sprinkler system installation"
            image={serviceImage1}
            altText="Sprinkler system installation"
            linkTo="/irrigation-installation"  
          />
          <Card 
            title="LANDSCAPE LIGHTING"
            description="Outdoor lighting design"
            image={serviceImage2}
            altText="Landscape lighting installation"
            linkTo="/landscape-lighting"  
          />
          <Card 
            title="STORMWATER MANAGEMENT"
            description="Drainage solutions"
            image={serviceImage3}
            altText="Stormwater management system"
            linkTo="/stormwater-management" 
          />
          <Card 
            title="MAINTENANCE SERVICE"
            description="System upkeep & repair"
            image={serviceImage4}
            altText="Irrigation maintenance service"
            linkTo="/maintenance-service"  
          />
        </div>


        <hr className="section-divider" />
        <div className="service-detail">
          <h3 className="detail-headline">
            Service / Spring Startup / Winterization
          </h3>
          <p className="detail-description">
            Book an appointment to have your irrigation system started in the
            spring or winterized in the fall. We warranty our work. We do
            underground sprinkler spring start ups / winterization in all of
            Calgary and surrounding area.
          </p>
          <div className="cta-group">
            <button className="btn btn-primary" onClick={handleBookNow}>BOOK NOW</button>
            <button className="btn btn-secondary" onClick={generateQuote}>REQUEST QUOTE</button>
          </div>
        </div>
        <div className="warranty-section">
          <h4 className="warranty-title">Warranty Terms and Conditions</h4>
          <p className="warranty-text">
            All Greenscape Irrigation residential systems include a 2 year
            warranty. The warranty covers all parts and labour on systems
            maintained by Greenscape Irrigation. This warranty does not cover
            vandalized or broken materials, or damages caused as a result of
            negligence or unauthorised repairs and maintenance. Greenscape
            Irrigation cannot warrant any service or repairs performed on the
            irrigation system by any persons or contractors other than those
            employed by Greenscape Irrigation. Any such unauthorised repairs,
            service or maintenance shall be grounds for cancellation of the
            remaining warranty.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Services;