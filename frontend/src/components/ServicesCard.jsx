import { Link } from 'react-router-dom';

const ServicesCard = ({ title, image, description, altText, linkTo }) => {
  return (
    <Link to={linkTo} className="card-link" style={{ textDecoration: 'none', color: 'inherit' }}>
      <div className="card">
        <div className="card-image-container">
          <img src={image} alt={altText} className="card-image" />
        </div>
        <div className="card-title-container">
          {description && <p className="card-description">{description}</p>}
          <h3 className="card-title">{title}</h3>
        </div>
      </div>
    </Link>
  );
};

export default ServicesCard;