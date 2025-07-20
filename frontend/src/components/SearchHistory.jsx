import React from 'react';
import { Clock, X, Trash2 } from 'lucide-react';

function SearchHistory({ searchHistory, onSelectSearch, onClearHistory, onRemoveSearch }) {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatSearchDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderRouteInfo = (search) => {
    if (search.tripType === 'multiCity') {
      const segments = search.segments || [];
      if (segments.length > 0) {
        return `${segments[0].from} → ${segments[segments.length - 1].to} (${segments.length} stops)`;
      }
      return 'Multi-city trip';
    } else {
      return `${search.from || 'Unknown'} → ${search.to || 'Unknown'}`;
    }
  };

  if (searchHistory.length === 0) {
    return (
      <div className="search-history">
        <h3>Recent Searches</h3>
        <div className="no-history">
          <Clock size={48} />
          <p>No recent searches</p>
        </div>
      </div>
    );
  }

  return (
    <div className="search-history">
      <div className="history-actions">
        <h3>Recent Searches</h3>
        <button onClick={onClearHistory} className="clear-history-btn">
          <Trash2 size={14} />
          Clear All
        </button>
      </div>
      
      <div className="history-list">
        {searchHistory.map((search) => (
          <div
            key={search.id}
            className="history-item"
            onClick={() => onSelectSearch(search)}
          >
            <div className="history-item-header">
              <span className="trip-type-badge">
                {search.tripType === 'oneWay' ? 'One Way' : 
                 search.tripType === 'return' ? 'Return' : 'Multi-City'}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveSearch(search.id);
                }}
                className="remove-item-btn"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="history-item-details">
              <div className="route-info">
                {renderRouteInfo(search)}
              </div>
              
              <div className="search-meta">
                <span>{search.passengers} passenger{search.passengers > 1 ? 's' : ''}</span>
                <span>{formatSearchDate(search.searchDate)}</span>
              </div>
              
              {search.tripType !== 'multiCity' && (
                <div className="search-meta">
                  <span>Departure: {formatDate(search.departureDate)}</span>
                  {search.returnDate && (
                    <span>Return: {formatDate(search.returnDate)}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SearchHistory;