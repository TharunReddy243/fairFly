import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ResultsHeader from '../components/ResultsPage/ResultsHeader';
import Sidebar from '../components/ResultsPage/Sidebar';
import FlightCard from '../components/ResultsPage/FlightCard';
import NoResults from '../components/ResultsPage/NoResults';
import PlaneLoader from '../components/ResultsPage/PlaneLoader';

function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = location.state?.searchParams;

  const [flightResults, setFlightResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [priceRange, setPriceRange] = useState(1000); // Default max price
  const [selectedAirlines, setSelectedAirlines] = useState([]);
  const [selectedStops, setSelectedStops] = useState([]);
  const [sortOrder, setSortOrder] = useState('price');
  const [selectedCurrency, setSelectedCurrency] = useState('INR');
  const [exchangeRates, setExchangeRates] = useState({ USD: 1 });
  const [currencyError, setCurrencyError] = useState(null);

  const currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' }
  ];

  useEffect(() => {
    const fetchExchangeRates = async () => {
      try {
        const response = await fetch('https://api.frankfurter.app/latest?from=USD');
        if (!response.ok) {
          throw new Error('Network response was not ok for currency rates.');
        }
        const data = await response.json();
        setExchangeRates({ ...data.rates, USD: 1 });
      } catch (err) {
        console.error("Failed to fetch real-time exchange rates:", err.message);
        setCurrencyError("Could not load real-time rates. Using fallback values.");
        setExchangeRates({
          USD: 1, EUR: 0.93, GBP: 0.79, JPY: 157.5, INR: 83.5
        });
      }
    };
    fetchExchangeRates();
  }, []);

  const fetchInitiated = useRef(false);

  useEffect(() => {
    const fetchFlights = async () => {
      if (!searchParams) return;
      if (fetchInitiated.current) return;
      fetchInitiated.current = true;
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
          const errorData = await response.json();
          const apiError = errorData.errors?.[0] || { title: 'Search Failed', detail: 'An unknown error occurred.' };
          throw new Error(`${apiError.title}: ${apiError.detail}`);
        }
        const data = await response.json();

        if (data.multiCity && Array.isArray(data.segments)) {
          const segmentedItineraries = data.segments.map(segment => segment.data?.itineraries || []);
          setFlightResults(segmentedItineraries);
        } else {
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

  const processedResults = useMemo(() => {
    if (!searchParams || !Array.isArray(flightResults)) return [];

    const applyFiltersAndSort = (itineraries) => {
      let filtered = [...itineraries];
      const getPrimaryLeg = (flight) => searchParams.tripType === 'return' ? flight.outbound : flight.sector;

      filtered = filtered.filter(flight => (Number(flight.price?.amount) || 0) <= priceRange);

      if (selectedAirlines.length > 0) {
        filtered = filtered.filter(flight => {
          const leg = getPrimaryLeg(flight);
          const airlineName = leg?.sectorSegments?.[0]?.segment?.carrier?.name;
          return airlineName && selectedAirlines.includes(airlineName);
        });
      }

      if (selectedStops.length > 0) {
        filtered = filtered.filter(flight => {
          const leg = getPrimaryLeg(flight);
          const stopsCount = (leg?.sectorSegments?.length || 1) - 1;
          return selectedStops.includes(stopsCount);
        });
      }

      const uniqueFlightsMap = new Map();
      for (const flight of filtered) {
        const leg = getPrimaryLeg(flight);
        const segment = leg?.sectorSegments?.[0]?.segment;
        if (!segment) continue;

        const uniqueKey = [
          segment.carrier?.code,
          segment.code,
          segment.source?.utcTime?.slice(11, 16),
          segment.destination?.utcTime?.slice(11, 16),
          leg?.duration,
          flight.price?.amount,
        ].join('-');

        if (!uniqueFlightsMap.has(uniqueKey) || Number(flight.price?.amount) < Number(uniqueFlightsMap.get(uniqueKey).price?.amount)) {
          uniqueFlightsMap.set(uniqueKey, flight);
        }
      }
      const deDupedFlights = Array.from(uniqueFlightsMap.values());

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

    return flightResults.map(segmentItineraries => applyFiltersAndSort(segmentItineraries));

  }, [flightResults, priceRange, selectedAirlines, selectedStops, sortOrder, searchParams]);

  const uniqueAirlines = useMemo(() => {
    if (!searchParams || !Array.isArray(flightResults)) return [];
    const allItineraries = flightResults.flat();
    const getPrimaryLeg = (flight) => searchParams.tripType === 'return' ? flight.outbound : flight.sector;
    const airlines = allItineraries.map(f => {
      const leg = getPrimaryLeg(f);
      return leg?.sectorSegments?.[0]?.segment?.carrier?.name;
    }).filter(Boolean);
    return [...new Set(airlines)];
  }, [flightResults, searchParams]);

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
    const baseUrl = 'https://www.kayak.com/flights';
    let path = '';

    if (searchParams.tripType === 'multiCity' && searchParams.segments?.length > 0) {
      path = searchParams.segments
        .map(s => `/${s.from}-${s.to}/${s.date}`)
        .join('');
    } else if (searchParams.tripType === 'return' && searchParams.returnDate) {
      path = `/${searchParams.from}-${searchParams.to}/${searchParams.departureDate}/${searchParams.returnDate}`;
    } else {
      path = `/${searchParams.from}-${searchParams.to}/${searchParams.departureDate}`;
    }

    const adults = searchParams.passengers || 1;
    const queryParams = new URLSearchParams({ adults });

    const primaryLeg = flight.outbound || flight.sector;
    if (primaryLeg?.sectorSegments?.[0]?.segment?.carrier?.code) {
      const airlineCode = primaryLeg.sectorSegments[0].segment.carrier.code;
      queryParams.append('airline', airlineCode);
    }

    if (primaryLeg?.sectorSegments) {
      const stops = primaryLeg.sectorSegments.length - 1;
      queryParams.append('stops', stops);
    }

    const finalUrl = `${baseUrl}${path}?${queryParams.toString()}`;
    window.open(finalUrl, '_blank', 'noopener,noreferrer');
  };

  const convertPrice = useCallback((priceUSD) => {
    const rate = exchangeRates[selectedCurrency];
    if (!rate) return '...';
    const convertedPrice = priceUSD * rate;
    const currency = currencies.find(c => c.code === selectedCurrency);
    if (['JPY', 'INR'].includes(selectedCurrency)) {
      return `${currency.symbol}${Math.round(convertedPrice).toLocaleString()}`;
    }
    return `${currency.symbol}${convertedPrice.toFixed(0)}`;
  }, [selectedCurrency, exchangeRates, currencies]);

  if (!searchParams) {
    return (
      <div className="results-page">
        <Navbar />
        <NoResults
          title="No search results found"
          message="Please go back and perform a new search."
          onBackToSearch={handleBackToSearch}
        />
      </div>
    );
  }

  return (
    <div className="results-page">
      <Navbar />
      <div className="results-container">
        <ResultsHeader searchParams={searchParams} onBackToSearch={handleBackToSearch} />

        <div className="results-content">
          <Sidebar
            selectedCurrency={selectedCurrency}
            onCurrencyChange={setSelectedCurrency}
            currencies={currencies}
            exchangeRates={exchangeRates}
            currencyError={currencyError}
            priceRange={priceRange}
            onPriceChange={setPriceRange}
            uniqueAirlines={uniqueAirlines}
            selectedAirlines={selectedAirlines}
            onAirlineChange={handleAirlineChange}
            selectedStops={selectedStops}
            onStopsChange={handleStopsChange}
            convertPrice={convertPrice}
          />

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
              {loading ? (
                <PlaneLoader />
              ) : error ? (
                <NoResults title={error} onBackToSearch={handleBackToSearch} />
              ) : processedResults.every(segment => segment.length === 0) ? (
                <NoResults title="No flights match your criteria." message="Try adjusting your filters or search again." />
              ) : (
                processedResults.map((segmentFlights, index) => (
                  <div key={index} className="segment-results-container">
                    {searchParams.tripType === 'multiCity' && (
                      <h2 className="segment-title">
                        Leg {index + 1}: {searchParams.segments[index].from} → {searchParams.segments[index].to}
                      </h2>
                    )}
                    {segmentFlights.length === 0 ? (
                      <NoResults title="No flights for this leg match your criteria." />
                    ) : (
                      segmentFlights.map((flight) => (
                        <FlightCard
                          key={flight.id}
                          flight={flight}
                          tripType={searchParams.tripType}
                          convertPrice={convertPrice}
                          onSelect={handleSelectFlight}
                        />
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
