import { generateObject } from 'ai';
import { z } from 'zod';
import { NextResponse } from 'next/server';
import { createModel } from '@/lib/ai';

export async function POST(req: Request) {
  try {
    const { text, quizType = 'mixed', openaiKey, geminiKey } = await req.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const model = createModel(openaiKey, geminiKey);

    let typeInstruction = 'Mix multiple-choice (MCQ), true/false (TF), and written/short answer questions.';
    if (quizType === 'mcq') {
      typeInstruction = 'Generate ONLY multiple-choice (MCQ) questions. Do not generate any true/false, written, or short answer questions.';
    } else if (quizType === 'tf') {
      typeInstruction = 'Generate ONLY true/false (TF) questions. Do not generate any multiple-choice, written, or short answer questions.';
    } else if (quizType === 'written' || quizType === 'short') {
      typeInstruction = `Generate ONLY ${quizType === 'written' ? 'written' : 'short'} answer questions. Do not generate any MCQ or TF questions.`;
    }

    const result = await generateObject({
      model,
      system: `You are an expert tutor creating study materials. Given the raw text notes, generate a quiz to test the user's recall.
Requirements:
1. Generate between 5 and 15 questions based ONLY on the provided text.
2. ${typeInstruction}
3. For MCQ, provide exactly 4 options.
4. For TF, provide exactly 2 options: ["True", "False"].
5. For written/short, provide a sampleAnswer (a correct answer the user might provide).
6. For written/short questions, set correctAnswerIndex to 0 (unused).
7. Do not include questions that cannot be answered by the text.
8. Make questions clear and concise.`,
      prompt: text,
      schema: z.object({
        questions: z.array(
          z.object({
            id: z.string().describe('A unique string ID for this question'),
            type: z.enum(['mcq', 'tf', 'written', 'short']),
            text: z.string().describe('The question text'),
            options: z.array(z.string()).describe('The possible answers. For TF must be ["True", "False"]. For written/short, can be empty or have one placeholder.'),
            correctAnswerIndex: z.number().describe('The index (0-based) of the correct option in the options array. For written/short, use 0.'),
            sampleAnswer: z.string().optional().describe('For written/short questions, the correct sample answer'),
          })
        ),
      }),
    });

    return NextResponse.json({ questions: result.object.questions });
  } catch (error: any) {
    console.error('Quiz Generation Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate quiz' }, { status: 500 });
  }
}
