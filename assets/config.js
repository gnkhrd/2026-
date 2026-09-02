/* ===========================================================
   설정 파일 — 실제 배포 시 이 파일만 고치면 됩니다.
=========================================================== */
window.CONFIG = {
  // Google Apps Script 배포 후 발급되는 웹앱 URL을 여기에 붙여넣으세요.
  // 비워두면 자동으로 MOCK(가짜 데이터) 모드로 동작합니다 — 배포 없이 바로 테스트 가능.
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbyw5As-BgCLtVd3mZ-jw21OvM5h6tIaCIZVS7vJ2hGlghUfTkuIxRMDe2UxZpaHEdHBFg/exec",

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

  // 기타안내 > 식사장소 탭: 조식은 이미지 1장. "중식/석식"은 중식과 석식이 같은 장소라는 전제로 이미지 1장을
  // 공통으로 사용하며, 그 아래에 좌/우 권역 문구만 나뉘어 표시됩니다.
  // 이미지는 VENUE_MAP_IMAGE와 동일한 방식(구글드라이브 링크/파일ID)으로 등록하세요.
  MEALPLACE_BREAKFAST_IMAGE: "https://drive.google.com/file/d/1jIUUuXxCFx_wchm1SLSJLY1gawiNQ4tU/view?usp=sharing",
  MEALPLACE_LUNCH_IMAGE: "https://drive.google.com/file/d/1yDyrsDYuhv_d-FDGo5K5Od0BrWnhlWYG/view?usp=sharing",
  MEALPLACE_LUNCH_LEFT_LABEL: "좌측 · 식당A",
  MEALPLACE_LUNCH_LEFT_REGIONS: "서인, 경원, 충청, 전북, 영남",
  MEALPLACE_LUNCH_RIGHT_LABEL: "우측 · 식당B",
  MEALPLACE_LUNCH_RIGHT_REGIONS: "광주전남, 본부",

  // 기타안내 > 자리배치표 탭(가장 앞 탭)에 보여줄 이미지 1장.
  // VENUE_MAP_IMAGE와 동일한 방식(구글드라이브 링크/파일ID)으로 등록하세요.
  SEATING_CHART_IMAGE: "https://drive.google.com/file/d/1dGDOjO5u32oBavocCdsDnJ0zKxxykIVl/view?usp=sharing",

  // 설문조사(만족도/종합평가)는 자체 제작 대신 기존에 쓰던 구글폼을 그대로 사용합니다.
  // 아래는 2025년 폼 링크입니다 — 2026년 연수 주제/발표자/날짜에 맞게 폼을 복제·수정한 뒤,
  // 그 새 폼의 링크로 반드시 교체하세요. (폼 자체의 "응답 > 요약" 탭에서 항목별 평균/그래프를 바로 볼 수 있습니다.)
  SURVEY_FORM_URL: "https://docs.google.com/forms/d/e/1FAIpQLSdp4R0lYmJ5sDORh9Qtc08Lv3J_XfTKC5tnR8fkJIAoFgtRtg/viewform",

  // 기타안내 > 설문조사 탭 상단에 보여줄 이미지 1장(선택사항 — QR코드, 안내 이미지 등).
  // VENUE_MAP_IMAGE와 동일한 방식(구글드라이브 링크/파일ID)으로 등록하세요. 비워두면 이미지 없이 문구+버튼만 보입니다.
  SURVEY_IMAGE: "https://drive.google.com/file/d/1GS4SQKX7iAeggYuK4CZp5TBqYNEGkdFn/view?usp=sharing",

  // 설문조사는 기타안내(info.html) 탭 안에 노출됩니다 — 이 날짜/시각 이후로 계속 열려있습니다(상시오픈, 종료시각 없음).
  SURVEY_TAB_OPEN_AT: { date: "2026-09-03", time: "12:20" },

  // 공동체 안내(community.html) 페이지 전체가 이 날짜/시각부터 열립니다(그 전엔 "아직 열리지 않았습니다" 안내만 표시,
  // 이후로는 종료시각 없이 계속 열려있습니다). 담당자는 주소 끝에 "?preview=1"을 붙이면 이 제한과 무관하게 미리 볼 수 있습니다.
  COMMUNITY_OPEN_AT: { date: "2026-09-02", time: "13:30" },

  // 공동체 안내(community.html) 안의 "포스터 갤러리 · 특별상 투표" 영역만 이 날짜/시각부터 열립니다
  // (포스터 업로드/등록은 그 전에 담당자가 미리 진행해도, 화면에는 이 시각 전까지 노출되지 않습니다).
  // null로 두면 시각 제한 없이 항상 노출됩니다 — 오픈 시각이 정해지면 COMMUNITY_OPEN_AT과 동일한
  // 형식으로 값을 채워주세요. 예) { date: "2026-09-02", time: "16:00" }
  POSTER_GALLERY_OPEN_AT: null,

  // GN 커넥트 챌린지(qr-card.html의 명함/QR 스캔 화면, leaderboard.html의 랭킹 화면)는
  // 이 날짜/시각부터 마감 안내로 바뀌고, 이후로는 다시 열리지 않습니다(상시 마감).
  // null로 두면 시각 제한 없이 항상 열려있습니다.
  CONNECT_CHALLENGE_CLOSE_AT: { date: "2026-09-02", time: "19:00" },

  // ▼ 사이트 전체 접속 허용 기간 ─────────────────────────────────────────
  // 아래 목록에 있는 기간에만 사이트 전체(모든 화면)가 열립니다. 그 외 시간에는
  // 모든 페이지가 "아직 접속할 수 없습니다" 안내 화면으로 가려집니다.
  // - 비워두면([]) 항상 열려있습니다.
  // - 한 구간의 end를 null로 두면, 그 시작 시각부터는 종료 없이 계속 열려있습니다(상시오픈).
  // - 담당자는 주소 끝에 "?preview=1"을 붙이면 이 제한과 무관하게 언제든 미리 볼 수 있습니다.
  //   예) https://gnkhrd.github.io/2026-/index.html?preview=1
  //
  // 연수모드 — 지금(2026-08-31 21:21)부터 종료시각 없이 상시오픈으로 전환했습니다.
  SITE_ACCESS_WINDOWS: [
    { start: { date: "2026-08-31", time: "21:21" }, end: null }
  ],
  // SITE_ACCESS_WINDOWS: [
  //   { start: { date: "2026-08-06", time: "00:00" }, end: { date: "2026-08-06", time: "23:59" } }, // 특정일 테스트 공개 예시
  //   { start: { date: "2026-09-01", time: "00:00" }, end: null } // 실제 연수 시작일부터 상시오픈
  // ]
};
