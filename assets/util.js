/* 공통 유틸 */
function initials(name) { return (name || "?").trim().slice(0, 1); }

function fmtTime(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
  } catch (e) { return ""; }
}

function myEmpId() { return localStorage.getItem("gn2026_my_empid") || ""; }
function setMyEmpId(id) { localStorage.setItem("gn2026_my_empid", id); }
function myName() { return localStorage.getItem("gn2026_my_name") || ""; }
function setMyName(name) { localStorage.setItem("gn2026_my_name", name); }

function todayStr() {
  const d = new Date();
  const p = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
function nowHHMM() {
  const d = new Date();
  const p = n => String(n).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}`;
}

// 구글시트의 날짜 셀이 자동으로 날짜형(예: "2026-09-01T00:00:00.000Z")으로 바뀌어 오더라도
// 항상 "YYYY-MM-DD" 형태로 통일해서 비교할 수 있게 해주는 함수. Schedule 시트 date 값 비교에 사용.
function normDate(v) {
  if (!v) return "";
  const m = String(v).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : String(v).trim();
}

// 대한민국 표준시(KST) 기준 오늘 날짜/현재 시각.
// 기기(휴대폰/PC)의 시간대 설정이 다르게 되어 있어도 항상 한국 시간 기준으로 계산됩니다.
function nowKST() {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false
  });
  const parts = {};
  fmt.formatToParts(new Date()).forEach(p => { parts[p.type] = p.value; });
  return { date: `${parts.year}-${parts.month}-${parts.day}`, hhmm: `${parts.hour}:${parts.minute}` };
}

function isWithinAttendanceWindow() {
  if (!window.CONFIG.ENFORCE_ATTENDANCE_WINDOW) return { ok: true };
  const today = todayStr();
  const win = window.CONFIG.ATTENDANCE_WINDOWS.find(w => w.date === today);
  if (!win) return { ok: false, reason: `오늘(${today})은 출석 인증 기간이 아닙니다.` };
  const now = nowHHMM();
  if (now < win.start || now > win.end) return { ok: false, reason: `출석 인증 가능 시간은 ${win.start} ~ ${win.end} 입니다.` };
  return { ok: true };
}

function showMockFlagIfNeeded() {
  if (window.API && window.API.mode === "MOCK") {
    const el = document.createElement("div");
    el.className = "mock-flag";
    el.textContent = "MOCK 모드 (테스트용 가짜 데이터)";
    document.body.appendChild(el);
  }
}
document.addEventListener("DOMContentLoaded", showMockFlagIfNeeded);
