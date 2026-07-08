import { post } from './api';
import { CropRecommendationInput, CropRecommendationResult } from '../types';

export const cropService = {
  async getRecommendation(
    input: CropRecommendationInput
  ): Promise<CropRecommendationResult> {
    return post<CropRecommendationResult>('/api/crop/recommend', {
      location: input.location,
      season: input.season,
      soilImage: input.soilImage,
      // Default NPK/soil values if user skipped soil step
      nitrogen: 80,
      phosphorous: 45,
      potassium: 50,
      ph: 6.5,
      soilType: 'Alluvial',
    });
  },
};
