import React, { createContext, useContext, useState, useEffect } from 'react';

const SearchHistoryContext = createContext();

export function SearchHistoryProvider({ children }) {
  const [searchHistory, setSearchHistory] = useState([]);

  // Load search history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('flightSearchHistory');
    if (savedHistory) {
      try {
        setSearchHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error('Error loading search history:', error);
      }
    }
  }, []);

  // Save search history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('flightSearchHistory', JSON.stringify(searchHistory));
  }, [searchHistory]);

  const addSearch = (search) => {
    const newSearch = {
      ...search,
      id: Date.now().toString(),
      searchDate: new Date().toISOString(),
    };

    setSearchHistory(prev => {
      // Remove duplicate searches and keep only the latest 10
      const filtered = prev.filter(item => {
        if (search.tripType === 'multiCity') {
          return !(
            item.tripType === 'multiCity' &&
            JSON.stringify(item.segments) === JSON.stringify(search.segments) &&
            item.passengers === search.passengers &&
            item.class === search.class
          );
        } else {
          return !(
            item.tripType === search.tripType &&
            item.from === search.from &&
            item.to === search.to &&
            item.departureDate === search.departureDate &&
            item.returnDate === search.returnDate &&
            item.passengers === search.passengers &&
            item.class === search.class
          );
        }
      });

      return [newSearch, ...filtered].slice(0, 10);
    });
  };

  const clearHistory = () => {
    setSearchHistory([]);
  };

  const removeSearch = (id) => {
    setSearchHistory(prev => prev.filter(item => item.id !== id));
  };

  return (
    <SearchHistoryContext.Provider value={{
      searchHistory,
      addSearch,
      clearHistory,
      removeSearch
    }}>
      {children}
    </SearchHistoryContext.Provider>
  );
}

export function useSearchHistory() {
  const context = useContext(SearchHistoryContext);
  if (context === undefined) {
    throw new Error('useSearchHistory must be used within a SearchHistoryProvider');
  }
  return context;
}