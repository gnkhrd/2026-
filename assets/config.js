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

  // 홈 화면 "오늘의 일정"에 뽑아서 보여줄 항목을 고르는 키워드입니다.
  // Google Sheet의 Schedule 탭에 tag 컬럼을 추가하고, 그 값이 아래 키워드 중 하나와 정확히 같은 행만 홈 화면에 나열됩니다.
  // 쉼표(,)로 여러 개를 나열할 수 있습니다. 각 세션 행의 tag 칸에는 그 세션에 맞는 키워드 하나만 적어주세요.
  // (예: "개회예배" 세션의 tag 칸엔 "개회예배"만, "기조강연" 세션의 tag 칸엔 "기조강연"만 — 같은 행에 다 적는 게 아닙니다.)
  // 일정표(schedule.html) 페이지는 이 키워드와 무관하게 전체 일정을 날짜별로 그대로 보여줍니다.
  HOME_SCHEDULE_KEYWORD: "개회예배,비전공유,기조강연,주제및사례발표",

  // 기타안내 > 방배정표 탭 하단에 보여줄 연수원 지도 이미지 (플렉스타워/스테이타워 구분 안내용).
  // 구글드라이브에 이미지를 올리고 "링크가 있는 모든 사용자(뷰어)"로 공유한 뒤,
  // 파일ID 또는 전체 링크를 여기 붙여넣으세요. 비워두면 "이미지 준비 중" 안내만 표시됩니다.
  VENUE_MAP_IMAGE: "https://drive.google.com/file/d/1wDO1ilxtzZPZ4XRUMpZTaU1eDdzCpvO9/view?usp=sharing",

  // 기타안내 > 식사장소 탭: 조식은 이미지 1장, 중식/석식은 좌/우로 나눠 이미지 2장 + 해당 권역 문구.
  // 이미지는 VENUE_MAP_IMAGE와 동일한 방식(구글드라이브 링크/파일ID)으로 등록하세요.
  MEALPLACE_BREAKFAST_IMAGE: "https://drive.google.com/file/d/1xdpMJy-EF3SKIcIGao0FTLwLx4oA-Obb/view?usp=sharing",
  MEALPLACE_LUNCH_LEFT_IMAGE: "https://drive.google.com/file/d/1Eqy8Kb9i6Yg8IcWTWw_D40dAZ1tE8WoS/view?usp=sharing",
  MEALPLACE_LUNCH_LEFT_REGIONS: "서인,경원,충청,전북,영남"
  MEALPLACE_LUNCH_RIGHT_IMAGE: "",
  MEALPLACE_LUNCH_RIGHT_REGIONS: "광주전남,본부"
  MEALPLACE_DINNER_LEFT_IMAGE: "",
  MEALPLACE_DINNER_LEFT_REGIONS: "",
  MEALPLACE_DINNER_RIGHT_IMAGE: "",
  MEALPLACE_DINNER_RIGHT_REGIONS: "",

  // 기타안내 > 자리배치표 탭(가장 앞 탭)에 보여줄 이미지 1장.
  // VENUE_MAP_IMAGE와 동일한 방식(구글드라이브 링크/파일ID)으로 등록하세요.
  SEATING_CHART_IMAGE: ""
};
