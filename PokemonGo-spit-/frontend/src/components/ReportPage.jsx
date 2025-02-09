import React, { useState, useEffect } from "react";
import { storage } from "../firebase"; // Import Firebase storage and Firestore
import { collection, addDoc, getFirestore, doc, updateDoc } from "firebase/firestore"; // Correct imports for Firestore v9+
import { getAuth } from "firebase/auth"; // Import Firebase Authentication
import { useNavigate } from "react-router-dom";

function ReportPage() {
  const [imageUrl, setImageUrl] = useState(""); // Track image URL
  const [location, setLocation] = useState("");
  const [status] = useState("pending");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [issueType, setIssueType] = useState(""); // Track issueType
  const [description, setDescription] = useState(""); // Track description
  const [title, setTitle] = useState(""); // Track title
  const [user, setUser] = useState(null); // Track user authentication status
  const navigate = useNavigate();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        setUser(currentUser); // Set user if authenticated
      } else {
        setUser(null); // Clear user if not authenticated
      }
    });

    // Check geolocation if the user is authenticated
    if (user) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setLocation(`Lat: ${latitude}, Lon: ${longitude}`);
          },
          (error) => {
            switch (error.code) {
              case error.PERMISSION_DENIED:
                alert("Location permission denied. Please allow access.");
                break;
              case error.POSITION_UNAVAILABLE:
                alert("Location information is unavailable.");
                break;
              case error.TIMEOUT:
                alert("Location request timed out.");
                break;
              default:
                alert("An unknown error occurred while fetching location.");
            }
            console.error("Geolocation error:", error);
          }
        );
      } else {
        alert("Geolocation is not supported by this browser.");
      }
    }

    return () => unsubscribe(); // Cleanup on unmount
  }, [user]);

  const handleImageUrlChange = (e) => {
    setImageUrl(e.target.value); // Update the image URL when the user enters it
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      alert("Please log in to submit a report.");
      return; // Exit if user is not authenticated
    }

    if (!title || !imageUrl || !location || !issueType || !description) {
      alert("Please provide all required details.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Initialize Firestore using imported `db` from firebaseConfig
      const db = getFirestore(); // Ensure db is correctly initialized

      // Add report data to Firestore
      const reportRef = await addDoc(collection(db, "reports"), {
        email: user.email, // Store the user's email from Firebase Authentication
        title: title, // Store the title
        issueType: issueType,
        location: location,
        description: description,
        imageUrl: imageUrl, // Store the image URL
        status: "pending",
        timestamp: new Date().toISOString(),
        flaggedCount: 0,  // Initial flagged count
        verificationCount: 0,  // Initial verification count
      });

      // After the report is added, store the generated reportId
      const reportId = reportRef.id;
      console.log("Report ID:", reportId);  // You can log it or use it as needed.

      // Optionally, you can update the report document to include the reportId (if needed)
      await updateDoc(doc(db, "reports", reportId), {
        reportId: reportId
      });

      alert("Report submitted successfully!");

      // Reset form
      setImageUrl("");
      setTitle("");
      setIssueType("");
      setDescription("");
      e.target.reset();
    } catch (error) {
      console.error("Error submitting report:", error);
      alert(`Failed to submit report: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-6 text-center">Store Issue Report</h2>
        {user ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block mb-2 text-sm font-medium">Title:</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-md focus:outline-none"
                placeholder="Enter the title"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium">Location:</label>
              <input
                type="text"
                value={location}
                readOnly
                className="w-full px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-md focus:outline-none"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium">Issue Type:</label>
              <select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-md focus:outline-none"
                required
              >
                <option value="">Select Issue Type</option>
                <option value="lnf">Lost and Found (lnf)</option>
                <option value="ann">Announcements (ann)</option>
                <option value="e">Events (e)</option>
              </select>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium">Description:</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows="4"
                className="w-full px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-md focus:outline-none"
                placeholder="Describe the issue here"
                required
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium">Image URL:</label>
              <input
                type="url"
                value={imageUrl}
                onChange={handleImageUrlChange}
                required
                className="w-full px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-md focus:outline-none"
                placeholder="Enter image URL"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium">Timestamp:</label>
              <input
                type="text"
                value={new Date().toLocaleString()}
                readOnly
                className="w-full px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-md focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full font-semibold py-2 rounded-md focus:outline-none focus:ring-2 ${
                isSubmitting
                  ? "bg-gray-600 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500"
              }`}
            >
              {isSubmitting ? "Submitting..." : "Submit Report"}
            </button>
          </form>
        ) : (
          <div className="text-center">
            <p className="text-lg mb-4">You must be logged in to submit a report.</p>
            <button
              onClick={() => navigate("/")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md"
            >
              Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReportPage;
