import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { getAuthenticatedClient } from '@/lib/supabase/server';

const VALID_CATEGORIES = [
  'restaurant', 'cafe', 'attraction', 'accommodation', 'shopping',
  'nature', 'activity', 'transportation', 'performance', 'movie', 'exhibition', 'other',
] as const;

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

function buildPrompt(title: string, message: string, tags: string[]): string {
  const parts = [
    title && `제목: ${title}`,
    message && `메모: ${message}`,
    tags.length && `태그: ${tags.join(', ')}`,
  ].filter(Boolean).join('\n');

  return `다음 여행 체크인의 카테고리를 아래 목록 중 하나로만 답해줘.
카테고리 목록: restaurant, cafe, attraction, accommodation, shopping, nature, activity, transportation, performance, movie, exhibition, other

${parts}

카테고리 하나만 영문 소문자로 답해. 다른 말은 하지 마.`;
}

function parseCategory(text: string): string {
  const normalized = text.trim().toLowerCase();
  return VALID_CATEGORIES.find(c => normalized.includes(c)) ?? 'other';
}

export async function POST(request: Request) {
  try {
    const { user } = await getAuthenticatedClient(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title = '', message = '', tags = [] } = body as {
      title?: string;
      message?: string;
      tags?: string[];
    };

    if (!title.trim() && !message.trim() && tags.length === 0) {
      return NextResponse.json({ error: 'No content provided' }, { status: 400 });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return NextResponse.json({ error: 'Gemini API is not configured' }, { status: 503 });
    }

    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL ?? 'gemini-2.5-flash-lite',
      contents: buildPrompt(title.trim(), message.trim(), tags),
    });

    const category = parseCategory(response.text ?? '');
    return NextResponse.json({ category });
  } catch {
    return NextResponse.json({ error: 'Failed to suggest category' }, { status: 500 });
  }
}
