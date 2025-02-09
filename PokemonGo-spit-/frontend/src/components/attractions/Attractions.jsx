import React, { useEffect, useState, useCallback } from 'react';
import { openDB } from 'idb';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../attractions/attraction.css';

const Attractions = ({ query }) => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [minRating, setMinRating] = useState(0);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState([12.921432, 100.85973]); // Default center
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [zoomedImage, setZoomedImage] = useState(null);

  // Function to calculate the center of the map based on the locations
  const calculateMapCenter = useCallback((locations) => {
    if (!locations || locations.length === 0) {
      return [12.921432, 100.85973]; // Default coordinates
    }

    const validLocations = locations.filter(
      loc => loc.latitude && loc.longitude && 
      !isNaN(parseFloat(loc.latitude)) && 
      !isNaN(parseFloat(loc.longitude))
    );

    if (validLocations.length === 0) {
      return [12.921432, 100.85973]; // Default coordinates
    }

    const sumLat = validLocations.reduce((sum, loc) => 
      sum + parseFloat(loc.latitude), 0);
    const sumLng = validLocations.reduce((sum, loc) => 
      sum + parseFloat(loc.longitude), 0);

    return [
      sumLat / validLocations.length,
      sumLng / validLocations.length
    ];
  }, []);

  useEffect(() => {
    const fetchAttractions = async () => {
      setLoading(true);

      try {
        const db = await openDB('AttractionsDB', 1, {
          upgrade(db) {
            if (!db.objectStoreNames.contains('attractions')) {
              db.createObjectStore('attractions', { keyPath: 'query' });
            }
          },
        });

        const cachedData = await db.get('attractions', query);

        if (cachedData) {
          console.log('Data loaded from IndexedDB');
          setLocations(cachedData.locations);
          setMapCenter(calculateMapCenter(cachedData.locations)); // Set center based on cached data
          setLoading(false);
          return;
        }

        const response = await fetch(`http://localhost:5000/fetch-attractions?query=${query}`, {
          method: 'GET',
         
          credentials: 'include',
        });

        if (response.status === 401) {
          console.error('Unauthorized User: Please log in again');
          setLoading(false);
          return;
        }

        const data = await response.json();

        if (data && Array.isArray(data.data) && data.data.length > 0) {
          setLocations(data.data);
          setMapCenter(calculateMapCenter(data.data)); // Set center based on fetched data

          // Save to IndexedDB
          await db.put('attractions', { query, locations: data.data });
          console.log('Data saved to IndexedDB');
        } else {
          setLocations([]);
        }
      } catch (error) {
        console.error('Error fetching locations:', error);
        setLocations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAttractions();
  }, [query, calculateMapCenter]);

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <span key={i} className={`star ${i < rating ? "filled" : ""}`}>★</span>
      );
    }
    return stars;
  };

  const handleRatingChange = (event) => {
    setMinRating(Number(event.target.value));
  };

  const filteredLocations = locations.filter((location) => location.rating >= minRating);

  const handleMarkerClick = (location) => {
    setSelectedLocation(location);
  };

  const attractionIcon = new Icon({
    iconUrl: '/images/image.png',
    iconSize: [50, 50],
  });

  function MapUpdater() {
    const map = useMap();

    useEffect(() => {
      if (selectedLocation) {
        const { latitude, longitude } = selectedLocation;
        if (latitude && longitude) {
          map.setView([parseFloat(latitude), parseFloat(longitude)], 13);
        }
      } else {
        map.setView(mapCenter, 13); // Use mapCenter for default or updated location center
      }
    }, [selectedLocation, mapCenter, selectedLocation, map]);

    return null;
  }

  return (
    <div>
      <div className="rating-filter">
        <label htmlFor="rating">Minimum Rating: </label>
        <input 
          type="range" 
          id="rating" 
          min="1" 
          max="5" 
          value={minRating} 
          onChange={handleRatingChange}
          step="0.1"
        />
        <span>{minRating} Stars</span>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : filteredLocations.length > 0 ? (
        <div className="location-grid">
          {filteredLocations.map((location, index) => (
            <div key={index} className="location-card">
              <img 
                src={location.photo?.images?.large?.url || "/images/image.png"} 
                alt={location.name || 'Location image'} 
                className="location-image"
                onClick={() => setZoomedImage(location.photo?.images?.original?.url)} 
              />
              <div className="location-info">
                <h3>{location.name}</h3>
                <p>{location.location_string}</p>
                <div className="rating">{renderStars(location.rating)}</div>
                <p>Rating: {location.rating}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>No results found</p>
      )}

      <div style={{ height: "400px", marginTop: "20px" }}>
        <MapContainer 
          center={mapCenter} 
          zoom={13} 
          style={{ height: "100%", width: "100%" }}
          key={mapCenter.join(',')}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {filteredLocations.map((location, index) => (
            <Marker
              key={index}
              position={[parseFloat(location.latitude), parseFloat(location.longitude)]}
              icon={attractionIcon}
              eventHandlers={{
                click: () => handleMarkerClick(location),
              }}
            >
              <Popup>
                <strong>{location.name}</strong><br />
                {location.location_string}<br />
                Rating: {location.rating} stars
              </Popup>
            </Marker>
          ))}
          <MapUpdater />
        </MapContainer>
      </div>

      {zoomedImage && (
        <div className="modal">
          <div className="modal-content">
            <img
              src={zoomedImage}
              alt="Zoomed"
              className="zoomed-image"
              onClick={() => setZoomedImage(null)} 
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Attractions;
