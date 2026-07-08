import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const FlowLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useAppStore();

  const currentPath = location.pathname;
  
  // Determine Flow Details
  const isRecommendation = currentPath.includes('crop-recommendation');
  
  // Titles translated
  const titles = {
    hi: {
      recommendation: 'क्या उगाएं?',
      disease: 'फसल की जांच',
    },
    en: {
      recommendation: 'What Should I Grow?',
      disease: 'Check My Crop',
    },
    mr: {
      recommendation: 'काय उगवावे?',
      disease: 'पिकांची तपासणी',
    }
  }[language] || {
    recommendation: 'What Should I Grow?',
    disease: 'Check My Crop',
  };

  const title = isRecommendation ? titles.recommendation : titles.disease;

  // Determine current step from URL path suffix (e.g. /step-1 -> step 1)
  let currentStep = 1;
  if (currentPath.includes('step-2') || currentPath.includes('soil-scan')) currentStep = 2;
  else if (currentPath.includes('step-3') || currentPath.includes('season')) currentStep = 3;
  else if (currentPath.includes('step-4') || currentPath.includes('analyzing')) currentStep = 4;
  else if (currentPath.includes('result')) currentStep = 3; // result screen is 3 in disease flow
  else if (currentPath.includes('treatment')) currentStep = 4; // treatment screen is 4 in disease flow

  const totalSteps = 4;

  const handleBack = () => {
    // If we're at step 1, navigate back to dashboard. Otherwise go back in history.
    if (currentPath.endsWith('step-1')) {
      navigate('/dashboard');
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="min-h-screen w-full bg-surface-container-low flex justify-center items-start sm:items-center">
      {/* 430px Mobile-viewport container */}
      <div className="w-full max-w-[430px] h-[100dvh] sm:h-[800px] sm:max-h-[100dvh] bg-background sm:rounded-xl sm:shadow-m3-1 flex flex-col relative overflow-hidden">
        
        {/* Flow Header */}
        <header className="bg-background px-5 py-4 flex items-center border-b border-surface-container-high">
          <button 
            onClick={handleBack}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container active:scale-95 transition-all text-on-surface mr-3"
            aria-label="Go Back"
            id="flow-back-btn"
          >
            <ArrowLeft size={20} />
          </button>
          
          <div className="flex-1 flex flex-col">
            <h2 className="text-lg font-bold font-outfit text-on-surface">
              {title}
            </h2>
            
            {/* Step indicators */}
            <div className="flex items-center gap-1.5 mt-1.5">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1.5 rounded-full transition-all ${
                    i + 1 === currentStep 
                      ? 'w-6 bg-primary' 
                      : i + 1 < currentStep 
                        ? 'w-1.5 bg-primary/45' 
                        : 'w-1.5 bg-surface-container-highest'
                  }`}
                />
              ))}
              <span className="text-[10px] text-outline font-outfit ml-1.5">
                Step {currentStep} of {totalSteps}
              </span>
            </div>
          </div>
        </header>

        {/* Wizard content */}
        <main className="flex-1 overflow-y-auto px-5 py-5 flex flex-col">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
