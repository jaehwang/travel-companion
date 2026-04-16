import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { getAuthenticatedClient } from '@/lib/supabase/server';

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

function buildPrompt(title: string, place: string, category: string, message: string): string {
  const parts = [
    title && `장소명: ${title}`,
    place && `장소 정보: ${place}`,
    category && `카테고리: ${category}`,
    message && `메모: ${message}`,
  ].filter(Boolean).join('\n');

  return `다음 체크인 정보를 보고 어울리는 해시태그를 3~5개 추천해줘.
한국어 단어로만, # 없이, 쉼표로 구분해서 한 줄로만 답해줘.
예: 맛집,뷰맛집,혼밥,재방문

${parts}`;
}

function parseTags(text: string): string[] {
  return text
    .split(/[,，\s]+/)
    .map(t => t.trim().replace(/^#+/, ''))
    .filter(t => t.length > 0 && t.length <= 12)
    .slice(0, 5);
}

export async function POST(request: Request) {
  try {
    const { user } = await getAuthenticatedClient(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return NextResponse.json({ error: 'Gemini API is not configured' }, { status: 503 });
    }

    const body = await request.json();
    const { title = '', place = '', category = '', message = '' } = body;

    if (!title && !place && !message) {
      return NextResponse.json({ tags: [] });
    }

    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL ?? 'gemini-2.5-flash-lite',
      contents: buildPrompt(title, place, category, message),
    });

    const tags = parseTags(response.text ?? '');
    return NextResponse.json({ tags });
  } catch {
    return NextResponse.json({ error: 'Failed to suggest tags' }, { status: 500 });
  }
}
