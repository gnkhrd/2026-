/* ===========================================================
   설정 파일 — 실제 배포 시 이 파일만 고치면 됩니다.
=========================================================== */
window.CONFIG = {
  // Google Apps Script 배포 후 발급되는 웹앱 URL을 여기에 붙여넣으세요.
  // 비워두면 자동으로 MOCK(가짜 데이터) 모드로 동작합니다 — 배포 없이 바로 테스트 가능.
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbyV2347WNzUuNCKEgxhzWqQZpZTAWjGW8X1ozluxeESYkFF4VOT75_IFaZsrLZQyovLrg/exec",

  EVENT_NAME: "2026년 정책연수",
  EVENT_DATES: ["2026-09-01", "2026-09-02", "2026-09-03"],
  EVENT_PLACE: "스플라스 리솜 (충남 예산)",

  // 출석체크를 허용할 시간대 (담당자가 현장에서 값만 바꾸면 됨)
  ATTENDANCE_WINDOWS: [
    { date: "2026-09-01", start: "08:00", end: "13:30" },
    { date: "2026-09-02", start: "07:00", end: "10:00" },
    { date: "2026-09-03", start: "06:30", end: "10:00" }
  ],

  // 시간대 제한을 끄고 싶으면 false로 (테스트 중엔 false 권장)
  ENFORCE_ATTENDANCE_WINDOW: false,

  // 홈 화면 "오늘의 주요일정" 4칸은 이제 이 값과 무관하게, Google Sheet의 Schedule 탭에서
  // "오늘 날짜" + "tag 칸이 채워진 행"만 자동으로 뽑혀서 최대 4개까지 표시됩니다.
  // 일자별로 다른 tag 문구를 적으면 그날에 맞는 4개가 자동으로 바뀝니다. (자세한 방법은 배포 가이드 참고)
  // 일정표(schedule.html) 페이지는 tag와 무관하게 전체 일정을 날짜별로 그대로 보여줍니다.

  // 기타안내 > 방배정표 탭 하단에 보여줄 연수원 지도 이미지 (플렉스타워/스테이타워 구분 안내용).
  // 구글드라이브에 이미지를 올리고 "링크가 있는 모든 사용자(뷰어)"로 공유한 뒤,
  // 파일ID 또는 전체 링크를 여기 붙여넣으세요. 비워두면 "이미지 준비 중" 안내만 표시됩니다.
  VENUE_MAP_IMAGE: "https://drive.google.com/file/d/1wDO1ilxtzZPZ4XRUMpZTaU1eDdzCpvO9/view?usp=sharing",

  // 기타안내 > 식사장소 탭: 조식은 이미지 1장. 중식도 이미지 1장이며, 그 아래에 좌/우 권역 문구만 나뉘어 표시됩니다.
  // 이미지는 VENUE_MAP_IMAGE와 동일한 방식(구글드라이브 링크/파일ID)으로 등록하세요.
  MEALPLACE_BREAKFAST_IMAGE: "https://drive.google.com/file/d/1xdpMJy-EF3SKIcIGao0FTLwLx4oA-Obb/view?usp=sharing",
  MEALPLACE_LUNCH_IMAGE: "https://drive.google.com/file/d/1Eqy8Kb9i6Yg8IcWTWw_D40dAZ1tE8WoS/view?usp=sharing",
  MEALPLACE_LUNCH_LEFT_REGIONS: "서인,경원,충청,전북,영남",
  MEALPLACE_LUNCH_RIGHT_REGIONS: "광주전남,본부",

  // 기타안내 > 자리배치표 탭(가장 앞 탭)에 보여줄 이미지 1장.
  // VENUE_MAP_IMAGE와 동일한 방식(구글드라이브 링크/파일ID)으로 등록하세요.
  SEATING_CHART_IMAGE: ""
};
