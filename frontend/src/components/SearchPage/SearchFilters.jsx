import React from 'react';

function SearchFilters({ flightClass, stops, passengers, onFilterChange }) {
  return (
    <div className="filters-section">
      <div className="form-group">
        <label htmlFor="class">Flight Class</label>
        <select
          id="class"
          name="flightClass"
          value={flightClass}
          onChange={onFilterChange}
        >
          <option value="economy">Economy</option>
          <option value="premium">Premium Economy</option>
          <option value="business">Business</option>
          <option value="first">First Class</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="stops">Number of Stops</label>
        <select
          id="stops"
          name="stops"
          value={stops}
          onChange={onFilterChange}
        >
          <option value="any">Any</option>
          <option value="nonstop">Non-stop</option>
          <option value="1stop">1 Stop</option>
          <option value="2stops">2+ Stops</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="passengers">Passengers</label>
        <select
          id="passengers"
          name="passengers"
          value={passengers}
          onChange={onFilterChange}
        >
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <option key={num} value={num}>{num} {num === 1 ? 'Passenger' : 'Passengers'}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default SearchFilters;