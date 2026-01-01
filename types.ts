
export interface Message {
  role: 'user' | 'anya' | 'system';
  content: string;
  emotion?: string; 
  sensory?: string; 
  fullText?: string; 
}

export interface UserProfile {
  name: string;
  trait: string;
  isPremium: boolean;
  imageGenerationCount: number;
  tokens: number;
  trialStartedAt: number | null;
}

export interface GeminiResponse {
  emotion: string;
  sensory: string;
  dialogue: string;
}

export type AppMode = 'chat' | 'image' | 'upgrade';
