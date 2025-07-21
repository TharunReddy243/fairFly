import React from 'react';
import { MapPin, Calendar, Plus, X } from 'lucide-react';

function MultiCityForm({ segments, onUpdate, onAdd, onRemove }) {
  return (
    <div className="multi-city-section">
      <h3>Flight Segments</h3>
      {segments.map((segment, index) => (
        <div key={segment.id} className="segment-row">
          <div className="form-group">
            <label>From (Flight {index + 1})</label>
            <div className="input-wrapper">
              <MapPin className="input-icon" size={20} />
              <input
                type="text"
                value={segment.from}
                onChange={(e) => onUpdate(segment.id, 'from', e.target.value)}
                placeholder="New York (NYC)"
              />
            </div>
          </div>

          <div className="form-group">
            <label>To</label>
            <div className="input-wrapper">
              <MapPin className="input-icon" size={20} />
              <input
                type="text"
                value={segment.to}
                onChange={(e) => onUpdate(segment.id, 'to', e.target.value)}
                placeholder="London (LHR)"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Date</label>
            <div className="input-wrapper">
              <Calendar className="input-icon" size={20} />
              <input
                type="date"
                value={segment.date}
                onChange={(e) => onUpdate(segment.id, 'date', e.target.value)}
              />
            </div>
          </div>

          {segments.length > 2 && (
            <button
              type="button"
              onClick={() => onRemove(segment.id)}
              className="remove-segment-btn"
            >
              <X size={20} />
            </button>
          )}
        </div>
      ))}
      
      <button
        type="button"
        onClick={onAdd}
        className="add-segment-btn"
      >
        <Plus size={16} />
        Add Another Flight
      </button>
    </div>
  );
}

export default MultiCityForm;