import '../../App.css';
import BackgroundVideo from '../../assets/videos/vid_1.mp4';
import Logo from '../../assets/img/Logo.png';

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../../components/AxiosInstance';

const CompleteClientProfile = () => {
    const navigate = useNavigate();

    // State for form fields
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');

    const [address, setAddress] = useState({
    street: '',
    city: '',
    province: '',
    postalcode: '',
    });

    // State for error handling and submission status
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Handle form submission
    const handleSubmit = async () => {
    // Set error to none at the start of submission
    setError('');
    
    // Check if all fields are filled out
    if (
        !firstName ||
        !lastName ||
        !phone ||
        !address.street ||
        !address.city ||
        !address.province ||
        !address.postalcode
    ) {
        // If any field is missing, set an error message and stop submission
        setError('Please fill in all fields.');
        return;
    }

    try {
        // Indicate that submission is in progress
        setSubmitting(true);
        // Make API call to complete profile
        await AxiosInstance.post('customers/complete-profile/', {
        first_name: firstName,
        last_name: lastName,
        phone: phone,
        address: {
            street: address.street,
            city: address.city,
            province: address.province,
            postalcode: address.postalcode,
        },
        });

        // Profile completed successfully, redirect to home
        localStorage.setItem("profile_ready", "true");
        navigate('/home');
    } catch (err) {
        console.error(err.response || err);
        setError(
        err.response?.data
            ? JSON.stringify(err.response.data)
            : 'Something went wrong. Please try again.'
        );
    } finally {
        setSubmitting(false);
    }
    };

    return (
    <div className="myBackground">
        {/* Background video */}
        <video autoPlay muted loop className="backgroundVideo">
        <source src={BackgroundVideo} type="video/mp4" />
        </video>

        {/* Login form */}
        <div className="loginForm">
        <div className="landingContent">
            <img src={Logo} alt="Logo" className="landingLogo" />
        </div>

        <h3 style={{ marginBottom: '10px' }}>
            Complete Your Profile
        </h3>
        <p style={{ fontSize: '14px', textAlign: 'center' }}>
            We just need a few more details to finish setting up your account.
        </p>

        {/* Name fields */}
        <input
            maxLength={25}
            type="text"
            placeholder="First Name (Ex. John)"
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
        />

        <input
            maxLength={25}
            type="text"
            placeholder="Last Name (Ex. Doe)"
            value={lastName}
            onChange={e => setLastName(e.target.value)}
        />

        {/* Phone number field */}
        <input
            maxLength={10}
            type="text"
            placeholder="Phone Number (Ex. 1234567890)"
            value={phone}
            onChange={e => setPhone(e.target.value)}
        />

        {/* Address fields */}
        <input
            maxLength={50}
            type="text"
            placeholder="Street Address (Ex. 123 Main St)"
            value={address.street}
            onChange={e =>
            setAddress({ ...address, street: e.target.value })
            }
        />

        <input
            maxLength={25}
            type="text"
            placeholder="City (Ex. Calgary)"
            value={address.city}
            onChange={e =>
            setAddress({ ...address, city: e.target.value })
            }
        />

        <input
            maxLength={2}
            type="text"
            placeholder="Province (Ex. AB)"
            value={address.province}
            onChange={e =>
            setAddress({ ...address, province: e.target.value })
            }
        />
    
        <input
            maxLength={6}
            type="text"
            placeholder="Postal Code (Ex. T2X 1V4)"
            value={address.postalcode}
            onChange={e =>
            setAddress({ ...address, postalcode: e.target.value })
            }
        />

        <button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Saving...' : 'Complete Profile'}
        </button>

        {error && <p className="errorMsg">{error}</p>}
        </div>
    </div>
    );
};

export default CompleteClientProfile;