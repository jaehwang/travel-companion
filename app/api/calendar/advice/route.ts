import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@/lib/supabase/server';
import { humanizeDuration } from '@/lib/humanizeDuration';

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function geocode(address: string): Promise<{ lat: number; lng: number } | null> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
    );
    const data = await res.json();
    const loc = data.results?.[0]?.geometry?.location;
    if (!loc) return null;
    return { lat: loc.lat, lng: loc.lng };
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'Gemini not configured' }, { status: 503 });

  const { summary, location, minutesUntil, userLat, userLng } = await request.json() as {
    summary: string;
    location?: string;
    minutesUntil: number;
    userLat?: number;
    userLng?: number;
  };

  // 거리 계산
  let distanceKm: number | null = null;
  if (location && userLat != null && userLng != null) {
    const coords = await geocode(location);
    if (coords) {
      distanceKm = haversineKm(userLat, userLng, coords.lat, coords.lng);
    }
  }

  // Gemini 프롬프트
  const timePart = minutesUntil <= 0
    ? '현재 진행 중인 일정'
    : `${humanizeDuration(minutesUntil)} 시작`;
  const distPart = distanceKm != null
    ? `직선거리 약 ${distanceKm < 1 ? `${Math.round(distanceKm * 1000)}m` : `${distanceKm.toFixed(1)}km`}`
    : location
      ? `장소: ${location}`
      : null;

  const contextLines = [`일정: ${summary}`, `시간: ${timePart}`];
  if (distPart) contextLines.push(distPart);

  const prompt = [
    '너는 여행 중인 사용자를 돕는 친근한 AI 어시스턴트다.',
    '다음 캘린더 일정 정보를 보고, 사용자에게 짧고 실용적인 한 줄 조언을 한국어로 줘라.',
    '조건:',
    '- 한 줄, 40자 이내',
    '- 시간·거리 정보를 자연스럽게 녹여라',
    '- 딱딱하지 않게, 말하듯 써라',
    '- 이모지 1개만 허용 (맨 앞)',
    '- 따옴표, 줄바꿈 금지',
    '',
    ...contextLines,
  ].join('\n');

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-lite',
    contents: prompt,
  });

  const advice = (response.text ?? '')
    .trim()
    .split(/\r?\n/, 1)[0]
    .replace(/^["'""'']+|["'""'']+$/g, '')
    .trim()
    .slice(0, 60);

  return NextResponse.json({ advice });
}
