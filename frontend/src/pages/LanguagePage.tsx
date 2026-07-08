import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Info, Mic, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

interface LanguageOption {
  id: 'hi' | 'pb' | 'en' | 'mr'; // hi=Hindi, pb=Punjabi, en=English, mr=Marathi
  nativeName: string;
  englishName: string;
}

export const LanguagePage: React.FC = () => {
  const navigate = useNavigate();
  const { language, setLanguage } = useAppStore();

  const languages: LanguageOption[] = [
    { id: 'hi', nativeName: 'हिन्दी', englishName: 'Hindi' },
    { id: 'pb', nativeName: 'ਪੰਜਾਬੀ', englishName: 'Punjabi' },
    { id: 'en', nativeName: 'English', englishName: 'English' },
    { id: 'mr', nativeName: 'मराठी', englishName: 'Marathi' },
  ];

  const handleLanguageSelect = (langId: 'hi' | 'pb' | 'en' | 'mr') => {
    // Save to store (mapping pb to hi or en for simplicity in app stores)
    if (langId === 'pb') {
      setLanguage('hi'); // Default fallback for Punjabi translation stubs
    } else {
      setLanguage(langId);
    }
  };

  const handleNext = () => {
    navigate('/login');
  };

  return (
    <div className="flex-1 flex flex-col justify-between py-5 px-5 font-outfit select-none bg-background relative">
      
      {/* Top Header Row with Tractor Logo */}
      <div className="flex items-center justify-center gap-2 py-2">
        {/* Tractor SVG Icon */}
        <svg width="24" height="20" viewBox="0 0 24 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary fill-current">
          <path d="M19 13C16.8 13 15 14.8 15 17C15 19.2 16.8 21 19 21C21.2 21 23 19.2 23 17C23 14.8 21.2 13 19 13ZM19 19.5C17.6 19.5 16.5 18.4 16.5 17C16.5 15.6 17.6 14.5 19 14.5C20.4 14.5 21.5 15.6 21.5 17C21.5 18.4 20.4 19.5 19 19.5Z" />
          <path d="M6 13C3.8 13 2 14.8 2 17C2 19.2 3.8 21 6 21C8.2 21 10 19.2 10 17C10 14.8 8.2 13 6 13ZM6 19.5C4.6 19.5 3.5 18.4 3.5 17C3.5 15.6 4.6 14.5 6 14.5C7.4 14.5 8.5 15.6 8.5 17C8.5 18.4 7.4 19.5 6 19.5Z" />
          <path d="M14 6H17V9H14V6ZM20 9H18.5V4.5C18.5 3.7 17.8 3 17 3H14C13.2 3 12.5 3.7 12.5 4.5V9H10C9.4 9 9 9.4 9 10V12H21V10C21 9.4 20.6 9 20 9ZM12.5 11H10.5V10.5H12.5V11ZM17 4.5V9H14V4.5H17ZM20 11H18.5V10.5H20V11Z" />
        </svg>
        <span className="text-[20px] font-bold text-primary">Kisan Alert</span>
      </div>

      {/* Center Layout Container */}
      <div className="flex-1 flex flex-col justify-center items-center mt-3">
        {/* Small Central Logo pin */}
        <div className="mb-4">
          <svg width="40" height="52" viewBox="0 0 84 108" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M42 0C18.8 0 0 18.8 0 42C0 73.5 35.7 104.7 40.2 108C41.3 108.8 42.7 108.8 43.8 108C48.3 104.7 84 73.5 84 42C84 18.8 65.2 0 42 0Z" fill="#1b6d24" />
            <path d="M42 8C23.2 8 8 23.2 8 42C8 63.8 34.6 91.2 42 97.5C49.4 91.2 76 63.8 76 42C76 23.2 60.8 8 42 8Z" fill="#88d982" />
            <path d="M42 22C32.1 22 24 30.1 24 40C24 53.6 42 74 42 74C42 74 60 53.6 60 40C60 30.1 51.9 22 42 22Z" fill="#0073b2" />
          </svg>
        </div>

        {/* Headlines */}
        <h2 className="text-[26px] font-bold text-on-surface text-center tracking-tight leading-8 font-outfit">
          चुनें अपनी भाषा
        </h2>
        <p className="text-[15px] text-outline-variant mt-1 text-center font-outfit text-on-surface-variant font-medium">
          Please select your preferred language
        </p>

        {/* Language Options Cards List (Vgap 12px or 16px) */}
        <div className="w-full flex flex-col gap-3.5 mt-6">
          {languages.map((lang) => {
            // Selected check
            // We map 'pb' selection visually as local state, but in store it can fallback
            const isSelected = (lang.id === 'hi' && language === 'hi') || 
                               (lang.id === 'en' && language === 'en') || 
                               (lang.id === 'mr' && language === 'mr') || 
                               (lang.id === 'pb' && !['hi','en','mr'].includes(language));

            return (
              <button
                key={lang.id}
                onClick={() => handleLanguageSelect(lang.id)}
                className={`w-full flex items-center justify-between p-4.5 px-5 min-h-[64px] border-2 rounded-xl transition-all text-left ${
                  isSelected
                    ? 'bg-[#cbffc2]/50 border-primary shadow-m3-2 text-primary'
                    : 'bg-surface-container-lowest border-surface-container-high hover:border-outline-variant text-on-surface shadow-m3-1'
                }`}
                id={`lang-card-${lang.id}`}
              >
                <div className="flex flex-col">
                  <span className={`text-[17px] font-bold ${isSelected ? 'text-primary' : 'text-on-surface'}`}>
                    {lang.nativeName}
                  </span>
                  <span className={`text-[13px] ${isSelected ? 'text-primary/80 font-medium' : 'text-outline'}`}>
                    {lang.englishName}
                  </span>
                </div>
                
                {/* Radio checkmark circle indicator */}
                <div className="flex items-center">
                  {isSelected ? (
                    <CheckCircle2 size={24} className="text-primary fill-primary stroke-white" />
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-outline-variant" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Info Box */}
        <div className="w-full bg-surface-container-low rounded-xl p-4 flex gap-3 mt-6 border border-surface-container-high">
          <Info size={20} className="text-primary shrink-0 mt-0.5" />
          <div className="flex flex-col text-[13px] text-on-surface-variant font-medium leading-relaxed">
            <span>आप इसे बाद में सेटिंग्स में बदल सकते हैं।</span>
            <span className="text-outline mt-0.5">(You can change this later in settings.)</span>
          </div>
        </div>
      </div>

      {/* Floating Microphone Voice Button */}
      <div className="absolute right-5 bottom-[88px] z-40">
        <button 
          onClick={() => navigate('/ask-ai')}
          className="m3-btn-voice active:scale-95 transition-all"
          aria-label="Voice Guidance"
          id="voice-assist-btn"
        >
          <Mic size={28} />
        </button>
      </div>

      {/* Bottom Button */}
      <div className="mt-6">
        <button
          onClick={handleNext}
          className="m3-btn-primary flex items-center justify-center gap-2"
          id="lang-continue-btn"
        >
          <span>आगे बढ़ें</span>
          {/* Right Arrow Icon */}
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4.16669 10H15.8334" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M10 4.16669L15.8334 10L10 15.8334" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
};
