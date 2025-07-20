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
      return { ...baseFlight, outbound: mapAmadeusItineraryToFlightLeg(offer.itineraries[0], carrierDictionary), inbound: mapAmadeusItineraryToFlightLeg(offer.itineraries[1], carrierDictionary) };
    }
    return { ...baseFlight, sector: mapAmadeusItineraryToFlightLeg(offer.itineraries[0], carrierDictionary) };
  });
  return { data: { itineraries } };
};

module.exports = { mapAmadeusResponseToFrontendFormat, mapAmadeusItineraryToFlightLeg, parseISODuration };