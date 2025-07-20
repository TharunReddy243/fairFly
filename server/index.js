const express = require('express');
const cors = require('cors');
// const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Amadeus = require('amadeus');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: './flightApi.env' });


const User = require('./User');
const Search = require('./Search');
const SearchResult = require('./SearchResult');
// const axios = require('axios');
// const bcrypt = require('bcrypt');


const app = express();
const PORT = process.env.PORT || 5000;


app.use(cors());
// app.use(bodyParser.json());
app.use(express.json());

// Connect to MongoDB
// mongoose.connect('mongodb://localhost:27017/mini2', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// }).then(() => {
//   console.log('Connected to MongoDB');
// }).catch((err) => {
//   console.error('MongoDB connection error:', err);
// });


// Ensure your .env file has the correct MONGODB_URI for your 'mini2' database
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mini2', {
    useNewUrlParser: true, // these are deprecated in Mongoose 6+ but might be needed for your version
    useUnifiedTopology: true,
  })
  .then(() => console.log('🍃 MongoDB connected successfully.'))
  .catch((err) => console.error('MongoDB connection error:', err));

// --- Amadeus API Initialization ---
if (!process.env.AMADEUS_API_KEY || !process.env.AMADEUS_API_SECRET) {
  console.error('Amadeus API credentials not set in flightApi.env. Please check your configuration.');
  process.exit(1);
}

const amadeus = new Amadeus({
  clientId: process.env.AMADEUS_API_KEY,
  clientSecret: process.env.AMADEUS_API_SECRET,
});

// --- Utility Functions to Map Amadeus Data for Frontend ---
const parseISODuration = (isoDuration) => {
  if (!isoDuration) return 0;
  const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
  const matches = isoDuration.match(regex);
  if (!matches) return 0;
  const hours = matches[1] ? parseInt(matches[1], 10) : 0;
  const minutes = matches[2] ? parseInt(matches[2], 10) : 0;
  return hours * 3600 + minutes * 60;
};

const mapAmadeusItineraryToFlightLeg = (itinerary, carrierDictionary) => {
  if (!itinerary || !itinerary.segments) return null;
  const sectorSegments = itinerary.segments.map((segment) => ({
    segment: {
      carrier: {
        name: carrierDictionary[segment.carrierCode] || segment.carrierCode,
        code: segment.carrierCode,
      },
      code: segment.number,
      source: { utcTime: segment.departure.at, station: { code: segment.departure.iataCode } },
      destination: { utcTime: segment.arrival.at, station: { code: segment.arrival.iataCode } },
    },
  }));
  return { duration: parseISODuration(itinerary.duration), sectorSegments };
};

const mapAmadeusResponseToFrontendFormat = (amadeusResponse, tripType) => {
  const { data, result } = amadeusResponse;
  const carrierDictionary = result.dictionaries?.carriers || {};
  const itineraries = data.map((offer) => {
    const baseFlight = {
      id: offer.id,
      price: { amount: offer.price.total },
      bookingOptions: { edges: [{ node: { bookingUrl: null } }] }, // Amadeus does not provide a simple booking URL
    };
    if (tripType === 'return') {
      return {
        ...baseFlight,
        outbound: mapAmadeusItineraryToFlightLeg(offer.itineraries[0], carrierDictionary),
        inbound: mapAmadeusItineraryToFlightLeg(offer.itineraries[1], carrierDictionary),
      };
    } else {
      return { ...baseFlight, sector: mapAmadeusItineraryToFlightLeg(offer.itineraries[0], carrierDictionary) };
    }
  });
  return { data: { itineraries } };
};


// Signup endpoint
app.post('/signup', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password required' });
  }
  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: 'User created' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Login endpoint
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    res.json({ message: 'Login successful', username: user.username });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- Flight Search Endpoint (Amadeus) ---
app.post('/api/flights', async (req, res) => {
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
            departureDate: segment.date, // IMPORTANT: Use future dates like 2025-11-20 for testing
            adults: adults || 1,
            max: 20,
        });
        multiCityResponses.push(response);
        await delay(250); // Add a 250ms delay to stay under the rate limit
      }
      // const mappedSegments = multiCityResponses.map((response) => mapAmadeusResponseToFrontendFormat(response, 'oneWay'));
      // Create unique IDs for multi-city results
      const mappedSegments = multiCityResponses.map((response, segmentIndex) => {
        const { data, result } = response;
        const carrierDictionary = result.dictionaries?.carriers || {};

        const itineraries = data.map((offer) => ({
          // Prefix the ID with the segment index to ensure it's unique
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
      departureDate, // IMPORTANT: Use future dates like 2025-11-20 for testing
      adults: adults || 1,
      currencyCode: 'USD',
      max: 30,
    };

    if (tripType === 'return' && returnDate) {
      searchParams.returnDate = returnDate; // IMPORTANT: Use future dates like 2025-11-30 for testing
    }

    if (cabinClass && cabinClass.toUpperCase() !== 'ANY') {
      searchParams.travelClass = cabinClass.toUpperCase();
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
});

    
// Store search input in MongoDB
app.post('/api/store-search', async (req, res) => {
  const { username, from, to, departureDate, returnDate, tripType, segments, passengers, class: flightClass, stops } = req.body;

  if (!username) {
    return res.status(200).json({ message: 'No user logged in, search not stored.' });
  }

  const searchData = {
    username, tripType, from, to, departureDate,
    returnDate: returnDate || null,
    segments: tripType === 'multiCity' ? segments : [],
    passengers, class: flightClass, stops,
  };

  try {
    // const newSearch = new Search({ from, to, departureDate, returnDate, tripType, segments, username });
    const newSearch = new Search(searchData);
    await newSearch.save();
    res.status(201).json({ message: 'Search saved' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to save search' });
  }
});

// Get previous searches for a user
app.get('/api/search-history', async (req, res) => {
  const { username } = req.query;
  if (!username) {
    return res.status(400).json({ message: 'Username is required' });
  }
  try {
    const searches = await Search.find({ username }).sort({ createdAt: -1 }).limit(10);
    res.json(searches);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch search history' });
  }
});

// Clear search history for a user
app.post('/api/search-history/clear', async (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ message: 'Username is required' });
  }
  try {
    await Search.deleteMany({ username });
    res.status(200).json({ message: 'Search history cleared successfully' });
  } catch (err) {
    console.error('Failed to clear search history:', err);
    res.status(500).json({ message: 'Failed to clear search history' });
  }
});

// Store search results
app.post('/api/store-search-result', async (req, res) => {
  const { from, to, departureDate, returnDate, results } = req.body;
  try {
    const newResult = new SearchResult({ from, to, departureDate, returnDate, results });
    await newResult.save();
    res.status(201).json({ message: 'Search results saved' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to save search results' });
  }
});

// Get previous search results
app.get('/api/search-results', async (req, res) => {
  try {
    const results = await SearchResult.find().sort({ createdAt: -1 }).limit(10);
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch search results' });
  }
});

app.listen(PORT, () => {
  console.log(`✈️ Server running on http://localhost:${PORT}`);
});
