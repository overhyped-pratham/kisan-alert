import { create } from 'zustand';
import { 
  UserProfile, 
  CropRecommendationInput, 
  CropRecommendationResult,
  DiseaseDetectionInput,
  DiseaseDetectionResult
} from '../types';
import { authService } from '../services/auth.service';

interface Message {
  id: string;
  sender: 'farmer' | 'ai';
  text: string;
  timestamp: Date;
  audioUrl?: string;
}

interface AppState {
  // Onboarding & Settings
  language: 'hi' | 'en' | 'mr';
  isLoggedIn: boolean;
  hasPermissions: boolean;
  userProfile: UserProfile | null;

  // Flow State: Crop Recommendation
  recommendationInput: CropRecommendationInput;
  recommendationResult: CropRecommendationResult | null;

  // Flow State: Crop Disease Detection
  diseaseInput: DiseaseDetectionInput | null;
  diseaseResult: DiseaseDetectionResult | null;

  // Ask AI Chat
  chatHistory: Message[];

  // Setters & Actions
  setLanguage: (lang: 'hi' | 'en' | 'mr') => void;
  setLoggedIn: (status: boolean) => void;
  setPermissions: (status: boolean) => void;
  setUserProfile: (profile: UserProfile | null) => void;
  
  setRecommendationInput: (input: Partial<CropRecommendationInput>) => void;
  setRecommendationResult: (result: CropRecommendationResult | null) => void;
  resetRecommendationFlow: () => void;

  setDiseaseInput: (input: DiseaseDetectionInput | null) => void;
  setDiseaseResult: (result: DiseaseDetectionResult | null) => void;
  resetDiseaseFlow: () => void;

  addChatMessage: (sender: 'farmer' | 'ai', text: string, audioUrl?: string) => void;
  clearChatHistory: () => void;

  /** Check Flask session on app load and hydrate state */
  hydrateFromSession: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Default States
  language: 'hi',
  isLoggedIn: false,
  hasPermissions: false,
  userProfile: null,

  recommendationInput: {
    location: '',
    soilImage: null,
    season: '',
  },
  recommendationResult: null,

  diseaseInput: null,
  diseaseResult: null,

  chatHistory: [],

  // Setters & Actions
  setLanguage: (language) => set({ language }),
  setLoggedIn: (isLoggedIn) => set({ isLoggedIn }),
  setPermissions: (hasPermissions) => set({ hasPermissions }),
  setUserProfile: (userProfile) => set({ userProfile }),

  setRecommendationInput: (input) =>
    set((state) => ({
      recommendationInput: { ...state.recommendationInput, ...input },
    })),
  setRecommendationResult: (recommendationResult) => set({ recommendationResult }),
  resetRecommendationFlow: () =>
    set({
      recommendationInput: { location: '', soilImage: null, season: '' },
      recommendationResult: null,
    }),

  setDiseaseInput: (diseaseInput) => set({ diseaseInput }),
  setDiseaseResult: (diseaseResult) => set({ diseaseResult }),
  resetDiseaseFlow: () => set({ diseaseInput: null, diseaseResult: null }),

  addChatMessage: (sender, text, audioUrl) =>
    set((state) => ({
      chatHistory: [
        ...state.chatHistory,
        {
          id: Math.random().toString(36).substring(7),
          sender,
          text,
          timestamp: new Date(),
          audioUrl,
        },
      ],
    })),
  clearChatHistory: () => set({ chatHistory: [] }),

  /**
   * On app mount, call GET /api/auth/me.
   * If a valid Flask-Login session exists, hydrate the store.
   */
  hydrateFromSession: async () => {
    try {
      const res = await authService.me();
      if (res.user) {
        set({
          isLoggedIn: true,
          hasPermissions: true,
          userProfile: {
            name: res.user.name,
            village: res.user.village,
            districtState: res.user.district,
            farmSize: res.user.farmSize || '5 Acres',
            cropType: res.user.cropType || 'Wheat',
            preferredLanguage: (res.user.preferredLanguage || 'hi') as 'en' | 'hi' | 'mr',
            phoneNumber: res.user.phone || '',
          },
        });
      }
    } catch {
      // No active session — stay logged out (default state)
    }
  },
}));
