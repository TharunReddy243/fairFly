import React from 'react';

function Filters({
  priceRange,
  onPriceChange,
  uniqueAirlines,
  selectedAirlines,
  onAirlineChange,
  selectedStops,
  onStopsChange,
  convertPrice,
}) {
  return (
    <div className="filter-section">
      <h3>Filter Results</h3>
      <div className="filter-group">
        <h4>Price Range (Max: {convertPrice(priceRange)})</h4>
        <div className="price-range">
          <input
            type="range"
            min="0"
            max="1000"
            value={priceRange}
            onChange={(e) => onPriceChange(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="filter-group">
        <h4>Airlines</h4>
        {uniqueAirlines.map((airline) => (
          <label key={airline} className="checkbox-label">
            <input
              type="checkbox"
              checked={selectedAirlines.includes(airline)}
              onChange={() => onAirlineChange(airline)}
            />
            <span>{airline}</span>
          </label>
        ))}
      </div>

      <div className="filter-group">
        <h4>Stops</h4>
        {[
          { label: 'Non-stop', value: 0 },
          { label: '1 Stop', value: 1 },
          { label: '2+ Stops', value: 2 },
        ].map(({ label, value }) => (
          <label key={value} className="checkbox-label">
            <input
              type="checkbox"
              checked={selectedStops.includes(value)}
              onChange={() => onStopsChange(value)}
            />
            <span>{label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

export default Filters;