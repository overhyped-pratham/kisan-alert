import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Image as ImageIcon, Lightbulb, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const CropDiseaseStep1: React.FC = () => {
  const navigate = useNavigate();
  const { setDiseaseInput } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        setDiseaseInput({ cropImage: reader.result as string });
        navigate('/crop-disease/step-2');
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col gap-5 font-outfit">
      {/* Hidden file input */}
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        id="disease-image-upload"
      />

      {/* Helper text */}
      <p className="text-[15px] text-on-surface font-medium leading-snug">
        Take a clear photo of the affected leaf or crop.
      </p>

      {/* Hero dashed card */}
      <div className="w-full bg-surface-container-low rounded-2xl p-5 flex flex-col items-center gap-4 border-2 border-dashed border-outline-variant shadow-m3-1">
        {/* Illustration */}
        <div className="w-full flex items-center justify-center bg-white rounded-xl overflow-hidden relative">
          {/* Soft grey circle behind illustration */}
          <div className="absolute w-40 h-40 rounded-full bg-surface-container-highest opacity-40 pointer-events-none" />
          <img
            src="/designs/assets/soil_scan_illustration.png"
            alt="Scan your crop"
            className="w-full max-h-[180px] object-contain relative z-10 rounded-xl"
          />
        </div>

        {/* Caption */}
        <p className="text-[13px] font-bold text-primary text-center leading-snug">
          For best results, capture the leaf in good daylight.
        </p>
      </div>

      {/* Primary CTA */}
      <button
        onClick={handleTriggerUpload}
        className="m3-btn-primary flex items-center justify-center gap-2"
        id="disease-take-photo"
      >
        <Camera size={20} />
        <span>Take Photo</span>
      </button>

      {/* Secondary CTA */}
      <button
        onClick={handleTriggerUpload}
        className="w-full h-14 border-2 border-primary bg-white text-primary font-bold rounded-2xl flex items-center justify-center gap-2 transition-all hover:bg-primary/5 active:scale-95 text-[15px]"
        id="disease-upload-photo"
      >
        <ImageIcon size={20} />
        <span>Upload From Gallery</span>
      </button>

      {/* Tips card — green left border */}
      <div className="w-full bg-white rounded-2xl border border-surface-container-high border-l-4 border-primary p-4 flex flex-col gap-3 shadow-m3-1">
        <div className="flex items-center gap-2">
          <Lightbulb size={18} className="text-primary shrink-0" />
          <span className="text-[15px] font-bold text-on-surface">Tips for a better scan</span>
        </div>

        <div className="flex flex-col gap-2.5 pl-1">
          {[
            'Capture one leaf at a time',
            'Avoid blurry images',
            'Use natural daylight',
            'Keep the leaf fully visible',
          ].map((tip) => (
            <div key={tip} className="flex items-center gap-2.5 text-[13px] text-on-surface-variant font-medium">
              <CheckCircle2 size={16} className="text-primary shrink-0" />
              <span>{tip}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
