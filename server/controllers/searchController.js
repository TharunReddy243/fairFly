const amadeus = require('../config/amadeus');
const { mapAmadeusResponseToFrontendFormat, mapAmadeusItineraryToFlightLeg } = require('../utils/amadeusMappers');
const delay = require('../utils/delay');
const Search = require('../models/Search');

exports.searchFlights = async (req, res) => {
  const { origin, destination, departureDate, returnDate, tripType, segments, adults, cabinClass } = req.body;

  try {
    // --- Multi-City Flight Search ---
    if (tripType === 'multiCity') {
      const multiCityResponses = [];
      for (const segment of segments) {
        console.log(`Searching segment: ${segment.from} to ${segment.to}`);
        const response = await amadeus.shopping.flightOffersSearch.get({
            originLocationCode: segment.from,
            destinationLocationCode: segment.to,
            departureDate: segment.date,
            adults: adults || 1,
            max: 20,
        });
        multiCityResponses.push(response);
        await delay(250); // Add a 250ms delay to stay under the rate limit
      }
      const mappedSegments = multiCityResponses.map((response, segmentIndex) => {
        const { data, result } = response;
        const carrierDictionary = result.dictionaries?.carriers || {};
        const itineraries = data.map((offer) => ({
          id: `${segmentIndex}-${offer.id}`,
          price: { amount: offer.price.total },
          bookingOptions: { edges: [{ node: { bookingUrl: null } }] },
          sector: mapAmadeusItineraryToFlightLeg(offer.itineraries[0], carrierDictionary),
        }));
        return { data: { itineraries } };
      });
      return res.json({ multiCity: true, segments: mappedSegments });
    }

    // --- One-Way and Return Flight Search ---
    const searchParams = {
      originLocationCode: origin,
      destinationLocationCode: destination,
      departureDate,
      adults: adults || 1,
      currencyCode: 'USD',
      max: 30,
    };

    if (tripType === 'return' && returnDate) {
      searchParams.returnDate = returnDate;
    }

    if (cabinClass && cabinClass.toUpperCase() !== 'ANY') {
      // Map frontend cabin class names to Amadeus API enumeration
      const travelClassMap = {
        ECONOMY: 'ECONOMY',
        PREMIUM: 'PREMIUM_ECONOMY', // Corrected value
        BUSINESS: 'BUSINESS',
        FIRST: 'FIRST',
      };
      const amadeusTravelClass = travelClassMap[cabinClass.toUpperCase()];
      if (amadeusTravelClass) {
        searchParams.travelClass = amadeusTravelClass;
      }
    }

    console.log('Searching Amadeus with params:', searchParams);
    const amadeusResponse = await amadeus.shopping.flightOffersSearch.get(searchParams);
    const formattedResponse = mapAmadeusResponseToFrontendFormat(amadeusResponse, tripType);

    res.json(formattedResponse);
  } catch (error) {
    console.error('Amadeus API Error:', error);
    const statusCode = error.response?.statusCode || 500;
    const errorDetails = error.response?.data?.errors || [{ detail: error.message || 'An unknown error occurred.' }];
    res.status(statusCode).json({ message: 'Failed to fetch flights from Amadeus.', errors: errorDetails });
  }
};

exports.storeSearch = async (req, res) => {
  const { username, from, to, departureDate, returnDate, tripType, segments, passengers, class: flightClass, stops } = req.body;
  if (!username) return res.status(200).json({ message: 'No user logged in, search not stored.' });
  const searchData = { username, tripType, from, to, departureDate, returnDate: returnDate || null, segments: tripType === 'multiCity' ? segments : [], passengers, class: flightClass, stops };
  try {
    const newSearch = new Search(searchData);
    await newSearch.save();
    res.status(201).json({ message: 'Search saved' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to save search' });
  }
};

exports.getSearchHistory = async (req, res) => {
  const { username } = req.query;
  if (!username) return res.status(400).json({ message: 'Username is required' });
  try {
    const searches = await Search.find({ username }).sort({ createdAt: -1 }).limit(10);
    res.json(searches);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch search history' });
  }
};

exports.clearSearchHistory = async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ message: 'Username is required' });
  try {
    await Search.deleteMany({ username });
    res.status(200).json({ message: 'Search history cleared successfully' });
  } catch (err) {
    console.error('Failed to clear search history:', err);
    res.status(500).json({ message: 'Failed to clear search history' });
  }
};