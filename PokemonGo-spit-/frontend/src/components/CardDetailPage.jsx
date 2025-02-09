import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebase'; // Import Firestore db instance
import { auth } from '../firebase'; // Import Firebase Authentication
import { doc, getDoc, collection, query, orderBy, onSnapshot, addDoc } from 'firebase/firestore';

function CardDetailPage() {
  const { id } = useParams(); // Get the card id from the URL
  const [cardDetails, setCardDetails] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    // Fetch the card details from Firestore using the ID
    const cardRef = doc(db, 'reports', id); // 'reports' is your collection name
    getDoc(cardRef)
      .then((docSnapshot) => {
        if (docSnapshot.exists()) {
          setCardDetails(docSnapshot.data());
        } else {
          console.log('No such document!');
        }
      })
      .catch((error) => {
        console.error('Error fetching document:', error);
      });

    // Optionally, fetch comments if they are stored in a subcollection 'comments'
    const commentsRef = collection(cardRef, 'comments'); // Access 'comments' subcollection
    const commentsQuery = query(commentsRef, orderBy('timestamp'));

    // Real-time listener to fetch comments
    const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
      const commentsData = snapshot.docs.map((doc) => doc.data());
      setComments(commentsData);
    });

    return () => unsubscribe(); // Clean up the listener on unmount

  }, [id]);

  const handleCommentSubmit = () => {
    if (!auth.currentUser) {
      alert("You must be logged in to comment.");
      return;
    }
  
    if (newComment.trim()) {
      const userEmail = auth.currentUser.email; // Ensure the user is authenticated
  
      const commentRef = collection(db, 'reports', id, 'comments'); // Access subcollection
      addDoc(commentRef, {
        text: newComment,
        timestamp: new Date().toISOString(),
        userEmail: userEmail, // Save the user's email
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

          {/* Flexbox layout for text and image */}
          <div className="flex flex-col md:flex-row md:space-x-6 mb-6">
            {/* Text section */}
            <div className="flex-1">
              <p>Posted by: {cardDetails.email}</p>
              <p>Posted on: {cardDetails.timestamp}</p>
              <p>Location: {cardDetails.location}</p>
            </div>

            {/* Image section */}
            <div className="md:w-1/2 lg:w-1/3">
              <img
                className="w-full h-auto rounded-lg shadow-lg object-cover"
                src={cardDetails.imgUrl}
                alt={cardDetails.title}
              />
            </div>
          </div>

          {/* Map displaying location */}
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

          {/* Discussion Forum */}
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

          {/* Comment Input */}
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
