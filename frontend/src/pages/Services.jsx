import Card from "../components/ServiceCard"
import "../clientCss/Services.css"

const Services = () =>{
    return(
        <div>
            <p className="titleWrapper">SERVICES</p>
            <div className="container">
            <div className="service-container">
                <Card></Card>
                <Card></Card>
                <Card></Card>
                <Card></Card>
            </div>
            </div>
        </div>
    )
}

export default Services;