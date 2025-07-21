import React from 'react';
import FlightLeg from './FlightLeg';

function renderFlightLegs(tripType, flight) {
  if (tripType === 'return') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, gap: '1rem' }}>
        <FlightLeg leg={flight.outbound} legType="Outbound" />
        <FlightLeg leg={flight.inbound} legType="Inbound" />
      </div>
    );
  }
  if (tripType === 'multiCity') {
    return <FlightLeg leg={flight.sector} legType="Segment" />;
  }
  return <FlightLeg leg={flight.sector} />;
}

function FlightCard({ flight, tripType, convertPrice, onSelect }) {
  return (
    <div className="flight-card">
      {renderFlightLegs(tripType, flight)}
      <div className="flight-price">
        <div className="price">{convertPrice(Number(flight.price?.amount || 0))}</div>
        <button className="select-button" onClick={() => onSelect(flight)}>
          Select Flight
        </button>
      </div>
    </div>
  );
}

export default FlightCard;