# TODO

## 모바일 앱

- [x] 모바일 앱에서 캘린더 연동 구현하기
- [ ] 모바일 앱에서 캘린더 연결하기 (Google OAuth 인증 포함)
- [ ] 모바일 앱 체크인 페이지에 AI tagline 넣기
- [ ] 체크인 화면에서 체크인 삭제 기능 추가
- [ ] 여행 삭제 시 속해있던 체크인을 default trip으로 이동

## 성능 개선

- [x] 모바일 → Supabase 직접 호출로 전환 (Vercel API hop 제거)
- [x] 홈 화면 trips/checkins 병렬 조회 (Promise.all)
- [ ] React Query 캐싱 + 낙관적 업데이트 적용

## 보안

- [x] `next` 업데이트 — HTTP request smuggling, next/image 캐시 무제한 증가 (medium)
- [x] `flatted` 업데이트 — Prototype Pollution via parse() (high)
- [x] `picomatch` 업데이트 — ReDoS, Method Injection (high/medium)
