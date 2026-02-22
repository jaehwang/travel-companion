import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const latitude = searchParams.get('latitude');
  const longitude = searchParams.get('longitude');
  const type = searchParams.get('type') || 'restaurant|cafe|tourist_attraction|store';

  if (!latitude || !longitude) {
    return NextResponse.json(
      { error: 'latitude and longitude are required' },
      { status: 400 }
    );
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Google Maps API key not configured' },
      { status: 500 }
    );
  }

  try {
    // Places API Nearby Search
    const url = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json');
    url.searchParams.set('location', `${latitude},${longitude}`);
    url.searchParams.set('radius', '100'); // 100미터 반경
    url.searchParams.set('type', type);
    url.searchParams.set('key', apiKey);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Places API error:', data);
      return NextResponse.json(
        { error: `Places API error: ${data.status}` },
        { status: 500 }
      );
    }

    // 결과를 간단한 형태로 변환
    const places = (data.results || []).slice(0, 5).map((place: any) => ({
      id: place.place_id,
      name: place.name,
      address: place.vicinity,
      types: place.types,
      rating: place.rating,
    }));

    return NextResponse.json({ places });
  } catch (error) {
    console.error('Failed to fetch nearby places:', error);
    return NextResponse.json(
      { error: 'Failed to fetch nearby places' },
      { status: 500 }
    );
  }
}
