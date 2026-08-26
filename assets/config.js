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

  // 설문조사는 기타안내(info.html) 탭 안에 노출됩니다 — 이 날짜/시각 이후로 계속 열려있습니다(상시오픈, 종료시각 없음).
  SURVEY_TAB_OPEN_AT: { date: "2026-09-03", time: "12:30" },

  // ▼ 사이트 전체 접속 허용 기간 ─────────────────────────────────────────
  // 아래 목록에 있는 기간에만 사이트 전체(모든 화면)가 열립니다. 그 외 시간에는
  // 모든 페이지가 "아직 접속할 수 없습니다" 안내 화면으로 가려집니다.
  // - 비워두면([]) 항상 열려있습니다.
  // - 한 구간의 end를 null로 두면, 그 시작 시각부터는 종료 없이 계속 열려있습니다(상시오픈).
  // - 담당자는 주소 끝에 "?preview=1"을 붙이면 이 제한과 무관하게 언제든 미리 볼 수 있습니다.
  //   예) https://gnkhrd.github.io/2026-/index.html?preview=1
  //
  // ※ 지금은 테스트 편의를 위해 배열을 비워 "항상 열림" 상태로 해두었습니다([] = 상시 접속 가능).
  //    다시 차단을 걸고 싶으면, 아래 주석을 해제하고 원하는 기간으로 값을 채우면 즉시 그 기간에만
  //    열리도록 동작합니다. (예시로 남겨둔 값: 특정 하루만 테스트 공개 + 실제 연수 시작일부터 상시오픈)
  SITE_ACCESS_WINDOWS: [],
  // SITE_ACCESS_WINDOWS: [
  //   { start: { date: "2026-08-06", time: "00:00" }, end: { date: "2026-08-06", time: "23:59" } }, // 특정일 테스트 공개 예시
  //   { start: { date: "2026-09-01", time: "00:00" }, end: null } // 실제 연수 시작일부터 상시오픈
  // ]
};
