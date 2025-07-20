import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import { useSearchHistory } from '../contexts/SearchHistoryContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { MapPin, Calendar, Search, Filter, Plus, X, Clock, Trash2 } from 'lucide-react';

function SearchPage() {
  const [tripType, setTripType] = useState('oneWay');
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [flightClass, setFlightClass] = useState('economy');
  const [stops, setStops] = useState('any');
  const [passengers, setPassengers] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [multiCitySegments, setMultiCitySegments] = useState([
    { id: '1', from: '', to: '', date: '' },
    { id: '2', from: '', to: '', date: '' }
  ]);
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [serverHistory, setServerHistory] = useState([]);
  const navigate = useNavigate();
  // const { addSearch } = useSearchHistory();
  const { username } = useAuth();

  const refetchHistory = () => {
    if (!username) return;
    fetch(`http://localhost:5000/api/search-history?username=${encodeURIComponent(username)}`)
      .then(res => res.json())
      .then(data => Array.isArray(data) ? setServerHistory(data) : setServerHistory([]))
      .catch(() => setServerHistory([]));
  };

  useEffect(() => {
    refetchHistory();
  }, [username]);

  // const searchFlights = async ({ origin, destination, departureDate, returnDate, adults }) => {
  //   const response = await fetch('http://localhost:5000/api/flights', {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({ origin, destination, departureDate, returnDate, adults })
  //   });
  //   if (!response.ok) throw new Error('Flight search failed');
  //   return response.json();
  // };

  const handleSearch = async (e) => {
    e.preventDefault();
    let searchParams;
    let isFromHistory = false; // Flag to check if it's an unmodified history search
    if (tripType === 'multiCity') {
      const validSegments = multiCitySegments.filter(segment => 
        segment.from && segment.to && segment.date
      );
      if (validSegments.length < 2) {
        alert('Please fill in at least 2 flight segments for multi-city search');
        return;
      }
      searchParams = {
        tripType,
        segments: validSegments,
        class: flightClass,
        stops: stops,
        passengers
      };
            // Check if it's an unmodified history search
      if (selectedHistory && selectedHistory.tripType === 'multiCity') {
          const compareSegments = (a, b) => {
            if (a.length !== b.length) return false;
            return a.every((segA, i) => {
              const segB = b[i];
              return segA.from === segB.from && segA.to === segB.to && segA.date === segB.date;
            });
          };
          // Use the same defaults for comparison as used when populating the form
          const historyClass = selectedHistory.class || 'economy';
          const historyPassengers = selectedHistory.passengers || 1;
          const historyStops = selectedHistory.stops || 'any';

          if (
            compareSegments(selectedHistory.segments, validSegments) &&
            historyPassengers === passengers &&
            historyClass === flightClass &&
            historyStops === stops
          ) {
              isFromHistory = true;
          }
      }

      if (!isFromHistory) {
        // Store multi-city search in MongoDB
        try {
          const res = await fetch('http://localhost:5000/api/store-search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tripType,
              segments: validSegments,
              username,
              passengers,
              class: flightClass,
              stops,
            })
          });
          if (res.ok) refetchHistory();
        } catch (err) {
          console.error("Failed to store multi-city search:", err);
        }
      }
    } else {
      if (!fromLocation || !toLocation || !departureDate) {
        alert('Please fill in all required fields');
        return;
      }
      if (tripType === 'return' && !returnDate) {
        alert('Please select a return date');
        return;
      }
      searchParams = {
        tripType,
        from: fromLocation,
        to: toLocation,
        departureDate,
        returnDate: tripType === 'return' ? returnDate : null,
        class: flightClass,
        stops: stops,
        passengers
      };
      // Check if it's an unmodified history search
      if (selectedHistory && selectedHistory.tripType !== 'multiCity') {
          // Normalize return dates for comparison. Treat null, undefined, and '' as the same for one-way trips.
          const historyReturnDate = selectedHistory.returnDate || null;
          const currentReturnDate = tripType === 'return' ? returnDate : null;
          // Use the same defaults for comparison as used when populating the form
          const historyClass = selectedHistory.class || 'economy';
          const historyPassengers = selectedHistory.passengers || 1;
          const historyStops = selectedHistory.stops || 'any';

          if (
            selectedHistory.from === fromLocation &&
            selectedHistory.to === toLocation &&
            selectedHistory.departureDate === departureDate &&
            historyReturnDate === currentReturnDate &&
            historyPassengers === passengers &&
            historyClass === flightClass &&
            historyStops === stops
          ) {
              isFromHistory = true;
          }
      }

      if (!isFromHistory) {
        // Store one-way/return search in MongoDB
        try {
          const res = await fetch('http://localhost:5000/api/store-search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...searchParams, username })
          });
          if (res.ok) refetchHistory();
        } catch (err) {
          console.error("Failed to store search history:", err);
        }
      }
    }

    // Reset selected history after search to ensure next search is treated as new
    setSelectedHistory(null);
    navigate('/results', { state: { searchParams } });
  };

  const handleSelectFromHistory = (search) => {
    setSelectedHistory(search); // Set the history object
    if (search.tripType === 'multiCity') {
      setTripType('multiCity');
      setMultiCitySegments(search.segments.map((segment, index) => ({
        id: (index + 1).toString(),
        ...segment
      })));
    } else {
      setTripType(search.tripType);
      setFromLocation(search.from || '');
      setToLocation(search.to || '');
      setDepartureDate(search.departureDate || '');
      setReturnDate(search.returnDate || '');
    }
    // Also populate filter values from history
    setFlightClass(search.class || 'economy');
    setPassengers(search.passengers || 1);
    setStops(search.stops || 'any');
  };

  const addMultiCitySegment = () => {
    const newSegment = {
      id: Date.now().toString(),
      from: '',
      to: '',
      date: ''
    };
    setSelectedHistory(null);
    setMultiCitySegments([...multiCitySegments, newSegment]);
  };

  const removeMultiCitySegment = (id) => {
    if (multiCitySegments.length > 2) {
      setSelectedHistory(null);
      setMultiCitySegments(multiCitySegments.filter(segment => segment.id !== id));
    }
  };

  const updateMultiCitySegment = (id, field, value) => {
    setSelectedHistory(null);
    setMultiCitySegments(multiCitySegments.map(segment =>
      segment.id === id ? { ...segment, [field]: value } : segment
    ));
  };

  const swapLocations = () => {
    const temp = fromLocation;
    setSelectedHistory(null);
    setFromLocation(toLocation);
    setToLocation(temp);
  };

  const handleClearHistory = async () => {
    if (!username || serverHistory.length === 0) return;

    if (window.confirm('Are you sure you want to clear your recent searches?')) {
      try {
        const response = await fetch('http://localhost:5000/api/search-history/clear', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username }),
        });

        if (response.ok) {
          setServerHistory([]); // Clear history in the UI
        } else {
          alert('Failed to clear search history.');
        }
      } catch (error) {
        console.error('Error clearing search history:', error);
        alert('An error occurred while clearing search history.');
      }
    }
  };

  // Only use serverHistory for display
  return (
    <div className="search-page">
      <Navbar />
      <div className="search-container">
        <div className="search-header">
          <h1>Find Your Perfect Flight</h1>
          <p>Search and compare flights from hundreds of airlines</p>
        </div>
        <div className="search-content">
          <div className="search-form-section">
            <div className="search-card">
              <form onSubmit={handleSearch} className="search-form">
                <div className="trip-type-selection">
                  <label>
                    <input
                      type="radio"
                      name="tripType"
                      value="oneWay"
                      checked={tripType === 'oneWay'}
                      onChange={(e) => { setTripType(e.target.value); setSelectedHistory(null); }}
                    />
                    <span>One Way</span>
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="tripType"
                      value="return"
                      checked={tripType === 'return'}
                      onChange={(e) => { setTripType(e.target.value); setSelectedHistory(null); }}
                    />
                    <span>Return</span>
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="tripType"
                      value="multiCity"
                      checked={tripType === 'multiCity'}
                      onChange={(e) => { setTripType(e.target.value); setSelectedHistory(null); }}
                    />
                    <span>Multi-City</span>
                  </label>
                </div>

                {tripType === 'multiCity' ? (
                  <div className="multi-city-section">
                    <h3>Flight Segments</h3>
                    {multiCitySegments.map((segment, index) => (
                      <div key={segment.id} className="segment-row">
                        <div className="form-group">
                          <label>From (Flight {index + 1})</label>
                          <div className="input-wrapper">
                            <MapPin className="input-icon" size={20} />
                            <input
                              type="text"
                              value={segment.from}
                              onChange={(e) => updateMultiCitySegment(segment.id, 'from', e.target.value)}
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
                              onChange={(e) => updateMultiCitySegment(segment.id, 'to', e.target.value)}
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
                              onChange={(e) => updateMultiCitySegment(segment.id, 'date', e.target.value)}
                            />
                          </div>
                        </div>

                        {multiCitySegments.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeMultiCitySegment(segment.id)}
                            className="remove-segment-btn"
                          >
                            <X size={20} />
                          </button>
                        )}
                      </div>
                    ))}
                    
                    <button
                      type="button"
                      onClick={addMultiCitySegment}
                      className="add-segment-btn"
                    >
                      <Plus size={16} />
                      Add Another Flight
                    </button>
                  </div>
                ) : (
                  <div className="location-date-grid">
                    <div className="form-group">
                      <label htmlFor="from">From</label>
                      <div className="input-wrapper">
                        <MapPin className="input-icon" size={20} />
                        <input
                          id="from"
                          type="text"
                          value={fromLocation} onChange={(e) => { setFromLocation(e.target.value); setSelectedHistory(null); }}
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
                          type="text"
                          value={toLocation} onChange={(e) => { setToLocation(e.target.value); setSelectedHistory(null); }}
                          placeholder="London (LHR)"
                          required
                        />
                        <button
                          type="button"
                          onClick={swapLocations}
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
                          type="date"
                          value={departureDate} onChange={(e) => { setDepartureDate(e.target.value); setSelectedHistory(null); }}
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
                            type="date"
                            value={returnDate} onChange={(e) => { setReturnDate(e.target.value); setSelectedHistory(null); }}
                            required
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="form-actions">
                  <button
                    type="button"
                    onClick={() => setShowFilters(!showFilters)}
                    className="filter-toggle-btn"
                  >
                    <Filter size={16} />
                    {showFilters ? 'Hide Filters' : 'Show Filters'}
                  </button>

                  <button type="submit" className="search-button">
                    <Search size={20} />
                    Search Flights
                  </button>
                </div>

                {showFilters && (
                  <div className="filters-section">
                    <div className="form-group">
                      <label htmlFor="class">Flight Class</label>
                      <select
                        id="class"
                        value={flightClass} onChange={(e) => { setFlightClass(e.target.value); setSelectedHistory(null); }}
                      >
                        <option value="economy">Economy</option>
                        <option value="premium">Premium Economy</option>
                        <option value="business">Business</option>
                        <option value="first">First Class</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="stops">Number of Stops</label>
                      <select
                        id="stops"
                        value={stops} onChange={(e) => { setStops(e.target.value); setSelectedHistory(null); }}
                      >
                        <option value="any">Any</option>
                        <option value="nonstop">Non-stop</option>
                        <option value="1stop">1 Stop</option>
                        <option value="2stops">2+ Stops</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="passengers">Passengers</label>
                      <select
                        id="passengers"
                        value={passengers} onChange={(e) => { setPassengers(Number(e.target.value)); setSelectedHistory(null); }}
                      >
                        {[1,2,3,4,5,6,7,8,9].map(num => (
                          <option key={num} value={num}>{num} {num === 1 ? 'Passenger' : 'Passengers'}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>

          <div className="search-history-section">
            <div className="search-history">
              <div className="history-actions">
                <h3>Recent Searches</h3>
                {serverHistory.length > 0 && (
                  <button onClick={handleClearHistory} className="clear-history-btn">
                    <Trash2 size={14} />
                    Clear All
                  </button>
                )}
              </div>
              <div className="history-list">
                {serverHistory.length === 0 ? (
                  <div className="no-history">
                    <Clock size={48} />
                    <p>No recent searches</p>
                  </div>
                ) : (
                  serverHistory.map((s, i) => (
                    <div key={s._id || i} className="history-item" onClick={() => handleSelectFromHistory(s)} style={{ cursor: 'pointer' }}>
                      <div className="history-item-header">
                        <span className="trip-type-badge">
                          {s.tripType === 'multiCity' ? 'Multi-City' : s.returnDate ? 'Return' : 'One Way'}
                        </span>
                      </div>
                      <div className="history-item-details">
                        <div className="route-info">
                          {s.tripType === 'multiCity' && s.segments && s.segments.length > 0
                            ? `${s.segments[0].from} → ${s.segments[s.segments.length - 1].to} (${s.segments.length} stops)`
                            : `${s.from} → ${s.to}`}
                        </div>
                        {s.tripType === 'multiCity' && s.segments ? (
                          <div className="search-meta">
                            {s.segments.map((seg, idx) => (
                              <div key={idx}>{seg.from} → {seg.to} ({seg.date})</div>
                            ))}
                          </div>
                        ) : (
                          <div className="search-meta">
                            <span>Departure: {s.departureDate}</span>
                            {s.returnDate && <span>Return: {s.returnDate}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SearchPage;