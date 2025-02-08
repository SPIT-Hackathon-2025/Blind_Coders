const bcrypt = require("bcrypt");
const { usersRef } = require("./firebase");

const createUser = async (email, name, password) => {
  try {
    const hashedPassword = await bcrypt.hash(password, 10); // Hash password

    await usersRef.doc(email).set({
      email,
      name,
      password: hashedPassword,  // Store hashed password
      credibilityScore: 0,
      reportsSubmitted: 0,
      createdAt: new Date().toISOString(),
    });

    return { success: true, message: "User created successfully" };
  } catch (error) {
    return { success: false, error: error.message };
  }
};


const loginUser = async (email, password) => {
    try {
      const userSnapshot = await usersRef.doc(email).get();
  
      if (!userSnapshot.exists) {
        return { success: false, message: "User not found" };
      }
  
      const user = userSnapshot.data();
  
      // Compare hashed password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return { success: false, message: "Invalid email or password" };
      }
  
      return { success: true, message: "Login successful", user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };
  
// Function to update credibility score
const updateCredibility = async (email, increment) => {
  try {
    await usersRef.doc(email).update({
      credibilityScore: admin.firestore.FieldValue.increment(increment),
      reportsSubmitted: admin.firestore.FieldValue.increment(1),
    });
    return { success: true, message: "Credibility updated" };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

module.exports = { createUser , loginUser , updateCredibility };
