import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import ReportPage from './components/ReportPage';
import HomePage from './components/HomePage';
import CardDetailPage from './components/CardDetailPage';
import Results  from './components/Result'; // Import CardDetailPage

function App() {
  return (
    <Router>
      <Routes>
        {/* Login Page Route */}
        <Route path="/" element={<LoginPage />} />

        {/* Home Page Route */}
        <Route path="/home" element={<HomePage />} />

        {/* Report Page Route */}
        <Route path="/report" element={<ReportPage />} />

        <Route path="/results" element={<Results />} />
        {/* Card Detail Route */}
        <Route path="/discussion/:id" element={<CardDetailPage />} />
      </Routes>
    </Router>
  );
}

export default App;