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
  ENFORCE_ATTENDANCE_WINDOW: false
};
