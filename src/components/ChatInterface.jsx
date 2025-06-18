import React, { useState, useEffect, useRef } from 'react';
import { Wallet, TrendingUp, HelpCircle } from 'lucide-react';
import MessageBubble from './MessageBubble';
import InputArea from './InputArea';
import { cryptoAPI } from '../services/cryptoAPI';
import speechService from '../services/speechService';
import { usePortfolio } from '../hooks/usePortfolio';
import { parseMessage, generateResponse } from '../utils/messageParser';

const ChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentlySpeaking, setCurrentlySpeaking] = useState(null);
  const messagesEndRef = useRef(null);
  const portfolio = usePortfolio();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const welcomeMessage = {
      id: Date.now(),
      text: `👋 Hi! I'm your crypto assistant. I can help you with:

• Current cryptocurrency prices
• Your portfolio tracking  
• Trending coins
• Price charts
• Coin information

Try asking "What's Bitcoin trading at?" or "Show me trending coins" to get started!`,
      isUser: false,
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  }, []);

  const handleSendMessage = async (messageText) => {
    const userMessage = {
      id: Date.now(),
      text: messageText,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);

    try {
      const intent = parseMessage(messageText);
      
      const response = await generateResponse(intent, cryptoAPI, portfolio);
      
      const assistantMessage = {
        id: Date.now() + 1,
        text: response.text,
        data: response.data,
        showChart: response.showChart,
        error: response.error,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (speechService.isSupported.synthesis && !response.error) {
        setTimeout(() => {
          handleSpeak(response.text, assistantMessage.id);
        }, 500);
      }

    } catch (error) {
      console.error('Error processing message:', error);
      
      const errorMessage = {
        id: Date.now() + 1,
        text: `Sorry, I encountered an error: ${error.message}. Please try again.`,
        error: true,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartListening = async () => {
    try {
      setIsListening(true);
      const transcript = await speechService.startListening();
      setIsListening(false);
      return transcript;
    } catch (error) {
      setIsListening(false);
      console.error('Speech recognition error:', error);
      
      const errorMessage = {
        id: Date.now(),
        text: `Voice input error: ${error.message}`,
        error: true,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      
      throw error;
    }
  };

  const handleStopListening = () => {
    speechService.stopListening();
    setIsListening(false);
  };

  const handleSpeak = async (text, messageId) => {
    try {
      setCurrentlySpeaking(messageId);
      await speechService.speak(text);
    } catch (error) {
      console.error('Speech synthesis error:', error);
    } finally {
      setCurrentlySpeaking(null);
    }
  };

  const handleStopSpeaking = () => {
    speechService.stopSpeaking();
    setCurrentlySpeaking(null);
  };

  const quickActions = [
    {
      icon: TrendingUp,
      label: 'Trending',
      message: 'Show me trending coins',
    },
    {
      icon: Wallet,
      label: 'Portfolio',
      message: 'What\'s my portfolio worth?',
    },
    {
      icon: HelpCircle,
      label: 'Help',
      message: 'help',
    },
  ];

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Crypto Chat</h1>
            <p className="text-sm text-gray-600">Your AI cryptocurrency assistant</p>
          </div>
          <div className="flex items-center space-x-2">
            {portfolio.portfolioValue > 0 && (
              <div className="text-right">
                <p className="text-sm text-gray-600">Portfolio Value</p>
                <p className="text-lg font-bold text-green-600">
                  ${portfolio.portfolioValue.toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-hide">
        <div className="max-w-4xl mx-auto">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isUser={message.isUser}
              timestamp={message.timestamp}
              onSpeak={(text) => handleSpeak(text, message.id)}
              isSpeaking={currentlySpeaking === message.id}
              onStopSpeaking={handleStopSpeaking}
            />
          ))}
          
          {isProcessing && (
            <div className="flex justify-start mb-4">
              <div className="message-bubble assistant">
                <div className="thinking-indicator">
                  <div className="thinking-dot"></div>
                  <div className="thinking-dot"></div>
                  <div className="thinking-dot"></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {messages.length <= 1 && (
        <div className="px-4 py-2">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-wrap gap-2 justify-center">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => handleSendMessage(action.message)}
                  disabled={isProcessing}
                  className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-200 rounded-full hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  <action.icon className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-700">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto w-full">
        <InputArea
          onSendMessage={handleSendMessage}
          onStartListening={handleStartListening}
          onStopListening={handleStopListening}
          isListening={isListening}
          isProcessing={isProcessing}
          speechSupported={speechService.isSupported}
        />
      </div>
    </div>
  );
};

export default ChatInterface;
