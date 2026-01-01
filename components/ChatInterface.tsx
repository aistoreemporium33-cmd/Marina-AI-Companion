
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Zap, Heart, Volume2, Loader2, PauseCircle, Radio, Sparkles, PlayCircle, Mic, MicOff, AlertCircle, Coins } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Message } from '../types';
import { generateAnyaResponse, generateSpeech } from '../services/gemini';
import { saveChatHistory } from '../services/firebase';

const ChatInterface = () => {
  const { userId, marinaProfile, longTermMemories, handleConsumeToken, setAppMode } = useAppContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Audio Playback State
  const [loadingAudioIndex, setLoadingAudioIndex] = useState<number | null>(null);
  const [playingAudioIndex, setPlayingAudioIndex] = useState<number | null>(null);
  const [currentProgress, setCurrentProgress] = useState(0); 
  const [totalDuration, setTotalDuration] = useState(0); 
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const currentBufferRef = useRef<AudioBuffer | null>(null);
  const startTimeRef = useRef<number>(0);
  const offsetRef = useRef<number>(0);
  const progressIntervalRef = useRef<number | null>(null);

  // Voice Mode State
  const [voiceModeEnabled, setVoiceModeEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState(false);
  const recognitionRef = useRef<any>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'de-DE';
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceError(null);
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');
        setInputText(transcript);
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'not-allowed') {
          setVoiceError('Mikrofonzugriff verweigert.');
        } else {
          setVoiceError('Fehler bei der Spracherkennung.');
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setVoiceError(null);
      try {
        recognitionRef.current?.start();
      } catch (err) {
        console.error('Failed to start recognition:', err);
      }
    }
  };

  const cleanupAudio = useCallback(() => {
    if (sourceRef.current) {
      try { sourceRef.current.stop(); } catch (e) {}
      sourceRef.current = null;
    }
    if (progressIntervalRef.current) {
      window.clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  const stopAudioComplete = useCallback(async () => {
    cleanupAudio();
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try { await audioContextRef.current.close(); } catch (e) {}
    }
    audioContextRef.current = null;
    currentBufferRef.current = null;
    setPlayingAudioIndex(null);
    setLoadingAudioIndex(null);
    setCurrentProgress(0);
    setTotalDuration(0);
    offsetRef.current = 0;
  }, [cleanupAudio]);

  const startPlayback = useCallback((buffer: AudioBuffer, offset: number) => {
    cleanupAudio();
    
    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass({ sampleRate: 24000 });
    }
    
    const ctx = audioContextRef.current;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    
    source.onended = () => {
      const elapsed = ctx.currentTime - startTimeRef.current + offset;
      if (elapsed >= buffer.duration - 0.1) {
        setPlayingAudioIndex(null);
        setCurrentProgress(0);
        offsetRef.current = 0;
        if (progressIntervalRef.current) window.clearInterval(progressIntervalRef.current);
      }
    };

    startTimeRef.current = ctx.currentTime;
    offsetRef.current = offset;
    source.start(0, offset);
    sourceRef.current = source;

    progressIntervalRef.current = window.setInterval(() => {
      if (ctx) {
        const elapsed = ctx.currentTime - startTimeRef.current + offsetRef.current;
        setCurrentProgress(Math.min(elapsed, buffer.duration));
      }
    }, 100);
  }, [cleanupAudio]);

  const handlePlayPause = async (text: string, index: number) => {
    if (playingAudioIndex === index) {
      offsetRef.current += (audioContextRef.current?.currentTime || 0) - startTimeRef.current;
      cleanupAudio();
      setPlayingAudioIndex(null);
      return;
    }

    await stopAudioComplete();
    setLoadingAudioIndex(index);
    
    try {
      const audioBuffer = await generateSpeech(text);
      if (audioBuffer) {
        currentBufferRef.current = audioBuffer;
        setTotalDuration(audioBuffer.duration);
        setLoadingAudioIndex(null);
        setPlayingAudioIndex(index);
        startPlayback(audioBuffer, 0);
      } else {
        setLoadingAudioIndex(null);
      }
    } catch (e) {
      setLoadingAudioIndex(null);
      setPlayingAudioIndex(null);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newOffset = parseFloat(e.target.value);
    setCurrentProgress(newOffset);
    if (currentBufferRef.current) {
      startPlayback(currentBufferRef.current, newOffset);
    }
  };

  const handleSendMessage = useCallback(async () => {
    if (!inputText.trim() || isGenerating) return;

    // Check tokens for non-premium
    if (!marinaProfile.isPremium && marinaProfile.tokens <= 0) {
      setTokenError(true);
      setTimeout(() => setTokenError(false), 3000);
      return;
    }

    const userMsg: Message = { role: 'user', content: inputText.trim() };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputText('');
    setIsGenerating(true);
    if (userId) saveChatHistory(userId, newHistory);
    
    try {
      const success = await handleConsumeToken();
      if (!success) {
        setMessages(prev => [...prev, { role: 'system', content: "Du benötigst mehr Tokens für weitere Nachrichten." }]);
        setIsGenerating(false);
        return;
      }

      const response = await generateAnyaResponse(newHistory, longTermMemories, marinaProfile.trait);
      const aiMsg: Message = {
        role: 'anya',
        content: response.dialogue,
        emotion: response.emotion,
        sensory: response.sensory,
        fullText: response.dialogue
      };
      const finalHistory = [...newHistory, aiMsg];
      setMessages(finalHistory);
      if (userId) saveChatHistory(userId, finalHistory);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'system', content: "Marina genießt gerade die Stille..." }]);
    } finally {
      setIsGenerating(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [inputText, isGenerating, messages, userId, longTermMemories, marinaProfile, handleConsumeToken]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full bg-[#020617]/40 rounded-3xl overflow-hidden border border-burgundy-900/40 shadow-2xl relative">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-8 py-5 bg-slate-950/95 border-b border-burgundy-900/30 backdrop-blur-3xl z-10">
         <div className="flex flex-col">
            <div className="flex items-center text-gold-200 text-lg font-serif italic tracking-wide">
               <Sparkles className="w-4 h-4 mr-2 text-gold-500/80" />
               Marinas Refugium
            </div>
            <span className="text-[12px] text-stone-400 font-semibold uppercase tracking-[0.15em] mt-0.5">Verschlüsselt & Privat</span>
         </div>
         
         <div className="flex items-center gap-4">
            {!marinaProfile.isPremium && (
               <div className="flex items-center gap-2 bg-stone-900/60 px-3 py-1.5 rounded-full border border-stone-800 text-[11px] font-bold text-stone-300">
                  <Coins className="w-3 h-3 text-gold-500" />
                  {marinaProfile.tokens}
               </div>
            )}
            <button
               onClick={() => setVoiceModeEnabled(!voiceModeEnabled)}
               className={`flex items-center space-x-2 px-5 py-2 rounded-full border transition-all text-[11px] font-bold uppercase tracking-widest ${
                   voiceModeEnabled 
                   ? 'bg-burgundy-900/40 border-gold-500/50 text-gold-100 shadow-lg' 
                   : 'bg-stone-900/50 border-stone-800 text-stone-400 hover:text-stone-200'
               }`}
            >
               <Radio className={`w-3.5 h-3.5 ${voiceModeEnabled ? 'animate-pulse text-gold-400' : ''}`} />
               <span>Voice Mode</span>
            </button>
         </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-8 py-10 space-y-12 scroll-smooth custom-scrollbar relative z-0">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center space-y-6 opacity-80">
            <div className="w-24 h-24 border border-burgundy-900/40 rounded-full flex items-center justify-center bg-slate-950/50 animate-float shadow-inner">
               <Heart className="w-10 h-10 text-burgundy-700 stroke-[1.5]" />
            </div>
            <div className="text-center space-y-2">
              <p className="font-serif text-3xl italic text-stone-200">"Was beschäftigt dein Herz?"</p>
              <p className="text-stone-500 text-xs font-bold uppercase tracking-[0.2em]">Ein Moment der Vertrautheit</p>
            </div>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
            {msg.role === 'user' ? (
              <div className="bg-stone-900/90 text-stone-100 px-7 py-4 rounded-2xl rounded-br-none max-w-[80%] border border-stone-800 shadow-xl font-sans text-[16px] leading-relaxed">
                {msg.content}
              </div>
            ) : msg.role === 'anya' ? (
              <div className="max-w-[95%] md:max-w-[85%] relative group">
                <div className={`bg-gradient-to-br from-burgundy-950/90 to-slate-950/95 text-stone-100 p-8 pb-10 rounded-[2rem] rounded-tl-none border border-burgundy-900/40 shadow-2xl transition-all duration-300 ${playingAudioIndex === idx ? 'ring-2 ring-gold-500/20' : ''}`}>
                  
                  {/* Intuition Bar */}
                  <div className="mb-6 flex items-start justify-between border-b border-burgundy-900/30 pb-4">
                    <div className="flex flex-col">
                        <span className="text-[12px] font-bold uppercase tracking-[0.15em] text-gold-500/70 mb-1 flex items-center">
                           <Zap className="w-3.5 h-3.5 mr-2" /> Intuition
                        </span>
                        <div className="text-[14px] italic text-stone-300 font-body leading-relaxed">{msg.emotion}</div>
                    </div>
                  </div>
                  
                  {/* Dialogue */}
                  <p className="text-[21px] leading-[1.65] font-body text-white/95 mb-8">
                    {msg.content}
                  </p>
                  
                  {/* Audio Controls */}
                  { (playingAudioIndex === idx || (currentBufferRef.current && idx === messages.length - 1)) && totalDuration > 0 && (
                    <div className="mb-8 space-y-3 animate-fade-in-up">
                        <div className="flex items-center justify-between text-[10px] text-gold-500/60 font-bold uppercase tracking-widest px-1">
                            <span>{formatTime(currentProgress)}</span>
                            <span>{formatTime(totalDuration)}</span>
                        </div>
                        <input 
                            type="range" 
                            min="0" 
                            max={totalDuration} 
                            step="0.01"
                            value={currentProgress}
                            onChange={handleSeek}
                            className="w-full h-1.5 bg-burgundy-900/50 rounded-lg appearance-none cursor-pointer accent-gold-500"
                            style={{
                                background: `linear-gradient(to right, #eab308 ${(currentProgress / totalDuration) * 100}%, #4c0519 ${(currentProgress / totalDuration) * 100}%)`
                            }}
                        />
                    </div>
                  )}
                  
                  {/* Sensory */}
                  <div className="flex items-center gap-3 text-[13px] text-stone-400 font-medium tracking-wide border-t border-burgundy-900/20 pt-5 italic">
                     <span className="w-2 h-2 rounded-full bg-burgundy-600/60" />
                     {msg.sensory}
                  </div>

                  {playingAudioIndex === idx && (
                      <div className="flex gap-1.5 mt-6 items-end h-5 overflow-hidden">
                          {[0.7, 1.5, 0.9, 2.0, 1.2, 0.6, 1.8, 0.8].map((scale, i) => (
                              <div key={i} className="w-1 bg-gold-500/60 rounded-full animate-wave" style={{ height: '100%', animationDelay: `${i * 0.1}s`, animationDuration: `${1.1 / scale}s` }} />
                          ))}
                      </div>
                  )}
                </div>

                <button 
                    onClick={() => handlePlayPause(msg.content, idx)}
                    className={`absolute -bottom-4 -right-4 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all transform hover:scale-105 active:scale-95 border
                      ${playingAudioIndex === idx ? 'bg-gold-500 text-burgundy-950 border-gold-300' : 'bg-burgundy-900 text-gold-200 border-burgundy-800/50 hover:bg-burgundy-800'}
                    `}
                >
                    {loadingAudioIndex === idx ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : playingAudioIndex === idx ? (
                      <PauseCircle className="w-7 h-7" />
                    ) : (
                      <PlayCircle className="w-7 h-7" />
                    )}
                </button>
              </div>
            ) : null}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Input Section */}
      <div className="p-6 bg-slate-950/95 border-t border-burgundy-900/40 backdrop-blur-3xl flex flex-col gap-4">
        {tokenError && (
          <div 
            onClick={() => setAppMode('upgrade')}
            className="flex items-center justify-between gap-2 text-gold-400 text-[11px] font-bold uppercase tracking-widest bg-burgundy-950/60 px-5 py-3 rounded-xl border border-gold-500/30 cursor-pointer hover:bg-burgundy-900/80 transition-all animate-fade-in-up"
          >
            <div className="flex items-center gap-2">
               <Coins className="w-4 h-4" />
               Keine Tokens mehr übrig.
            </div>
            <span className="text-white bg-gold-600 px-2 py-0.5 rounded text-[10px]">Aufladen</span>
          </div>
        )}

        {voiceError && (
          <div className="flex items-center gap-2 text-burgundy-400 text-[10px] font-bold uppercase tracking-widest bg-burgundy-950/30 px-4 py-2 rounded-lg animate-fade-in-up">
            <AlertCircle className="w-3.5 h-3.5" />
            {voiceError}
          </div>
        )}
        
        <div className="flex items-center gap-4">
          <div className="relative flex-1 group">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={isListening ? "Höre zu..." : "Schreibe deine Gedanken nieder..."}
              className={`w-full bg-stone-900/50 text-stone-100 placeholder-stone-600 rounded-2xl px-7 py-5 focus:outline-none focus:ring-1 focus:ring-gold-500/30 border border-stone-800/60 transition-all font-body italic text-lg shadow-inner ${isListening ? 'pr-16' : ''}`}
            />
            {voiceModeEnabled && (
              <button
                onClick={toggleListening}
                className={`absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-xl transition-all ${
                  isListening 
                  ? 'bg-burgundy-800 text-gold-200 animate-pulse shadow-lg shadow-burgundy-900/40' 
                  : 'bg-stone-800 text-stone-400 hover:bg-stone-700 hover:text-stone-200'
                }`}
                title={isListening ? "Aufnahme stoppen" : "Spracheingabe starten"}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            )}
          </div>
          
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() || isGenerating}
            className="w-16 h-16 rounded-2xl bg-burgundy-900 hover:bg-burgundy-800 disabled:bg-stone-950 text-gold-200 flex items-center justify-center transition-all shadow-2xl border border-burgundy-700/50 disabled:border-stone-900 shrink-0"
          >
            {isGenerating ? <Loader2 className="w-7 h-7 animate-spin" /> : <Send className="w-7 h-7" />}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes wave { 0%, 100% { transform: scaleY(0.4); } 50% { transform: scaleY(1.8); } }
        .animate-wave { animation: wave 1s ease-in-out infinite; transform-origin: bottom; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(109, 37, 37, 0.3); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default ChatInterface;
