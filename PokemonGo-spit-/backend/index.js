const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const bodyParser = require('body-parser');
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
