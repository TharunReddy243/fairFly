import React from 'react';
import { ArrowLeft } from 'lucide-react';

function formatDate(dateString) {
  if (!dateString) return '';
  // Adding a time to treat it as UTC and avoid timezone issues
  const date = new Date(`${dateString}T00:00:00Z`);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

function ResultsHeader({ searchParams, onBackToSearch }) {
  return (
    <div className="results-header">
      <button onClick={onBackToSearch} className="back-button">
        <ArrowLeft size={20} />
        Back to Search
      </button>
      <div className="search-summary">
        <h1>Flight Results</h1>
        {searchParams.tripType === 'multiCity' ? (
          <p>
            Multi-city trip • First leg:{' '}
            {formatDate(searchParams.segments?.[0]?.date)}
          </p>
        ) : (
          <p>
            {searchParams.from} → {searchParams.to} •{' '}
            {searchParams.tripType === 'return' ? 'Return' : 'One Way'} •{' '}
            {formatDate(searchParams.departureDate)}
            {searchParams.tripType === 'return' &&
              ` - ${formatDate(searchParams.returnDate)}`}
          </p>
        )}
      </div>
    </div>
  );
}

export default ResultsHeader;