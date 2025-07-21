import React from 'react';
import { Plane, Clock } from 'lucide-react';

const formatUtcDateTime = (utcString) => {
  if (!utcString) return { date: '', time: '--:--' };
  // Append 'Z' to ensure it's parsed as UTC, if it's not already there.
  const d = new Date(utcString.endsWith('Z') ? utcString : utcString + 'Z');
  if (isNaN(d)) return { date: 'Invalid Date', time: '--:--' };

  const time = d.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  });
  const date = d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
  return { date, time };
};

function FlightLeg({ leg, legType }) {
  if (!leg?.sectorSegments?.length) {
    return (
      <div className="flight-info">
        <p>Flight leg information is not available.</p>
      </div>
    );
  }

  const firstSegment = leg.sectorSegments[0].segment;
  const lastSegment = leg.sectorSegments[leg.sectorSegments.length - 1].segment;
  const stopsCount = leg.sectorSegments.length - 1;

  const departureDateTime = formatUtcDateTime(firstSegment.source?.utcTime);
  const arrivalDateTime = formatUtcDateTime(lastSegment.destination?.utcTime);

  return (
    <div className="flight-info">
      {legType && <div className="leg-type-badge">{legType}</div>}
      <div className="airline-section">
        <div className="airline-logo">
          <Plane size={24} />
        </div>
        <div className="airline-details">
          <h3>{firstSegment.carrier?.name || 'Airline'}</h3>
          <p>
            {firstSegment.carrier?.code || ''}
            {firstSegment.code || ''}
          </p>
        </div>
      </div>
      <div className="flight-times">
        <div className="departure">
          <div className="time">{departureDateTime.time} GMT</div>
          <div className="date" style={{ fontSize: '0.8rem', color: '#6c757d' }}>{departureDateTime.date}</div>
          <div className="airport">{firstSegment.source?.station?.code || 'N/A'}</div>
        </div>
        <div className="flight-path">
          <div className="duration">
            <Clock size={16} />
            <span>{leg.duration ? `${Math.floor(leg.duration / 3600)}h ${Math.round((leg.duration % 3600) / 60)}m` : 'N/A'}</span>
          </div>
          <div className="path-line">
            <div className="line"></div>
            <Plane size={16} className="plane-icon" />
          </div>
          <div className="stops">
            <span>{stopsCount === 0 ? 'Non-stop' : `${stopsCount} stop(s)`}</span>
          </div>
        </div>
        <div className="arrival">
          <div className="time">{arrivalDateTime.time} GMT</div>
          <div className="date" style={{ fontSize: '0.8rem', color: '#6c757d' }}>{arrivalDateTime.date}</div>
          <div className="airport">{lastSegment.destination?.station?.code || 'N/A'}</div>
        </div>
      </div>
    </div>
  );
}

export default FlightLeg;