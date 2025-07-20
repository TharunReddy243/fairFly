const mongoose = require('mongoose');

const searchSchema = new mongoose.Schema({
  // For one-way/return
  from: { type: String },
  to: { type: String },
  departureDate: { type: String },
  returnDate: { type: String },
  // For multi-city
  tripType: { type: String },
  segments: [{
    from: String,
    to: String,
    date: String
  }],
  username: { type: String, required: true }, // Associate search with user
  createdAt: { type: Date, default: Date.now }
});

const Search = mongoose.model('Search', searchSchema);

module.exports = Search;
