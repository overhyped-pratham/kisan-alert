import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HelpCircle, MapPin, Mic, Bell, Check } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

interface PermissionState {
  location: boolean;
  microphone: boolean;
  notifications: boolean;
}

export const PermissionsPage: React.FC = () => {
  const navigate = useNavigate();
  const { setPermissions } = useAppStore();
  
  const [granted, setGranted] = useState<PermissionState>({
    location: false,
    microphone: false,
    notifications: false,
  });

  const togglePermission = (key: keyof PermissionState) => {
    setGranted((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleContinue = () => {
    setPermissions(true);
    navigate('/dashboard');
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col justify-between py-5 px-5 font-outfit select-none bg-background">
      
      {/* Top Header Row with Tractor and Help */}
      <div className="flex items-center justify-between py-2 w-full">
        <div className="flex items-center gap-2">
          {/* Tractor SVG Icon */}
          <svg width="24" height="20" viewBox="0 0 24 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary fill-current">
            <path d="M19 13C16.8 13 15 14.8 15 17C15 19.2 16.8 21 19 21C21.2 21 23 19.2 23 17C23 14.8 21.2 13 19 13ZM19 19.5C17.6 19.5 16.5 18.4 16.5 17C16.5 15.6 17.6 14.5 19 14.5C20.4 14.5 21.5 15.6 21.5 17C21.5 18.4 20.4 19.5 19 19.5Z" />
            <path d="M6 13C3.8 13 2 14.8 2 17C2 19.2 3.8 21 6 21C8.2 21 10 19.2 10 17C10 14.8 8.2 13 6 13ZM6 19.5C4.6 19.5 3.5 18.4 3.5 17C3.5 15.6 4.6 14.5 6 14.5C7.4 14.5 8.5 15.6 8.5 17C8.5 18.4 7.4 19.5 6 19.5Z" />
            <path d="M14 6H17V9H14V6ZM20 9H18.5V4.5C18.5 3.7 17.8 3 17 3H14C13.2 3 12.5 3.7 12.5 4.5V9H10C9.4 9 9 9.4 9 10V12H21V10C21 9.4 20.6 9 20 9ZM12.5 11H10.5V10.5H12.5V11ZM17 4.5V9H14V4.5H17ZM20 11H18.5V10.5H20V11Z" />
          </svg>
          <span className="text-[19px] font-bold text-primary">Kisan Alert</span>
        </div>
        <button 
          className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center hover:bg-surface-container-high active:scale-95 text-on-surface"
          aria-label="Help"
          id="help-btn"
        >
          <HelpCircle size={18} />
        </button>
      </div>

      {/* Central Content */}
      <div className="flex-1 flex flex-col items-center mt-2 overflow-y-auto pb-6">
        {/* Sprout Avatar Circle */}
        <div className="w-[84px] h-[84px] rounded-full bg-[#cbffc2] flex items-center justify-center overflow-hidden mb-5 border-2 border-primary/20">
          {/* Detailed Sprout SVG */}
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Sprout leaves */}
            <path d="M24 40V20C24 20 28 14 38 14C38 14 39 21 31 26C27 28.5 24 30 24 30" stroke="#0d631b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M24 32C24 32 21 28.5 17 26C9 21 10 14 10 14C20 14 24 20 24 20" stroke="#0d631b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            {/* Stem */}
            <path d="M24 20V42" stroke="#7a5649" strokeWidth="3" strokeLinecap="round" />
            {/* Soil Ground Curve */}
            <path d="M6 42C12 40 18 43 24 42C30 41 36 44 42 42" stroke="#7a5649" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>

        {/* Title */}
        <h2 className="text-[25px] font-bold text-on-surface text-center tracking-tight leading-8 font-outfit px-3">
          Let's set up your farming assistant.
        </h2>
        <p className="text-[14px] text-outline mt-1.5 text-center font-outfit font-medium px-4 max-w-[280px]">
          Grant these permissions to get the best help for your fields.
        </p>

        {/* Permissions Cards Stack */}
        <div className="w-full flex flex-col gap-3.5 mt-5">
          {/* Permission 1: Location */}
          <div className="w-full bg-surface-container-lowest rounded-xl p-4 shadow-m3-1 flex border-l-4 border-primary flex-col gap-3">
            <div className="flex gap-3.5 items-start">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                <MapPin size={20} />
              </div>
              <div className="flex flex-col">
                <h3 className="text-base font-bold text-on-surface font-outfit flex items-center gap-1.5">
                  📍 Location
                </h3>
                <p className="text-[13px] text-outline mt-0.5 leading-relaxed font-outfit font-medium">
                  Used for accurate weather and crop recommendations.
                </p>
              </div>
            </div>
            <button
              onClick={() => togglePermission('location')}
              className={`w-full h-11 border-2 rounded-xl text-sm font-bold font-outfit transition-all flex items-center justify-center gap-1.5 ${
                granted.location
                  ? 'bg-primary border-primary text-on-primary'
                  : 'bg-transparent border-primary text-primary hover:bg-primary/5'
              }`}
              id="perm-btn-location"
            >
              {granted.location ? (
                <>
                  <Check size={16} />
                  <span>Allowed</span>
                </>
              ) : (
                <span>Allow</span>
              )}
            </button>
          </div>

          {/* Permission 2: Microphone */}
          <div className="w-full bg-surface-container-lowest rounded-xl p-4 shadow-m3-1 flex border-l-4 border-secondary flex-col gap-3">
            <div className="flex gap-3.5 items-start">
              <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center shrink-0 text-secondary">
                <Mic size={20} />
              </div>
              <div className="flex flex-col">
                <h3 className="text-base font-bold text-on-surface font-outfit flex items-center gap-1.5">
                  🎤 Microphone
                </h3>
                <p className="text-[13px] text-outline mt-0.5 leading-relaxed font-outfit font-medium">
                  Used for voice interaction in your language.
                </p>
              </div>
            </div>
            <button
              onClick={() => togglePermission('microphone')}
              className={`w-full h-11 border-2 rounded-xl text-sm font-bold font-outfit transition-all flex items-center justify-center gap-1.5 ${
                granted.microphone
                  ? 'bg-secondary border-secondary text-on-secondary'
                  : 'bg-transparent border-secondary text-secondary hover:bg-secondary/5'
              }`}
              id="perm-btn-microphone"
            >
              {granted.microphone ? (
                <>
                  <Check size={16} />
                  <span>Allowed</span>
                </>
              ) : (
                <span>Allow</span>
              )}
            </button>
          </div>

          {/* Permission 3: Notifications */}
          <div className="w-full bg-surface-container-lowest rounded-xl p-4 shadow-m3-1 flex border-l-4 border-error flex-col gap-3">
            <div className="flex gap-3.5 items-start">
              <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center shrink-0 text-error">
                <Bell size={20} />
              </div>
              <div className="flex flex-col">
                <h3 className="text-base font-bold text-on-surface font-outfit flex items-center gap-1.5">
                  🔔 Notifications
                </h3>
                <p className="text-[13px] text-outline mt-0.5 leading-relaxed font-outfit font-medium">
                  Used for rainfall and emergency alerts.
                </p>
              </div>
            </div>
            <button
              onClick={() => togglePermission('notifications')}
              className={`w-full h-11 border-2 rounded-xl text-sm font-bold font-outfit transition-all flex items-center justify-center gap-1.5 ${
                granted.notifications
                  ? 'bg-error border-error text-on-error'
                  : 'bg-transparent border-error text-error hover:bg-error/5'
              }`}
              id="perm-btn-notifications"
            >
              {granted.notifications ? (
                <>
                  <Check size={16} />
                  <span>Allowed</span>
                </>
              ) : (
                <span>Allow</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="mt-5 flex flex-col items-center">
        <button
          onClick={handleContinue}
          className="m3-btn-primary"
          id="perm-continue-btn"
        >
          Continue
        </button>
        <span className="text-[12px] font-bold text-outline mt-3 uppercase tracking-wider font-outfit">
          Step 2 of 3
        </span>
      </div>
    </div>
  );
};
