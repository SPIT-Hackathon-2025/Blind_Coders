import React, { useState, useEffect } from "react";

function ReportPage() {
  const [imageBase64, setImageBase64] = useState("");
  const [location, setLocation] = useState("");
  const [status] = useState("pending");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [issueType, setIssueType] = useState(""); // Track issueType
  const [description, setDescription] = useState(""); // Track description

  useEffect(() => {
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
  }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];

    if (!file) return;
    
    // Restrict file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size should be less than 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => setImageBase64(reader.result);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!imageBase64 || !location || !issueType || !description) {
      alert("Please provide all required details.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create FormData object
      const formData = new FormData();
      
      // Convert base64 to file
      const base64Response = await fetch(imageBase64);
      const blob = await base64Response.blob();
      const imageFile = new File([blob], "report-image.jpg", { type: 'image/jpeg' });
      
      // Append all required fields
      formData.append("image", imageFile);
      formData.append("email", "harshitheroh5@gmail.com");
      formData.append("issueType", issueType); // Use the selected issueType
      formData.append("location", location);
      formData.append("description", description); // Add description field

      const response = await fetch("http://localhost:5000/api/reports/submit", {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        alert("Report submitted successfully!");
        // Reset form
        setImageBase64("");
        setIssueType("");
        setDescription("");
        e.target.reset();
      } else {
        throw new Error(data.error || "Failed to submit report");
      }
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
        <form onSubmit={handleSubmit} className="space-y-6">
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
            <label className="block mb-2 text-sm font-medium">Upload Image:</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              required
              className="w-full px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-md focus:outline-none"
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
      </div>
    </div>
  );
}

export default ReportPage;
