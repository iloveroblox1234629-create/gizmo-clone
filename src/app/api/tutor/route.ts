import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      question, 
      wrongAnswer, 
      correctAnswer, 
      openaiKey, 
      geminiKey,
      userAnswer,
      questionType,
    } = body;

    let model;
    
    if (geminiKey || process.env.GEMINI_API_KEY) {
      const google = createGoogleGenerativeAI({
        apiKey: geminiKey || process.env.GEMINI_API_KEY,
      });
      model = google('gemini-2.5-flash-lite');
    } else if (openaiKey || process.env.OPENAI_API_KEY) {
      const openai = createOpenAI({
        apiKey: openaiKey || process.env.OPENAI_API_KEY,
      });
      model = openai('gpt-4o-mini');
    } else {
      return NextResponse.json(
        { error: 'No API key provided. Please configure an API key in settings.' },
        { status: 401 }
      );
    }

    // Grading mode: evaluate user's written answer
    if (questionType === 'written' || questionType === 'short' || userAnswer) {
      if (!question || !userAnswer || !correctAnswer) {
        return NextResponse.json({ error: 'Missing required fields for grading' }, { status: 400 });
      }

      const result = await generateText({
        model,
        system: `You are an AI Tutor grading a student's answer to a ${questionType || 'written'} question.
Evaluate whether the student's answer is correct or incorrect based on semantic similarity and factual accuracy.
Respond with a JSON object containing:
- correct: boolean (true if answer is correct, false if incorrect)
- explanation: string (brief explanation of why it's correct/incorrect, 1-3 sentences)

Be lenient but accurate. Accept answers that are semantically equivalent or contain the key facts, even if worded differently.
For short answers, accept if the core concept is present.`,
        prompt: `Question: ${question}
Student's Answer: ${userAnswer}
Correct Answer: ${correctAnswer}

Respond with JSON: { "correct": true/false, "explanation": "..." }`,
      });

      let parsedResult = { correct: false, explanation: result.text };
      try {
        const text = result.text;
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}');
        if (start !== -1 && end !== -1 && end > start) {
          const jsonStr = text.slice(start, end + 1);
          parsedResult = JSON.parse(jsonStr);
        }
      } catch {
        parsedResult = { correct: false, explanation: result.text };
      }

      return NextResponse.json(parsedResult);
    }

    // Explanation mode: explain why wrong answer was wrong
    if (!question || !wrongAnswer || !correctAnswer) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await generateText({
      model,
      system: `You are an encouraging and concise AI Tutor. The user just answered a quiz question incorrectly.
Explain briefly (in 1-3 short sentences) why their answer was wrong and why the correct answer is right.
Do not be condescending. Use a friendly, supportive tone. Do not repeat the exact question back to them unless necessary.`,
      prompt: `Question: ${question}\nUser's Answer: ${wrongAnswer}\nCorrect Answer: ${correctAnswer}\n\nPlease explain.`,
    });

    return NextResponse.json({ explanation: result.text });
  } catch (error: any) {
    console.error('Tutor Generation Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate explanation' }, { status: 500 });
  }
}