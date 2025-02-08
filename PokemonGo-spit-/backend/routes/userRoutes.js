const express = require("express");
const path = require("path");
const { createUser, loginUser } = require(path.join(__dirname, "../Database/userModel"));

const router = express.Router();

// Register user
router.post("/register", async (req, res) => {
    const { email, name, password } = req.body;  // Accept password
    const response = await createUser(email, name, password);
    res.status(response.success ? 200 : 400).json(response);
  });
  

// Login user
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const response = await loginUser(email, password);
  res.status(response.success ? 200 : 400).json(response);
});

module.exports = router;
