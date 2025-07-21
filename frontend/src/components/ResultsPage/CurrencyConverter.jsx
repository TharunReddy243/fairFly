import React from 'react';
import { DollarSign } from 'lucide-react';

function CurrencyConverter({
  selectedCurrency,
  onCurrencyChange,
  currencies,
  exchangeRates,
  currencyError,
}) {
  return (
    <div className="currency-converter">
      <div className="currency-header">
        <DollarSign size={20} />
        <h3>Currency Converter</h3>
      </div>
      {currencyError && (
        <div className="currency-error-message" style={{ fontSize: '0.8rem', color: 'orange', marginTop: '5px' }}>
          {currencyError}
        </div>
      )}
      <div className="currency-selector">
        <label>Display prices in:</label>
        <select
          value={selectedCurrency}
          onChange={(e) => onCurrencyChange(e.target.value)}
          className="currency-select"
        >
          {currencies.map((currency) => (
            <option key={currency.code} value={currency.code}>
              {currency.symbol} {currency.code} - {currency.name}
            </option>
          ))}
        </select>
      </div>
      {selectedCurrency !== 'USD' && exchangeRates[selectedCurrency] && (
        <div className="exchange-rate">
          <span>1 USD = {exchangeRates[selectedCurrency]} {selectedCurrency}</span>
        </div>
      )}
    </div>
  );
}

export default CurrencyConverter;