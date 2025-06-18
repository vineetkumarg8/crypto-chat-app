// Application constants and configuration
export const APP_CONFIG = {
  name: 'Crypto Chat App',
  version: '1.0.0',
  description: 'A modern React-based cryptocurrency chat application',
  author: 'vineetkumarg8',
  repository: 'https://github.com/vineetkumarg8/crypto-chat-app'
};

// API Configuration
export const API_CONFIG = {
  coinGecko: {
    baseUrl: 'https://api.coingecko.com/api/v3',
    endpoints: {
      price: '/simple/price',
      trending: '/search/trending',
      markets: '/coins/markets',
      history: '/coins/{id}/market_chart'
    }
  }
};

// Supported cryptocurrencies
export const SUPPORTED_CRYPTOS = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
  { id: 'binancecoin', symbol: 'BNB', name: 'Binance Coin' },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano' },
  { id: 'solana', symbol: 'SOL', name: 'Solana' },
  { id: 'polkadot', symbol: 'DOT', name: 'Polkadot' },
  { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin' },
  { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche' },
  { id: 'polygon', symbol: 'MATIC', name: 'Polygon' },
  { id: 'chainlink', symbol: 'LINK', name: 'Chainlink' }
];

// Chart configuration
export const CHART_CONFIG = {
  defaultTimeframe: '7d',
  colors: {
    primary: '#3b82f6',
    success: '#16a34a',
    danger: '#dc2626',
    warning: '#f59e0b'
  },
  animation: {
    duration: 1000,
    easing: 'easeInOutQuart'
  }
};

// Local storage keys
export const STORAGE_KEYS = {
  portfolio: 'crypto-chat-portfolio',
  preferences: 'crypto-chat-preferences',
  chatHistory: 'crypto-chat-history'
};

// Message types
export const MESSAGE_TYPES = {
  USER: 'user',
  BOT: 'bot',
  SYSTEM: 'system',
  ERROR: 'error'
};

// Command patterns for message parsing
export const COMMAND_PATTERNS = {
  price: /(?:price|cost|value)\s+(?:of\s+)?(\w+)/i,
  chart: /(?:chart|graph)\s+(?:for\s+)?(\w+)/i,
  portfolio: /(?:portfolio|holdings|my\s+coins)/i,
  add: /(?:add|buy|purchase)\s+(\d+(?:\.\d+)?)\s+(\w+)/i,
  remove: /(?:remove|sell)\s+(\d+(?:\.\d+)?)\s+(\w+)/i,
  trending: /(?:trending|popular|hot)\s+(?:coins|crypto)/i
};

export default {
  APP_CONFIG,
  API_CONFIG,
  SUPPORTED_CRYPTOS,
  CHART_CONFIG,
  STORAGE_KEYS,
  MESSAGE_TYPES,
  COMMAND_PATTERNS
};
