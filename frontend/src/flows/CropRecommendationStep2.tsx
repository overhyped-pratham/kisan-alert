import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Image as ImageIcon, HelpCircle, Check, Mic } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const CropRecommendationStep2: React.FC = () => {
  const navigate = useNavigate();
  const { setRecommendationInput, recommendationInput } = useAppStore();
  const [photoCaptured, setPhotoCaptured] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleTriggerUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setRecommendationInput({ soilImage: reader.result as string });
        setPhotoCaptured(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleContinue = () => {
    navigate('/crop-recommendation/step-3');
  };

  return (
    <div className="flex-1 flex flex-col justify-between py-5 px-5 font-outfit select-none bg-background min-h-0 -mx-5 -my-5">
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        id="soil-image-upload"
      />
      
      {/* Custom Flow Header */}
      <div className="flex flex-col w-full border-b border-surface-container-high pb-4 pt-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/crop-recommendation/step-1')}
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
            <span className="text-primary font-bold">Step 2 of 3</span>
            <span>66% Complete</span>
          </div>
          <div className="w-full h-2 bg-surface-container-low rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: '66%' }} />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col gap-5 mt-4 overflow-y-auto pb-4">
        <div className="flex flex-col">
          <h3 className="text-2xl font-bold text-on-surface font-outfit tracking-tight leading-8">
            Scan Your Soil
          </h3>
          <p className="text-[14px] text-outline mt-1 font-outfit font-medium">
            Let's check your land's health using your camera.
          </p>
        </div>

        {/* Central Illustration Container */}
        <div className="bg-[#cbffc2]/10 border border-surface-container rounded-2xl overflow-hidden shadow-m3-1 flex flex-col items-center">
          <div className="p-4 flex items-center justify-center w-full bg-white relative">
            <img 
              src="/designs/assets/soil_scan_illustration.png" 
              alt="Scanning Soil Illustration" 
              className="w-full max-h-[160px] object-contain rounded-lg"
              onError={(e) => {
                // Fallback image URL if copy task is slow
                e.currentTarget.src = 'https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?auto=format&fit=crop&w=300&q=80';
              }}
            />
          </div>
          <div className="w-full py-3 bg-[#f5f3f3] text-center border-t border-surface-container-high text-xs font-semibold text-outline italic">
            Point your camera at a handful of soil
          </div>
        </div>

        {/* Buttons Stack */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleTriggerUpload}
            className={`m3-btn-primary flex items-center justify-center gap-2 ${
              photoCaptured ? 'bg-[#0d631b]/80' : ''
            }`}
            id="soil-scan-take-photo"
          >
            <Camera size={18} />
            <span>{photoCaptured ? 'Photo Captured ✓' : 'Take Photo'}</span>
          </button>

          <button
            onClick={handleTriggerUpload}
            className="w-full h-14 border-2 border-primary bg-white text-primary font-bold rounded-2xl flex items-center justify-center gap-2 transition-all hover:bg-primary/5 active:scale-95"
            id="soil-scan-upload-photo"
          >
            <ImageIcon size={18} />
            <span>Upload Photo</span>
          </button>
        </div>

        {/* Info Card (Green left border) */}
        <div className="bg-white rounded-2xl p-4.5 shadow-m3-1 border border-surface-container-high border-l-4 border-primary flex flex-col gap-3">
          <div className="flex items-center gap-2 text-on-surface font-bold text-sm">
            <HelpCircle size={18} className="text-primary shrink-0" />
            <span>Why do we need this?</span>
          </div>

          <div className="flex flex-col gap-2.5 pl-1">
            <div className="flex items-start gap-2.5 text-xs text-on-surface-variant leading-relaxed">
              <Check size={14} className="text-primary shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Soil Type</span>
                <span className="text-outline">Identify if it's Clay, Loam, or Sandy soil.</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-xs text-on-surface-variant leading-relaxed">
              <Check size={14} className="text-primary shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Soil Texture</span>
                <span className="text-outline">Check water holding capacity.</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-xs text-on-surface-variant leading-relaxed">
              <Check size={14} className="text-primary shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Soil Colour</span>
                <span className="text-outline">Estimates nutrient and organic levels.</span>
              </div>
            </div>
          </div>

          <div className="text-[10px] font-black text-primary uppercase tracking-wider mt-1 border-t border-surface-container pt-3">
            NO MANUAL INPUT REQUIRED
          </div>
        </div>
      </div>

      {/* Floating Voice Button */}
      <div className="absolute right-5 bottom-[92px] z-40">
        <button 
          onClick={() => navigate('/ask-ai')}
          className="m3-btn-voice active:scale-95 transition-all shadow-m3-2"
          aria-label="Voice help"
          id="flow-voice-btn"
        >
          <Mic size={24} />
        </button>
      </div>

      {/* Bottom Nav Actions */}
      <div className="grid grid-cols-2 gap-3.5 pt-4 border-t border-surface-container-high shrink-0 bg-background">
        <button
          onClick={() => navigate('/crop-recommendation/step-1')}
          className="w-full h-14 border border-outline bg-[#f5f3f3] text-outline font-bold rounded-2xl flex items-center justify-center transition-all hover:bg-surface-container active:scale-95 text-base"
          id="flow-step2-back"
        >
          Back
        </button>
        <button
          onClick={handleContinue}
          className="m3-btn-primary flex items-center justify-center gap-1.5"
          id="flow-step2-continue"
        >
          <span>Continue</span>
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4.16669 10H15.8334" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M10 4.16669L15.8334 10L10 15.8334" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

    </div>
  );
};
