import React from 'react';
import { Outlet } from 'react-router-dom';

export const OnboardingLayout: React.FC = () => {
  return (
    <div className="min-h-screen w-full bg-surface-container-low flex justify-center items-start sm:items-center">
      {/* 430px Mobile-viewport container */}
      <div className="w-full max-w-[430px] h-[100dvh] sm:h-[800px] sm:max-h-[100dvh] bg-background sm:rounded-xl sm:shadow-m3-1 flex flex-col relative overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
};
