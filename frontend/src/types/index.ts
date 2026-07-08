export interface CropRecommendationInput {
  location: string;
  soilImage: string | null;
  season: string;
}

export interface CropRecommendationResult {
  cropName: string;
  confidence: string;
  expectedYield: string;
  profit: string;
  waterRequirement?: string;
  fertilizer?: string;
  modelName?: string;
  inputs?: Record<string, number | string>;
}

export interface DiseaseDetectionInput {
  cropImage: string;
  voiceDesc?: string;
  expertEscalate?: boolean;
}

export interface FertilizerRecommendation {
  name: string;
  details: string;
  applicationMethod: string;
}

export interface DiseaseDetectionResult {
  disease: string;
  severity: 'Low' | 'Medium' | 'High';
  treatment: string;
  confidence?: string;
  prevention?: string;
  organicAlternatives?: string;
  fertilizer?: FertilizerRecommendation;
  ticketCreated?: boolean;
  ticketId?: number | null;
  details?: string;
}

export interface AskAiInput {
  questionText?: string;
  questionVoiceBlob?: Blob | null;
}

export interface AskAiResult {
  reply: string;
  audioUrl?: string;
}

export interface WeatherAdvisory {
  forecast: string;
  advice: string;
  alerts: string[];
}

export interface AlertItem {
  id: string;
  type: 'weather' | 'disease' | 'irrigation' | 'general';
  severity: 'info' | 'warning' | 'danger';
  title: string;
  description: string;
  time: string;
  advice?: string;
}

export interface UserProfile {
  name: string;
  village: string;
  districtState: string;
  farmSize: string;
  cropType: string;
  preferredLanguage: 'en' | 'hi' | 'mr'; // English, Hindi, Marathi
  phoneNumber: string;
  familyMembersCount?: number;
  emergencyContacts?: string[];
}
