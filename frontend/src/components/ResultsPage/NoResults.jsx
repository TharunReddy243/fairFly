import React from 'react';
import { Frown, ArrowLeft } from 'lucide-react';

function NoResults({ title, message, onBackToSearch }) {
  return (
    <div className="no-results-container">
      <Frown size={64} strokeWidth={1} />
      <h2>{title}</h2>
      {message && <p>{message}</p>}
      {onBackToSearch && (
        <button onClick={onBackToSearch} className="back-button">
          <ArrowLeft size={20} />
          Back to Search
        </button>
      )}
    </div>
  );
}

export default NoResults;