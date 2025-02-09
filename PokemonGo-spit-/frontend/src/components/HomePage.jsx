import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Map, LayoutDashboard, Plus } from 'lucide-react';
import OtherNotifications from './OtherNotifications';
import LostAndFound from './LostAndFound';
import MapView from './MapView';  // Import your MapView component
import { signOut } from 'firebase/auth'; 
import { auth } from '../firebase'; 
import { useAuth } from './AuthContext'; 
import { User } from 'lucide-react';
import './homefile.css';

const ProfileMenu = ({ onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const { userEmail } = useAuth(); 

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 right-3 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-colors"
      >
        <User size={24} />
      </button>

      {isOpen && (
        <div className="fixed top-14 right-3 w-80 bg-gray-800 rounded-lg shadow-lg py-2 border border-gray-700 z-50">
          <div className="px-4 py-3 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="bg-gray-600 p-3 rounded-full">
                <User size={24} className="text-gray-300" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-200">Profile</p>
                <p className="text-xs text-gray-400">{userEmail || 'Guest User'}</p>
              </div>
            </div>
          </div>
          
          {/* Menu Items */}
          <div className="px-4 py-2">
            <button
              onClick={onLogout}
              className="w-full text-left px-2 py-2 text-lg text-red-400 hover:bg-gray-700 rounded transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

function HomePage() {
  const [location, setLocation] = useState(null);
  const [area, setArea] = useState('Fetching location...');
  const [viewMode, setViewMode] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth();
  const dropdownRef = useRef(null);

  // Reverse Geocoding Function
  const fetchAreaName = async (latitude, longitude) => {
    try {
      const response = await fetch(`https://geocode.xyz/${latitude},${longitude}?geoit=json`);
      const data = await response.json();
      if (data.city) {
        setArea(data.city);
      } else {
        setArea('Unknown Location');
      }
    } catch (error) {
      console.error('Error fetching area name:', error);
      setArea('Unable to determine location');
    }
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ latitude, longitude });
          fetchAreaName(latitude, longitude);
        },
        (error) => {
          console.error('Error fetching location:', error);
          setArea('Failed to fetch location.');
        }
      );
    } else {
      setArea('Geolocation is not supported by this browser.');
    }
  }, []);

  const handleReports = () => {
    navigate('/report');
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      logout();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
      alert('Logout failed. Please try again.');
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim() === '') {
      alert('Please enter a search term.');
      return;
    }
    console.log(searchQuery);
    navigate(`/results?query=${searchQuery}`);
  };

  const handleInputChange = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim() === '') {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/search-suggestions?query=${query}`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      if (data.length === 0) {
        setSuggestions(['No matches found']);
      } else {
        setSuggestions(data);
      }
      setShowSuggestions(true);
    } catch (err) {
      console.error('Error fetching suggestions:', err.message);
      setSuggestions([`Error: ${err.message}`]);
      setShowSuggestions(true);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
  };

  const eventLocations = [
    { latitude: 20.5937, longitude: 78.9629, description: 'Event 1' },
    { latitude: 19.076, longitude: 72.8777, description: 'Event 2' },
  ];

  const lostAndFoundLocations = [
    { latitude: 22.5726, longitude: 88.3639, description: 'Lost Item 1' },
    { latitude: 13.0827, longitude: 80.2707, description: 'Found Item 1' },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="flex ml-auto">
        <button
          aria-label="Map View"
          className={`p-3 rounded-md transition-colors m-2 ${viewMode === 'map' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-700 hover:bg-slate-800'}`}
          onClick={() => setViewMode('map')}
        >
          <Map size={24} />
        </button>
        <button
          aria-label="Dashboard View"
          className={`p-3 rounded-md transition-colors m-2 ${viewMode === 'dashboard' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-700 hover:bg-slate-800'}`}
          onClick={() => setViewMode('dashboard')}
        >
          <LayoutDashboard size={24} />
        </button>
      </div>

      {/* Profile Menu */}
      <ProfileMenu onLogout={handleLogout} className="z-50" />

      {viewMode === 'map' ? (
        <MapView locations={eventLocations.concat(lostAndFoundLocations)} /> // Display the map view here
      ) : (
        <div className="flex-container min-h-screen p-8">
          <div className="notifications-section">
            <OtherNotifications />
          </div>
          <div className="divider"></div>
          <div className="lost-found-section border-l-white border-l-2">
            <LostAndFound area={area} />
          </div>
        </div>
      )}

      <div className="search-bar" ref={dropdownRef}>
        <input
          type="text"
          placeholder="Where do you want to go?"
          value={searchQuery}
          onChange={handleInputChange}
        />
        <button onClick={handleSearch}>Search</button>
        {showSuggestions && suggestions.length > 0 && (
          <div className={`suggestions-dropdown ${showSuggestions ? 'show' : ''}`}>
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="suggestion-item"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion}
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={handleReports}
        aria-label="Report Issue"
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-colors flex items-center justify-center overflow-hidden"
        onMouseEnter={() => setIsHovered(true)} 
        onMouseLeave={() => setIsHovered(false)} 
      >
        <img
          src="/images/pokemon logo.png"
          alt="Pokémon Ball"
          className="transition-all duration-300 transform w-12 h-12"
        />
        <span
          className={`transition-all duration-300 transform ${isHovered ? "size-10 translate-x-0" : "size-0 translate-x-4"} text-sm font-semibold ml-2`}
        >
          Add Report
        </span>
      </button>

    </div>
  );
}

export default HomePage;
