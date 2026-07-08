import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mic, Volume2, Languages, ChevronDown, ChevronRight, Bug, Sun, Send, Loader2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { aiService } from '../services/ai.service';
import { motion } from 'framer-motion';

export const AskAiPage: React.FC = () => {
  const navigate = useNavigate();
  const { chatHistory, addChatMessage, language } = useAppStore();
  
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [useFallbackRecorder, setUseFallbackRecorder] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Translation Dictionary
  const t = {
    hi: {
      title: '🎤 पूछें किसान AI',
      subtitle: 'अपनी भाषा में स्वाभाविक रूप से बोलें',
      listening: 'सुन रहा हूँ...',
      holdToSpeak: 'बोलने के लिए दबाएं',
      emptyState: 'अपने खेत के बारे में किसान AI से कुछ भी पूछें!',
      thinking: 'किसान AI सोच रहा है...',
      quickQuestions: 'त्वरित प्रश्न',
      question1: 'मुझे कौन सी फसल उगानी चाहिए?',
      question2: 'क्या मुझे आज सिंचाई करनी चाहिए?',
      question3: 'नवीनतम मंडी भाव',
      recentAdvice: 'हाल की सलाह',
      viewHistory: 'इतिहास देखें',
      yesterday: 'कल',
      today: 'आज',
      diseaseDiag: 'फसल रोग निदान',
      weatherAdv: 'मौसम की सलाह',
      placeholder: 'लिखें या माइक दबाएं...',
      listen: 'सुनें',
      playing: 'चल रहा है...',
    },
    mr: {
      title: '🎤 विचारा किसान AI',
      subtitle: 'तुमच्या भाषेत नैसर्गिकरित्या बोला',
      listening: 'ऐकत आहे...',
      holdToSpeak: 'बोलण्यासाठी दाबा',
      emptyState: 'तुमच्या शेतीबद्दल किसान AI ला काहीही विचारा!',
      thinking: 'किसान AI विचार करत आहे...',
      quickQuestions: 'जलद प्रश्न',
      question1: 'मी कोणते पीक उगवावे?',
      question2: 'मी आज पाणी दिले पाहिजे का?',
      question3: 'ताजे मंडी भाव',
      recentAdvice: 'अलीकडील सल्ला',
      viewHistory: 'इतिहास पहा',
      yesterday: 'काल',
      today: 'आज',
      diseaseDiag: 'पीक रोगाचे निदान',
      weatherAdv: 'हवामान सल्ला',
      placeholder: 'टाईप करा किंवा माईक दाबा...',
      listen: 'ऐका',
      playing: 'चालू आहे...',
    },
    en: {
      title: '🎤 Ask Kisan AI',
      subtitle: 'Speak naturally in your language',
      listening: 'Listening...',
      holdToSpeak: 'Hold to Speak',
      emptyState: 'Ask Kisan AI anything about your farm!',
      thinking: 'Kisan AI is thinking...',
      quickQuestions: 'Quick Questions',
      question1: 'What crop should I grow?',
      question2: 'Should I irrigate today?',
      question3: 'Latest Mandi prices',
      recentAdvice: 'Recent Advice',
      viewHistory: 'View History',
      yesterday: 'Yesterday',
      today: 'Today',
      diseaseDiag: 'Disease diagnosis',
      weatherAdv: 'Weather advice',
      placeholder: 'Type or tap mic...',
      listen: 'Listen',
      playing: 'Playing...',
    }
  }[language] || {
    title: '🎤 Ask Kisan AI',
    subtitle: 'Speak naturally in your language',
    listening: 'Listening...',
    holdToSpeak: 'Hold to Speak',
    emptyState: 'Ask Kisan AI anything about your farm!',
    thinking: 'Kisan AI is thinking...',
    quickQuestions: 'Quick Questions',
    question1: 'What crop should I grow?',
    question2: 'Should I irrigate today?',
    question3: 'Latest Mandi prices',
    recentAdvice: 'Recent Advice',
    viewHistory: 'View History',
    yesterday: 'Yesterday',
    today: 'Today',
    diseaseDiag: 'Disease diagnosis',
    weatherAdv: 'Weather advice',
    placeholder: 'Type or tap mic...',
    listen: 'Listen',
    playing: 'Playing...',
  };

  // Dynamic header override (Hide AppLayout default header, show page-specific custom header)
  useEffect(() => {
    const parentHeader = document.querySelector('header');
    if (parentHeader) {
      parentHeader.style.display = 'none';
    }
    return () => {
      if (parentHeader) {
        parentHeader.style.display = 'flex';
      }
    };
  }, []);

  // Scroll to bottom when new messages arrive
  const chatEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const sendQuery = async (q: string) => {
    if (!q.trim()) return;
    addChatMessage('farmer', q);
    setIsLoading(true);
    try {
      const response = await aiService.askKisanAi({ questionText: q }, language);
      addChatMessage('ai', response.reply, response.audioUrl);
    } catch (err: any) {
      addChatMessage('ai', `Sorry, I could not get a response: ${err.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendText = async () => {
    if (!inputText.trim()) return;
    const q = inputText;
    setInputText('');
    await sendQuery(q);
  };

  const handleQuickQuestion = async (text: string) => {
    await sendQuery(text);
  };

  const startMediaRecorder = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Stop all tracks on the stream to release microphone access
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }

        // Upload recorded audio to ElevenLabs transcribe endpoint
        setIsLoading(true);
        try {
          const formData = new FormData();
          formData.append('audio', audioBlob, 'audio.webm');
          formData.append('language', language);

          const response = await fetch('/voice/transcribe', {
            method: 'POST',
            body: formData,
          });
          const resData = await response.json();
          if (resData.success && resData.text) {
            sendQuery(resData.text);
          } else {
            addChatMessage('ai', `Sorry, voice transcription was unavailable: ${resData.error || 'Unknown error'}`);
          }
        } catch (err: any) {
          addChatMessage('ai', `Voice processing failed: ${err.message || 'Server error'}`);
        } finally {
          setIsLoading(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err: any) {
      console.error('MediaRecorder start failed:', err);
      addChatMessage('ai', 'Microphone access denied or not supported in your browser.');
      setIsRecording(false);
    }
  };

  const stopMediaRecorder = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleVoiceRecord = () => {
    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        stopMediaRecorder();
      }
      setIsRecording(false);
      return;
    }

    // Always use MediaRecorder → backend Groq Whisper STT
    // (more accurate than browser webkitSpeechRecognition, especially for Hindi/Marathi)
    startMediaRecorder();
  };

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playAudio = (audioUrl: string) => {
    if (!audioUrl) return;
    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    setIsPlayingAudio(true);
    audio.play().catch(() => setIsPlayingAudio(false));
    audio.onended = () => setIsPlayingAudio(false);
    audio.onerror = () => setIsPlayingAudio(false);
  };

  const chatTopRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex flex-col gap-4 font-outfit min-h-full pb-10">
      
      {/* Custom Page Header */}
      <div className="flex items-center gap-3 -mx-5 -mt-4 px-5 py-4 border-b border-surface-container-high bg-background sticky top-0 z-30">
        <button
          onClick={() => navigate('/dashboard')}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container active:scale-95 transition-all text-on-surface"
          aria-label="Back to Dashboard"
          id="ai-header-back"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex flex-col">
          <h2 className="text-lg font-bold text-on-surface flex items-center gap-1.5 font-outfit">
            {t.title}
          </h2>
          <span className="text-[11px] text-outline font-outfit font-medium">
            {t.subtitle}
          </span>
        </div>
      </div>

      {/* Mic Recording Area */}
      <div className="flex flex-col items-center justify-center py-4 mt-2">
        <div className="relative flex items-center justify-center">
          {/* Animated pulse rings */}
          {isRecording && (
            <>
              <motion.div
                animate={{ scale: [1, 1.8], opacity: [0.4, 0] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'easeOut' }}
                className="absolute w-20 h-20 bg-primary/20 rounded-full"
              />
              <motion.div
                animate={{ scale: [1, 1.4], opacity: [0.3, 0] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'easeOut', delay: 0.5 }}
                className="absolute w-20 h-20 bg-primary/30 rounded-full"
              />
            </>
          )}
          
          <button
            onClick={toggleVoiceRecord}
            className={`w-20 h-20 rounded-full flex items-center justify-center shadow-m3-2 transition-all relative z-10 ${
              isRecording 
                ? 'bg-red-600 text-white animate-pulse ring-4 ring-red-100' 
                : 'bg-[#0d631b] text-white hover:bg-primary-container'
            }`}
            id="ai-record-mic"
          >
            <Mic size={36} />
          </button>
        </div>
        
        <button
          onClick={toggleVoiceRecord}
          className={`mt-4 px-5 py-2 rounded-full text-sm font-bold font-outfit shadow-m3-1 active:scale-95 transition-all text-white ${
            isRecording ? 'bg-red-600' : 'bg-[#0d631b]'
          }`}
          id="ai-hold-speak-btn"
        >
          {isRecording ? t.listening : t.holdToSpeak}
        </button>
      </div>

      {/* Chat Thread Area */}
      <div className="flex flex-col gap-4 mt-2 max-h-[300px] overflow-y-auto px-1 py-2">
        {chatHistory.length === 0 && (
          <div className="text-center text-outline text-sm font-medium py-6">
            {t.emptyState}
          </div>
        )}
        {chatHistory.map((msg) => {
          if (msg.sender === 'farmer') {
            return (
              <div key={msg.id} className="flex justify-end w-full">
                <div className="max-w-[85%] bg-primary text-on-primary rounded-2xl rounded-tr-sm p-3.5 px-4 text-[15px] font-medium leading-normal shadow-m3-1">
                  {msg.text}
                </div>
              </div>
            );
          } else {
            return (
              <div key={msg.id} className="flex gap-2.5 items-start w-full">
                {/* Robot Avatar */}
                <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center shrink-0 border border-surface-container-high text-on-surface-variant">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="10" rx="2" />
                    <circle cx="12" cy="5" r="2" />
                    <path d="M12 7v4M8 16h.01M16 16h.01" />
                  </svg>
                </div>
                
                {/* AI Speech Bubble */}
                <div className="flex flex-col gap-1.5 max-w-[80%]">
                  <div className="bg-white border border-surface-container-high rounded-2xl rounded-tl-sm p-4 text-[14px] text-on-surface leading-relaxed shadow-m3-1 font-medium">
                    <p>{msg.text}</p>
                    
                    {/* Audio Listen controls */}
                    {msg.audioUrl && (
                      <button
                        onClick={() => playAudio(msg.audioUrl!)}
                        className={`flex items-center gap-1.5 text-xs mt-3 font-bold ${
                          isPlayingAudio ? 'text-primary animate-pulse' : 'text-primary'
                        } hover:underline`}
                        id={`ai-listen-btn-${msg.id}`}
                      >
                        <Volume2 size={15} />
                        <span>{isPlayingAudio ? t.playing : t.listen}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          }
        })}
        {/* AI loading indicator */}
        {isLoading && (
          <div className="flex gap-2.5 items-start w-full">
            <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center shrink-0 border border-surface-container-high text-primary">
              <Loader2 size={16} className="animate-spin" />
            </div>
            <div className="bg-white border border-surface-container-high rounded-2xl rounded-tl-sm p-3.5 text-[13px] text-outline italic shadow-m3-1">
              {t.thinking}
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Suggested Quick Questions */}
      <div className="flex flex-col gap-2 mt-2">
        <span className="text-xs font-bold text-outline uppercase tracking-wider pl-1">
          {t.quickQuestions}
        </span>
        <div className="flex flex-col gap-2.5">
          <button
            onClick={() => handleQuickQuestion(t.question1)}
            className="w-full flex items-center p-3 px-4.5 bg-white border border-surface-container-high rounded-xl text-xs font-bold text-on-surface shadow-m3-1 hover:border-primary/20 active:scale-98 transition-all text-left"
          >
            🌾 {t.question1}
          </button>
          
          <button
            onClick={() => handleQuickQuestion(t.question2)}
            className="w-full flex items-center p-3 px-4.5 bg-white border border-surface-container-high rounded-xl text-xs font-bold text-on-surface shadow-m3-1 hover:border-primary/20 active:scale-98 transition-all text-left"
          >
            💧 {t.question2}
          </button>

          <button
            onClick={() => handleQuickQuestion(t.question3)}
            className="w-full flex items-center p-3 px-4.5 bg-white border border-surface-container-high rounded-xl text-xs font-bold text-on-surface shadow-m3-1 hover:border-primary/20 active:scale-98 transition-all text-left"
          >
            💰 {t.question3}
          </button>
        </div>
      </div>

      {/* Language Selector Dropdown Box */}
      <div className="w-full bg-surface-container rounded-xl p-3 flex items-center justify-between border border-surface-container-high shadow-m3-1 mt-1">
        <div className="flex items-center gap-2 text-on-surface">
          <Languages size={18} className="text-primary" />
          <span className="text-xs font-bold font-outfit">
            <span className={language === 'en' ? 'underline decoration-2 underline-offset-4 text-primary decoration-primary font-bold' : 'text-outline'}>English</span>
            {' | '}
            <span className={language === 'hi' ? 'underline decoration-2 underline-offset-4 text-primary decoration-primary font-bold' : 'text-outline'}>हिन्दी</span>
            {' | '}
            <span className={language === 'mr' ? 'underline decoration-2 underline-offset-4 text-primary decoration-primary font-bold' : 'text-outline'}>मराठी</span>
          </span>
        </div>
        <ChevronDown size={18} className="text-outline" />
      </div>

      {/* Recent Advice Section */}
      <div className="flex flex-col mt-2">
        <div className="flex justify-between items-center w-full">
          <span className="text-xs font-bold text-outline uppercase tracking-wider pl-1">
            {t.recentAdvice}
          </span>
          <button 
            className="text-xs font-bold text-primary hover:underline"
            id="ai-view-history"
            onClick={() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
          >
            {t.viewHistory}
          </button>
        </div>

        <div className="flex flex-col gap-2.5 mt-2">
          {/* Card 1: Disease Diagnosis — navigate to scan */}
          <div
            onClick={() => navigate('/crop-disease')}
            className="bg-[#f5f3f3] rounded-xl p-3.5 flex items-center justify-between gap-3 border-l-4 border-[#7a5649] shadow-m3-1 cursor-pointer hover:bg-surface-container active:scale-98 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#fdcdbc]/45 text-secondary flex items-center justify-center shrink-0">
                <Bug size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-outline font-bold uppercase leading-none">{t.yesterday}</span>
                <span className="text-[14px] font-bold text-on-surface leading-tight mt-1">{t.diseaseDiag}</span>
              </div>
            </div>
            <ChevronRight size={18} className="text-outline-variant shrink-0" />
          </div>

          {/* Card 2: Weather Advice — navigate to alerts */}
          <div
            onClick={() => navigate('/alerts')}
            className="bg-[#f5f3f3] rounded-xl p-3.5 flex items-center justify-between gap-3 border-l-4 border-primary shadow-m3-1 cursor-pointer hover:bg-surface-container active:scale-98 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#cbffc2]/50 text-primary flex items-center justify-center shrink-0">
                <Sun size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-outline font-bold uppercase leading-none">{t.today}</span>
                <span className="text-[14px] font-bold text-on-surface leading-tight mt-1">{t.weatherAdv}</span>
              </div>
            </div>
            <ChevronRight size={18} className="text-outline-variant shrink-0" />
          </div>
        </div>
      </div>

      {/* Input Bar (Sticky at bottom just above tabbar) */}
      <div className="mt-auto pt-3">
        <div className="flex items-center bg-surface-container rounded-full p-1.5 px-4 shadow-m3-1 border border-surface-container-high w-full">
          <input
            type="text"
            placeholder={t.placeholder}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
            className="bg-transparent flex-1 outline-none text-[14px] text-on-surface font-outfit font-medium placeholder:text-outline"
            id="ai-text-input"
          />
          {inputText.trim() ? (
            <button 
              onClick={handleSendText}
              className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-container shrink-0"
              id="ai-send-text-btn"
            >
              <Send size={14} />
            </button>
          ) : (
            <button 
              onClick={toggleVoiceRecord}
              className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-container shrink-0"
              id="ai-mic-input-btn"
            >
              <Mic size={14} />
            </button>
          )}
        </div>
      </div>

    </div>
  );
};
