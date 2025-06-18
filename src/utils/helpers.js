/**
 * Crypto Chat App - Utility Helper Functions
 * A comprehensive collection of utility functions for cryptocurrency operations
 */

// Number formatting utilities
export const formatCurrency = (amount, currency = 'USD', decimals = 2) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
};

export const formatNumber = (number, decimals = 2) => {
  if (number === null || number === undefined) return '0';
  
  const num = parseFloat(number);
  if (isNaN(num)) return '0';
  
  if (num >= 1e9) {
    return (num / 1e9).toFixed(decimals) + 'B';
  } else if (num >= 1e6) {
    return (num / 1e6).toFixed(decimals) + 'M';
  } else if (num >= 1e3) {
    return (num / 1e3).toFixed(decimals) + 'K';
  }
  
  return num.toFixed(decimals);
};

export const formatPercentage = (value, decimals = 2) => {
  if (value === null || value === undefined) return '0%';
  const num = parseFloat(value);
  if (isNaN(num)) return '0%';
  return `${num.toFixed(decimals)}%`;
};

// Date and time utilities
export const formatDate = (timestamp, format = 'short') => {
  const date = new Date(timestamp);
  
  const options = {
    short: { month: 'short', day: 'numeric' },
    long: { year: 'numeric', month: 'long', day: 'numeric' },
    time: { hour: '2-digit', minute: '2-digit' },
    full: { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    }
  };
  
  return date.toLocaleDateString('en-US', options[format] || options.short);
};

export const getTimeAgo = (timestamp) => {
  const now = new Date();
  const past = new Date(timestamp);
  const diffInSeconds = Math.floor((now - past) / 1000);
  
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60
  };
  
  for (const [unit, seconds] of Object.entries(intervals)) {
    const interval = Math.floor(diffInSeconds / seconds);
    if (interval >= 1) {
      return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
    }
  }
  
  return 'Just now';
};

// Cryptocurrency utilities
export const getCryptoSymbol = (coinId) => {
  const symbolMap = {
    'bitcoin': 'BTC',
    'ethereum': 'ETH',
    'binancecoin': 'BNB',
    'cardano': 'ADA',
    'solana': 'SOL',
    'polkadot': 'DOT',
    'dogecoin': 'DOGE',
    'avalanche-2': 'AVAX',
    'polygon': 'MATIC',
    'chainlink': 'LINK'
  };
  
  return symbolMap[coinId] || coinId.toUpperCase();
};

export const calculatePortfolioValue = (holdings, prices) => {
  if (!holdings || !prices) return 0;
  
  return holdings.reduce((total, holding) => {
    const price = prices[holding.coinId]?.usd || 0;
    return total + (holding.amount * price);
  }, 0);
};

export const calculatePriceChange = (currentPrice, previousPrice) => {
  if (!previousPrice || previousPrice === 0) return 0;
  return ((currentPrice - previousPrice) / previousPrice) * 100;
};

// String utilities
export const capitalizeFirst = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

// Array utilities
export const sortByKey = (array, key, direction = 'asc') => {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (direction === 'desc') {
      return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
    }
    return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
  });
};

export const groupBy = (array, key) => {
  return array.reduce((groups, item) => {
    const group = item[key];
    groups[group] = groups[group] || [];
    groups[group].push(item);
    return groups;
  }, {});
};

// Validation utilities
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidCryptoAmount = (amount) => {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0 && num < 1e15;
};

// Local storage utilities
export const setLocalStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    return false;
  }
};

export const getLocalStorage = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return defaultValue;
  }
};

// API utilities
export const createApiUrl = (baseUrl, endpoint, params = {}) => {
  const url = new URL(endpoint, baseUrl);
  Object.keys(params).forEach(key => {
    if (params[key] !== null && params[key] !== undefined) {
      url.searchParams.append(key, params[key]);
    }
  });
  return url.toString();
};

export const handleApiError = (error) => {
  if (error.response) {
    return `API Error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`;
  } else if (error.request) {
    return 'Network Error: Unable to reach the server';
  } else {
    return `Error: ${error.message}`;
  }
};

// Color utilities for charts
export const getColorByChange = (change) => {
  if (change > 0) return '#16a34a'; // green
  if (change < 0) return '#dc2626'; // red
  return '#6b7280'; // gray
};

export const generateChartColors = (count) => {
  const colors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
    '#8b5cf6', '#06b6d4', '#84cc16', '#f97316',
    '#ec4899', '#6366f1'
  ];
  
  const result = [];
  for (let i = 0; i < count; i++) {
    result.push(colors[i % colors.length]);
  }
  return result;
};

// Debounce utility
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Default export with all utilities
export default {
  formatCurrency,
  formatNumber,
  formatPercentage,
  formatDate,
  getTimeAgo,
  getCryptoSymbol,
  calculatePortfolioValue,
  calculatePriceChange,
  capitalizeFirst,
  slugify,
  sortByKey,
  groupBy,
  isValidEmail,
  isValidCryptoAmount,
  setLocalStorage,
  getLocalStorage,
  createApiUrl,
  handleApiError,
  getColorByChange,
  generateChartColors,
  debounce
};
