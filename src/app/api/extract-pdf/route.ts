import { NextResponse } from 'next/server';
import { spawn } from 'child_process';

async function extractWithPython(buffer: Buffer): Promise<string> {
  return new Promise(async (resolve, reject) => {
    const python = spawn('python3', ['-c', `
import sys
import io
try:
    try:
        from PyPDF2 import PdfReader
    except:
        from pypdf import PdfReader
    data = sys.stdin.buffer.read()
    reader = PdfReader(io.BytesIO(data))
    text = ""
    for page in reader.pages:
        text += page.extract_text() or ""
    print(text, end="")
except Exception as e:
    print(f"ERROR:{e}", file=sys.stderr)
    sys.exit(1)
`], { stdio: ['pipe', 'pipe', 'pipe'] });

    let stdout = '';
    let stderr = '';

    python.stdout.on('data', (data) => { stdout += data.toString(); });
    python.stderr.on('data', (data) => { stderr += data.toString(); });
    python.on('close', (code) => {
      if (code !== 0) reject(new Error(stderr || 'Python failed'));
      else resolve(stdout);
    });
    python.on('error', reject);

    python.stdin.write(buffer);
    python.stdin.end();
  });
}

export async function POST(req: Request) {
  try {
    const arrayBuffer = await req.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const text = await extractWithPython(buffer);
    
    if (!text || text.trim().length < 10) {
      return NextResponse.json({ error: 'No text in PDF' }, { status: 400 });
    }
    
    return NextResponse.json({ text: text.trim() });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}