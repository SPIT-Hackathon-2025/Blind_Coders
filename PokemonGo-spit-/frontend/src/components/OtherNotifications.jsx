import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFirestore, collection, getDocs } from 'firebase/firestore'; // Import necessary Firebase methods
import Card from './Card';

// Helper function to calculate the distance between two coordinates (in kilometers)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
};

function OtherNotifications() {
  const navigate = useNavigate();
  const [eventNotifications, setEventNotifications] = useState([]);
  const [announcementNotifications, setAnnouncementNotifications] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const db = getFirestore(); // Firebase Firestore instance

  // Fetch user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ latitude, longitude });
        },
        (error) => {
          console.error("Error getting location", error);
        }
      );
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch reports collection from Firebase Firestore
        const reportsCollection = collection(db, "reports");
        const querySnapshot = await getDocs(reportsCollection);

        const events = [];
        const announcements = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();

          // Make sure the data has all required fields
          if (data.issueType === "e") {
            events.push({
              id: data.reportId,
              image: data.imageUrl,
              title: data.title || "Unknown",
              description: data.description||"Unknown",
              location: data.locationCoordinates, // Assuming location is stored as { lat, lon }
            });
          } else if(data.issueType === "ann") {
            announcements.push({
              id: data.reportId,
              image: data.imageUrl,
              title: data.title || "Unknown",
              description: data.description||"Unknown",
              location: data.locationCoordinates, // Assuming location is stored as { lat, lon }
            });
          }
        });

        // Sort events by distance (nearest first) and calculate distance
        if (userLocation) {
          events.sort((a, b) => {
            const distanceA = calculateDistance(userLocation.latitude, userLocation.longitude, a.location.lat, a.location.lon);
            const distanceB = calculateDistance(userLocation.latitude, userLocation.longitude, b.location.lat, b.location.lon);
            a.distance = distanceA.toFixed(2); // Save the distance to display
            b.distance = distanceB.toFixed(2); // Save the distance to display
            return distanceA - distanceB; // Nearest first
          });

          // Sort announcements by distance (nearest first) and calculate distance
          announcements.sort((a, b) => {
            const distanceA = calculateDistance(userLocation.latitude, userLocation.longitude, a.location.lat, a.location.lon);
            const distanceB = calculateDistance(userLocation.latitude, userLocation.longitude, b.location.lat, b.location.lon);
            a.distance = distanceA.toFixed(2); // Save the distance to display
            b.distance = distanceB.toFixed(2); // Save the distance to display
            return distanceA - distanceB; // Nearest first
          });
        }

        setEventNotifications(events);
        setAnnouncementNotifications(announcements);
      } catch (error) {
        console.error('Error fetching data from Firebase:', error);
      }
    };

    fetchData();
  }, [db, userLocation]);

  const handleEventCardClick = (eventId) => {
    navigate(`/discussion/${eventId}`);
  };

  const handleAnnouncementCardClick = (announcementId) => {
    navigate(`/discussion/${announcementId}`);
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Event Notifications</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {eventNotifications.map((event) => (
          <Card
          key={event.id}
          image={event.image}
          title={event.title}
          description={`${event.description}`} // Corrected string interpolation with curly braces
          onClick={() => handleEventCardClick(event.id)}
        />
        ))}
      </div>

      <h2 className="text-2xl font-semibold mb-4">Announcements</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {announcementNotifications.map((announcement) => (
          <Card
          key={announcement.id}
          image={announcement.image}
          title={announcement.title}
          description={`${announcement.description}`} // Corrected string interpolation
          onClick={() => handleAnnouncementCardClick(announcement.id)}
        />
        ))}
      </div>
    </div>
  );
}

export default OtherNotifications;
