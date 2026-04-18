# TODO

## 모바일 앱

- [x] 지도 기반 체크인 브라우징 — 구현 문서: `docs/map-browse.md`
- [ ] 로컬 저장 기능 (오프라인 우선) — 상세 계획: `todo/offline-local-save.md`
- [x] 모바일 앱에서 캘린더 연동 구현하기
- [x] Supabase direct connection
- [X] 하단 탭 메뉴 정리
- [x] 여행 삭제 시 속해있던 체크인을 default trip으로 이동
- [x] 체크인 화면에서 체크인 삭제 기능 추가
- [x] 체크인 삭제할 때 사진도 같이 지우기
- [ ] 여러 체크인을 동시에 여행으로 이동하기. 체크인을 꾹 누르면 다른 체크인도 선택할 수 있게 하자. 이동할 여행은 최근 것에서 선택하거나 검색할 수 있게 하자.
- [x] 모바일 앱에서 캘린더 연결하기 (Google OAuth 인증 포함)
- [ ] 모바일 앱 체크인 페이지에 AI tagline 넣기
- [x] 하단 메뉴에 검색 탭 추가 (여행·체크인 혼합 검색, 체크인 선택 시 해당 위치로 스크롤)

## 성능 개선

- [x] 모바일 → Supabase 직접 호출로 전환 (Vercel API hop 제거)
- [x] 홈 화면 trips/checkins 병렬 조회 (Promise.all)
- [ ] React Query 캐싱 + 낙관적 업데이트 적용

## 보안

- [x] `next` 업데이트 — HTTP request smuggling, next/image 캐시 무제한 증가 (medium)
- [x] `flatted` 업데이트 — Prototype Pollution via parse() (high)
- [x] `picomatch` 업데이트 — ReDoS, Method Injection (high/medium)
