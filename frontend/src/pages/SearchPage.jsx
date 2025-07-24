import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { Search, Filter } from 'lucide-react';

import TripTypeSelector from '../components/SearchPage/TripTypeSelector.jsx';
import OneWayReturnForm from '../components/SearchPage/OneWayReturnForm.jsx';
import MultiCityForm from '../components/SearchPage/MultiCityForm.jsx';
import SearchFilters from '../components/SearchPage/SearchFilters.jsx';
import SearchHistory from '../components/SearchPage/SearchHistory.jsx';

function SearchPage() {
  // --- STATE MANAGEMENT ---
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
  const { username, token } = useAuth();

  // --- DATA FETCHING & SIDE EFFECTS ---
  const refetchHistory = useCallback(() => {
    if (!username || !token) return;
    fetch(`${import.meta.env.VITE_API_URL}/search-history?username=${encodeURIComponent(username)}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => Array.isArray(data) ? setServerHistory(data) : setServerHistory([]))
      .catch(() => setServerHistory([]));
  }, [username]);

  useEffect(() => {
    refetchHistory();
  }, [refetchHistory]);

  // --- LOGIC HANDLERS ---
  const handleSearch = async (e) => {
    e.preventDefault();
    let searchParams;
    let isFromHistory = false;

    if (tripType === 'multiCity') {
      const validSegments = multiCitySegments.filter(segment => segment.from && segment.to && segment.date);
      if (validSegments.length < 2) {
        alert('Please fill in at least 2 flight segments for multi-city search');
        return;
      }
      searchParams = { tripType, segments: validSegments, class: flightClass, stops, passengers };

      if (selectedHistory && selectedHistory.tripType === 'multiCity') {
        const compareSegments = (a, b) => a.length === b.length && a.every((segA, i) => {
          const segB = b[i];
          return segA.from === segB.from && segA.to === segB.to && segA.date === segB.date;
        });
        if (
          compareSegments(selectedHistory.segments, validSegments) &&
          (selectedHistory.passengers || 1) === passengers &&
          (selectedHistory.class || 'economy') === flightClass &&
          (selectedHistory.stops || 'any') === stops
        ) {
          isFromHistory = true;
        }
      }

      if (!isFromHistory) {
        try {
          const res = await fetch(`${import.meta.env.VITE_API_URL}/store-search`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ tripType, segments: validSegments, username, passengers, class: flightClass, stops })
          });
          if (res.ok) refetchHistory();
        } catch (err) {
          console.error("Failed to store multi-city search:", err);
        }
      }
    } else {
      if (!fromLocation || !toLocation || !departureDate || (tripType === 'return' && !returnDate)) {
        alert('Please fill in all required fields');
        return;
      }
      searchParams = { tripType, from: fromLocation, to: toLocation, departureDate, returnDate: tripType === 'return' ? returnDate : null, class: flightClass, stops, passengers };

      if (selectedHistory && selectedHistory.tripType !== 'multiCity') {
        if (
          selectedHistory.from === fromLocation &&
          selectedHistory.to === toLocation &&
          selectedHistory.departureDate === departureDate &&
          (selectedHistory.returnDate || null) === (tripType === 'return' ? returnDate : null) &&
          (selectedHistory.passengers || 1) === passengers &&
          (selectedHistory.class || 'economy') === flightClass &&
          (selectedHistory.stops || 'any') === stops
        ) {
          isFromHistory = true;
        }
      }

      if (!isFromHistory) {
        try {
          const res = await fetch(`${import.meta.env.VITE_API_URL}/store-search`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ ...searchParams, username })
          });
          if (res.ok) refetchHistory();
        } catch (err) {
          console.error("Failed to store search history:", err);
        }
      }
    }

    setSelectedHistory(null);
    navigate('/results', { state: { searchParams } });
  };

  const handleSelectFromHistory = (search) => {
    setSelectedHistory(search);
    setTripType(search.tripType || (search.returnDate ? 'return' : 'oneWay'));
    
    if (search.tripType === 'multiCity') {
      setMultiCitySegments(search.segments.map((segment, index) => ({
        id: (index + 1).toString(),
        ...segment
      })));
    } else {
      setFromLocation(search.from || '');
      setToLocation(search.to || '');
      setDepartureDate(search.departureDate || '');
      setReturnDate(search.returnDate || '');
    }
    
    setFlightClass(search.class || 'economy');
    setPassengers(search.passengers || 1);
    setStops(search.stops || 'any');
  };

  const addMultiCitySegment = () => {
    setSelectedHistory(null);
    setMultiCitySegments([...multiCitySegments, { id: Date.now().toString(), from: '', to: '', date: '' }]);
  };

  const handleClearHistory = async () => {
    if (!username || serverHistory.length === 0) return;
    if (window.confirm('Are you sure you want to clear your recent searches?')) {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/clear-history`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ username }),
        });
        if (response.ok) {
          setServerHistory([]);
        } else {
          alert('Failed to clear search history.');
        }
      } catch (error) {
        console.error('Error clearing search history:', error);
        alert('An error occurred while clearing search history.');
      }
    }
  };

  // --- FORM INPUT HANDLERS ---
  const handleTripTypeChange = (newTripType) => {
    setTripType(newTripType);
    setSelectedHistory(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSelectedHistory(null);
    switch (name) {
      case 'fromLocation': setFromLocation(value); break;
      case 'toLocation': setToLocation(value); break;
      case 'departureDate': setDepartureDate(value); break;
      case 'returnDate': setReturnDate(value); break;
      default: break;
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setSelectedHistory(null);
    switch (name) {
      case 'flightClass': setFlightClass(value); break;
      case 'stops': setStops(value); break;
      case 'passengers': setPassengers(Number(value)); break;
      default: break;
    }
  };

  const swapLocations = () => {
    setSelectedHistory(null);
    setFromLocation(toLocation);
    setToLocation(fromLocation);
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

  // --- RENDER ---
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
                <TripTypeSelector
                  tripType={tripType}
                  onTripTypeChange={handleTripTypeChange}
                />

                {tripType === 'multiCity' ? (
                  <MultiCityForm
                    segments={multiCitySegments}
                    onUpdate={updateMultiCitySegment}
                    onAdd={addMultiCitySegment}
                    onRemove={removeMultiCitySegment}
                  />
                ) : (
                  <OneWayReturnForm
                    tripType={tripType}
                    from={fromLocation}
                    to={toLocation}
                    departure={departureDate}
                    ret={returnDate}
                    onInputChange={handleInputChange}
                    onSwap={swapLocations}
                  />
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
                  <SearchFilters
                    flightClass={flightClass}
                    stops={stops}
                    passengers={passengers}
                    onFilterChange={handleFilterChange}
                  />
                )}
              </form>
            </div>
          </div>

          {username && (
            <SearchHistory
              history={serverHistory}
              onSelect={handleSelectFromHistory}
              onClear={handleClearHistory}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default SearchPage;
