import { NextResponse } from 'next/server';
import JSZip from 'jszip';
import { parseString } from 'xml2js';

async function parseXml(xmlString: string): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    parseString(xmlString, (err: Error | null, result: Record<string, unknown>) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

function extractTextFromElement(el: unknown): string {
  if (typeof el === 'string') return el;
  if (!el || typeof el !== 'object') return '';
  
  const obj = el as Record<string, unknown>;
  
  if (Array.isArray(obj.t)) {
    return obj.t.map((t) => extractTextFromElement(t)).join('');
  }
  
  if (Array.isArray(obj.r)) {
    return obj.r.map((r) => extractTextFromElement(r)).join('');
  }
  
  if (Array.isArray(obj.c)) {
    return obj.c.map((c) => extractTextFromElement(c)).join('');
  }
  
  if (obj.$ && typeof obj.$ === 'object' && 't' in (obj.$ as Record<string, unknown>)) {
    return String((obj.$ as Record<string, unknown>).t);
  }
  
  if (obj._) {
    return String(obj._);
  }
  
  return '';
}

function getTitleFromSlide(slideObj: unknown): string {
  const slide = slideObj as Record<string, unknown>;
  if (!slide['p:sp']) return '';
  
  const shapes = slide['p:sp'] as Array<unknown>;
  for (const sp of shapes) {
    const shape = sp as Record<string, unknown>;
    const nvSpPr = shape['p:nvSpPr'];
    if (nvSpPr) {
      const cNvPr = (nvSpPr as Record<string, unknown>)['p:cNvPr'];
      if (cNvPr && typeof cNvPr === 'object') {
        const props = cNvPr as Record<string, unknown>;
        const isTitle = props['$.id'] === '1';
        if (isTitle && shape['p:txBody']) {
          const txBody = (shape['p:txBody'] as Record<string, unknown>)['a:p'];
          if (txBody && Array.isArray(txBody)) {
            return extractTextFromElement(txBody[0]);
          }
        }
      }
    }
  }
  return '';
}

function extractTextFromSlide(slideObj: unknown): string {
  const slide = slideObj as Record<string, unknown>;
  if (!slide['p:sp']) return '';
  
  const shapes = slide['p:sp'] as Array<unknown>;
  const textParts: string[] = [];
  
  for (const sp of shapes) {
    const shape = sp as Record<string, unknown>;
    if (shape['p:txBody']) {
      const txBody = (shape['p:txBody'] as Record<string, unknown>)['a:p'];
      if (txBody && Array.isArray(txBody)) {
        for (const p of txBody) {
          const text = extractTextFromElement(p);
          if (text.trim()) {
            textParts.push(text.trim());
          }
        }
      }
    }
  }
  
  return textParts.join('\n');
}

export async function POST(req: Request) {
  try {
    const arrayBuffer = await req.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);
    
    const zip = new JSZip();
    const zipResult = await zip.loadAsync(data);
    
    const slideFiles = Object.keys(zipResult.files)
      .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
      .sort((a, b) => {
        const numA = parseInt(a.match(/slide(\d+)\.xml$/)?.[1] || '0');
        const numB = parseInt(b.match(/slide(\d+)\.xml$/)?.[1] || '0');
        return numA - numB;
      });
    
    if (slideFiles.length === 0) {
      return NextResponse.json({ error: 'No slides found in PowerPoint file' }, { status: 400 });
    }
    
    let extractedText = '';
    
    for (const fileName of slideFiles) {
      const file = zipResult.files[fileName];
      if (!file || file.dir) continue;
      
      const xmlContent = await file.async('string');
      const slideObj = await parseXml(xmlContent);
      
      const title = getTitleFromSlide(slideObj);
      const content = extractTextFromSlide(slideObj);
      
      const slideNum = fileName.match(/slide(\d+)\.xml$/)?.[1] || '?';
      
      if (title || content) {
        extractedText += `Slide ${slideNum}:\n`;
        if (title) {
          extractedText += `Title: ${title}\n`;
        }
        if (content) {
          extractedText += content + '\n';
        }
        extractedText += '\n';
      }
    }
    
    if (!extractedText.trim()) {
      return NextResponse.json({ error: 'No text content found in PowerPoint file' }, { status: 400 });
    }
    
    return NextResponse.json({
      text: extractedText.trim(),
      slideCount: slideFiles.length
    });
  } catch (error: unknown) {
    console.error('PowerPoint Extraction Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to extract text from PowerPoint';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}