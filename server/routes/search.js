const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');

// Flight Search Endpoint (Amadeus)
router.post('/flights', searchController.searchFlights);

// Store search input in MongoDB
router.post('/store-search', searchController.storeSearch);

// Get previous searches for a user
router.get('/search-history', searchController.getSearchHistory);

// Clear search history for a user
router.post('/search-history/clear', searchController.clearSearchHistory);

module.exports = router;