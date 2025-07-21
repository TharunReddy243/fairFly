import React from 'react';

function PlaneLoader() {
  return (
    <div className="plane-loader-container">
      <img src="/assets/flying-plane.gif" alt="Loading animation" className="plane-loader-icon" />
      <p className="plane-loader-text">Searching for the best flights...</p>
    </div>
  );
}

export default PlaneLoader;