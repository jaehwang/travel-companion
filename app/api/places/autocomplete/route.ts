import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const input = searchParams.get('input');

  if (!input || input.trim().length === 0) {
    return NextResponse.json({ predictions: [] });
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Google Maps API key not configured' },
      { status: 500 }
    );
  }

  try {
    // Places API Autocomplete
    const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
    url.searchParams.set('input', input);
    url.searchParams.set('key', apiKey);
    url.searchParams.set('language', 'ko');

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Places Autocomplete API error:', data);
      return NextResponse.json(
        { error: `Places API error: ${data.status}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ predictions: data.predictions || [] });
  } catch (error) {
    console.error('Failed to fetch autocomplete:', error);
    return NextResponse.json(
      { error: 'Failed to fetch autocomplete' },
      { status: 500 }
    );
  }
}
