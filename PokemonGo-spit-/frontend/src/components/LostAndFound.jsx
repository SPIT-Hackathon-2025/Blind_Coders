import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFirestore, collection, getDocs } from 'firebase/firestore'; // Firebase Firestore
import Card from './Card'; // Reusable Card component

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

function LostAndFound() {
  const [lostAndFoundItems, setLostAndFoundItems] = useState([]);
  const [userLocation, setUserLocation] = useState(null); // To store user's location
  const navigate = useNavigate();
  const db = getFirestore(); // Initialize Firestore instance

  // Fetch user's location
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
        // Fetch the "reports" collection from Firestore
        const reportsCollection = collection(db, 'reports');
        const querySnapshot = await getDocs(reportsCollection);

        const filteredItems = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          console.log(data);
          // Only push items where the issueType is "lnf"
          if (data.issueType === "lnf") {
            filteredItems.push({
              id: data.reportId,
              image: data.imageUrl,
              title: data.title || "unknown",
              description: data.location,
              location: data.locationCoordinates, // Assuming location is stored as { lat, lon }
            });
          }
        });

        // Sort lost and found items by distance (nearest first) if user location is available
        if (userLocation) {
          filteredItems.sort((a, b) => {
            const distanceA = calculateDistance(userLocation.latitude, userLocation.longitude, a.location.lat, a.location.lon);
            const distanceB = calculateDistance(userLocation.latitude, userLocation.longitude, b.location.lat, b.location.lon);
            a.distance = distanceA.toFixed(2); // Add distance property
            b.distance = distanceB.toFixed(2); // Add distance property
            return distanceA - distanceB; // Sort by nearest distance
          });
        }

        setLostAndFoundItems(filteredItems); // Set the filtered and sorted items
      } catch (error) {
        console.error('Error fetching lost and found items from Firebase:', error);
      }
    };

    fetchData(); // Call the function to fetch data
  }, [db, userLocation]); // Depend on both db and userLocation

  const handleCardClick = (id) => {
    navigate(`/discussion/${id}`); // Navigate to the card detail page
  };

  return (
    <div className="bg-gray-900 p-4 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-white">Lost and Found</h2>
      {lostAndFoundItems.length > 0 ? (
        <div className="space-y-4"> {/* Vertical space between cards */}
          {lostAndFoundItems.map((item) => (
            <Card
              key={item.id}
              image={item.image} // Ensure the image field is correct
              title={item.title}
              description={`${item.description} - ${item.distance} km away`} // Display the distance
              onClick={() => handleCardClick(item.id)}
            />
          ))}
        </div>
      ) : (
        <p className="text-gray-400">No lost and found items available.</p>
      )}
    </div>
  );
}

export default LostAndFound;
