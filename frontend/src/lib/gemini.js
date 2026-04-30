import { GoogleGenerativeAI } from '@google/generative-ai';

const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!geminiApiKey) {
  console.warn('Gemini API Key is missing. Please check your .env.local file.');
}

export const genAI = new GoogleGenerativeAI(geminiApiKey || '');
