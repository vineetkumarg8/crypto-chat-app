import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Loader2 } from 'lucide-react';

const InputArea = ({ 
  onSendMessage, 
  onStartListening, 
  onStopListening, 
  isListening, 
  isProcessing,
  speechSupported 
}) => {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  }, [message]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !isProcessing) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleMicClick = async () => {
    if (isListening) {
      onStopListening();
      setIsRecording(false);
    } else {
      try {
        setIsRecording(true);
        const transcript = await onStartListening();
        if (transcript) {
          setMessage(transcript);
          setTimeout(() => {
            onSendMessage(transcript);
            setMessage('');
          }, 500);
        }
      } 
      catch (error) {
        console.error('Voice input error:', error);
      } 
      finally {
        setIsRecording(false);
      }
    }
  };

  const getMicButtonState = () => {
    if (isListening || isRecording) {
      return {
        icon: MicOff,
        className: 'bg-red-500 hover:bg-red-600 text-white animate-pulse',
        title: 'Stop listening',
      };
    }
    return {
      icon: Mic,
      className: 'bg-gray-100 hover:bg-gray-200 text-gray-600',
      title: 'Start voice input',
    };
  };

  const micState = getMicButtonState();
  const MicIcon = micState.icon;

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      <form onSubmit={handleSubmit} className="flex items-end space-x-3">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              isListening 
                ? "Listening..." 
                : isProcessing 
                  ? "Processing..." 
                  : "Ask me about crypto prices, your portfolio, or trending coins..."
            }
            disabled={isProcessing || isListening}
            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
            rows={1}
            style={{ minHeight: '48px', maxHeight: '120px' }}
          />

          {message.length > 200 && (
            <div className="absolute bottom-1 right-12 text-xs text-gray-400">
              {message.length}/500
            </div>
          )}
        </div>

        {speechSupported.recognition && (
          <button
            type="button"
            onClick={handleMicClick}
            disabled={isProcessing}
            className={`p-3 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${micState.className}`}
            title={micState.title}
          >
            <MicIcon className="w-5 h-5" />
          </button>
        )}

        <button
          type="submit"
          disabled={!message.trim() || isProcessing || isListening}
          className="p-3 bg-primary-500 text-white rounded-full hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          title="Send message"
        >
          {isProcessing ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </form>

      <div className="mt-2 min-h-[20px]">
        {isListening && (
          <div className="flex items-center space-x-2 text-sm text-blue-600">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
            <span>Listening for your voice...</span>
          </div>
        )}
        
        {isProcessing && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Thinking...</span>
          </div>
        )}

        {!speechSupported.recognition && (
          <div className="text-xs text-gray-500">
            Voice input not supported in this browser
          </div>
        )}
      </div>
    </div>
  );
};

export default InputArea;
