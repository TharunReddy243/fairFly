import React from 'react';
import { MapPin, Calendar } from 'lucide-react';

function OneWayReturnForm({ tripType, from, to, departure, ret, onInputChange, onSwap }) {
  return (
    <div className="location-date-grid">
      <div className="form-group">
        <label htmlFor="from">From</label>
        <div className="input-wrapper">
          <MapPin className="input-icon" size={20} />
          <input
            id="from"
            name="fromLocation"
            type="text"
            value={from}
            onChange={onInputChange}
            placeholder="New York (NYC)"
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="to">To</label>
        <div className="input-wrapper">
          <MapPin className="input-icon" size={20} />
          <input
            id="to"
            name="toLocation"
            type="text"
            value={to}
            onChange={onInputChange}
            placeholder="London (LHR)"
            required
          />
          <button
            type="button"
            onClick={onSwap}
            className="swap-button"
          >
            ⇄
          </button>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="departure">Departure Date</label>
        <div className="input-wrapper">
          <Calendar className="input-icon" size={20} />
          <input
            id="departure"
            name="departureDate"
            type="date"
            value={departure}
            onChange={onInputChange}
            required
          />
        </div>
      </div>

      {tripType === 'return' && (
        <div className="form-group">
          <label htmlFor="return">Return Date</label>
          <div className="input-wrapper">
            <Calendar className="input-icon" size={20} />
            <input
              id="return"
              name="returnDate"
              type="date"
              value={ret}
              onChange={onInputChange}
              required
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default OneWayReturnForm;