import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { OnboardingLayout } from '../layouts/OnboardingLayout';
import { AppLayout } from '../layouts/AppLayout';
import { FlowLayout } from '../layouts/FlowLayout';
import { useAppStore } from '../store/useAppStore';

// Onboarding Pages
import { SplashPage } from '../pages/SplashPage';
import { LanguagePage } from '../pages/LanguagePage';
import { LoginPage } from '../pages/LoginPage';
import { PermissionsPage } from '../pages/PermissionsPage';

// Main Pages
import { DashboardPage } from '../pages/DashboardPage';
import { AskAiPage } from '../pages/AskAiPage';
import { AlertsPage } from '../pages/AlertsPage';
import { ProfilePage } from '../pages/ProfilePage';

// Flow Pages
import { CropRecommendationStep1 } from '../flows/CropRecommendationStep1';
import { CropRecommendationStep2 } from '../flows/CropRecommendationStep2';
import { CropRecommendationStep3 } from '../flows/CropRecommendationStep3';
import { CropRecommendationStep4 } from '../flows/CropRecommendationStep4';
import { CropRecommendationResultPage } from '../flows/CropRecommendationResultPage';

import { CropDiseaseStep1 } from '../flows/CropDiseaseStep1';
import { CropDiseaseStep2 } from '../flows/CropDiseaseStep2';
import { CropDiseaseStep3 } from '../flows/CropDiseaseStep3';
import { CropDiseaseStep4 } from '../flows/CropDiseaseStep4';

export const AppRoutes: React.FC = () => {
  const isLoggedIn = useAppStore((s) => s.isLoggedIn);

  return (
    <Routes>
      {/* Root redirect — go to dashboard if logged in, otherwise splash */}
      <Route path="/" element={<Navigate to={isLoggedIn ? '/dashboard' : '/splash'} replace />} />

      {/* Onboarding Flow routes */}
      <Route element={<OnboardingLayout />}>
        <Route path="/splash" element={<SplashPage />} />
        <Route path="/language" element={<LanguagePage />} />
        <Route path="/login" element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
        <Route path="/permissions" element={<PermissionsPage />} />
      </Route>

      {/* Authenticated Dashboard routes */}
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={isLoggedIn ? <DashboardPage /> : <Navigate to="/login" replace />} />
        <Route path="/ask-ai" element={<AskAiPage />} />
        <Route path="/alerts" element={<AlertsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      {/* Crop Recommendation Wizard routes */}
      <Route path="/crop-recommendation" element={<FlowLayout />}>
        <Route index element={<Navigate to="step-1" replace />} />
        <Route path="step-1" element={<CropRecommendationStep1 />} />
        <Route path="step-2" element={<CropRecommendationStep2 />} />
        <Route path="step-3" element={<CropRecommendationStep3 />} />
        <Route path="step-4" element={<CropRecommendationStep4 />} />
        <Route path="result" element={<CropRecommendationResultPage />} />
      </Route>

      {/* Crop Disease Detection Wizard routes */}
      <Route path="/crop-disease" element={<FlowLayout />}>
        <Route index element={<Navigate to="step-1" replace />} />
        <Route path="step-1" element={<CropDiseaseStep1 />} />
        <Route path="step-2" element={<CropDiseaseStep2 />} />
        <Route path="step-3" element={<CropDiseaseStep3 />} />
        <Route path="step-4" element={<CropDiseaseStep4 />} />
      </Route>

      {/* Catch-all Redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
