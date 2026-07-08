import { post } from './api';
import { AskAiInput, AskAiResult } from '../types';

export const aiService = {
  async askKisanAi(input: AskAiInput, language = 'en'): Promise<AskAiResult> {
    return post<AskAiResult>('/api/ai/ask', {
      question: input.questionText || '',
      language,
    });
  },

  getSuggestedQuestions(): string[] {
    return [
      'मेरी कपास की फसल के पत्तों पर पीले धब्बे क्यों हैं?',
      'अगले ३ दिनों में मौसम कैसा रहेगा?',
      'इस मौसम में कौन सी खाद सबसे अच्छी है?',
      'नहर के पानी के लिए सरकारी योजना क्या है?',
    ];
  },
};
