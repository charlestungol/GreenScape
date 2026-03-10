import '../clientCss/ServiceCard.css';

const ServiceCard = ({ title = "SERVICE", icon = null, onClick }) => {
  return (
    <div className='card-container' onClick={onClick}>
      {icon && <div className="card-icon">{icon}</div>}
      <h3 className='card-title'>
        {title}
      </h3>
    </div>
  );
};

export default ServiceCard;