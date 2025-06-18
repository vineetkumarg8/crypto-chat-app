import axios from 'axios';

const BASE_URL = 'https://api.coingecko.com/api/v3';

class RateLimiter {
  constructor(maxRequests = 10, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = [];
  }

  canMakeRequest() {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    return this.requests.length < this.maxRequests;
  }

  recordRequest() {
    this.requests.push(Date.now());
  }
}

const rateLimiter = new RateLimiter();

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  if (!rateLimiter.canMakeRequest()) {
    return Promise.reject(new Error('Rate limit exceeded. Please wait a moment.'));
  }
  rateLimiter.recordRequest();
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 429) {
      throw new Error('API rate limit exceeded. Please try again in a minute.');
    }
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Please check your connection.');
    }
    if (!error.response) {
      throw new Error('Network error. Please check your internet connection.');
    }
    throw error;
  }
);

export const cryptoAPI = {
  async getCurrentPrice(coinId) {
    try {
      const response = await api.get(`/simple/price`, {
        params: {
          ids: coinId,
          vs_currencies: 'usd',
          include_24hr_change: true,
          include_market_cap: true,
        }
      });
      
      const data = response.data[coinId];
      if (!data) {
        throw new Error(`Cryptocurrency "${coinId}" not found`);
      }
      
      return {
        price: data.usd,
        change24h: data.usd_24h_change,
        marketCap: data.usd_market_cap,
      };
    } catch (error) {
      console.error('Error fetching current price:', error);
      throw error;
    }
  },

  async getTrendingCoins() {
    try {
      const response = await api.get('/search/trending');
      return response.data.coins.map(coin => ({
        id: coin.item.id,
        name: coin.item.name,
        symbol: coin.item.symbol,
        rank: coin.item.market_cap_rank,
        thumb: coin.item.thumb,
      }));
    } catch (error) {
      console.error('Error fetching trending coins:', error);
      throw error;
    }
  },

  async getCoinDetails(coinId) {
    try {
      const response = await api.get(`/coins/${coinId}`, {
        params: {
          localization: false,
          tickers: false,
          market_data: true,
          community_data: false,
          developer_data: false,
        }
      });
      
      const coin = response.data;
      return {
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol.toUpperCase(),
        description: coin.description?.en?.split('.')[0] + '.' || 'No description available.',
        currentPrice: coin.market_data?.current_price?.usd,
        marketCap: coin.market_data?.market_cap?.usd,
        change24h: coin.market_data?.price_change_percentage_24h,
        volume24h: coin.market_data?.total_volume?.usd,
        rank: coin.market_cap_rank,
        image: coin.image?.large,
      };
    } catch (error) {
      console.error('Error fetching coin details:', error);
      throw error;
    }
  },

  async getHistoricalData(coinId, days = 7) {
    try {
      const response = await api.get(`/coins/${coinId}/market_chart`, {
        params: {
          vs_currency: 'usd',
          days: days,
          interval: days <= 1 ? 'hourly' : 'daily',
        }
      });
      
      return response.data.prices.map(([timestamp, price]) => ({
        timestamp: new Date(timestamp),
        price: price,
      }));
    } catch (error) {
      console.error('Error fetching historical data:', error);
      throw error;
    }
  },

  async searchCoins(query) {
    try {
      const response = await api.get('/search', {
        params: { query }
      });
      
      return response.data.coins.slice(0, 10).map(coin => ({
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol.toUpperCase(),
        rank: coin.market_cap_rank,
        thumb: coin.thumb,
      }));
    } catch (error) {
      console.error('Error searching coins:', error);
      throw error;
    }
  },

  async getMultiplePrices(coinIds) {
    try {
      const response = await api.get('/simple/price', {
        params: {
          ids: coinIds.join(','),
          vs_currencies: 'usd',
          include_24hr_change: true,
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching multiple prices:', error);
      throw error;
    }
  },
};

export const normalizeCoinName = (name) => {
  const coinMap = {
    'btc': 'bitcoin',
    'bitcoin': 'bitcoin',
    'eth': 'ethereum',
    'ethereum': 'ethereum',
    'ada': 'cardano',
    'cardano': 'cardano',
    'dot': 'polkadot',
    'polkadot': 'polkadot',
    'link': 'chainlink',
    'chainlink': 'chainlink',
    'bnb': 'binancecoin',
    'binance': 'binancecoin',
    'sol': 'solana',
    'solana': 'solana',
    'matic': 'matic-network',
    'polygon': 'matic-network',
    'avax': 'avalanche-2',
    'avalanche': 'avalanche-2',
    'luna': 'terra-luna',
    'doge': 'dogecoin',
    'dogecoin': 'dogecoin',
    'shib': 'shiba-inu',
    'shiba': 'shiba-inu',
  };
  
  return coinMap[name.toLowerCase()] || name.toLowerCase();
};

export default cryptoAPI;
