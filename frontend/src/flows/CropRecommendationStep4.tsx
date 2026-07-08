import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Info, Check, Cloud, Sprout, Home, Camera, Mic, Bell, User, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { cropService } from '../services/crop.service';

export const CropRecommendationStep4: React.FC = () => {
  const navigate = useNavigate();
  const { recommendationInput, setRecommendationResult } = useAppStore();
  const [progress, setProgress] = useState(15);
  const [currentStage, setCurrentStage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const apiFinishedRef = useRef(false);

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

  // Fire the real API call on mount
  useEffect(() => {
    let active = true;
    const runRecommendation = async () => {
      try {
        const result = await cropService.getRecommendation(recommendationInput);
        if (active) {
          setRecommendationResult(result);
          apiFinishedRef.current = true;
        }
      } catch (err: any) {
        if (active) setError(err.message || 'Could not get crop recommendation. Please try again.');
      }
    };
    runRecommendation();
    return () => { active = false; };
  }, [recommendationInput, setRecommendationResult]);

  // Animate progress and navigate when API + progress both done
  useEffect(() => {
    if (error) return;
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          if (apiFinishedRef.current) {
            setTimeout(() => navigate('/crop-recommendation/result'), 600);
          } else {
            // Poll until API finishes then navigate
            const waitInterval = setInterval(() => {
              if (apiFinishedRef.current) {
                clearInterval(waitInterval);
                navigate('/crop-recommendation/result');
              }
            }, 200);
          }
          return 100;
        }
        const nextProgress = prev + 15;
        if (nextProgress >= 90) setCurrentStage(5);
        else if (nextProgress >= 70) setCurrentStage(4);
        else if (nextProgress >= 50) setCurrentStage(3);
        else if (nextProgress >= 30) setCurrentStage(2);
        return nextProgress;
      });
    }, 900);

    return () => clearInterval(interval);
  }, [navigate, error]);

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center px-6 -mx-5 -my-5 bg-background">
        <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
          <AlertTriangle size={32} />
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-black text-on-surface">Analysis Failed</h2>
          <p className="text-sm text-outline">{error}</p>
        </div>
        <button
          onClick={() => navigate('/crop-recommendation/step-1')}
          className="h-14 px-8 border-2 border-primary bg-white text-primary font-bold rounded-2xl flex items-center gap-2"
        >
          <ArrowLeft size={18} />
          Start Over
        </button>
      </div>
    );
  }


  return (
    <div className="flex-1 flex flex-col justify-between py-5 px-5 font-outfit select-none bg-background min-h-0 -mx-5 -my-5 pb-[76px] relative">
      
      {/* Standard App Header (matching screenshot) */}
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

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center gap-5 mt-4 overflow-y-auto min-h-0 pb-4">
        
        {/* Robot Card Container */}
        <div className="w-full bg-white border border-surface-container rounded-2xl p-5 shadow-m3-1 flex flex-col items-center justify-center relative max-w-[310px]">
          {/* Top-Right Cloud Icon */}
          <div className="absolute top-4 right-4 w-9 h-9 rounded-full bg-sky-50 text-sky-500 flex items-center justify-center">
            <Cloud size={16} />
          </div>

          {/* Bottom-Left Leaf Icon */}
          <div className="absolute bottom-4 left-4 w-9 h-9 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
            <Sprout size={16} />
          </div>

          <img 
            src="/designs/assets/kisan_ai_robot.png" 
            alt="Kisan AI Robot Analysis" 
            className="w-40 h-40 object-contain rounded-lg my-1"
            onError={(e) => {
              e.currentTarget.src = 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=200&q=80';
            }}
          />
          
          <span className="text-xs font-bold text-outline mt-1 font-outfit">
            Finding the Best Crop for You
          </span>
        </div>

        {/* Text Headers */}
        <div className="text-center flex flex-col gap-1.5 px-3">
          <h2 className="text-2xl font-bold text-on-surface leading-tight tracking-tight">
            Finding the Best Crop for You
          </h2>
          <p className="text-sm text-outline font-medium">
            Please wait while Kisan AI analyzes your farm.
          </p>
        </div>

        {/* Status Checklist Card */}
        <div className="w-full bg-white rounded-2xl p-4.5 shadow-m3-1 border border-surface-container-high flex flex-col gap-3.5 max-w-[320px]">
          {/* Checklist Item 1 */}
          <div className="flex items-center gap-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
              currentStage >= 2 ? 'bg-primary text-on-primary' : 'bg-surface-container text-outline'
            }`}>
              <Check size={14} />
            </div>
            <span className={`text-[13px] font-bold ${
              currentStage >= 2 ? 'text-on-surface' : 'text-outline-variant'
            }`}>
              Checking weather conditions...
            </span>
          </div>

          {/* Checklist Item 2 */}
          <div className="flex items-center gap-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
              currentStage >= 3 ? 'bg-primary text-on-primary' : 'bg-surface-container text-outline'
            }`}>
              <Check size={14} />
            </div>
            <span className={`text-[13px] font-bold ${
              currentStage >= 3 ? 'text-on-surface' : 'text-outline-variant'
            }`}>
              Identifying soil type...
            </span>
          </div>

          {/* Checklist Item 3 */}
          <div className="flex items-center gap-3">
            {currentStage === 3 ? (
              <div className="w-6 h-6 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-primary animate-ping" />
              </div>
            ) : (
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                currentStage > 3 ? 'bg-primary text-on-primary' : 'bg-surface-container text-outline'
              }`}>
                <Check size={14} />
              </div>
            )}
            <span className={`text-[13px] font-bold ${
              currentStage >= 3 ? 'text-primary' : 'text-outline-variant'
            }`}>
              {currentStage >= 3 ? `${progress}% Processed` : 'Processing soil scan...'}
            </span>
          </div>

          {/* Checklist Item 4 */}
          <div className="flex items-center gap-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
              currentStage >= 4 ? 'bg-primary text-on-primary' : 'bg-surface-container text-outline-variant'
            }`}>
              {currentStage > 4 ? <Check size={14} /> : <div className="w-1.5 h-1.5 rounded-full bg-outline-variant" />}
            </div>
            <span className={`text-[13px] font-bold ${
              currentStage >= 4 ? 'text-on-surface' : 'text-outline-variant'
            }`}>
              Comparing crop performance...
            </span>
          </div>

          {/* Checklist Item 5 */}
          <div className="flex items-center gap-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
              currentStage >= 5 ? 'bg-primary text-on-primary' : 'bg-surface-container text-outline-variant'
            }`}>
              {currentStage > 5 ? <Check size={14} /> : <div className="w-1.5 h-1.5 rounded-full bg-outline-variant" />}
            </div>
            <span className={`text-[13px] font-bold ${
              currentStage >= 5 ? 'text-on-surface' : 'text-outline-variant'
            }`}>
              Estimating expected profit...
            </span>
          </div>
        </div>

        {/* Progress Bar details */}
        <div className="w-full flex flex-col gap-1.5 px-2 max-w-[320px] shrink-0">
          <div className="flex justify-between items-center text-xs font-bold text-outline">
            <span className="text-primary font-bold">{progress}% Processed</span>
            <span>Analyzing...</span>
          </div>
          <div className="w-full h-2 bg-surface-container-low rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Information box at the bottom */}
        <div className="w-full bg-[#fdcdbc]/25 rounded-xl p-4 flex gap-3 border border-[#fdcdbc]/40 max-w-[320px] shrink-0 mt-1">
          <Info size={18} className="text-secondary shrink-0 mt-0.5" />
          <p className="text-[12px] text-[#795548] font-semibold leading-relaxed">
            This usually takes 5–10 seconds. Please don't close the app.
          </p>
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
