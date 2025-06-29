import React, { useState } from 'react';
import config from './config.json';

const Avatar = ({ size = 'normal', className = '' }) => {
  const [imageError, setImageError] = useState(false);
  
  const isImagePath = config.ai.avatar.includes('.png') || 
                     config.ai.avatar.includes('.jpg') || 
                     config.ai.avatar.includes('.jpeg') || 
                     config.ai.avatar.includes('.gif') || 
                     config.ai.avatar.includes('.svg');

  const handleImageError = () => {
    setImageError(true);
  };

  const getAvatarStyle = () => {
    switch (size) {
      case 'small':
        return { width: '24px', height: '24px', fontSize: '12px' };
      case 'large':
        return { width: '48px', height: '48px', fontSize: '24px' };
      case 'inline':
        return { width: '28px', height: '28px', fontSize: '14px' };
      default:
        return { width: '32px', height: '32px', fontSize: '16px' };
    }
  };

  const avatarStyle = {
    ...getAvatarStyle(),
    borderRadius: '50%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: isImagePath && !imageError ? 'transparent' : '#2d2d2d',
    border: '2px solid rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    flexShrink: 0
  };

  // If it's an image path and hasn't errored, show image
  if (isImagePath && !imageError) {
    return (
      <img
        src={config.ai.avatar}
        alt={`${config.ai.name} Avatar`}
        style={avatarStyle}
        className={`avatar-image ${className}`}
        onError={handleImageError}
      />
    );
  }

  // Otherwise show emoji fallback
  return (
    <div 
      style={avatarStyle}
      className={`avatar-emoji ${className}`}
    >
      {config.ai.avatarFallback}
    </div>
  );
};

export default Avatar; 