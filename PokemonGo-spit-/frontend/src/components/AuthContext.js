import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [userEmail, setUserEmail] = useState(localStorage.getItem('userEmail') || null);

  const login = async (email) => {
    try {
      setUserEmail(email);
      localStorage.setItem('userEmail', email);
      // Add your logic for logging in via Google or another service here
    } catch (error) {
      console.error("Login failed:", error);
    }
  };
  
  const logout = () => {
    localStorage.removeItem("token"); // Remove stored token
    sessionStorage.clear(); // Clear session storage if used
    if (window.google && window.google.accounts) {
      window.google.accounts.id.revoke(userEmail, () => {
        window.google.accounts.id.disableAutoSelect(); // Prevent auto-login on next visit
      });
    }
    setUserEmail(null); // ✅ Fixed: Changed setUser to setUserEmail
  };
  

  useEffect(() => {
    if (window.google && window.google.accounts) {
      window.google.accounts.id.initialize({
        client_id: 'YOUR_GOOGLE_CLIENT_ID',
        callback: (response) => {
          // Handle the Google sign-in response here
        },
      });
      window.google.accounts.id.renderButton(
        document.getElementById('google-signin-btn'),
        { theme: 'outline', size: 'large' }
      );
      window.google.accounts.id.disableAutoSelect(); // Prevents auto login
    }
  }, []);
  

  return (
    <AuthContext.Provider value={{ userEmail, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
