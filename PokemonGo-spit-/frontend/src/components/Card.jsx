import React from 'react';

// A reusable Card component that accepts image, title, description, and an onClick handler
function Card({ image, title, description, onClick }) {
  return (
    <div
      className="max-w-sm rounded-lg overflow-hidden shadow-lg cursor-pointer transition-transform transform hover:scale-105 bg-gray-800 text-white"
      onClick={onClick}
    >
      <img className="w-full h-48 object-cover" src={image} alt={title} />
      <div className="px-6 py-4">
        <div className="font-bold text-xl mb-2 text-gray-100">{title}</div>
        <p className="text-gray-300 text-base">{description}</p>
      </div>
    </div>
  );
}

export default Card;
