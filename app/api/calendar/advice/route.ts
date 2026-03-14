import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@/lib/supabase/server';
import { humanizeDuration } from '@/lib/humanizeDuration';

interface EventInput {
  summary: string;
  location?: string;
  minutesUntil: number;
  isAllDay?: boolean;
}

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

function formatDistance(km: number): string {
  return km < 1
    ? `${Math.round(km * 1000)}m`
    : `${km.toFixed(1)}km`;
}

function formatTime(minutesUntil: number, isAllDay: boolean): string {
  if (isAllDay) {
    const days = Math.ceil(minutesUntil / 60 / 24);
    return days <= 1 ? '내일' : `${days}일 후`;
  }
  if (minutesUntil <= 0) return '진행 중';
  return humanizeDuration(minutesUntil);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'Gemini not configured' }, { status: 503 });

  const { events, userLat, userLng } = await request.json() as {
    events: EventInput[];
    userLat?: number;
    userLng?: number;
  };

  if (!events || events.length === 0) {
    return NextResponse.json({ error: 'No events' }, { status: 400 });
  }

  // 각 이벤트에 대해 geocode + 거리 계산
  const lines = await Promise.all(
    events.map(async (e) => {
      const timePart = formatTime(e.minutesUntil, e.isAllDay ?? false);

      let distPart = '-';
      if (e.location && userLat != null && userLng != null) {
        const coords = await geocode(e.location);
        if (coords) {
          distPart = formatDistance(haversineKm(userLat, userLng, coords.lat, coords.lng));
        }
      }

      return `- ${timePart} / ${distPart} / ${e.summary}`;
    })
  );

  const prompt = [
    '너는 여행 중인 사용자를 돕는 친근한 AI 어시스턴트다.',
    '아래 일정 목록을 보고 사용자에게 짧고 실용적인 한 줄 조언을 한국어로 줘라.',
    '',
    '조건:',
    '- 한 줄, 40자 이내',
    '- 가장 급하거나 중요한 일정 위주로',
    '- 시간·거리 정보를 자연스럽게 녹여라',
    '- 말하듯 써라',
    '- 이모지 1개만 허용 (맨 앞)',
    '- 따옴표, 줄바꿈 금지',
    '',
    '일정 목록 (남은 시간 / 거리 / 제목):',
    ...lines,
  ].join('\n');

  const model = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash-lite';
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model,
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
