import React from 'react';
import ReactDOM from 'react-dom/client';
import './output.css';
import App from './App';
import { AuthProvider } from './components/AuthContext'; // Import the AuthProvider

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
