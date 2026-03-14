import { useState } from 'react'; 
import { Box, Button, Paper, Alert, Typography, LinearProgress } from '@mui/material';
import '../../components/clientCss/ClientProfile.css';
import DefaultProfilePic from '../../assets/img/Profile.webp'; 

function ClientProfile() {
  // Initialize state directly from localStorage
  const [selectedImage, setSelectedImage] = useState(() => {
    const savedImage = localStorage.getItem('profileImage');
    return savedImage || DefaultProfilePic;
  });
  
  // New state for file size warning
  const [fileError, setFileError] = useState('');
  const [fileSize, setFileSize] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Maximum file size in bytes (5MB)
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        setFileError(`File too large! Maximum size is ${formatFileSize(MAX_FILE_SIZE)}. Your file: ${formatFileSize(file.size)}`);
        setFileSize(file.size);
        return;
      }

      // Clear any previous errors
      setFileError('');
      setFileSize(file.size);
      setIsUploading(true);

      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target.result);
        setIsUploading(false);
      };
      reader.onerror = () => {
        setFileError('Error reading file. Please try again.');
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    console.log('Saving profile image...');
    if (selectedImage && selectedImage !== DefaultProfilePic) {
      localStorage.setItem('profileImage', selectedImage);
      window.dispatchEvent(new Event('storage'));
      alert('Profile image saved!');
    }
  };

  const handleRemove = () => {
    if (window.confirm('Are you sure you want to remove your profile picture?')) {
      localStorage.removeItem('profileImage');
      window.dispatchEvent(new Event('storage'));
      setSelectedImage(DefaultProfilePic);
      setFileError('');
      setFileSize(null);
      alert('Profile picture removed!');
    }
  };

  const isDefaultImage = () => selectedImage === DefaultProfilePic;
  
  const hasImageChanged = () => {
    const savedImage = localStorage.getItem('profileImage');
    return selectedImage !== (savedImage || DefaultProfilePic);
  };

  return (
    <>
      <div className="titleWrapper">Profile</div>
      <Box className="profile-container">
        <Paper className="profile-paper">
          <Box className="image-wrapper">
            <img src={selectedImage} alt="Profile" className="profile-image" />
          </Box>

          {/* File size indicator */}
          {fileSize && !fileError && (
            <Box className="file-size-indicator">
              <Typography variant="body2" color="textSecondary">
                File size: {formatFileSize(fileSize)}
              </Typography>
              {fileSize > MAX_FILE_SIZE * 0.8 && (
                <Typography variant="caption" color="warning.main" display="block">
                  Warning: File is close to size limit
                </Typography>
              )}
            </Box>
          )}

          {/* File error alert */}
          {fileError && (
            <Alert severity="error" className="file-error" onClose={() => setFileError('')}>
              {fileError}
            </Alert>
          )}

          {/* Upload progress indicator */}
          {isUploading && (
            <Box className="upload-progress">
              <Typography variant="body2">Uploading...</Typography>
              <LinearProgress />
            </Box>
          )}

          <Box className="button-wrapper">
            <Button variant="contained" component="label" className="choose-button">
              Choose Image
              <input 
                type="file" 
                hidden 
                accept="image/*" 
                onChange={handleImageUpload}
                disabled={isUploading}
              />
            </Button>

            {!isDefaultImage() && (
              <Button 
                variant="outlined" 
                color="error" 
                onClick={handleRemove} 
                className="remove-button"
                disabled={isUploading}
              >
                Remove
              </Button>
            )}
          </Box>

          {hasImageChanged() && (
            <>
              <Box className="save-wrapper">
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={handleSave} 
                  className="save-button"
                  disabled={isUploading || fileError}
                >
                  Save Changes
                </Button>
              </Box>
              <Box className="cancel-wrapper">
                <Button
                  variant="text"
                  color="error"
                  onClick={() => {
                    const savedImage = localStorage.getItem('profileImage');
                    setSelectedImage(savedImage || DefaultProfilePic);
                    setFileError('');
                    setFileSize(null);
                  }}
                  className="cancel-button"
                  disabled={isUploading}
                >
                  Cancel
                </Button>
              </Box>
            </>
          )}

          {/* Size limit info */}
          <Box className="size-info">
            <Typography variant="caption" color="textSecondary">
              Maximum file size: 5MB. Supported formats: JPG, PNG, WEBP, GIF
            </Typography>
          </Box>
        </Paper>
      </Box>
    </>
  );
}

export default ClientProfile;