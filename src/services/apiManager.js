/**
 * API Manager - Centralized API handling for Crypto Chat App
 * Handles all external API calls with proper error handling and caching
 */

import axios from 'axios';
import { API_CONFIG } from '../utils/constants.js';
import { handleApiError, createApiUrl } from '../utils/helpers.js';

class ApiManager {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.rateLimiter = new Map();
    this.maxRequestsPerMinute = 50;
    
    // Create axios instance with default config
    this.axiosInstance = axios.create({
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // Add request interceptor for rate limiting
    this.axiosInstance.interceptors.request.use(
      (config) => this.handleRateLimit(config),
      (error) => Promise.reject(error)
    );
    
    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => this.handleResponseError(error)
    );
  }
  
  // Rate limiting logic
  handleRateLimit(config) {
    const now = Date.now();
    const windowStart = now - 60000; // 1 minute window
    
    // Clean old requests
    for (const [timestamp] of this.rateLimiter) {
      if (timestamp < windowStart) {
        this.rateLimiter.delete(timestamp);
      }
    }
    
    // Check if we're within rate limit
    if (this.rateLimiter.size >= this.maxRequestsPerMinute) {
      throw new Error('Rate limit exceeded. Please wait before making more requests.');
    }
    
    // Add current request to rate limiter
    this.rateLimiter.set(now, true);
    
    return config;
  }
  
  // Handle response errors
  handleResponseError(error) {
    const errorMessage = handleApiError(error);
    console.error('API Error:', errorMessage);
    return Promise.reject(new Error(errorMessage));
  }
  
  // Cache management
  getCacheKey(url, params = {}) {
    return `${url}_${JSON.stringify(params)}`;
  }
  
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }
  
  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }
  
  // Generic API request method
  async makeRequest(url, params = {}, useCache = true) {
    const cacheKey = this.getCacheKey(url, params);
    
    // Check cache first
    if (useCache) {
      const cachedData = this.getFromCache(cacheKey);
      if (cachedData) {
        return cachedData;
      }
    }
    
    try {
      const fullUrl = createApiUrl(API_CONFIG.coinGecko.baseUrl, url, params);
      const response = await this.axiosInstance.get(fullUrl);
      
      // Cache successful responses
      if (useCache && response.data) {
        this.setCache(cacheKey, response.data);
      }
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }
  
  // Cryptocurrency price methods
  async getCryptoPrices(coinIds, vsCurrency = 'usd') {
    const params = {
      ids: Array.isArray(coinIds) ? coinIds.join(',') : coinIds,
      vs_currencies: vsCurrency,
      include_24hr_change: true,
      include_market_cap: true,
      include_24hr_vol: true,
    };
    
    return this.makeRequest('/simple/price', params);
  }
  
  async getCoinDetails(coinId) {
    const params = {
      localization: false,
      tickers: false,
      market_data: true,
      community_data: false,
      developer_data: false,
      sparkline: false,
    };
    
    return this.makeRequest(`/coins/${coinId}`, params);
  }
  
  async getMarketData(vsCurrency = 'usd', perPage = 100, page = 1) {
    const params = {
      vs_currency: vsCurrency,
      order: 'market_cap_desc',
      per_page: perPage,
      page: page,
      sparkline: false,
      price_change_percentage: '24h,7d',
    };
    
    return this.makeRequest('/coins/markets', params);
  }
  
  async getTrendingCoins() {
    return this.makeRequest('/search/trending');
  }
  
  async getCoinHistory(coinId, days = 7, vsCurrency = 'usd') {
    const params = {
      vs_currency: vsCurrency,
      days: days,
      interval: days <= 1 ? 'hourly' : 'daily',
    };
    
    return this.makeRequest(`/coins/${coinId}/market_chart`, params);
  }
  
  // Search methods
  async searchCoins(query) {
    if (!query || query.length < 2) {
      return { coins: [] };
    }
    
    const params = { query };
    return this.makeRequest('/search', params, false); // Don't cache search results
  }
  
  // Global market data
  async getGlobalData() {
    return this.makeRequest('/global');
  }
  
  // Exchange rates
  async getExchangeRates() {
    return this.makeRequest('/exchange_rates');
  }
  
  // Portfolio tracking methods
  async getPortfolioValue(holdings) {
    if (!holdings || holdings.length === 0) {
      return { totalValue: 0, holdings: [] };
    }
    
    const coinIds = holdings.map(h => h.coinId);
    const prices = await this.getCryptoPrices(coinIds);
    
    const portfolioData = holdings.map(holding => {
      const price = prices[holding.coinId]?.usd || 0;
      const value = holding.amount * price;
      const change24h = prices[holding.coinId]?.usd_24h_change || 0;
      
      return {
        ...holding,
        currentPrice: price,
        value: value,
        change24h: change24h,
        changeValue: (value * change24h) / 100,
      };
    });
    
    const totalValue = portfolioData.reduce((sum, item) => sum + item.value, 0);
    const totalChange = portfolioData.reduce((sum, item) => sum + item.changeValue, 0);
    const totalChangePercent = totalValue > 0 ? (totalChange / (totalValue - totalChange)) * 100 : 0;
    
    return {
      totalValue,
      totalChange,
      totalChangePercent,
      holdings: portfolioData,
    };
  }
  
  // Batch operations
  async batchRequest(requests) {
    const promises = requests.map(request => 
      this.makeRequest(request.url, request.params, request.useCache)
        .catch(error => ({ error: error.message }))
    );
    
    return Promise.all(promises);
  }
  
  // Cache management methods
  clearCache() {
    this.cache.clear();
  }
  
  getCacheSize() {
    return this.cache.size;
  }
  
  getCacheStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;
    
    for (const [, value] of this.cache) {
      if (now - value.timestamp < this.cacheTimeout) {
        validEntries++;
      } else {
        expiredEntries++;
      }
    }
    
    return {
      total: this.cache.size,
      valid: validEntries,
      expired: expiredEntries,
    };
  }
  
  // Cleanup expired cache entries
  cleanupCache() {
    const now = Date.now();
    for (const [key, value] of this.cache) {
      if (now - value.timestamp >= this.cacheTimeout) {
        this.cache.delete(key);
      }
    }
  }
}

// Create singleton instance
const apiManager = new ApiManager();

// Auto cleanup cache every 10 minutes
setInterval(() => {
  apiManager.cleanupCache();
}, 10 * 60 * 1000);

export default apiManager;

// Named exports for specific functionality
export const {
  getCryptoPrices,
  getCoinDetails,
  getMarketData,
  getTrendingCoins,
  getCoinHistory,
  searchCoins,
  getGlobalData,
  getPortfolioValue,
  clearCache,
  getCacheStats,
} = apiManager;
