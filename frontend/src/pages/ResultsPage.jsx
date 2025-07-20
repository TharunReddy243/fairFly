import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { ArrowLeft, Plane, Clock, DollarSign } from 'lucide-react';

// A reusable component to display a single flight leg (outbound, inbound, or one-way)
const FlightLeg = ({ leg, legType }) => {
  if (!leg?.sectorSegments?.length) {
    return (
      <div className="flight-info">
        <p>Flight leg information is not available.</p>
      </div>
    );
  }

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

  const firstSegment = leg.sectorSegments[0].segment;
  // For multi-stop flights, the final destination is in the last segment
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
};

function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = location.state?.searchParams;

  // --- STATE MANAGEMENT ---
  const [flightResults, setFlightResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filter and sort state
  const [priceRange, setPriceRange] = useState(1000); // Default max price
  const [selectedAirlines, setSelectedAirlines] = useState([]);
  const [selectedStops, setSelectedStops] = useState([]);
  const [sortOrder, setSortOrder] = useState('price');

  // Currency converter state
  const [selectedCurrency, setSelectedCurrency] = useState('INR'); // Default to Indian Rupee
  const [exchangeRates, setExchangeRates] = useState({ USD: 1 });
  const [currencyError, setCurrencyError] = useState(null);
  const currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
    { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' }
  ];

  // --- DATA FETCHING ---
  useEffect(() => {
    const fetchExchangeRates = async () => {
      // Using Frankfurter.app API, which is free and requires no key.
      // We fetch all rates with USD as the base currency.
      try {
        const response = await fetch('https://api.frankfurter.app/latest?from=USD');
        if (!response.ok) {
          let errorInfo = 'Network response was not ok for currency rates.';
          try {
            const errorData = await response.json();
            errorInfo = errorData.message || errorInfo;
          } catch (e) { /* Ignore if response is not JSON */ }
          throw new Error(errorInfo);
        }
        const data = await response.json();
        // Frankfurter API returns rates directly on success.
        if (data.rates) {
          // Add USD to the rates list as the base currency, since the API doesn't include it.
          setExchangeRates({ ...data.rates, USD: 1 });
        } else {
          throw new Error(data.message || 'Failed to fetch exchange rates from API.');
        }
      } catch (err) {
        console.error("Failed to fetch real-time exchange rates:", err.message);
        setCurrencyError("Could not load real-time rates. Using fallback values.");
        // Fallback to hardcoded rates if API fails
        setExchangeRates({
          USD: 1, EUR: 0.93, GBP: 0.79, JPY: 157.5, CAD: 1.37, AUD: 1.51, CHF: 0.90, CNY: 7.25, INR: 83.5
        });
      }
    };

    fetchExchangeRates();
  }, []); // Empty dependency array ensures this runs once on mount

  const fetchInitiated = useRef(false);

  useEffect(() => {
    const fetchFlights = async () => {
      if (!searchParams) return;
      // Prevent fetch from running twice in React 18 Strict Mode (development)
      if (fetchInitiated.current) return;
      fetchInitiated.current = true;
      setLoading(true);
      setError('');
      try {
        const response = await fetch('http://localhost:5000/api/flights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            origin: searchParams.from,
            destination: searchParams.to,
            departureDate: searchParams.departureDate,
            returnDate: searchParams.returnDate,
            tripType: searchParams.tripType,
            segments: searchParams.segments,
            adults: searchParams.passengers || 1,
            cabinClass: searchParams.class || 'ECONOMY'
          })
        });
        if (!response.ok) {
          // Try to parse the error message from the server for better feedback
          const errorData = await response.json();
          const apiError = errorData.errors?.[0] || { title: 'Search Failed', detail: 'An unknown error occurred.' };
          throw new Error(`${apiError.title}: ${apiError.detail}`);
        }
        const data = await response.json();

        if (data.multiCity && Array.isArray(data.segments)) {
          // For multi-city, keep the segmented structure from the server
          const segmentedItineraries = data.segments.map(segment => segment.data?.itineraries || []);
          setFlightResults(segmentedItineraries);
        } else {
          // For one-way/return, wrap it in an array to have a consistent structure
          const results = data.data?.itineraries || [];
          setFlightResults([results]);
        }
      } catch (err) {
        setError(err.message || 'Could not fetch flights. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchFlights();
  }, [searchParams]);

  // --- FILTERING AND SORTING LOGIC ---
  const processedResults = useMemo(() => {
    if (!searchParams || !Array.isArray(flightResults)) return [];

    // This function will apply all filters and sorting to a single list of itineraries
    const applyFiltersAndSort = (itineraries) => {
      let filtered = [...itineraries];

      // Helper to get the primary leg for filtering/sorting
      const getPrimaryLeg = (flight) => {
        if (searchParams.tripType === 'return') {
          return flight.outbound;
        }
        return flight.sector; // For oneWay and multiCity
      };

      // Price filter
      filtered = filtered.filter(flight => (Number(flight.price?.amount) || 0) <= priceRange);

      // Airline filter
      if (selectedAirlines.length > 0) {
        filtered = filtered.filter(flight => {
          const leg = getPrimaryLeg(flight);
          const airlineName = leg?.sectorSegments?.[0]?.segment?.carrier?.name;
          return airlineName && selectedAirlines.includes(airlineName);
        });
      }

      // Stops filter
      if (selectedStops.length > 0) {
        filtered = filtered.filter(flight => {
          const leg = getPrimaryLeg(flight);
          const stopsCount = (leg?.sectorSegments?.length || 1) - 1;
          return selectedStops.includes(stopsCount);
        });
      }

      // De-duplicate flights that appear identical in the UI
      const uniqueFlightsMap = new Map();
      for (const flight of filtered) {
        const leg = getPrimaryLeg(flight);
        const segment = leg?.sectorSegments?.[0]?.segment;
        if (!segment) continue;

        // Create a key based on visually distinct properties
        const uniqueKey = [
          segment.carrier?.code,
          segment.code,
          segment.source?.utcTime?.slice(11, 16),
          segment.destination?.utcTime?.slice(11, 16),
          leg?.duration,
          flight.price?.amount, // Include price in key to avoid removing cheaper identical flights
        ].join('-');

        // If we haven't seen this flight, or if this one is cheaper, store it.
        if (!uniqueFlightsMap.has(uniqueKey) || Number(flight.price?.amount) < Number(uniqueFlightsMap.get(uniqueKey).price?.amount)) {
          uniqueFlightsMap.set(uniqueKey, flight);
        }
      }
      const deDupedFlights = Array.from(uniqueFlightsMap.values());

      // Sorting
      deDupedFlights.sort((a, b) => {
        const legA = getPrimaryLeg(a);
        const legB = getPrimaryLeg(b);
        
        switch (sortOrder) {
          case 'duration':
            return (legA?.duration || 0) - (legB?.duration || 0);
          case 'departure':
            return new Date(legA?.sectorSegments?.[0]?.segment?.source?.utcTime) - new Date(legB?.sectorSegments?.[0]?.segment?.source?.utcTime);
          case 'arrival':
            const lastSegmentA = legA?.sectorSegments?.[legA.sectorSegments.length - 1]?.segment;
            const lastSegmentB = legB?.sectorSegments?.[legB.sectorSegments.length - 1]?.segment;
            return new Date(lastSegmentA?.destination?.utcTime) - new Date(lastSegmentB?.destination?.utcTime);
          case 'price':
          default:
            return (Number(a.price?.amount) || 0) - (Number(b.price?.amount) || 0);
        }
      });

      return deDupedFlights;
    };

    // Apply the processing to each segment of flights
    return flightResults.map(segmentItineraries => applyFiltersAndSort(segmentItineraries));

  }, [flightResults, priceRange, selectedAirlines, selectedStops, sortOrder, searchParams]);

  const uniqueAirlines = useMemo(() => {
    if (!searchParams || !Array.isArray(flightResults)) return [];

    // Flatten all itineraries from all segments to get a list of all airlines
    const allItineraries = flightResults.flat();

    const getPrimaryLeg = (flight) => searchParams.tripType === 'return' ? flight.outbound : flight.sector;
    
    const airlines = allItineraries.map(f => {
      const leg = getPrimaryLeg(f);
      return leg?.sectorSegments?.[0]?.segment?.carrier?.name;
    }).filter(Boolean);

    return [...new Set(airlines)];
  }, [flightResults, searchParams]);

  // --- EVENT HANDLERS ---
  const handleAirlineChange = (airlineName) => {
    setSelectedAirlines(prev =>
      prev.includes(airlineName)
        ? prev.filter(name => name !== airlineName)
        : [...prev, airlineName]
    );
  };

  const handleStopsChange = (stops) => {
    const stopsAsNumber = Number(stops);
    setSelectedStops(prev =>
      prev.includes(stopsAsNumber)
        ? prev.filter(s => s !== stopsAsNumber)
        : [...prev, stopsAsNumber]
    );
  };

  const handleBackToSearch = () => navigate('/search');

  const handleSelectFlight = (flight) => {
    // The Amadeus Self-Service API doesn't provide a direct booking link.
    // A great user-friendly alternative is to construct a deep link to a major
    // flight aggregator. We will use Kayak, which has a reliable URL format.

    const baseUrl = 'https://www.kayak.com/flights';
    let path = '';

    // This part constructs the main search path (e.g., /JFK-LHR/2025-10-10)
    if (searchParams.tripType === 'multiCity' && searchParams.segments?.length > 0) {
      path = searchParams.segments
        .map(s => `/${s.from}-${s.to}/${s.date}`)
        .join('');
    } else if (searchParams.tripType === 'return' && searchParams.returnDate) {
      path = `/${searchParams.from}-${searchParams.to}/${searchParams.departureDate}/${searchParams.returnDate}`;
    } else { // oneWay
      path = `/${searchParams.from}-${searchParams.to}/${searchParams.departureDate}`;
    }

    const adults = searchParams.passengers || 1;
    const queryParams = new URLSearchParams({ adults });

    // --- NEW: Make the link more specific using the selected flight's airline ---
    // This gets us closer to the specific flight the user clicked on.
    const primaryLeg = flight.outbound || flight.sector;
    if (primaryLeg?.sectorSegments?.[0]?.segment?.carrier?.code) {
      const airlineCode = primaryLeg.sectorSegments[0].segment.carrier.code;
      queryParams.append('airline', airlineCode);
    }

    // --- ENHANCEMENT: Add the number of stops to make the link even more specific ---
    if (primaryLeg?.sectorSegments) {
      const stops = primaryLeg.sectorSegments.length - 1;
      queryParams.append('stops', stops);
    }

    const finalUrl = `${baseUrl}${path}?${queryParams.toString()}`;

    // Open the constructed URL in a new tab
    window.open(finalUrl, '_blank', 'noopener,noreferrer');
  };

  const convertPrice = (priceUSD) => {
    const rate = exchangeRates[selectedCurrency];
    if (!rate) {
      return '...'; // Or a loading indicator
    }
    const convertedPrice = priceUSD * rate;
    const currency = currencies.find(c => c.code === selectedCurrency);
    if (selectedCurrency === 'JPY' || selectedCurrency === 'CNY' || selectedCurrency === 'INR') {
      return `${currency.symbol}${Math.round(convertedPrice).toLocaleString()}`;
    }
    return `${currency.symbol}${convertedPrice.toFixed(0)}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    // The date string is in 'YYYY-MM-DD' format. Creating a date from it can have timezone issues.
    // Splitting and creating a UTC date is safer to avoid off-by-one day errors.
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  // --- Helper function to render flight legs based on trip type ---
  // This function was moved here, to the correct location inside the component
  // but before the `return` statement.
  const renderFlightLegs = (tripType, flight) => {
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
  };

  // --- RENDER LOGIC ---
  if (!searchParams) {
    return (
      <div className="results-page">
        <Navbar />
        <div className="results-container">
          <div className="no-results">
            <h2>No search results found</h2>
            <p>Please go back and perform a new search.</p>
            <button onClick={handleBackToSearch} className="back-button">
              <ArrowLeft size={20} />
              Back to Search
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="results-page">
        <Navbar />
        <div className="results-container">
          <div className="no-results">
            <h2>Loading flight results...</h2>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="results-page">
        <Navbar />
        <div className="results-container">
          <div className="no-results">
            <h2>{error}</h2>
            <button onClick={handleBackToSearch} className="back-button">
              <ArrowLeft size={20} />
              Back to Search
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="results-page">
      <Navbar />
      <div className="results-container">
        <div className="results-header">
          <button onClick={handleBackToSearch} className="back-button">
            <ArrowLeft size={20} />
            Back to Search
          </button>
          <div className="search-summary">
            <h1>Flight Results</h1>
            {searchParams.tripType === 'multiCity' ? (
              <p>
                Multi-city trip • First leg: {formatDate(searchParams.segments?.[0]?.date)}
              </p>
            ) : (
              <p>
                {searchParams.from} → {searchParams.to} • {searchParams.tripType === 'return' ? 'Return' : 'One Way'} • {formatDate(searchParams.departureDate)}
                {searchParams.tripType === 'return' && ` - ${formatDate(searchParams.returnDate)}`}
              </p>
            )}
          </div>
        </div>

        <div className="results-content">
          <div className="filters-sidebar">
            <div className="currency-converter">
              <div className="currency-header">
                <DollarSign size={20} />
                <h3>Currency Converter</h3>
              </div>
              {currencyError && <div className="currency-error-message" style={{ fontSize: '0.8rem', color: 'orange', marginTop: '5px' }}>{currencyError}</div>}
              <div className="currency-selector">
                <label>Display prices in:</label>
                <select
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                  className="currency-select"
                >
                  {currencies.map(currency => (
                    <option key={currency.code} value={currency.code}>
                      {currency.symbol} {currency.code} - {currency.name}
                    </option>
                  ))}
                </select>
              </div>
              {selectedCurrency !== 'USD' && (
                <div className="exchange-rate">
                  <span>1 USD = {exchangeRates[selectedCurrency]} {selectedCurrency}</span>
                </div>
              )}
            </div>

            <div className="filter-section">
              <h3>Filter Results</h3>
              <div className="filter-group">
                <h4>Price Range (Max: {convertPrice(priceRange)})</h4>
                <div className="price-range">
                  <input type="range" min="0" max="1000" value={priceRange} onChange={(e) => setPriceRange(Number(e.target.value))} />
                </div>
              </div>

              <div className="filter-group">
                <h4>Airlines</h4>
                {uniqueAirlines.map(airline => (
                  <label key={airline} className="checkbox-label">
                    <input type="checkbox" checked={selectedAirlines.includes(airline)} onChange={() => handleAirlineChange(airline)} />
                    <span>{airline}</span>
                  </label>
                ))}
              </div>

              <div className="filter-group">
                <h4>Stops</h4>
                <label className="checkbox-label">
                  <input type="checkbox" checked={selectedStops.includes(0)} onChange={() => handleStopsChange(0)} />
                  <span>Non-stop</span>
                </label>
                <label className="checkbox-label">
                  <input type="checkbox" checked={selectedStops.includes(1)} onChange={() => handleStopsChange(1)} />
                  <span>1 Stop</span>
                </label>
                <label className="checkbox-label">
                  <input type="checkbox" checked={selectedStops.includes(2)} onChange={() => handleStopsChange(2)} />
                  <span>2+ Stops</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flights-list">
            <div className="sort-options">
              <span>Sort by:</span>
              <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                <option value="price">Price (Low to High)</option>
                <option value="duration">Duration</option>
                <option value="departure">Departure Time</option>
                <option value="arrival">Arrival Time</option>
              </select>
            </div>

            <div className="flights-results">
              {processedResults.length === 0 || processedResults.every(segment => segment.length === 0) ? (
                <div>No flights match your criteria.</div>
              ) : (
                processedResults.map((segmentFlights, index) => (
                  <div key={index} className="segment-results-container">
                    {searchParams.tripType === 'multiCity' && (
                      <h2 className="segment-title">
                        Leg {index + 1}: {searchParams.segments[index].from} → {searchParams.segments[index].to}
                      </h2>
                    )}
                    {segmentFlights.length === 0 ? (
                      <div style={{ padding: '1rem', textAlign: 'center' }}>No flights for this leg match your criteria.</div>
                    ) : (
                      segmentFlights.map((flight) => (
                        <div key={flight.id} className="flight-card">
                          {renderFlightLegs(searchParams.tripType, flight)}
                          <div className="flight-price">
                            <div className="price">{convertPrice(Number(flight.price?.amount || 0))}</div>
                            <button className="select-button" onClick={() => handleSelectFlight(flight)}>Select Flight</button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResultsPage;
