import { NextResponse } from 'next/server';
import { YoutubeTranscript } from 'youtube-transcript';
import { generateText } from 'ai';
import { createModel } from '@/lib/ai';

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'YouTube URL is required' }, { status: 400 });
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
    }

    let transcript = '';
    let title = `YouTube Video (${videoId})`;

    try {
      const transcriptResult = await YoutubeTranscript.fetchTranscript(videoId, {
        lang: 'en',
      });

      if (transcriptResult && transcriptResult.length > 0) {
        transcript = transcriptResult
          .map((item) => item.text)
          .join(' ');
      }
    } catch (transcriptError) {
      console.log('Transcript fetch error:', transcriptError);
    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${process.env.YOUTUBE_API_KEY}`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.items && data.items.length > 0) {
          title = data.items[0].snippet.title;
        }
      }
    } catch (titleError) {
      console.log('Title fetch error:', titleError);
    }

    if (!transcript) {
      return NextResponse.json({
        error: 'No captions available for this video',
        title,
        videoId,
      }, { status: 404 });
    }

    return NextResponse.json({
      title,
      videoId,
      transcript: transcript.slice(0, 50000),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch YouTube video';
    console.error('YouTube Import Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { transcript, title, videoId, summarize, openaiKey, geminiKey } = await req.json();

    if (!transcript) {
      return NextResponse.json({ error: 'Transcript is required' }, { status: 400 });
    }

    if (!summarize) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const model = createModel(openaiKey, geminiKey);

    const summaryPrompt = `You are an expert knowledge extractor and summarizer. 
Analyze the following transcript from a YouTube video titled "${title || 'Untitled video'}".
Create a comprehensive summary that includes:
1. Main Topic - one sentence describing the video's core subject
2. Key Takeaways - the most important points (5-7 bullets)
3. Actionable Insights - practical advice or steps mentioned
4. Important Concepts - any definitions, frameworks, or terminology introduced

Transcript:
${transcript}`;

    const result = await generateText({
      model,
      prompt: summaryPrompt,
    });

    return NextResponse.json({
      summary: result.text,
      title,
      videoId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate summary';
    console.error('YouTube Summary Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}