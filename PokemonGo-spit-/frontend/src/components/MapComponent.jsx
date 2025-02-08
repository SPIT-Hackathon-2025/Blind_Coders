// MapComponent.js
import React from 'react';

function MapComponent({ latitude, longitude }) {
  const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=15&size=600x300&maptype=roadmap
  &markers=color:red%7Clabel:L%7C${latitude},${longitude}&key=YOUR_API_KEY`; // Use your API key

  return (
    <div>
      <img src={mapUrl} alt="Location Map" className="w-full h-auto rounded-lg mb-4" />
    </div>
  );
}

export default MapComponent;
