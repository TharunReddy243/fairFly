import React from 'react';

function TripTypeSelector({ tripType, onTripTypeChange }) {
  return (
    <div className="trip-type-selection">
      <label>
        <input
          type="radio"
          name="tripType"
          value="oneWay"
          checked={tripType === 'oneWay'}
          onChange={(e) => onTripTypeChange(e.target.value)}
        />
        <span>One Way</span>
      </label>
      <label>
        <input
          type="radio"
          name="tripType"
          value="return"
          checked={tripType === 'return'}
          onChange={(e) => onTripTypeChange(e.target.value)}
        />
        <span>Return</span>
      </label>
      <label>
        <input
          type="radio"
          name="tripType"
          value="multiCity"
          checked={tripType === 'multiCity'}
          onChange={(e) => onTripTypeChange(e.target.value)}
        />
        <span>Multi-City</span>
      </label>
    </div>
  );
}

export default TripTypeSelector;