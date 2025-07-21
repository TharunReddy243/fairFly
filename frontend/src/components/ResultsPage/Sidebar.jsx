import React from 'react';
import CurrencyConverter from './CurrencyConverter';
import Filters from './Filters';

function Sidebar({
  // Currency props
  selectedCurrency,
  onCurrencyChange,
  currencies,
  exchangeRates,
  currencyError,
  // Filter props
  priceRange,
  onPriceChange,
  uniqueAirlines,
  selectedAirlines,
  onAirlineChange,
  selectedStops,
  onStopsChange,
  convertPrice,
}) {
  return (
    <div className="filters-sidebar">
      <CurrencyConverter
        selectedCurrency={selectedCurrency}
        onCurrencyChange={onCurrencyChange}
        currencies={currencies}
        exchangeRates={exchangeRates}
        currencyError={currencyError}
      />
      <Filters
        priceRange={priceRange}
        onPriceChange={onPriceChange}
        uniqueAirlines={uniqueAirlines}
        selectedAirlines={selectedAirlines}
        onAirlineChange={onAirlineChange}
        selectedStops={selectedStops}
        onStopsChange={onStopsChange}
        convertPrice={convertPrice}
      />
    </div>
  );
}

export default Sidebar;