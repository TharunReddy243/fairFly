const mongoose = require('mongoose');

const searchResultSchema = new mongoose.Schema({
  from: { type: String, required: true },
  to: { type: String, required: true },
  departureDate: { type: String, required: true },
  returnDate: { type: String },
  results: { type: Array, required: true },
  createdAt: { type: Date, default: Date.now }
});

const SearchResult = mongoose.model('SearchResult', searchResultSchema);

module.exports = SearchResult;
