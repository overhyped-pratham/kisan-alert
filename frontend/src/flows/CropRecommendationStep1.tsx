import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Home } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const CropRecommendationStep1: React.FC = () => {
  const navigate = useNavigate();
  const { setRecommendationInput, recommendationInput } = useAppStore();
  const [selectedMethod, setSelectedMethod] = useState<'gps' | 'manual'>('gps');

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

  const handleContinue = () => {
    // Save selection method to state
    setRecommendationInput({ 
      location: selectedMethod === 'gps' ? 'Indore, MP (GPS Detected)' : 'Select District Manually' 
    });
    navigate('/crop-recommendation/step-2');
  };

  return (
    <div className="flex-1 flex flex-col justify-between py-5 px-5 font-outfit select-none bg-background min-h-0 -mx-5 -my-5">
      
      {/* Custom Flow Header */}
      <div className="flex flex-col w-full border-b border-surface-container-high pb-4 pt-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container active:scale-95 transition-all text-on-surface"
            aria-label="Back to Dashboard"
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
            <span className="text-primary font-bold">Step 1 of 3</span>
            <span>33%</span>
          </div>
          <div className="w-full h-2 bg-surface-container-low rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: '33%' }} />
          </div>
        </div>
      </div>

      {/* Main Form Content */}
      <div className="flex-1 flex flex-col justify-center gap-6 mt-2">
        <h3 className="text-2xl font-bold text-on-surface font-outfit pl-1 tracking-tight leading-8">
          Where is your farm?
        </h3>

        <div className="flex flex-col gap-4">
          {/* Card 1: GPS location */}
          <button
            onClick={() => setSelectedMethod('gps')}
            className={`w-full p-6 rounded-2xl flex flex-col items-center justify-center gap-4 text-center border-2 transition-all relative overflow-hidden ${
              selectedMethod === 'gps'
                ? 'bg-[#cbffc2]/30 border-primary shadow-m3-2 text-primary'
                : 'bg-white border-surface-container shadow-m3-1 text-on-surface'
            }`}
            id="loc-method-gps"
          >
            <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${
              selectedMethod === 'gps' ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-outline'
            }`}>
              <MapPin size={28} />
            </div>
            
            <span className="text-base font-bold font-outfit">
              Use Current Location
            </span>

            {/* Decorative background circle visible on active */}
            {selectedMethod === 'gps' && (
              <div className="absolute -right-8 -bottom-8 w-24 h-24 rounded-full bg-primary/5 pointer-events-none" />
            )}
          </button>

          {/* Card 2: Manual selection */}
          <button
            onClick={() => setSelectedMethod('manual')}
            className={`w-full p-6 rounded-2xl flex flex-col items-center justify-center gap-4 text-center border-2 transition-all relative overflow-hidden ${
              selectedMethod === 'manual'
                ? 'bg-[#cbffc2]/30 border-primary shadow-m3-2 text-primary'
                : 'bg-white border-surface-container shadow-m3-1 text-on-surface'
            }`}
            id="loc-method-manual"
          >
            <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${
              selectedMethod === 'manual' ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface'
            }`}>
              <Home size={28} />
            </div>
            
            <span className="text-base font-bold font-outfit">
              Select District Manually
            </span>
          </button>
        </div>
      </div>

      {/* Bottom Button */}
      <div className="mt-6 pt-4 border-t border-surface-container-high">
        <button
          onClick={handleContinue}
          className="m3-btn-primary flex items-center justify-center gap-2"
          id="flow-step1-continue"
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
