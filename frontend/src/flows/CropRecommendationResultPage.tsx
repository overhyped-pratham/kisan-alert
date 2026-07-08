import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Sprout, TrendingUp, Droplet, Calendar, Mic, RefreshCw, CheckCircle, Home, Camera, Bell, User } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const CropRecommendationResultPage: React.FC = () => {
  const navigate = useNavigate();
  const { addChatMessage, recommendationResult, recommendationInput, resetRecommendationFlow } = useAppStore();

  // Hide parent layout header dynamically
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

  const cropName = recommendationResult?.cropName || 'Cotton';
  const confidence = recommendationResult?.confidence || '94%';
  const confidenceNum = parseInt(confidence, 10) / 100 || 0.94;
  const expectedYield = recommendationResult?.expectedYield || 'High';
  const profit = recommendationResult?.profit || 'Good';
  const waterReq = recommendationResult?.waterRequirement || 'Medium';

  const handleAskAboutCrop = () => {
    addChatMessage('farmer', `What are the best seeds and fertilizer for ${cropName}?`);
    navigate('/ask-ai');
  };

  const handleRestart = () => {
    resetRecommendationFlow();
    navigate('/crop-recommendation/step-1');
  };

  return (
    <div className="flex-1 flex flex-col justify-between py-5 px-5 font-outfit select-none bg-background min-h-0 -mx-5 -my-5 pb-[76px] relative">
      
      {/* Standard App Header */}
      <header className="bg-background -mx-5 -mt-5 px-5 py-4 flex items-center justify-between border-b border-surface-container-high rounded-b-lg shrink-0">
        <div className="flex items-center gap-3">
          <Menu size={22} className="text-on-surface cursor-pointer" onClick={() => navigate('/dashboard')} />
          <h1 className="text-xl font-bold font-outfit text-primary">
            Kisan Alert
          </h1>
        </div>
        
        {/* Profile Avatar */}
        <div className="w-10 h-10 rounded-full border border-surface-container-high overflow-hidden shrink-0">
          <img 
            src="/designs/assets/icon.png" 
            alt="Farmer Profile" 
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80';
            }}
          />
        </div>
      </header>

      {/* Scrollable Content Area */}
      <div className="flex-1 flex flex-col gap-4 mt-4 overflow-y-auto min-h-0 pb-4">
        
        {/* Main Recommendation Result Card */}
        <div className="bg-white rounded-2xl p-5 shadow-m3-1 border border-surface-container-high border-l-4 border-primary flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-black bg-[#cbffc2] text-primary px-2.5 py-0.5 rounded-full w-max border border-primary/10">
              AI RECOMMENDED
            </span>
            <h2 className="text-3xl font-black text-[#0d631b] font-outfit tracking-tight leading-none mt-1">
              {cropName}
            </h2>
            <p className="text-[12px] text-outline font-medium mt-0.5 leading-snug max-w-[170px]">
              Perfect match for your {recommendationInput.location || 'field'} in {recommendationInput.season || 'this season'} season.
            </p>
          </div>

          {/* Confidence Circular Gauge */}
          <div className="relative w-18 h-18 shrink-0 flex items-center justify-center">
            <svg className="w-16 h-16 transform -rotate-90">
              <circle cx="32" cy="32" r="26" stroke="#f5f3f3" strokeWidth="5" fill="transparent" />
              <circle 
                cx="32" 
                cy="32" 
                r="26" 
                stroke="#0d631b" 
                strokeWidth="5" 
                fill="transparent" 
                strokeDasharray={2 * Math.PI * 26}
                strokeDashoffset={2 * Math.PI * 26 * (1 - confidenceNum)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col justify-center items-center font-outfit">
              <span className="text-sm font-bold text-on-surface leading-none">{confidence}</span>
              <span className="text-[8px] text-outline font-bold leading-none mt-0.5">Match</span>
            </div>
          </div>
        </div>

        {/* 2x2 Performance Metrics Grid */}
        <div className="grid grid-cols-2 gap-3.5">
          {/* Yield */}
          <div className="bg-white rounded-2xl p-4 shadow-m3-1 border border-surface-container flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-[#cbffc2]/50 text-primary flex items-center justify-center shrink-0">
              <Sprout size={18} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-outline font-bold uppercase tracking-wider">EXPECTED YIELD</span>
              <span className="text-base font-bold text-on-surface mt-1">{expectedYield}</span>
            </div>
          </div>

          {/* Profitability */}
          <div className="bg-white rounded-2xl p-4 shadow-m3-1 border border-surface-container flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-[#cbffc2]/50 text-primary flex items-center justify-center shrink-0">
              <TrendingUp size={18} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-outline font-bold uppercase tracking-wider">PROFITABILITY</span>
              <span className="text-base font-bold text-on-surface mt-1">{profit}</span>
            </div>
          </div>

          {/* Water Need */}
          <div className="bg-white rounded-2xl p-4 shadow-m3-1 border border-surface-container flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-[#e9f2ff] text-tertiary flex items-center justify-center shrink-0">
              <Droplet size={18} className="fill-current" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-outline font-bold uppercase tracking-wider">WATER REQUIREMENT</span>
              <span className="text-base font-bold text-on-surface mt-1">{waterReq}</span>
            </div>
          </div>

          {/* Sowing Season */}
          <div className="bg-white rounded-2xl p-4 shadow-m3-1 border border-surface-container flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-[#fdcdbc]/50 text-[#795548] flex items-center justify-center shrink-0">
              <Calendar size={18} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-outline font-bold uppercase tracking-wider">SEASON</span>
              <span className="text-base font-bold text-on-surface mt-1">{recommendationInput.season || 'Kharif'}</span>
            </div>
          </div>
        </div>

        {/* Advisory Tips Card */}
        <div className="bg-white rounded-2xl p-5 shadow-m3-1 border border-surface-container-high flex flex-col gap-3">
          <div className="flex items-center gap-2 font-bold text-sm text-on-surface">
            <CheckCircle size={18} className="text-primary shrink-0" />
            <span>AI Advisory for {cropName}</span>
          </div>
          <p className="text-xs text-on-surface-variant leading-relaxed font-medium">
            {recommendationResult?.fertilizer
              ? `Fertilizer Recommendation: ${recommendationResult.fertilizer}`
              : 'Soil moisture is ideal. Proceed with seed sowing. Sowing before the next heavy rainfall window is highly recommended for best seed establishment.'}
          </p>
        </div>

        {/* Buttons Stack */}
        <div className="flex flex-col gap-3.5 mt-2">
          {/* Ask AI */}
          <button
            onClick={handleAskAboutCrop}
            className="m3-btn-primary flex items-center justify-center gap-2 shadow-m3-2"
            id="result-ask-ai"
          >
            <Mic size={18} />
            <span>Ask AI about {cropName}</span>
          </button>

          {/* Scan Another */}
          <button
            onClick={handleRestart}
            className="w-full h-14 border-2 border-primary bg-white text-primary font-bold rounded-2xl flex items-center justify-center gap-2 transition-all hover:bg-primary/5 active:scale-95 text-base"
            id="result-restart"
          >
            <RefreshCw size={18} />
            <span>Scan Another Field</span>
          </button>
        </div>

      </div>

      {/* Bottom Navigation */}
      <nav className="absolute bottom-0 left-0 right-0 h-[72px] bg-surface-container-lowest border-t border-surface-container-high flex justify-around items-center px-2 z-50">
        <button onClick={() => navigate('/dashboard')} className="flex flex-col items-center justify-center flex-1 py-1 text-outline">
          <div className="p-1 px-3 rounded-full mb-1">
            <Home size={20} />
          </div>
          <span className="text-[10px] font-outfit">Home</span>
        </button>
        <button onClick={() => navigate('/crop-disease')} className="flex flex-col items-center justify-center flex-1 py-1 text-primary">
          <div className="p-1 px-3 rounded-full mb-1 bg-primary/10">
            <Camera size={20} />
          </div>
          <span className="text-[10px] font-outfit font-semibold">Scan</span>
        </button>
        <div className="relative flex flex-col items-center -mt-8">
          <button onClick={() => navigate('/ask-ai')} className="w-16 h-16 rounded-full flex items-center justify-center shadow-m3-2 bg-primary text-on-primary">
            <Mic size={32} />
          </button>
          <span className="text-[10px] font-outfit mt-1 font-semibold text-outline">Ask AI</span>
        </div>
        <button onClick={() => navigate('/alerts')} className="flex flex-col items-center justify-center flex-1 py-1 text-outline">
          <div className="p-1 px-3 rounded-full mb-1">
            <Bell size={20} />
          </div>
          <span className="text-[10px] font-outfit">Alerts</span>
        </button>
        <button onClick={() => navigate('/profile')} className="flex flex-col items-center justify-center flex-1 py-1 text-outline">
          <div className="p-1 px-3 rounded-full mb-1">
            <User size={20} />
          </div>
          <span className="text-[10px] font-outfit">Profile</span>
        </button>
      </nav>

    </div>
  );
};
