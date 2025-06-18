import { normalizeCoinName } from '../services/cryptoAPI';


const PATTERNS = {
  // Price queries
  PRICE_QUERY: /(?:what'?s|what is|price of|current price|how much is)\s+(.+?)(?:\s+trading\s+at)?(?:\?)?$/i,
  PRICE_SIMPLE: /^(.+?)\s+price$/i,
  PRICE_TRADING: /(?:what'?s|what is)\s+(.+?)\s+trading\s+at/i,
  ADD_HOLDING: /(?:i have|i own|add|buy|bought)\s+(\d+(?:\.\d+)?)\s+(.+?)(?:\s+(?:coins?|tokens?))?$/i,
  PORTFOLIO_VALUE: /(?:portfolio|my holdings|total value|how much|what'?s my portfolio worth)/i,
  TRENDING: /(?:trending|hot|popular|top)\s*(?:coins?|crypto|cryptocurrencies?)?/i,
  CHART_REQUEST: /(?:chart|graph|price chart|show chart)\s+(?:for\s+)?(.+?)(?:\s+(?:7\s*days?|week|weekly))?$/i,
  INFO_REQUEST: /(?:tell me about|info about|information about|what is)\s+(.+)/i,
  HELP: /^(?:help|what can you do|commands)$/i,
};


const extractCoinName = (text) => {
  const cleaned = text
    .toLowerCase()
    .replace(/\b(?:price|current|trading|at|now|today|currently)\b/g, '')
    .replace(/\b(?:crypto|cryptocurrency)\b/g, '')
    .replace(/\b(?:token)\b(?!\w)/g, '') // Only remove "token" if it's a standalone word
    .replace(/\b(?:coin)\b(?!\w)/g, '') // Only remove "coin" if it's a standalone word
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned;
};

const extractHoldingInfo = (text) => {
  const match = text.match(/(\d+(?:\.\d+)?)\s+(.+)/i);
  if (match) {
    const amount = parseFloat(match[1]);
    const coinName = extractCoinName(match[2]);
    return { amount, coinName };
  }
  return null;
};

export const parseMessage = (message) => {
  const trimmed = message.trim();

  let match = trimmed.match(PATTERNS.PRICE_TRADING);
  if (match) {
    const coinName = extractCoinName(match[1]);
    return {
      type: 'PRICE_QUERY',
      coinName: normalizeCoinName(coinName),
      originalCoinName: coinName,
    };
  }

  match = trimmed.match(PATTERNS.PRICE_QUERY);
  if (match) {
    const coinName = extractCoinName(match[1]);
    return {
      type: 'PRICE_QUERY',
      coinName: normalizeCoinName(coinName),
      originalCoinName: coinName,
    };
  }
  
  match = trimmed.match(PATTERNS.PRICE_SIMPLE);
  if (match) {
    const coinName = extractCoinName(match[1]);
    return {
      type: 'PRICE_QUERY',
      coinName: normalizeCoinName(coinName),
      originalCoinName: coinName,
    };
  }
  
  match = trimmed.match(PATTERNS.ADD_HOLDING);
  if (match) {
    const holdingInfo = extractHoldingInfo(trimmed);
    if (holdingInfo) {
      return {
        type: 'ADD_HOLDING',
        amount: holdingInfo.amount,
        coinName: normalizeCoinName(holdingInfo.coinName),
        originalCoinName: holdingInfo.coinName,
      };
    }
  }
  
  if (PATTERNS.PORTFOLIO_VALUE.test(trimmed)) {
    return {
      type: 'PORTFOLIO_VALUE',
    };
  }

  if (PATTERNS.TRENDING.test(trimmed)) {
    return {
      type: 'TRENDING',
    };
  }
  
  match = trimmed.match(PATTERNS.CHART_REQUEST);
  if (match) {
    const coinName = extractCoinName(match[1]);
    return {
      type: 'CHART_REQUEST',
      coinName: normalizeCoinName(coinName),
      originalCoinName: coinName,
    };
  }
  
  match = trimmed.match(PATTERNS.INFO_REQUEST);
  if (match) {
    const coinName = extractCoinName(match[1]);
    return {
      type: 'INFO_REQUEST',
      coinName: normalizeCoinName(coinName),
      originalCoinName: coinName,
    };
  }

  if (PATTERNS.HELP.test(trimmed)) {
    return {
      type: 'HELP',
    };
  }
  
  return {
    type: 'GENERAL',
    message: trimmed,
  };
};

export const generateResponse = async (intent, cryptoAPI, portfolioHook) => {
  try {
    switch (intent.type) {
      case 'PRICE_QUERY':
        const priceData = await cryptoAPI.getCurrentPrice(intent.coinName);
        const changeText = priceData.change24h > 0 ? 'up' : 'down';
        const changeColor = priceData.change24h > 0 ? 'positive' : 'negative';
        
        return {
          text: `${intent.originalCoinName.toUpperCase()} is currently trading at $${priceData.price.toLocaleString()} (${changeText} ${Math.abs(priceData.change24h).toFixed(2)}% in 24h)`,
          data: { priceData, changeColor },
        };
      
      case 'ADD_HOLDING':
        const coinDetails = await cryptoAPI.getCoinDetails(intent.coinName);
        portfolioHook.addHolding(
          intent.coinName,
          coinDetails.name,
          coinDetails.symbol,
          intent.amount
        );
        
        return {
          text: `Added ${intent.amount} ${coinDetails.symbol} to your portfolio! Current value: $${(intent.amount * coinDetails.currentPrice).toLocaleString()}`,
          data: { coinDetails, amount: intent.amount },
        };
      
      case 'PORTFOLIO_VALUE':
        const summary = portfolioHook.getPortfolioSummary();
        if (summary.totalCoins === 0) {
          return {
            text: "Your portfolio is empty. Try adding some holdings by saying something like 'I have 2 ETH'",
          };
        }
        
        const changeText2 = summary.change24h > 0 ? 'up' : 'down';
        return {
          text: `Your portfolio is worth $${summary.totalValue.toLocaleString()} across ${summary.totalCoins} different cryptocurrencies (${changeText2} ${Math.abs(summary.change24h).toFixed(2)}% today)`,
          data: { summary },
        };
      
      case 'TRENDING':
        const trending = await cryptoAPI.getTrendingCoins();
        const trendingList = trending.slice(0, 5).map((coin, index) => 
          `${index + 1}. ${coin.name} (${coin.symbol})`
        ).join('\n');
        
        return {
          text: `Here are today's top trending cryptocurrencies:\n\n${trendingList}`,
          data: { trending },
        };
      
      case 'CHART_REQUEST':
        try {
          const coinDetails = await cryptoAPI.getCoinDetails(intent.coinName);
          const chartData = await cryptoAPI.getHistoricalData(intent.coinName, 7);
          return {
            text: `Here's the 7-day price chart for ${coinDetails.name}:`,
            data: { chartData, coinName: coinDetails.name },
            showChart: true,
          };
        } catch (error) {
          try {
            const searchResults = await cryptoAPI.searchCoins(intent.originalCoinName);
            if (searchResults.length > 0) {
              const firstResult = searchResults[0];
              const chartData = await cryptoAPI.getHistoricalData(firstResult.id, 7);
              return {
                text: `Here's the 7-day price chart for ${firstResult.name}:`,
                data: { chartData, coinName: firstResult.name },
                showChart: true,
              };
            }
          } catch (searchError) {
            console.error('Chart search fallback failed:', searchError);
          }
          throw new Error(`Could not find chart data for "${intent.originalCoinName}". Try using the full name or symbol.`);
        }
      
      case 'INFO_REQUEST':
        const info = await cryptoAPI.getCoinDetails(intent.coinName);
        return {
          text: `${info.name} (${info.symbol}) is currently ranked #${info.rank} with a market cap of $${info.marketCap?.toLocaleString() || 'N/A'}. ${info.description}`,
          data: { info },
        };
      
      case 'HELP':
        return {
          text: `I can help you with cryptocurrency information! Try asking me:
          
• "What's Bitcoin trading at?" - Get current prices
• "I have 2 ETH" - Add to your portfolio  
• "What's my portfolio worth?" - Check portfolio value
• "Show me trending coins" - See what's hot
• "Show chart for Bitcoin" - View price charts
• "Tell me about Ethereum" - Get coin information

Just speak naturally - I'll understand!`,
        };
      
      default:
        return {
          text: "I'm not sure how to help with that. Try asking about cryptocurrency prices, your portfolio, or trending coins. Say 'help' to see what I can do!",
        };
    }
  } catch (error) {
    console.error('Error generating response:', error);
    return {
      text: `Sorry, I encountered an error: ${error.message}. Please try again.`,
      error: true,
    };
  }
};

export default { parseMessage, generateResponse };
