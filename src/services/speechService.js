class SpeechService {
  constructor() {
    this.recognition = null;
    this.synthesis = window.speechSynthesis;
    this.isListening = false;
    this.isSupported = this.checkSupport();
  }

  checkSupport() {
    const hasRecognition = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    const hasSynthesis = 'speechSynthesis' in window;
    
    return {
      recognition: hasRecognition,
      synthesis: hasSynthesis,
      full: hasRecognition && hasSynthesis
    };
  }

  initializeRecognition() {
    if (!this.isSupported.recognition) {
      throw new Error('Speech recognition is not supported in this browser');
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 1;
  }

  async startListening() {
    return new Promise((resolve, reject) => {
      if (!this.isSupported.recognition) {
        reject(new Error('Speech recognition not supported'));
        return;
      }

      if (this.isListening) {
        reject(new Error('Already listening'));
        return;
      }

      if (!this.recognition) {
        this.initializeRecognition();
      }

      this.isListening = true;

      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        this.isListening = false;
        resolve(transcript);
      };

      this.recognition.onerror = (event) => {
        this.isListening = false;
        let errorMessage = 'Speech recognition error';
        
        switch (event.error) {
          case 'no-speech':
            errorMessage = 'No speech detected. Please try again.';
            break;
          case 'audio-capture':
            errorMessage = 'Microphone not accessible. Please check permissions.';
            break;
          case 'not-allowed':
            errorMessage = 'Microphone access denied. Please allow microphone access.';
            break;
          case 'network':
            errorMessage = 'Network error. Please check your connection.';
            break;
          default:
            errorMessage = `Speech recognition error: ${event.error}`;
        }
        
        reject(new Error(errorMessage));
      };

      this.recognition.onend = () => {
        this.isListening = false;
      };

      try {
        this.recognition.start();
      } catch (error) {
        this.isListening = false;
        reject(error);
      }
    });
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  async speak(text, options = {}) {
    return new Promise((resolve, reject) => {
      if (!this.isSupported.synthesis) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      this.synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      
      utterance.rate = options.rate || 1;
      utterance.pitch = options.pitch || 1;
      utterance.volume = options.volume || 0.8;
      utterance.lang = options.lang || 'en-US';
      const voices = this.synthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.lang.startsWith('en') && 
        (voice.name.includes('Google') || voice.name.includes('Microsoft'))
      ) || voices.find(voice => voice.lang.startsWith('en'));
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = (event) => reject(new Error(`Speech synthesis error: ${event.error}`));

      this.synthesis.speak(utterance);
    });
  }

  stopSpeaking() {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
  }

  getVoices() {
    if (!this.isSupported.synthesis) {
      return [];
    }
    return this.synthesis.getVoices();
  }

  isSpeaking() {
    return this.synthesis && this.synthesis.speaking;
  }

  async requestMicrophonePermission() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      return false;
    }
  }
}

const speechService = new SpeechService();

if (speechService.isSupported.synthesis) {
  speechService.synthesis.onvoiceschanged = () => {
    // Voices are now loaded
  };
}

export default speechService;
