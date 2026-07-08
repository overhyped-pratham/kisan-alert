import { upload, post } from './api';
import { DiseaseDetectionInput, DiseaseDetectionResult } from '../types';

export const diseaseService = {
  async detectDisease(
    input: DiseaseDetectionInput
  ): Promise<DiseaseDetectionResult> {
    const formData = new FormData();
    // cropImage is a base64 data-url — convert to File and append
    if (input.cropImage) {
      const blob = await fetch(input.cropImage).then((r) => r.blob());
      const file = new File([blob], 'leaf.jpg', { type: 'image/jpeg' });
      formData.append('file', file);
    }
    if (input.voiceDesc) {
      formData.append('voiceDesc', input.voiceDesc);
    }
    if (input.expertEscalate) {
      formData.append('expertEscalate', String(input.expertEscalate));
    }
    const res = await upload<any>('/api/disease/detect', formData);
    return {
      disease: res.diseaseName,
      severity: res.severity,
      treatment: res.treatment,
      confidence: res.confidence,
      prevention: res.prevention,
      organicAlternatives: res.organicAlternatives,
      fertilizer: res.fertilizer,
      ticketCreated: res.ticketCreated,
      ticketId: res.ticketId,
      details: res.details,
    };
  },

  async escalateDisease(): Promise<{ success: boolean; ticketId: number; assignedCenter: string }> {
    return post<{ success: boolean; ticketId: number; assignedCenter: string }>('/api/disease/escalate');
  },
};
