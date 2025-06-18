import { useState, useEffect, useCallback } from 'react';
import { cryptoAPI } from '../services/cryptoAPI';

const STORAGE_KEY = 'crypto-chat-portfolio';

export const usePortfolio = () => {
  const [holdings, setHoldings] = useState([]);
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const savedPortfolio = localStorage.getItem(STORAGE_KEY);
    if (savedPortfolio) {
      try {
        const parsed = JSON.parse(savedPortfolio);
        setHoldings(parsed);
      } catch (error) {
        console.error('Error loading portfolio:', error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(holdings));
  }, [holdings]);

  const calculatePortfolioValue = useCallback(async () => {
    if (holdings.length === 0) {
      setPortfolioValue(0);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const coinIds = holdings.map(holding => holding.coinId);
      const prices = await cryptoAPI.getMultiplePrices(coinIds);
      
      let totalValue = 0;
      const updatedHoldings = holdings.map(holding => {
        const priceData = prices[holding.coinId];
        if (priceData) {
          const currentValue = holding.amount * priceData.usd;
          totalValue += currentValue;
          
          return {
            ...holding,
            currentPrice: priceData.usd,
            currentValue: currentValue,
            change24h: priceData.usd_24h_change,
            lastUpdated: new Date().toISOString(),
          };
        }
        return holding;
      });

      setHoldings(updatedHoldings);
      setPortfolioValue(totalValue);
    } catch (error) {
      console.error('Error calculating portfolio value:', error);
      setError('Failed to update portfolio values');
    } finally {
      setLoading(false);
    }
  }, [holdings]);

  const addHolding = useCallback((coinId, coinName, coinSymbol, amount) => {
    setHoldings(prevHoldings => {
      const existingIndex = prevHoldings.findIndex(h => h.coinId === coinId);
      
      if (existingIndex >= 0) {
        const updated = [...prevHoldings];
        updated[existingIndex] = {
          ...updated[existingIndex],
          amount: updated[existingIndex].amount + amount,
          lastUpdated: new Date().toISOString(),
        };
        return updated;
      } 
      else {
        return [...prevHoldings, {
          id: Date.now().toString(),
          coinId,
          coinName,
          coinSymbol: coinSymbol.toUpperCase(),
          amount,
          addedAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
        }];
      }
    });
  }, []);

  const removeHolding = useCallback((holdingId) => {
    setHoldings(prevHoldings => 
      prevHoldings.filter(holding => holding.id !== holdingId)
    );
  }, []);

  const updateHolding = useCallback((holdingId, newAmount) => {
    if (newAmount <= 0) {
      removeHolding(holdingId);
      return;
    }

    setHoldings(prevHoldings =>
      prevHoldings.map(holding =>
        holding.id === holdingId
          ? { ...holding, amount: newAmount, lastUpdated: new Date().toISOString() }
          : holding
      )
    );
  }, [removeHolding]);

  const clearPortfolio = useCallback(() => {
    setHoldings([]);
    setPortfolioValue(0);
  }, []);

  const getHolding = useCallback((coinId) => {
    return holdings.find(holding => holding.coinId === coinId);
  }, [holdings]);

  const getPortfolioSummary = useCallback(() => {
    const totalCoins = holdings.length;
    const totalValue = portfolioValue;
    
    let totalChange24h = 0;
    let validChanges = 0;
    
    holdings.forEach(holding => {
      if (holding.change24h !== undefined && holding.currentValue) {
        const holdingChange = (holding.change24h / 100) * holding.currentValue;
        totalChange24h += holdingChange;
        validChanges++;
      }
    });

    const avgChange24h = validChanges > 0 ? (totalChange24h / totalValue) * 100 : 0;

    return {
      totalCoins,
      totalValue,
      change24h: avgChange24h,
      holdings: holdings.map(holding => ({
        ...holding,
        percentage: totalValue > 0 ? (holding.currentValue / totalValue) * 100 : 0,
      })),
    };
  }, [holdings, portfolioValue]);

  useEffect(() => {
    if (holdings.length > 0) {
      calculatePortfolioValue();
      
      const interval = setInterval(calculatePortfolioValue, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [holdings.length, calculatePortfolioValue]);

  return {
    holdings,
    portfolioValue,
    loading,
    error,
    addHolding,
    removeHolding,
    updateHolding,
    clearPortfolio,
    getHolding,
    getPortfolioSummary,
    refreshPortfolio: calculatePortfolioValue,
  };
};
