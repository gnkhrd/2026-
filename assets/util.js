/* 공통 유틸 */
function initials(name) { return (name || "?").trim().slice(0, 1); }

function fmtTime(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
  } catch (e) { return ""; }
}

// 날짜+시간을 함께 표시 (예: "09/01 14:32") — GN 커넥트 챌린지 "내가 찍은 사람들" 목록 등에 사용
function fmtDateTime(iso) {
  try {
    const d = new Date(iso);
    const p = n => String(n).padStart(2, "0");
    const md = `${p(d.getMonth() + 1)}/${p(d.getDate())}`;
    const hm = d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
    return `${md} ${hm}`;
  } catch (e) { return ""; }
}

// 일정표의 "시간" 칸을 안전하게 표시용으로 가공합니다.
// Schedule 시트에 "12:10-13:00"처럼 "-"로 적든 "18:00~18:10"처럼 "~"로 적든
// 항상 시작 / ~ / 끝 세 줄로 통일해서, 좁은 칸에서 제목과 글자가 겹치는 걸 방지합니다.
function fmtTimeRange(raw) {
  if (!raw) return "";
  const parts = String(raw).split(/[-~]/).map(s => s.trim()).filter(Boolean);
  if (parts.length >= 2) return `${parts[0]}~${parts[1]}`;
  return String(raw).trim();
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

/* ---------- 사이트 전체 접속 허용 기간 게이트 ----------
   config.js의 SITE_ACCESS_WINDOWS에 지정된 기간이 아니면, 페이지 내용을 그리기 전에
   전체 화면을 "아직 접속할 수 없습니다" 안내로 가립니다. (모든 html이 이 util.js를
   자기 화면 스크립트보다 먼저 불러오므로, 이 파일 로드 시점에 즉시 가려집니다.)
   담당자는 주소 끝에 "?preview=1"을 붙이면 언제든 이 제한 없이 볼 수 있습니다. */
function isSiteAccessOpen() {
  const windows = window.CONFIG && window.CONFIG.SITE_ACCESS_WINDOWS;
  if (!windows || !windows.length) return true;
  const kst = nowKST();
  const nowKey = kst.date + " " + kst.hhmm;
  return windows.some(w => {
    const startKey = w.start.date + " " + w.start.time;
    if (nowKey < startKey) return false;
    if (!w.end) return true;
    const endKey = w.end.date + " " + w.end.time;
    return nowKey <= endKey;
  });
}

(function enforceSiteAccessGate() {
  try {
    const bypass = new URLSearchParams(location.search).get("preview") === "1";
    if (bypass || isSiteAccessOpen()) return;
    const app = document.querySelector(".app");
    if (app) app.style.display = "none";
    const lock = document.createElement("div");
    lock.className = "site-locked";
    lock.innerHTML = `
      <div class="site-locked-box">
        <div class="site-locked-icon">🔒</div>
        <div class="site-locked-title">아직 접속할 수 없습니다</div>
        <div class="site-locked-desc">이 페이지는 2026년 정책연수 기간에 맞춰 열립니다.<br>연수 시작 전까지는 잠시 이용하실 수 없어요.</div>
      </div>
    `;
    document.body.appendChild(lock);
  } catch (e) { /* 게이트 계산 자체가 실패해도 사이트가 막히지 않도록 조용히 무시 */ }
})();
