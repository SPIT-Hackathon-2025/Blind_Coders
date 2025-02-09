import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, Popup } from 'react-leaflet';
import { getFirestore, collection, getDocs } from 'firebase/firestore'; // Firebase Firestore
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

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

const eventIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'blue-icon'
});

function MapView() {
  const [userLocation, setUserLocation] = useState(null);
  const [reportsList, setReportsList] = useState([]);
  const db = getFirestore(); // Initialize Firestore instance
  const defaultPosition = [19.0760, 72.8777]; // Mumbai center

  // Fetch the report data from Firestore
  useEffect(() => {
    const fetchReportsData = async () => {
      try {
        const reportsCollection = collection(db, 'reports');
        const querySnapshot = await getDocs(reportsCollection);
    
        const fetchedReports = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          console.log (data)
          const locationParts = data.location.split(',');
    
          // Parse the latitude and longitude from the location string
          const latitudeStr = locationParts[0]?.split(':')[1]?.trim();
          const longitudeStr = locationParts[1]?.split(':')[1]?.trim();
    
          const latitude = parseFloat(latitudeStr);
          const longitude = parseFloat(longitudeStr);
    
          // Check if latitude and longitude are valid numbers
          if (!latitude || !longitude) {
            console.error('Invalid location data for report', doc.id, data.location);
            return; // Skip this report if location is invalid
          }
    
          // Add the valid report to the fetchedReports array
          fetchedReports.push({
            id: doc.id,
            title: data.title,
            issueType: data.issueType,
            imageUrl: data.imageUrl,
            location: data.location,
            latitude: latitude,
            longitude: longitude,
            email: data.email,
            status: data.status,
            timestamp: data.timestamp,
            flaggedCount: data.flaggedCount,
            verificationCount: data.verificationCount
          });
        });
    
        setReportsList(fetchedReports); // Set the valid reports to the state
      } catch (error) {
        console.error('Error fetching reports from Firebase:', error);
      }
    };
    
    fetchReportsData();
  }, [db]); // Run the fetch function when the component mounts

  // Fetch user's location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
        },
        (error) => {
          console.error("Error getting location", error);
        }
      );
    }
  }, []);

  return (
    <div className="map-container" style={{ display: 'flex', height: '600px', width: '100%' }}>
      <div className="map-wrapper" style={{ flex: 1 }}>
        <MapContainer
          center={userLocation || defaultPosition}
          zoom={6}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {/* Display the user's location on the map */}
          {userLocation && (
            <Marker position={userLocation} icon={userIcon}>
              <Tooltip permanent direction="top" offset={[0, -20]}>
                Your Location
              </Tooltip>
            </Marker>
          )}
          {/* Display reports on the map */}
          {reportsList.map((report) => (
            <Marker
              key={report.id}
              position={[report.latitude, report.longitude]}
              icon={eventIcon}
            >
              <Tooltip permanent direction="top" offset={[0, -20]}>
                <div className="tooltip-title">{report.title}</div>
                <div className="tooltip-status">{report.status}</div>
              </Tooltip>
              <Popup>
                <div className="report-popup">
                  <h3>{report.title}</h3>
                  <p><strong>Email:</strong> {report.email}</p>
                  <p><strong>Issue Type:</strong> {report.issueType}</p>
                  <p><strong>Flagged Count:</strong> {report.flaggedCount}</p>
                  <p><strong>Verification Count:</strong> {report.verificationCount}</p>
                  <p><strong>Status:</strong> {report.status}</p>
                  <p><strong>Timestamp:</strong> {new Date(report.timestamp).toLocaleString()}</p>
                  {report.imageUrl && (
                    <img src={report.imageUrl} alt="Report" style={{ maxWidth: '100%' }} />
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}

export default MapView;