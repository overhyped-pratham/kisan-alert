import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lightbulb, Check, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { diseaseService } from '../services/disease.service';

const STAGES = [
  { label: 'Processing image...', sub: null },
  { label: 'Detecting diseases...', sub: 'Scanning pixels for anomalies' },
  { label: 'Checking severity...',  sub: null },
  { label: 'Preparing treatment...', sub: null },
  { label: 'Looking for expert guidance...', sub: null },
];

export const CropDiseaseStep2: React.FC = () => {
  const navigate = useNavigate();
  const { diseaseInput, setDiseaseResult } = useAppStore();
  const [progress, setProgress] = useState(0);
  const [activeStage, setActiveStage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const apiFinishedRef = useRef(false);

  useEffect(() => {
    let active = true;
    const runAnalysis = async () => {
      if (!diseaseInput || !diseaseInput.cropImage) {
        setError('No image found. Please go back and capture an image.');
        return;
      }
      try {
        const result = await diseaseService.detectDisease(diseaseInput);
        if (active) {
          setDiseaseResult(result);
          apiFinishedRef.current = true;
        }
      } catch (err: any) {
        console.error(err);
        if (active) {
          setError(err.message || 'Error occurred during analysis.');
        }
      }
    };
    runAnalysis();
    return () => {
      active = false;
    };
  }, [diseaseInput, setDiseaseResult]);

  useEffect(() => {
    if (error) return;

    // Simulate analysis progress: 0→100
    const totalMs = 3000;
    const tickMs = 80;
    const step = (tickMs / totalMs) * 100;

    const interval = setInterval(() => {
      setProgress(prev => {
        const next = Math.min(prev + step, 100);
        // Map progress to stage
        if (next >= 20 && next < 45) setActiveStage(1);
        else if (next >= 45 && next < 65) setActiveStage(2);
        else if (next >= 65 && next < 85) setActiveStage(3);
        else if (next >= 85) setActiveStage(4);
        
        if (next >= 100 && apiFinishedRef.current) {
          clearInterval(interval);
          setTimeout(() => navigate('/crop-disease/step-3'), 400);
        }
        return next;
      });
    }, tickMs);

    return () => clearInterval(interval);
  }, [navigate, error]);

  if (error) {
    return (
      <div className="flex flex-col gap-6 font-outfit items-center text-center py-10 w-full">
        <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center shadow-m3-1">
          <AlertTriangle size={32} />
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-black text-on-surface">Analysis Failed</h2>
          <p className="text-[14px] text-outline px-4">{error}</p>
        </div>
        <button
          onClick={() => navigate('/crop-disease/step-1')}
          className="w-full h-14 mt-4 border-2 border-primary bg-white text-primary font-bold rounded-2xl flex items-center justify-center gap-2 transition-all hover:bg-primary/5 active:scale-95 text-base max-w-[280px]"
        >
          <ArrowLeft size={18} />
          <span>Go Back and Try Again</span>
        </button>
      </div>
    );
  }

  const pct = Math.round(progress);

  return (
    <div className="flex flex-col gap-6 font-outfit items-center">

      {/* Progress % in header style — matches screenshot "41%" at top */}
      <div className="w-full flex items-center gap-3">
        <span className="text-2xl font-black text-on-surface">{pct}%</span>
      </div>

      {/* Central illustration inside soft circle */}
      <div className="relative flex items-center justify-center w-52 h-52">
        {/* Soft grey circle background */}
        <div className="absolute inset-0 rounded-full bg-surface-container-low" />

        {/* Pulse ring (Framer Motion) */}
        <motion.div
          className="absolute w-44 h-44 rounded-full border-2 border-primary/30"
          animate={{ scale: [1, 1.08, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Illustration */}
        <img
          src="/designs/assets/kisan_ai_robot.png"
          alt="Analyzing crop"
          className="w-40 h-32 object-contain relative z-10"
        />
      </div>

      {/* Title + subtitle */}
      <div className="text-center flex flex-col gap-2">
        <h2 className="text-2xl font-black text-on-surface tracking-tight leading-tight">
          Analyzing Your Crop
        </h2>
        <p className="text-[14px] text-outline font-medium leading-snug">
          Please wait while Kisan AI checks your crop health.
        </p>
      </div>

      {/* Stage checklist */}
      <div className="w-full flex flex-col gap-3.5">
        {STAGES.map((stage, i) => {
          const done = i < activeStage;
          const current = i === activeStage;
          const pending = i > activeStage;

          return (
            <div key={i} className="flex items-start gap-3">
              {/* Icon */}
              {done ? (
                <div className="w-8 h-8 rounded-lg bg-primary text-on-primary flex items-center justify-center shrink-0">
                  <Check size={16} />
                </div>
              ) : current ? (
                <div className="w-8 h-8 rounded-full border-2 border-primary bg-surface-container flex items-center justify-center shrink-0">
                  <motion.div
                    className="w-3 h-3 rounded-full bg-primary"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 0.9, repeat: Infinity }}
                  />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full border-2 border-outline-variant flex items-center justify-center shrink-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-outline-variant" />
                </div>
              )}

              {/* Text */}
              <div className="flex flex-col">
                <span className={`text-[14px] font-bold leading-tight ${pending ? 'text-outline-variant' : 'text-on-surface'}`}>
                  {stage.label}
                </span>
                {stage.sub && current && (
                  <span className="text-[12px] text-primary font-semibold mt-0.5">{stage.sub}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="w-full flex flex-col gap-1.5">
        <div className="flex justify-between text-[12px] font-bold">
          <span className="text-on-surface">Analysis Progress</span>
          <span className="text-primary">{pct}%</span>
        </div>
        <div className="w-full h-2.5 bg-surface-container-low rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
      </div>

      {/* Tip card — green left border */}
      <div className="w-full bg-white border border-surface-container-high border-l-4 border-primary rounded-2xl p-4 flex gap-2.5 items-start shadow-m3-1">
        <Lightbulb size={18} className="text-primary shrink-0 mt-0.5" />
        <p className="text-[13px] text-on-surface-variant font-medium leading-relaxed">
          <span className="font-bold text-on-surface">Tip:</span> Good quality photos improve disease detection accuracy.
        </p>
      </div>

      {/* Footer note */}
      <p className="text-[12px] text-outline text-center font-medium">
        Analysis usually takes less than 10 seconds.
      </p>

    </div>
  );
};
