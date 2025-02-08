const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { createReport, verifyReport } = require("../Database/reportModel");

const router = express.Router();

// Ensure the Upload directory exists
const uploadDir = path.join(__dirname, "../Upload");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Save uploaded files in /backend/Upload/
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // Limit: 50MB
});

// ✅ Submit a report
router.post("/submit", upload.single("image"), async (req, res) => {
  try {
    const { email, issueType, location } = req.body;

    if (!email || !issueType || !location) {
      return res.status(400).json({ success: false, error: "All fields are required." });
    }

    const imageUrl = req.file ? `/Upload/${req.file.filename}` : null;
    console.log("Image uploaded:", imageUrl); // Debugging

    const response = await createReport(email, issueType, location, imageUrl);
    return res.status(200).json(response);
  } catch (error) {
    console.error("Error submitting report:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ Verify a report
router.post("/verify", async (req, res) => {
  try {
    const { reportId } = req.body;
    if (!reportId) {
      return res.status(400).json({ success: false, error: "Report ID is required." });
    }

    const response = await verifyReport(reportId, false);
    res.status(response.success ? 200 : 400).json(response);
  } catch (error) {
    console.error("Error verifying report:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ Flag a report
router.post("/flag", async (req, res) => {
  try {
    const { reportId } = req.body;
    if (!reportId) {
      return res.status(400).json({ success: false, error: "Report ID is required." });
    }

    const response = await verifyReport(reportId, true);
    res.status(response.success ? 200 : 400).json(response);
  } catch (error) {
    console.error("Error flagging report:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ Serve uploaded images statically
router.use("/Upload", express.static(uploadDir));

module.exports = router;
