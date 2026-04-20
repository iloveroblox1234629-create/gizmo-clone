import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { LanguageModel } from 'ai';

export function createModel(openaiKey?: string | null, geminiKey?: string | null): LanguageModel {
  if (geminiKey || process.env.GEMINI_API_KEY) {
    const google = createGoogleGenerativeAI({
      apiKey: geminiKey || process.env.GEMINI_API_KEY!,
    });
    return google('gemini-2.5-flash-lite');
  }

  if (openaiKey || process.env.OPENAI_API_KEY) {
    const openai = createOpenAI({
      apiKey: openaiKey || process.env.OPENAI_API_KEY!,
    });
    return openai('gpt-4o-mini');
  }

  throw new Error('No API key provided. Please configure an API key in settings.');
}