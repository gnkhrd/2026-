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
