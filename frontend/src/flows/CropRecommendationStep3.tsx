import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CloudRain, Snowflake, Sun } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const CropRecommendationStep3: React.FC = () => {
  const navigate = useNavigate();
  const { setRecommendationInput, recommendationInput } = useAppStore();
  const [selectedSeason, setSelectedSeason] = useState<string>('');

  // Hide parent layout header dynamically to allow full custom screen rendering matching screenshot
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

  const handleSelectSeason = (season: string) => {
    setSelectedSeason(season);
  };

  const handleContinue = () => {
    if (selectedSeason) {
      setRecommendationInput({ season: selectedSeason });
      navigate('/crop-recommendation/step-4');
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between py-5 px-5 font-outfit select-none bg-background min-h-0 -mx-5 -my-5">
      
      {/* Custom Flow Header */}
      <div className="flex flex-col w-full border-b border-surface-container-high pb-4 pt-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/crop-recommendation/step-2')}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container active:scale-95 transition-all text-on-surface"
            aria-label="Go Back"
            id="flow-back-btn"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-lg font-bold text-on-surface font-outfit">
            What Should I Grow?
          </h2>
        </div>
        
        {/* Progress Bar Header */}
        <div className="flex flex-col gap-1.5 mt-4">
          <div className="flex justify-between items-center text-xs font-bold text-outline">
            <span className="text-primary font-bold">Step 3 of 3</span>
            <span>100%</span>
          </div>
          <div className="w-full h-2 bg-surface-container-low rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: '100%' }} />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col gap-4.5 mt-4 overflow-y-auto pb-4">
        <div className="flex flex-col">
          <h3 className="text-2xl font-bold text-on-surface font-outfit tracking-tight leading-8">
            Current Season
          </h3>
          <p className="text-[14px] text-outline mt-1 font-outfit font-medium leading-normal">
            Select the season you are planning for to get the best crop matches.
          </p>
        </div>

        {/* Season Options Stack */}
        <div className="flex flex-col gap-4">
          {/* Card 1: Kharif */}
          <button
            onClick={() => handleSelectSeason('Kharif')}
            className={`w-full bg-white rounded-2xl p-4.5 border-2 text-left flex flex-col gap-3 transition-all shadow-m3-1 ${
              selectedSeason === 'Kharif' ? 'border-primary ring-2 ring-primary/10' : 'border-surface-container-high'
            }`}
            id="season-kharif"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-[#cbffc2]/50 text-primary flex items-center justify-center shrink-0">
                <CloudRain size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold text-on-surface font-outfit leading-none">Kharif</span>
                <span className="text-xs text-outline mt-1 font-medium leading-none">Monsoon (July – Oct)</span>
              </div>
            </div>
            
            <div className="w-full h-[88px] rounded-xl overflow-hidden border border-surface-container">
              <img 
                src="/designs/assets/kharif_crop_field.png" 
                alt="Kharif monsoon field" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&w=300&q=80';
                }}
              />
            </div>
          </button>

          {/* Card 2: Rabi */}
          <button
            onClick={() => handleSelectSeason('Rabi')}
            className={`w-full bg-white rounded-2xl p-4.5 border-2 text-left flex flex-col gap-3 transition-all shadow-m3-1 ${
              selectedSeason === 'Rabi' ? 'border-primary ring-2 ring-primary/10' : 'border-surface-container-high'
            }`}
            id="season-rabi"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-[#e9f2ff] text-[#005a8c] flex items-center justify-center shrink-0">
                <Snowflake size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold text-on-surface font-outfit leading-none">Rabi</span>
                <span className="text-xs text-outline mt-1 font-medium leading-none">Winter (Oct – March)</span>
              </div>
            </div>
            
            <div className="w-full h-[88px] rounded-xl overflow-hidden border border-surface-container">
              <img 
                src="/designs/assets/rabi_crop_field.png" 
                alt="Rabi winter field" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=300&q=80';
                }}
              />
            </div>
          </button>

          {/* Card 3: Zaid */}
          <button
            onClick={() => handleSelectSeason('Zaid')}
            className={`w-full bg-white rounded-2xl p-4.5 border-2 text-left flex flex-col gap-3 transition-all shadow-m3-1 ${
              selectedSeason === 'Zaid' ? 'border-primary ring-2 ring-primary/10' : 'border-surface-container-high'
            }`}
            id="season-zaid"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-[#fdcdbc]/50 text-[#795548] flex items-center justify-center shrink-0">
                <Sun size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold text-on-surface font-outfit leading-none">Zaid</span>
                <span className="text-xs text-outline mt-1 font-medium leading-none">Summer (March – June)</span>
              </div>
            </div>
            
            <div className="w-full h-[88px] rounded-xl overflow-hidden border border-surface-container">
              <img 
                src="/designs/assets/zaid_crop_field.png" 
                alt="Zaid summer field" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1593113630400-ea4288922497?auto=format&fit=crop&w=300&q=80';
                }}
              />
            </div>
          </button>
        </div>
      </div>

      {/* Bottom Button */}
      <div className="mt-4 pt-4 border-t border-surface-container-high">
        <button
          onClick={handleContinue}
          disabled={!selectedSeason}
          className={`m3-btn-primary flex items-center justify-center gap-1.5 ${
            selectedSeason ? 'bg-primary' : 'bg-surface-container text-outline cursor-not-allowed border border-surface-container-high'
          }`}
          id="flow-step3-continue"
        >
          <span>Continue</span>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4.16669 10H15.8334" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M10 4.16669L15.8334 10L10 15.8334" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

    </div>
  );
};
