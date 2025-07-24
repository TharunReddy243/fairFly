const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');
const authMiddleware = require('../middleware/authMiddleware');

// Flight Search Endpoint (Amadeus)
router.post('/flights', searchController.searchFlights);

// Store search input in MongoDB
router.post('/store-search', authMiddleware, searchController.storeSearch);


// Get previous searches for a user
router.get('/search-history', authMiddleware, searchController.getSearchHistory);

// Clear search history for a user
router.post('/clear-history', authMiddleware, searchController.clearSearchHistory);


module.exports = router;