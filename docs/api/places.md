# Places API

Google Places API의 서버사이드 프록시. API 키를 클라이언트에 노출하지 않기 위해 사용합니다.

**인증**: 불필요 (서버에서 API 키 사용)

---

## GET /api/places/autocomplete
장소 이름 자동완성 검색.

**Query Parameters**
| 파라미터 | 필수 | 설명 |
|---------|------|------|
| `input` | 필수 | 검색어 |
| `lat` | 선택 | 현재 위치 위도 (주변 결과 우선) |
| `lng` | 선택 | 현재 위치 경도 (주변 결과 우선) |

**예시**
```
GET /api/places/autocomplete?input=성산일출봉&lat=33.45&lng=126.90
```

**응답 200**
```json
{
  "predictions": [
    {
      "place_id": "ChIJ...",
      "description": "성산일출봉, 성산읍, 서귀포시, 제주도 대한민국",
      "structured_formatting": {
        "main_text": "성산일출봉",
        "secondary_text": "성산읍, 서귀포시, 제주도 대한민국"
      }
    }
  ]
}
```

빈 검색어이면 `{ "predictions": [] }` 반환.

---

## GET /api/places/details
Google Place ID로 장소 상세 정보 조회.

**Query Parameters**
| 파라미터 | 필수 | 설명 |
|---------|------|------|
| `place_id` | 필수 | Google Place ID |

**예시**
```
GET /api/places/details?place_id=ChIJ...
```

**응답 200**
```json
{
  "place": {
    "name": "성산일출봉",
    "address": "대한민국 제주특별자치도 서귀포시 성산읍 일출로 284-12",
    "latitude": 33.4585,
    "longitude": 126.9422,
    "rating": 4.6,
    "types": ["natural_feature", "tourist_attraction", "point_of_interest"]
  }
}
```

---

## GET /api/places/nearby
현재 위치 주변 장소 검색 (반경 100m).

**Query Parameters**
| 파라미터 | 필수 | 설명 |
|---------|------|------|
| `latitude` | 필수 | 위도 |
| `longitude` | 필수 | 경도 |
| `type` | 선택 | 장소 타입 (기본: `restaurant\|cafe\|tourist_attraction\|store`) |

**예시**
```
GET /api/places/nearby?latitude=33.4585&longitude=126.9422
```

**응답 200**
```json
{
  "places": [
    {
      "id": "ChIJ...",
      "name": "성산일출봉",
      "address": "성산읍, 서귀포시",
      "types": ["natural_feature", "tourist_attraction"],
      "rating": 4.6
    }
  ]
}
```

최대 5개 반환.
