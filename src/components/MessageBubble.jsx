import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import PriceChart from './PriceChart';

const MessageBubble = ({ 
  message, 
  isUser, 
  timestamp, 
  onSpeak, 
  isSpeaking, 
  onStopSpeaking 
}) => {
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleSpeakClick = () => {
    if (isSpeaking) {
      onStopSpeaking();
    } else {
      onSpeak(message.text);
    }
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 animate-slide-up`}>
      <div className={`message-bubble ${isUser ? 'user' : 'assistant'} relative group`}>
        <div className="whitespace-pre-wrap break-words">
          {message.text}
        </div>

        {message.showChart && message.data?.chartData && (
          <div className="mt-3">
            <PriceChart 
              data={message.data.chartData} 
              coinName={message.data.coinName}
              className="max-w-sm"
            />
          </div>
        )}

        {message.data?.priceData && (
          <div className="mt-2 p-2 bg-gray-50 rounded-lg text-sm">
            <div className="flex justify-between items-center">
              <span className="font-medium">Current Price:</span>
              <span className="font-bold">${message.data.priceData.price.toLocaleString()}</span>
            </div>
            {message.data.priceData.marketCap && (
              <div className="flex justify-between items-center mt-1">
                <span className="font-medium">Market Cap:</span>
                <span>${message.data.priceData.marketCap.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between items-center mt-1">
              <span className="font-medium">24h Change:</span>
              <span className={`font-bold ${message.data.changeColor === 'positive' ? 'price-positive' : 'price-negative'}`}>
                {message.data.priceData.change24h > 0 ? '+' : ''}{message.data.priceData.change24h.toFixed(2)}%
              </span>
            </div>
          </div>
        )}

        {message.data?.summary && (
          <div className="mt-2 p-2 bg-gray-50 rounded-lg text-sm">
            <div className="font-medium mb-2">Portfolio Breakdown:</div>
            {message.data.summary.holdings.slice(0, 5).map((holding, index) => (
              <div key={holding.id} className="flex justify-between items-center py-1">
                <span className="font-medium">
                  {holding.amount} {holding.coinSymbol}
                </span>
                <div className="text-right">
                  <div className="font-bold">${holding.currentValue?.toLocaleString() || '0'}</div>
                  <div className="text-xs text-gray-500">
                    {holding.percentage?.toFixed(1) || '0'}%
                  </div>
                </div>
              </div>
            ))}
            {message.data.summary.holdings.length > 5 && (
              <div className="text-xs text-gray-500 mt-1">
                +{message.data.summary.holdings.length - 5} more holdings
              </div>
            )}
          </div>
        )}

        {message.data?.trending && (
          <div className="mt-2 p-2 bg-gray-50 rounded-lg text-sm">
            <div className="font-medium mb-2">Trending Cryptocurrencies:</div>
            {message.data.trending.slice(0, 5).map((coin, index) => (
              <div key={coin.id} className="flex items-center py-1">
                <span className="w-6 text-gray-500 font-medium">{index + 1}.</span>
                <img 
                  src={coin.thumb} 
                  alt={coin.name} 
                  className="w-4 h-4 mr-2"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <span className="font-medium">{coin.name}</span>
                <span className="ml-1 text-gray-500">({coin.symbol})</span>
                {coin.rank && (
                  <span className="ml-auto text-xs text-gray-400">#{coin.rank}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {message.data?.info && (
          <div className="mt-2 p-2 bg-gray-50 rounded-lg text-sm">
            <div className="flex items-center mb-2">
              {message.data.info.image && (
                <img 
                  src={message.data.info.image} 
                  alt={message.data.info.name} 
                  className="w-6 h-6 mr-2"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              )}
              <span className="font-bold">{message.data.info.name} ({message.data.info.symbol})</span>
              {message.data.info.rank && (
                <span className="ml-auto text-xs bg-gray-200 px-2 py-1 rounded">
                  Rank #{message.data.info.rank}
                </span>
              )}
            </div>
            {message.data.info.currentPrice && (
              <div className="flex justify-between items-center mt-1">
                <span className="font-medium">Price:</span>
                <span className="font-bold">${message.data.info.currentPrice.toLocaleString()}</span>
              </div>
            )}
            {message.data.info.marketCap && (
              <div className="flex justify-between items-center mt-1">
                <span className="font-medium">Market Cap:</span>
                <span>${message.data.info.marketCap.toLocaleString()}</span>
              </div>
            )}
            {message.data.info.volume24h && (
              <div className="flex justify-between items-center mt-1">
                <span className="font-medium">24h Volume:</span>
                <span>${message.data.info.volume24h.toLocaleString()}</span>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mt-2 pt-1">
          <span className="text-xs opacity-70">
            {formatTime(timestamp)}
          </span>

          {!isUser && (
            <button
              onClick={handleSpeakClick}
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-gray-100 rounded"
              title={isSpeaking ? "Stop speaking" : "Read aloud"}
            >
              {isSpeaking ? (
                <VolumeX className="w-4 h-4 text-gray-600" />
              ) : (
                <Volume2 className="w-4 h-4 text-gray-600" />
              )}
            </button>
          )}
        </div>

        {message.error && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
