import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebase';
import { auth } from '../firebase';
import { doc, getDoc, collection, query, orderBy, onSnapshot, addDoc } from 'firebase/firestore';

const GOOGLE_MAPS_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY'; // Replace with your actual API Key

function CardDetailPage() {
  const { id } = useParams(); // Get the card id from the URL
  const [cardDetails, setCardDetails] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [placeName, setPlaceName] = useState(''); // State to store the place name
  const [distance, setDistance] = useState(''); // State to store the distance from user

  useEffect(() => {
    // Fetch the card details from Firestore using the ID
    const cardRef = doc(db, 'reports', id);
    getDoc(cardRef)
      .then((docSnapshot) => {
        if (docSnapshot.exists()) {
          setCardDetails(docSnapshot.data());
          fetchPlaceName(docSnapshot.data().lat, docSnapshot.data().lon);
        } else {
          console.log('No such document!');
        }
      })
      .catch((error) => {
        console.error('Error fetching document:', error);
      });

    // Optionally, fetch comments if they are stored in a subcollection 'comments'
    const commentsRef = collection(cardRef, 'comments');
    const commentsQuery = query(commentsRef, orderBy('timestamp'));

    // Real-time listener to fetch comments
    const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
      const commentsData = snapshot.docs.map((doc) => doc.data());
      setComments(commentsData);
    });

    return () => unsubscribe(); // Clean up the listener on unmount

  }, [id]);

  // Function to fetch place name using Geocoding API
  const fetchPlaceName = async (lat, lon) => {
    const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${GOOGLE_MAPS_API_KEY}`);
    const data = await response.json();
    console.log(data);
    if (data.status === 'OK') {
      setPlaceName(data.results[0].formatted_address);
    } else {
      setPlaceName('Location not found');
    }

    // Fetch user's current location and calculate distance
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const userLat = position.coords.latitude;
        const userLon = position.coords.longitude;
        const calculatedDistance = calculateDistance(userLat, userLon, lat, lon);
        setDistance(calculatedDistance);
      });
    }
  };

  // Function to calculate the distance between two points (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return distance.toFixed(2); // Return distance in km
  };

  const handleCommentSubmit = () => {
    if (!auth.currentUser) {
      alert('You must be logged in to comment.');
      return;
    }

    if (newComment.trim()) {
      const userEmail = auth.currentUser.email;

      const commentRef = collection(db, 'reports', id, 'comments');
      addDoc(commentRef, {
        text: newComment,
        timestamp: new Date().toISOString(),
        userEmail: userEmail,
      })
        .then(() => {
          setNewComment('');
        })
        .catch((error) => {
          console.error('Error posting comment:', error);
        });
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {cardDetails ? (
        <>
          <h1 className="text-3xl font-bold mb-4">{cardDetails.title}</h1>

          <div className="flex flex-col md:flex-row md:space-x-6 mb-6">
            <div className="flex-1">
              <p>Posted by: {cardDetails.email}</p>
              <p>Posted on: {new Date(cardDetails.timestamp).toLocaleString()}</p>
              <p>Description: {cardDetails.description}</p>
            </div>

            <div className="md:w-1/2 lg:w-1/3">
              <img
                className="w-full h-auto rounded-lg shadow-lg object-cover"
                src={cardDetails.imageUrl}
                

                alt={cardDetails.title}
              />
            </div>
          </div>

          <div className="mb-6">
            <iframe
              title="Map"
              src={`https://www.google.com/maps?q=${cardDetails.lat},${cardDetails.lon}&z=15&output=embed`}
              width="100%"
              height="400"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
            ></iframe>
          </div>

          

          <h2 className="text-2xl font-bold mb-4">Discussion Forum</h2>
          <div className="mb-4">
            {comments.map((comment, index) => (
              <div key={index} className="mb-2 p-3 bg-gray-800 rounded-md">
                <p>{comment.text}</p>
                <small>Posted by: {comment.userEmail}</small><br />
                <small>Posted on: {new Date(comment.timestamp).toLocaleString()}</small>
              </div>
            ))}
          </div>

          <div className="mb-6">
            <textarea
              className="w-full p-3 bg-gray-700 rounded-md text-white"
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <button
              className="mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              onClick={handleCommentSubmit}
            >
              Post Comment
            </button>
          </div>
        </>
      ) : (
        <p>Loading card details...</p>
      )}
    </div>
  );
}

export default CardDetailPage;
