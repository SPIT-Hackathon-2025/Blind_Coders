import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, useMap, Circle, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Custom markers with different colors
const userIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'red-icon'
});

const nearbyEventIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'blue-icon'
});

const farEventIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'gray-icon'
});

// Enhanced demo event data with more spread out locations
const demoEventLocations = [
  // Nearby events (Mumbai)
  {
    latitude: 19.0760,
    longitude: 72.8777,
    title: 'Tech Summit 2025',
    description: 'Annual Technology Conference',
    venue: 'BKC Convention Center',
    date: '2025-03-15',
    time: '10:00 AM',
    type: 'conference'
  },
  {
    latitude: 19.0896,
    longitude: 72.8656,
    title: 'Startup Networking',
    description: 'Connect with Fellow Entrepreneurs',
    venue: 'Bandra Co-working Space',
    date: '2025-03-20',
    time: '5:30 PM',
    type: 'meetup'
  },
  // Distant events (Other cities)
  {
    latitude: 18.5204,
    longitude: 73.8567,
    title: 'Pune Dev Conference',
    description: 'Developer Conference & Workshop',
    venue: 'Pune Tech Park',
    date: '2025-03-25',
    time: '9:00 AM',
    type: 'conference'
  },
  {
    latitude: 12.9716,
    longitude: 77.5946,
    title: 'Bangalore AI Summit',
    description: 'AI/ML Conference',
    venue: 'Bangalore Convention Center',
    date: '2025-04-01',
    time: '2:00 PM',
    type: 'conference'
  },
  {
    latitude: 28.6139,
    longitude: 77.2090,
    title: 'Delhi Tech Week',
    description: 'Technology Exhibition',
    venue: 'Delhi Exhibition Center',
    date: '2025-04-05',
    time: '10:00 AM',
    type: 'exhibition'
  }
];

function LocationMarker({ position, setUserLocation }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.setView(position, map.getZoom());
    }
  }, [position, map]);

  return position ? (
    <>
      <Marker position={position} icon={userIcon}>
        <Tooltip permanent direction="top" offset={[0, -20]} className="custom-tooltip">
          Your Location
        </Tooltip>
      </Marker>
      <Circle 
        center={position}
        radius={20000}
        pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.1 }}
      />
    </>
  ) : null;
}

function MapView() {
  const [userLocation, setUserLocation] = useState(null);
  const [eventsList, setEventsList] = useState([]);
  const defaultPosition = [19.0760, 72.8777]; // Mumbai center

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const updateEvents = (position) => {
    if (!position) return;

    const eventsWithDistance = demoEventLocations.map(event => ({
      ...event,
      distance: calculateDistance(
        position[0],
        position[1],
        event.latitude,
        event.longitude
      ),
      isNearby: false
    }));

    // Mark events as nearby or distant
    const updatedEvents = eventsWithDistance.map(event => ({
      ...event,
      isNearby: event.distance <= 20 // Only mark as nearby if distance is <= 20 km
    }));

    setEventsList(updatedEvents);
  };

  useEffect(() => {
    let watchId;

    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const newPosition = [position.coords.latitude, position.coords.longitude];
          setUserLocation(newPosition);
          updateEvents(newPosition);
        },
        (error) => {
          console.error('Error getting location:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    }

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  return (
    <div className="map-container" style={{ display: 'flex', height: '600px', width: '100%' }}>
      <div className="map-wrapper" style={{ flex: 1 }}>
        <MapContainer 
          center={userLocation || defaultPosition} 
          zoom={6} // Zoomed out to show more events
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          <LocationMarker position={userLocation} setUserLocation={setUserLocation} />

          {eventsList.map((event, index) => (
            <Marker
              key={index}
              position={[event.latitude, event.longitude]}
              icon={event.isNearby ? nearbyEventIcon : farEventIcon}
            >
              <Tooltip permanent direction="top" offset={[0, -20]} 
                className={`custom-tooltip ${event.isNearby ? 'nearby' : 'distant'}`}>
                <div className="tooltip-title">{event.title}</div>
                <div className="tooltip-distance">({event.distance.toFixed(1)} km away)</div>
              </Tooltip>
              <Popup>
                <div className="event-popup">
                  <h3>{event.title}</h3>
                  <p>{event.description}</p>
                  <p><strong>Venue:</strong> {event.venue}</p>
                  <p><strong>Date:</strong> {event.date}</p>
                  <p><strong>Time:</strong> {event.time}</p>
                  <p><strong>Type:</strong> {event.type}</p>
                  <p><strong>Distance:</strong> {event.distance.toFixed(1)} km</p>
                  <p className="distance-note">
                    {event.isNearby ? '(Within 20km radius)' : '(Outside 20km radius)'}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Event List Section - Only show events within 20 km */}
      <div className="event-list" style={{ width: '300px', paddingLeft: '20px', overflowY: 'auto' }}>
        <h2>Events List</h2>
        {eventsList.filter(event => event.isNearby).length === 0 ? (
          <p>No events found nearby.</p>
        ) : (
          <ul>
            {eventsList.filter(event => event.isNearby).map((event, index) => (
              <li key={index}>
                <div className="event-item">
                  <div className={`event-type ${event.isNearby ? 'nearby' : 'distant'}`}>
                    {event.title} ({event.distance.toFixed(1)} km)
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}


export default MapView;
