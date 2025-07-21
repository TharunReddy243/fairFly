import React from 'react';
import { Clock, Trash2 } from 'lucide-react';

function SearchHistory({ history, onSelect, onClear }) {
  return (
    <div className="search-history-section">
      <div className="search-history">
        <div className="history-actions">
          <h3>Recent Searches</h3>
          {history.length > 0 && (
            <button onClick={onClear} className="clear-history-btn">
              <Trash2 size={14} />
              Clear All
            </button>
          )}
        </div>
        <div className="history-list">
          {history.length === 0 ? (
            <div className="no-history">
              <Clock size={48} />
              <p>No recent searches</p>
            </div>
          ) : (
            history.map((s, i) => (
              <div key={s._id || i} className="history-item" onClick={() => onSelect(s)} style={{ cursor: 'pointer' }}>
                <div className="history-item-header">
                  <span className="trip-type-badge">
                    {s.tripType === 'multiCity' ? 'Multi-City' : s.returnDate ? 'Return' : 'One Way'}
                  </span>
                </div>
                <div className="history-item-details">
                  <div className="route-info">
                    {s.tripType === 'multiCity' && s.segments?.length > 1
                      ? `${s.segments[0].from} → ${s.segments[s.segments.length - 1].to} (${s.segments.length - 1} stop${s.segments.length - 1 === 1 ? '' : 's'})`
                      : `${s.from} → ${s.to}`}
                  </div>
                  {s.tripType === 'multiCity' && s.segments ? (
                    <div className="search-meta">
                      {s.segments.map((seg, idx) => (
                        <div key={idx}>{seg.from} → {seg.to} ({formatDate(seg.date)})</div>
                      ))}
                    </div>
                  ) : (
                    <div className="search-meta">
                      <span>Departure: {formatDate(s.departureDate)}</span>
                      {s.returnDate && <span>Return: {formatDate(s.returnDate)}</span>}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function formatDate(dateString) {
  if (!dateString) return '';
  // Adding a time to treat it as UTC and avoid timezone issues
  const date = new Date(`${dateString}T00:00:00Z`);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

export default SearchHistory;