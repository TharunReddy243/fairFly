const Amadeus = require('amadeus');
require('dotenv').config({ path: './flightApi.env' });

if (!process.env.AMADEUS_API_KEY || !process.env.AMADEUS_API_SECRET) {
  console.error('Amadeus API credentials not set in flightApi.env. Please check your configuration.');
  process.exit(1);
}

const amadeus = new Amadeus({
  clientId: process.env.AMADEUS_API_KEY,
  clientSecret: process.env.AMADEUS_API_SECRET,
});

module.exports = amadeus;