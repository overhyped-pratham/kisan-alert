import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export const SplashPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check localStorage for auto-login redirect
    const hasAuth = localStorage.getItem('kisan_auth') === 'true';
    const timer = setTimeout(() => {
      if (hasAuth) {
        navigate('/dashboard');
      } else {
        navigate('/language');
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex-1 flex flex-col justify-between items-center py-10 px-6 font-outfit select-none bg-background">
      {/* Empty top block for spacing */}
      <div />

      {/* Center Logo & Title Block */}
      <div className="flex flex-col items-center text-center">
        {/* Logo Icon (SVG Replica of Green Location Pin & Blue Drop) */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mb-8"
        >
          <svg width="84" height="108" viewBox="0 0 84 108" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-m3-1">
            {/* Outer Green Location Pin */}
            <path
              d="M42 0C18.8 0 0 18.8 0 42C0 73.5 35.7 104.7 40.2 108C41.3 108.8 42.7 108.8 43.8 108C48.3 104.7 84 73.5 84 42C84 18.8 65.2 0 42 0Z"
              fill="#1b6d24"
            />
            {/* Inner Light Green Pin Outline Accent */}
            <path
              d="M42 8C23.2 8 8 23.2 8 42C8 63.8 34.6 91.2 42 97.5C49.4 91.2 76 63.8 76 42C76 23.2 60.8 8 42 8Z"
              fill="#88d982"
            />
            {/* Center Blue Water Droplet */}
            <path
              d="M42 22C32.1 22 24 30.1 24 40C24 53.6 42 74 42 74C42 74 60 53.6 60 40C60 30.1 51.9 22 42 22ZM42 61.2C38 56.4 32.5 49.3 32.5 40C32.5 34.8 36.8 30.5 42 30.5C47.2 30.5 51.5 34.8 51.5 40C51.5 49.3 46 56.4 42 61.2Z"
              fill="#0073b2"
            />
          </svg>
        </motion.div>

        {/* Title */}
        <h1 className="text-[32px] font-bold text-primary font-outfit tracking-tight leading-10">
          Kisan Alert
        </h1>
        
        {/* Subtitle */}
        <h2 className="text-lg font-semibold text-secondary mt-1 font-outfit leading-7">
          Smart Farming Assistant
        </h2>
        
        {/* Description */}
        <p className="text-sm text-outline mt-2 font-outfit max-w-[240px]">
          Helping Indian Farmers with AI
        </p>

        {/* Loading Progress Bar */}
        <div className="w-[140px] h-[3px] bg-surface-container mt-12 rounded-full overflow-hidden relative">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 2.2, ease: 'easeInOut' }}
            className="h-full bg-primary-container rounded-full"
          />
        </div>
      </div>

      {/* Powered By AI Footer */}
      <div className="text-[10px] tracking-[0.15em] text-outline font-outfit font-bold uppercase">
        Powered by AI
      </div>
    </div>
  );
};
