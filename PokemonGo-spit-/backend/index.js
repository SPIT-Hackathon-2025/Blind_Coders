const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
dotenv.config();

const userRoutes = require("./routes/userRoutes");
const reportRoutes = require("./routes/reportRoutes");

const app = express();
app.use(cors());
// Increase the request size limit
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: "http://localhost:3000", credentials: true }));

app.use("/uploads", express.static("uploads")); // Serve uploaded images

app.use("/api/users", userRoutes);
app.use("/api/reports", reportRoutes);

app.get("/", (req, res) => {
  res.send("Server is running");
});

// Import axios
const axios = require('axios'); // Add this line

// Function for geocoding using OpenStreetMap Nominatim API
async function geocode(address) {
    const response = await axios.get(`https://nominatim.openstreetmap.org/search?q=${address}&format=json`, {
        headers: {
            'User-Agent': 'tanmaychavan2214/1.0 (tanmaychavan2214@gmail.com)' // Customize with your app details
        }
    });
    return response.data;
}

app.get('/search-suggestions', async (req, res) => {
    const query = req.query.query ? req.query.query.toLowerCase() : '';
    
    try {
        // Geocoding the query using Nominatim API
        const data = await geocode(query);

        // Map the results to extract relevant location information (e.g., place name)
        const locations = data.map(location => location.display_name); // Adjust based on what information you want to return

        // Filter results based on user query
        const filteredLocations = locations.filter(location =>
            location.toLowerCase().includes(query)
        );

        res.status(200).json(filteredLocations);
    } catch (err) {
        console.error("Error fetching location:", err);
        res.status(500).json({ message: "Error fetching location", details: err.message });
    }
});

app.get("/fetch-hotels", async (req, res) => {
    
    try {
        const query = req.query.query || '';  
        const locationData = await geocode(query);  // Get geocode data based on the query
        if (locationData.length === 0) {
            return res.status(400).json({ message: "No location found" });
        }

        // Get latitude and longitude from geocode data
        const latitude = locationData[0].lat;
        const longitude = locationData[0].lon;

        // Use the latitude and longitude for the API request
        const url = 'https://travel-advisor.p.rapidapi.com/hotels/list-by-latlng';
        const params = {
            latitude: latitude,
            longitude: longitude,
            lunit: 'km',
            currency: 'USD',
            lang: 'en_US',
            search: query  // Assuming the external API accepts a 'search' parameter for filtering
        };

        const headers = {
            'x-rapidapi-key': process.env.RAPIDAPI_KEY, // Replace with your actual API key
            'x-rapidapi-host': process.env.RAPIDAPI_HOST
        };
        
        const response = await axios.get(url, { params, headers });
        // console.log("Hotel API Response:", response.data); 
        res.status(200).json(response.data);  // Send the correct data to the frontend
    } catch (err) {
        console.error("Error fetching hotels:", err);
        res.status(500).json({ message: "Error fetching hotels", details: err.message });
    }
});


app.get("/fetch-restaurants", async (req, res) => {
    try {
        const query = req.query.query || '';  
        const locationData = await geocode(query);  // Get geocode data based on the query
        if (locationData.length === 0) {
            return res.status(400).json({ message: "No location found" });
        }

        // Get latitude and longitude from geocode data
        const latitude = locationData[0].lat;
        const longitude = locationData[0].lon;

        // Define the API URL and parameters
        const url = 'https://travel-advisor.p.rapidapi.com/restaurants/list-by-latlng';
        const params = {
            latitude: latitude,
            longitude: longitude,
            limit: 30,
            currency: 'USD',
            distance: 2,
            open_now: false,
            lunit: 'km',
            lang: 'en_US'
        };

        const headers = {
            'x-rapidapi-key': process.env.RAPIDAPI_KEY,
            'x-rapidapi-host': process.env.RAPIDAPI_HOST
        };

        // Make the API request using Axios
        const response = await axios.get(url, { params, headers });

        // Return the data received from the API to the client
        res.status(200).json(response.data);
    } catch (err) {
        console.error("Error fetching restaurants:", err);
        res.status(500).json({ message: "Error fetching restaurants", details: err.message });
    }
});

app.get("/fetch-attractions", async (req, res) => {
    try {
        const query = req.query.query || '';  
        const locationData = await geocode(query);  // Get geocode data based on the query
        if (locationData.length === 0) {
            return res.status(400).json({ message: "No location found" });
        }


        // Get latitude and longitude from geocode data
        const latitude = locationData[0].lat;
        const longitude = locationData[0].lon;

        // Define the API URL and parameters
        const url = 'https://travel-advisor.p.rapidapi.com/attractions/list-by-latlng';
        const params = {
            latitude: latitude,
            longitude: longitude,
            lunit: 'km',
            currency: 'USD',
            lang: 'en_US'
        };

        // Define the headers
        const headers = {
            'x-rapidapi-key': process.env.RAPIDAPI_KEY,
            'x-rapidapi-host': process.env.RAPIDAPI_HOST
        };

        // Make the API request using Axios
        const response = await axios.get(url, { params, headers });
          
        // Return the data received from the API to the client
        res.status(200).json(response.data);
    } catch (err) {
        console.error("Error fetching attractions:", err);
        res.status(500).json({ message: "Error fetching attractions", details: err.message });
    }
});




const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});
app.post('/send-email', (req, res) => {
    const { eventTitle, eventDescription, eventVenue, eventDate, eventTime, eventDistance } = req.body;
  
    // Check if all required fields are provided
    if (!eventTitle || !eventDescription || !eventVenue || !eventDate || !eventTime || !eventDistance) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
  
    // Prepare the email options
    const mailOptions = {
      from: 'your-email@gmail.com', // Sender's email
      to: 'recipient-email@example.com', // Recipient's email
      subject: `Nearby Event: ${eventTitle}`,
      text: `Event Details:
        Title: ${eventTitle}
        Description: ${eventDescription}
        Venue: ${eventVenue}
        Date: ${eventDate}
        Time: ${eventTime}
        Distance: ${eventDistance} km`,
    };
  
    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return res.status(500).json({ message: 'Error sending email', error: error.message });
      }
      res.status(200).json({ message: 'Email sent successfully', info });
    });
  });
  

// Server listening on port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
