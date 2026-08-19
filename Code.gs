/* ===========================================================
   2026년 정책연수 웹페이지 - Google Apps Script 백엔드
   ------------------------------------------------------------
   이 스크립트는 "Google Sheets 컨테이너 바인딩 스크립트"로 사용합니다.
   1) 아래 SHEET_NAMES 에 있는 이름 그대로 시트 탭을 만드세요.
   2) 각 시트의 1행(헤더)에 지정된 컬럼명을 정확히 적어주세요. (순서는 상관없음)
   3) 상단 메뉴 확장 프로그램 > Apps Script 에서 이 코드를 붙여넣고 배포하세요.
      배포 > 새 배포 > 유형: 웹 앱
        - 실행 계정: 나
        - 액세스 권한이 있는 사용자: 전체
      배포 후 나오는 웹 앱 URL을 프론트엔드 assets/config.js 의 APPS_SCRIPT_URL 에 붙여넣습니다.
=========================================================== */

const SHEET_NAMES = {
  ROSTER: "Roster",         // 컬럼: empId, name, org, role (role=직급, 출석체크 화면의 직급별 통계에 사용)
  ATTENDANCE: "Attendance", // 컬럼: empId, name, org, role, time
  PROFILES: "Profiles",     // 컬럼: empId, name, org, role, keywords, intro, photo
                            // (전부 웹페이지(qr-card.html)에서 직원이 직접 입력/업로드하면 자동으로 채워짐 — 구글폼·구글계정 불필요.
                            //  최초에는 완전히 비어있어도 되고, 예시행만 삭제하면 됨)
  SCANLOG: "ScanLog",       // 컬럼: scannerId, scannedId, time
  SCHEDULE: "Schedule",     // 컬럼: date, time, title, speaker, tag, link1Label, link1Url, link2Label, link2Url
                            // (tag는 선택 입력 — 홈 화면 "오늘의 주요일정" 4칸에 노출할 행에만 원하는 문구를 적으면 됨.
                            //  같은 날짜(date) 안에서 tag가 채워진 행만, 시간순으로 최대 4개까지 홈 화면에 나열됨.
                            //  일자별로 다른 문구를 적으면 그날엔 그 4개가 자동으로 노출됨 (아이콘은 문구 보고 자동 매칭).
                            //  일정표(schedule.html) 페이지에는 tag와 상관없이 전체 일정이 날짜별로 그대로 나옴)
                            //  link1Url/link2Url은 선택 입력 — 이 행이 "지금 진행 중"인 시간대에만 홈 화면 상단에 실시간
                            //  참여 버튼으로 노출됩니다 (예: 주제발표 행엔 슬라이도 링크만, 토크쇼 행엔 슬라이도+퀴즈쇼 둘 다
                            //  채우면 동시에 노출됨). link1Label/link2Label을 비워두면 버튼 문구는 "실시간 참여"로 표시됨.
  MATERIALS: "Materials",   // 컬럼: title, speaker, file  (file = 구글드라이브 파일ID 또는 전체 URL / PDF 또는 구글슬라이드 형식만 지원)
  MATERIAL_VIEWS: "MaterialViews", // 컬럼: empId, name, org, materialTitle, viewedAt
                            // (발표자료를 열람할 때마다 한 줄씩 쌓입니다 — 유출 등 문제 발생 시 열람자 추적용.
                            //  중복 체크 없이 매번 새 행을 추가합니다.)
  BANNERS: "Banners",       // 컬럼: emoji, title, url
  ROOMS: "RoomAssignment",  // 컬럼: empId, name, org, room (room = 건물/방번호, 예: "B동 305호")
                            // (기타안내 화면의 "내 방 찾기" 검색과 전체 방배정표 목록에 사용됩니다.
                            //  대표직책/본부 등 일부 인원만 개별 방이 배정되는 경우, 나머지 인원은 이 시트에
                            //  없어도 되며 화면에는 "별도로 배정된 방이 없습니다" 안내가 자동으로 뜹니다.)
  MEALGROUPS: "MealGroups", // 컬럼: date, meal, target, menu, count, members
                            // (기타안내 화면의 "식사조" 섹션 — 일자·끼니별로 묶어서 아코디언 형태로 보여줍니다.
                            //  meal은 "아침/점심/저녁"처럼 자유 텍스트, members는 쉼표로 구분된 이름 목록입니다.)
  SURVEY_RESPONSES: "SurveyResponses", // 컬럼: empId, name, org, role, item1, item2, item3, item4, item5, comment, submittedAt
                            // (연수 종료 후 만족도·종합평가 설문 응답. 문항 내용 자체는 survey.html에 고정 텍스트로 있고,
                            //  이 시트에는 응답 값만 쌓입니다. 결과는 survey-admin.html에서 관리자 PIN 입력 후에만 볼 수 있습니다.)
  LEADERBOARD_VIEW: "LeaderboardView", // 이 시트는 직접 만들 필요 없이 자동으로 생성/갱신됩니다 — 사람이 손으로 수정하지 마세요.
                            // (updateLeaderboardSheet_ 가 몇 분 간격으로 개인/소속 랭킹을 자동으로 써주는 "보여주기용" 시트입니다.
                            //  이 시트를 "뷰어" 권한으로 공유해두면, 공유받은 사람이 실시간으로 랭킹을 볼 수 있습니다.)
  EVENT_WINNERS: "EventWinners", // 이 시트도 직접 만들 필요 없이 자동으로 생성됩니다.
                            // (NETWORK_EVENT_TARGETS에 지정한 순번의 당첨자가 나올 때마다 한 줄씩 자동 기록됩니다:
                            //  rank, empId, name, org, time)
  COMMUNITY_POSTERS: "CommunityPosters", // 컬럼: id, org, title, imageUrl
                            // (공동체 활동 포스터 갤러리용 — 담당자가 직접 입력합니다. id는 1,2,3... 처럼 행마다 겹치지 않는 값이면
                            //  충분합니다 (좋아요 기록과 매칭하는 용도). imageUrl은 구글드라이브 공유링크를 그대로 붙여넣어도
                            //  서버에서 자동으로 화면에 보이는 형식으로 변환합니다.)
  POSTER_LIKES: "PosterLikes" // 이 시트는 직접 만들 필요 없이 자동으로 생성됩니다.
                            // (컬럼: id, empId, time — 누가 어떤 포스터에 좋아요를 눌렀는지 기록. 한 사람당 같은 포스터에는
                            //  한 번만 기록되며, 취소(재클릭)는 지원하지 않습니다.)
};

// "N번째로 네트워크 활동을 시작한 사람"을 이벤트 당첨자로 선정할 순번들입니다.
// 지금은 테스트 목적으로 10번째만 지정해두었습니다. 실제 운영 시 이 배열만 바꾸면 됩니다.
// (예: [50] → 50번째 1명만 당첨 / [50, 100] → 50번째·100번째 각각 당첨)
const NETWORK_EVENT_TARGETS = [10];

function ss_() { return SpreadsheetApp.getActiveSpreadsheet(); }

function getSheet_(name) {
  const sh = ss_().getSheetByName(name);
  if (!sh) throw new Error(`시트를 찾을 수 없습니다: ${name}`);
  return sh;
}

// 시트를 [{header: value, ...}, ...] 형태의 객체 배열로 변환
function sheetToObjects_(sheetName) {
  const sh = getSheet_(sheetName);
  const values = sh.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0].map(h => String(h).trim());
  const rows = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    if (row.every(c => c === "" || c === null)) continue; // 빈 행 skip
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = row[idx]; });
    rows.push(obj);
  }
  return rows;
}

function appendRow_(sheetName, obj, headerOrder) {
  const sh = getSheet_(sheetName);
  const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(h => String(h).trim());
  const row = headers.map(h => (obj[h] !== undefined ? obj[h] : ""));
  sh.appendRow(row);
}

// EventWinners처럼 "미리 직접 만들어두지 않아도 되는" 시트를 위한 헬퍼입니다.
// 시트가 없으면 헤더 행까지 자동으로 만들어준 뒤 반환합니다.
function ensureSheetWithHeaders_(sheetName, headers) {
  const ss = ss_();
  let sh = ss.getSheetByName(sheetName);
  if (!sh) {
    sh = ss.insertSheet(sheetName);
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  return sh;
}

function splitKeywords_(raw) {
  if (!raw) return [];
  return String(raw).split(/[,，\s]+/).map(s => s.trim()).filter(Boolean);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// ---------- 액션 핸들러 ----------

function actionCheckIn_(p) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const roster = sheetToObjects_(SHEET_NAMES.ROSTER);
    const match = roster.find(r => String(r.empId) === String(p.empId) && String(r.name).trim() === String(p.name).trim());
    if (!match) return { ok: false, message: "명단에서 사번/성명을 찾을 수 없습니다. 다시 확인해주세요." };

    const attendance = sheetToObjects_(SHEET_NAMES.ATTENDANCE);
    if (attendance.find(a => String(a.empId) === String(p.empId))) {
      return { ok: false, message: "이미 출석 처리되었습니다." };
    }
    appendRow_(SHEET_NAMES.ATTENDANCE, {
      empId: p.empId, name: p.name, org: p.org || match.org, role: match.role || "", time: new Date().toISOString()
    });
    // 캐시된 출석 명단이 있다면 즉시 무효화 — 방금 출석체크한 사람이 곧바로 발표자료 등
    // 출석 게이트를 통과해야 하는데, 캐시가 남아있으면 최대 캐시 시간만큼 "미출석"으로 잘못 보일 수 있음.
    CacheService.getScriptCache().remove("attendanceList");
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

function actionGetAttendanceList_() {
  const rows = sheetToObjects_(SHEET_NAMES.ATTENDANCE);
  rows.sort((a, b) => new Date(b.time) - new Date(a.time));
  return { ok: true, list: rows };
}

// 몰리는 순간 매 요청마다 시트를 다시 읽지 않도록, 출석 명단을 10초간 캐시합니다.
// (출석체크 시 위에서 즉시 캐시를 지우므로, 방금 출석한 사람이 바로 게이트를 통과하는 데는 문제 없음)
function getAttendanceCached_() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get("attendanceList");
  if (cached) return JSON.parse(cached);
  const rows = sheetToObjects_(SHEET_NAMES.ATTENDANCE);
  cache.put("attendanceList", JSON.stringify(rows), 10);
  return rows;
}

// 자료 목록은 연수 중 거의 바뀌지 않으므로 60초간 캐시합니다.
function getMaterialsCached_() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get("materialsList");
  if (cached) return JSON.parse(cached);
  const list = sheetToObjects_(SHEET_NAMES.MATERIALS);
  cache.put("materialsList", JSON.stringify(list), 60);
  return list;
}

// 발표자료 페이지 전용 — "출석했는지 확인" + "자료 목록 조회"를 한 번의 요청으로 함께 처리합니다.
// (기존에는 두 번 왕복했는데, 각 왕복마다 Apps Script 특유의 리다이렉트 지연이 붙어 로딩이 느려지는
// 원인이 되었습니다. 하나로 합치고, 캐시까지 적용해 몰리는 상황에서도 부담을 줄입니다.)
function actionGetMaterialsGate_(p) {
  const empId = String(p.empId || "").trim();
  const name = String(p.name || "").trim();
  if (!empId || !name) return { ok: true, attended: false, list: [] };
  const attendance = getAttendanceCached_();
  const attended = attendance.some(a => String(a.empId).trim() === empId && String(a.name).trim() === name);
  if (!attended) return { ok: true, attended: false, list: [] };
  return { ok: true, attended: true, list: getMaterialsCached_() };
}

// 개인정보(이름 등) 노출 없이 전체 명단 인원수만 반환 — 출석체크 화면의 게이지 차트용
function actionGetRosterCount_() {
  return { ok: true, count: sheetToObjects_(SHEET_NAMES.ROSTER).length };
}

function actionGetProfile_(p) {
  const rows = sheetToObjects_(SHEET_NAMES.PROFILES);
  const row = rows.find(r => String(r.empId) === String(p.empId));
  if (!row) return { ok: false, message: "아직 명함을 만들지 않았습니다. 먼저 명함을 만들어주세요." };
  return {
    ok: true,
    profile: {
      empId: String(row.empId), name: row.name, org: row.org, role: row.role || "",
      keywords: splitKeywords_(row.keywords), intro: row.intro || "", photo: row.photo || ""
    }
  };
}

// Profiles 시트에 새 행을 추가하거나(신규), 기존 empId 행을 갱신(수정)합니다.
// fields에 없는 컬럼(주로 photo)은 건드리지 않아 기존 값을 보존합니다.
function upsertProfile_(fields) {
  const sh = getSheet_(SHEET_NAMES.PROFILES);
  const lastRow = sh.getLastRow();
  const lastCol = sh.getLastColumn();
  const headers = lastCol ? sh.getRange(1, 1, 1, lastCol).getValues()[0].map(h => String(h).trim()) : [];
  if (!headers.length) throw new Error("Profiles 시트에 헤더가 없습니다.");
  const empIdx = headers.indexOf("empId");

  if (lastRow >= 2) {
    const empIdCol = sh.getRange(2, empIdx + 1, lastRow - 1, 1).getValues();
    for (let i = 0; i < empIdCol.length; i++) {
      if (String(empIdCol[i][0]) === String(fields.empId)) {
        const rowNum = i + 2;
        headers.forEach((h, idx) => {
          if (fields[h] !== undefined) sh.getRange(rowNum, idx + 1).setValue(fields[h]);
        });
        return "updated";
      }
    }
  }
  const row = headers.map(h => (fields[h] !== undefined ? fields[h] : ""));
  sh.appendRow(row);
  return "created";
}

// 1단계: 사번/성명을 명단과 대조하고, 기존에 만든 명함이 있으면 그 내용을 돌려줍니다.
// (편집 화면을 채워주기 위함 — 없으면 org만 채운 빈 틀을 돌려줌)
function actionGetOrInitProfile_(p) {
  const roster = sheetToObjects_(SHEET_NAMES.ROSTER);
  const match = roster.find(r => String(r.empId) === String(p.empId) && String(r.name).trim() === String(p.name).trim());
  if (!match) return { ok: false, message: "명단에서 사번/성명을 찾을 수 없습니다. 다시 확인해주세요." };

  const rows = sheetToObjects_(SHEET_NAMES.PROFILES);
  const row = rows.find(r => String(r.empId) === String(p.empId));
  if (row) {
    return {
      ok: true, isNew: false,
      profile: {
        empId: String(row.empId), name: row.name, org: row.org, role: row.role || "",
        keywords: row.keywords || "", intro: row.intro || "", photo: row.photo || ""
      }
    };
  }
  return {
    ok: true, isNew: true,
    profile: { empId: p.empId, name: match.name, org: match.org, role: "", keywords: "", intro: "", photo: "" }
  };
}

// 2단계: 실제로 명함을 생성/수정 저장합니다.
function actionSaveProfile_(p) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const roster = sheetToObjects_(SHEET_NAMES.ROSTER);
    const match = roster.find(r => String(r.empId) === String(p.empId) && String(r.name).trim() === String(p.name).trim());
    if (!match) return { ok: false, message: "명단에서 사번/성명을 찾을 수 없습니다. 다시 확인해주세요." };

    upsertProfile_({
      empId: p.empId,
      name: p.name,
      org: p.org || match.org,
      role: p.role || "",
      keywords: p.keywords || "",
      intro: p.intro || ""
    });
    return actionGetProfile_({ empId: p.empId });
  } finally {
    lock.releaseLock();
  }
}

function actionLogScan_(p) {
  if (String(p.scannerId) === String(p.scannedId)) return { ok: false, message: "본인 QR입니다." };
  const lock = LockService.getScriptLock();
  let firstScanRank = null; // NETWORK_EVENT_TARGETS에 지정된 순번의 당첨자에게만 값이 채워집니다 (그 외에는 항상 null).
  lock.waitLock(10000);
  try {
    const logs = sheetToObjects_(SHEET_NAMES.SCANLOG);
    const already = logs.find(l => String(l.scannerId) === String(p.scannerId) && String(l.scannedId) === String(p.scannedId));
    if (!already) {
      // "N번째 네트워크 활동 참여자" 당첨 여부는 각자의 "첫 스캔" 기준으로 판단합니다.
      // (스캔을 이미 한 번이라도 해본 사람은 이후 스캔에서는 이 판정을 다시 하지 않습니다.)
      const isFirstScanForThisPerson = !logs.some(l => String(l.scannerId) === String(p.scannerId));
      appendRow_(SHEET_NAMES.SCANLOG, { scannerId: p.scannerId, scannedId: p.scannedId, time: new Date().toISOString() });
      if (isFirstScanForThisPerson) {
        const distinctScanners = new Set(logs.map(l => String(l.scannerId)));
        distinctScanners.add(String(p.scannerId));
        const rank = distinctScanners.size; // 이 사람을 포함해 지금까지 네트워크 활동을 시작한 총 인원수

        // 지정된 순번(예: 10번째)에 해당할 때만 당첨자로 확정하고, 확인용으로 시트에 기록해둡니다.
        // (다른 사람들에게는 몇 번째인지 전혀 노출되지 않습니다 — 당첨자 본인만 배너를 보게 됩니다.)
        if (NETWORK_EVENT_TARGETS.indexOf(rank) !== -1) {
          firstScanRank = rank;
          ensureSheetWithHeaders_(SHEET_NAMES.EVENT_WINNERS, ["rank", "empId", "name", "org", "time"]);
          const roster = sheetToObjects_(SHEET_NAMES.ROSTER);
          const winner = roster.find(r => String(r.empId) === String(p.scannerId));
          appendRow_(SHEET_NAMES.EVENT_WINNERS, {
            rank, empId: p.scannerId, name: winner ? winner.name : "", org: winner ? winner.org : "",
            time: new Date().toISOString()
          });
        }
      }
    }
  } finally {
    lock.releaseLock();
  }
  const profileRes = actionGetProfile_({ empId: p.scannedId });
  const profile = profileRes.ok ? profileRes.profile : { empId: p.scannedId, name: "(미등록 프로필)", org: "", role: "", keywords: [], intro: "" };
  return { ok: true, profile, firstScanRank };
}

function actionGetMyScans_(p) {
  const logs = sheetToObjects_(SHEET_NAMES.SCANLOG).filter(l => String(l.scannerId) === String(p.scannerId));
  const profiles = sheetToObjects_(SHEET_NAMES.PROFILES);
  const list = logs.map(l => {
    const row = profiles.find(r => String(r.empId) === String(l.scannedId));
    const base = row
      ? { empId: String(row.empId), name: row.name, org: row.org, role: row.role || "", keywords: splitKeywords_(row.keywords), intro: row.intro || "", photo: row.photo || "" }
      : { empId: l.scannedId, name: "(미등록 프로필)", org: "", role: "", keywords: [], intro: "" };
    base.scannedAt = l.time;
    return base;
  }).sort((a, b) => new Date(b.scannedAt) - new Date(a.scannedAt));
  return { ok: true, list };
}

// 사진은 구글폼(로그인 필요) 대신 우리 웹페이지에서 직접 업로드받습니다.
// 그래서 직원은 구글 계정이 전혀 없어도 됩니다 — 이 함수가 대신 구글드라이브에 저장해줍니다.
function getOrCreatePhotoFolder_() {
  const props = PropertiesService.getScriptProperties();
  const existingId = props.getProperty("PHOTO_FOLDER_ID");
  if (existingId) {
    try { return DriveApp.getFolderById(existingId); } catch (e) { /* 폴더가 삭제된 경우 재생성 */ }
  }
  const folder = DriveApp.createFolder("2026 정책연수 - 프로필 사진");
  props.setProperty("PHOTO_FOLDER_ID", folder.getId());
  return folder;
}

// Profiles 시트에서 empId가 일치하는 행을 찾아 특정 컬럼 값만 갱신
function updateProfileField_(empId, field, value) {
  const sh = getSheet_(SHEET_NAMES.PROFILES);
  const values = sh.getDataRange().getValues();
  if (values.length < 2) return false;
  const headers = values[0].map(h => String(h).trim());
  const empIdx = headers.indexOf("empId");
  const fieldIdx = headers.indexOf(field);
  if (empIdx === -1 || fieldIdx === -1) return false;
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][empIdx]) === String(empId)) {
      sh.getRange(i + 1, fieldIdx + 1).setValue(value);
      return true;
    }
  }
  return false;
}

function actionUploadPhoto_(p) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const folder = getOrCreatePhotoFolder_();
    const bytes = Utilities.base64Decode(p.dataBase64);
    const blob = Utilities.newBlob(bytes, p.mimeType || "image/jpeg", `${p.empId}_photo.jpg`);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    const url = `https://drive.google.com/uc?export=view&id=${file.getId()}`;
    const updated = updateProfileField_(p.empId, "photo", url);
    if (!updated) return { ok: false, message: "먼저 명함을 만든 뒤 사진을 등록해주세요." };
    return { ok: true, photo: url };
  } finally {
    lock.releaseLock();
  }
}

// 구글시트에 날짜를 입력하면 시트가 자동으로 "날짜" 타입 셀로 바꿔버리는 경우가 많아,
// 이 값을 그대로 내려주면 화면 쪽 "YYYY-MM-DD" 비교 로직과 어긋날 수 있습니다.
// 그래서 항상 "YYYY-MM-DD" 문자열로 통일해서 내려줍니다.
function normalizeDateCell_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, "Asia/Seoul", "yyyy-MM-dd");
  if (!v) return "";
  const s = String(v).trim();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : s;
}

function actionGetSchedule_() {
  const rows = sheetToObjects_(SHEET_NAMES.SCHEDULE);
  rows.forEach(r => { r.date = normalizeDateCell_(r.date); });
  return { ok: true, list: rows };
}

function actionGetMaterials_() {
  return { ok: true, list: getMaterialsCached_() };
}

// 발표자료 열람 기록 — 잠금 없이 매번 새 행만 추가합니다(중복 체크가 필요 없는 단순 로그이므로
// 락으로 요청을 직렬화할 필요가 없어, 다른 액션들에 걸리는 대기시간에 영향을 주지 않습니다).
function actionLogMaterialView_(p) {
  appendRow_(SHEET_NAMES.MATERIAL_VIEWS, {
    empId: p.empId || "", name: p.name || "", org: p.org || "",
    materialTitle: p.materialTitle || "", viewedAt: new Date().toISOString()
  });
  return { ok: true };
}

// 발표자료 원본을 pdf.js 뷰어(커스텀 화면)로 직접 그려주기 위해,
// 브라우저가 구글드라이브에 직접 접속하지 않고 이 서버를 거쳐서 PDF 데이터를 받아갑니다.
// (브라우저가 드라이브에 직접 fetch하면 CORS로 막히는 경우가 많고, 다운로드 주소가 그대로
//  노출되는 것도 막을 수 있습니다.) PDF 파일 또는 구글 슬라이드(자동으로 PDF 변환)만 지원합니다.
function actionGetMaterialFile_(p) {
  const raw = String(p.file || "").trim();
  if (!raw) return { ok: false, message: "등록된 파일이 없습니다." };
  let id = raw;
  const m = id.match(/\/d\/([^/]+)/);
  if (m) id = m[1];
  let file;
  try {
    file = DriveApp.getFileById(id);
  } catch (e) {
    return { ok: false, message: "파일을 찾을 수 없습니다. 파일 ID/공유 설정을 확인해주세요." };
  }
  const mime = file.getMimeType();
  let blob;
  if (mime === "application/pdf") {
    blob = file.getBlob();
  } else if (mime === "application/vnd.google-apps.presentation" || mime === "application/vnd.google-apps.document") {
    blob = file.getAs("application/pdf");
  } else {
    return { ok: false, message: "지원하지 않는 파일 형식입니다. PDF 또는 구글 슬라이드로 등록해주세요." };
  }
  return { ok: true, base64: Utilities.base64Encode(blob.getBytes()), mimeType: "application/pdf" };
}

function actionGetBanners_() {
  return { ok: true, list: sheetToObjects_(SHEET_NAMES.BANNERS) };
}

// ---------- 공동체 활동 포스터 갤러리 + 좋아요 ----------
// 구글드라이브 공유링크(예: https://drive.google.com/file/d/{id}/view?usp=sharing)를
// 브라우저 <img>가 바로 표시할 수 있는 형식으로 바꿔줍니다. 이미 올바른 형식이거나
// 드라이브 링크가 아니면 원본 그대로 반환합니다. (actionGetMaterialFile_의 ID 추출 방식과 동일)
function normalizeDriveImageUrl_(raw) {
  const url = String(raw || "").trim();
  if (!url) return "";
  const m = url.match(/\/d\/([^/]+)/) || url.match(/[?&]id=([^&]+)/);
  if (m) return `https://drive.google.com/uc?export=view&id=${m[1]}`;
  return url;
}

function actionGetCommunityPosters_(p) {
  const posters = sheetToObjects_(SHEET_NAMES.COMMUNITY_POSTERS);
  const likes = sheetToObjects_(SHEET_NAMES.POSTER_LIKES);
  const empId = String((p && p.empId) || "").trim();

  const countById = {};
  const likedByMeSet = new Set();
  likes.forEach(l => {
    const id = String(l.id);
    countById[id] = (countById[id] || 0) + 1;
    if (empId && String(l.empId).trim() === empId) likedByMeSet.add(id);
  });

  const list = posters.map(row => {
    const id = String(row.id);
    return {
      id,
      org: row.org || "",
      title: row.title || "",
      imageUrl: normalizeDriveImageUrl_(row.imageUrl),
      likeCount: countById[id] || 0,
      likedByMe: likedByMeSet.has(id)
    };
  });
  return { ok: true, list };
}

// 좋아요는 취소(재클릭) 없이 1인당 1포스터에 1회만 기록됩니다. (여러 포스터에는 각각 누를 수 있음)
function actionLikePoster_(p) {
  const empId = String(p.empId || "").trim();
  const id = String(p.id || "").trim();
  if (!empId) return { ok: false, message: "먼저 사번·성명을 확인해주세요." };
  if (!id) return { ok: false, message: "포스터 정보를 찾을 수 없습니다." };

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    ensureSheetWithHeaders_(SHEET_NAMES.POSTER_LIKES, ["id", "empId", "time"]);
    const likes = sheetToObjects_(SHEET_NAMES.POSTER_LIKES);
    const already = likes.some(l => String(l.id) === id && String(l.empId).trim() === empId);
    if (already) return { ok: false, message: "이미 이 포스터에 좋아요를 누르셨습니다." };

    appendRow_(SHEET_NAMES.POSTER_LIKES, { id, empId, time: new Date().toISOString() });
    const likeCount = likes.filter(l => String(l.id) === id).length + 1;
    return { ok: true, likeCount };
  } finally {
    lock.releaseLock();
  }
}

// ---------- 방배정표 ----------
// 650명 전체 명단을 그대로 반환합니다 (개인정보는 사번/성명/소속/방 뿐이라
// 다른 기능들과 동일 수준). 클라이언트(info.html)에서 사번+성명 검색과
// 전체 목록 표시를 모두 이 응답 하나로 처리합니다.
function actionGetRoomAssignment_() {
  return { ok: true, list: sheetToObjects_(SHEET_NAMES.ROOMS) };
}

// ---------- 식사조 (사무총장 동행 식사 일정) ----------
function actionGetMealGroups_() {
  return { ok: true, list: sheetToObjects_(SHEET_NAMES.MEALGROUPS) };
}

// ---------- 네트워킹 랭킹전 ----------
// 아래 숫자들은 운영 중 자유롭게 조정 가능한 "기본값"입니다.
// (배포 가이드 문서에도 동일하게 설명되어 있습니다.)
const LEADERBOARD_CONFIG = {
  POINTS_PER_SCAN: 10,   // 명함 1건(중복 제외) 스캔당 기본 점수
  CROSS_ORG_BONUS: 10,   // 나와 소속(지부/부서)이 다른 사람을 스캔했을 때 추가 점수
  MILESTONES: [          // 누적 스캔 수(중복 제외) 달성 시 1회성 보너스
    { count: 10, bonus: 50 },
    { count: 30, bonus: 150 },
    { count: 50, bonus: 300 }
  ]
};

function computeLeaderboardScore_(uniqueCount, crossOrgCount) {
  let score = uniqueCount * LEADERBOARD_CONFIG.POINTS_PER_SCAN + crossOrgCount * LEADERBOARD_CONFIG.CROSS_ORG_BONUS;
  LEADERBOARD_CONFIG.MILESTONES.forEach(m => { if (uniqueCount >= m.count) score += m.bonus; });
  return score;
}

// scanlog는 logScan 시점에 이미 (scannerId, scannedId) 중복을 막아두었으므로
// 여기서는 별도 중복제거 없이 행 수 = 고유 스캔 수로 취급합니다.
function actionGetLeaderboard_(p) {
  const scanlog = sheetToObjects_(SHEET_NAMES.SCANLOG);
  const roster = sheetToObjects_(SHEET_NAMES.ROSTER);
  const profiles = sheetToObjects_(SHEET_NAMES.PROFILES);
  const attendance = sheetToObjects_(SHEET_NAMES.ATTENDANCE);

  const orgCache = {}, nameCache = {};
  function orgOf(empId) {
    const key = String(empId);
    if (key in orgCache) return orgCache[key];
    const pr = profiles.find(r => String(r.empId) === key);
    const ro = roster.find(r => String(r.empId) === key);
    return (orgCache[key] = (pr && pr.org) || (ro && ro.org) || "");
  }
  function nameOf(empId) {
    const key = String(empId);
    if (key in nameCache) return nameCache[key];
    const pr = profiles.find(r => String(r.empId) === key);
    const ro = roster.find(r => String(r.empId) === key);
    return (nameCache[key] = (pr && pr.name) || (ro && ro.name) || key);
  }

  const byScanner = {};
  scanlog.forEach(row => {
    const scannerId = String(row.scannerId);
    (byScanner[scannerId] = byScanner[scannerId] || []).push(String(row.scannedId));
  });

  const individual = Object.keys(byScanner).map(empId => {
    const scannedIds = byScanner[empId];
    const myOrg = orgOf(empId);
    const crossOrgCount = scannedIds.filter(sid => orgOf(sid) && orgOf(sid) !== myOrg).length;
    const uniqueCount = scannedIds.length;
    return {
      empId, name: nameOf(empId), org: myOrg,
      uniqueCount, crossOrgCount,
      score: computeLeaderboardScore_(uniqueCount, crossOrgCount)
    };
  });
  individual.sort((a, b) => b.score - a.score);

  const top10 = individual.slice(0, 10);

  // 소속별 평균 점수 = (그 소속 참여자들의 점수 합계) ÷ (그 소속의 출석체크 인원수).
  // 참여자 수가 아니라 출석 인원수로 나누기 때문에, 소속 내 참여율이 낮으면 평균도 함께 낮아집니다.
  const attendanceCountByOrg = {};
  attendance.forEach(a => {
    const org = a.org || "(미지정)";
    attendanceCountByOrg[org] = (attendanceCountByOrg[org] || 0) + 1;
  });

  const orgMap = {};
  individual.forEach(ind => {
    const org = ind.org || "(미지정)";
    if (!orgMap[org]) orgMap[org] = { org, totalScore: 0, memberCount: 0, totalScans: 0 };
    orgMap[org].totalScore += ind.score;
    orgMap[org].memberCount += 1;
    orgMap[org].totalScans += ind.uniqueCount;
  });
  // 스캔 기록이 아예 없는 소속도(참여자 0명) 평균 0점으로 함께 노출되도록, 출석 인원 목록 기준으로 순회합니다.
  const orgRanking = Object.keys(attendanceCountByOrg).map(org => {
    const bucket = orgMap[org] || { org, totalScore: 0, memberCount: 0, totalScans: 0 };
    const attendanceCount = attendanceCountByOrg[org];
    const avgScore = attendanceCount > 0 ? Math.round((bucket.totalScore / attendanceCount) * 10) / 10 : 0;
    return { ...bucket, attendanceCount, avgScore };
  }).sort((a, b) => b.avgScore - a.avgScore);

  let me = null;
  if (p && p.empId) {
    const idx = individual.findIndex(i => String(i.empId) === String(p.empId));
    me = idx !== -1
      ? { ...individual[idx], rank: idx + 1 }
      : { empId: p.empId, name: nameOf(p.empId), org: orgOf(p.empId), uniqueCount: 0, crossOrgCount: 0, score: 0, rank: null };
  }

  const stats = {
    totalParticipants: individual.length,
    totalScans: individual.reduce((sum, i) => sum + i.uniqueCount, 0),
    maxScans: individual.length ? Math.max(...individual.map(i => i.uniqueCount)) : 0,
    avgScans: individual.length ? Math.round((individual.reduce((sum, i) => sum + i.uniqueCount, 0) / individual.length) * 10) / 10 : 0
  };

  return { ok: true, top10, orgRanking, me, stats, config: LEADERBOARD_CONFIG };
}

// ---------- GN 커넥트 챌린지 — 교류 다양성 통계 / 랭킹현황 시트 자동갱신 ----------
// actionGetLeaderboard_와 별도로, "관리자 통계" 화면과 "랭킹현황" 시트 자동갱신에 공통으로 쓰는
// 집계 함수입니다. 개인별 점수 랭킹은 물론, "얼마나 다양한 소속·직급과 교류했는지"까지 함께 계산합니다.
function buildNetworkAnalytics_() {
  const scanlog = sheetToObjects_(SHEET_NAMES.SCANLOG);
  const roster = sheetToObjects_(SHEET_NAMES.ROSTER);
  const profiles = sheetToObjects_(SHEET_NAMES.PROFILES);
  const attendance = sheetToObjects_(SHEET_NAMES.ATTENDANCE);

  const orgCache = {}, nameCache = {}, roleCache = {};
  function orgOf(empId) {
    const key = String(empId);
    if (key in orgCache) return orgCache[key];
    const pr = profiles.find(r => String(r.empId) === key);
    const ro = roster.find(r => String(r.empId) === key);
    return (orgCache[key] = (pr && pr.org) || (ro && ro.org) || "");
  }
  function nameOf(empId) {
    const key = String(empId);
    if (key in nameCache) return nameCache[key];
    const pr = profiles.find(r => String(r.empId) === key);
    const ro = roster.find(r => String(r.empId) === key);
    return (nameCache[key] = (pr && pr.name) || (ro && ro.name) || key);
  }
  function roleOf(empId) {
    const key = String(empId);
    if (key in roleCache) return roleCache[key];
    const pr = profiles.find(r => String(r.empId) === key);
    const ro = roster.find(r => String(r.empId) === key);
    return (roleCache[key] = (pr && pr.role) || (ro && ro.role) || "");
  }

  const byScanner = {};
  scanlog.forEach(row => {
    const scannerId = String(row.scannerId);
    (byScanner[scannerId] = byScanner[scannerId] || []).push(String(row.scannedId));
  });

  const individual = Object.keys(byScanner).map(empId => {
    const scannedIds = byScanner[empId];
    const myOrg = orgOf(empId);
    const crossOrgCount = scannedIds.filter(sid => orgOf(sid) && orgOf(sid) !== myOrg).length;
    const uniqueCount = scannedIds.length;
    // 교류 다양성 = 나와 "다른" 소속 종류 수 / 스캔한 상대방들의 직급 종류 수 (많을수록 다양하게 교류한 것)
    const orgDiversity = new Set(scannedIds.map(orgOf).filter(o => o && o !== myOrg)).size;
    const roleDiversity = new Set(scannedIds.map(roleOf).filter(Boolean)).size;
    return {
      empId, name: nameOf(empId), org: myOrg,
      uniqueCount, crossOrgCount,
      score: computeLeaderboardScore_(uniqueCount, crossOrgCount),
      orgDiversity, roleDiversity
    };
  });

  const attendanceCountByOrg = {};
  attendance.forEach(a => {
    const org = a.org || "(미지정)";
    attendanceCountByOrg[org] = (attendanceCountByOrg[org] || 0) + 1;
  });

  const orgMap = {};
  individual.forEach(ind => {
    const org = ind.org || "(미지정)";
    if (!orgMap[org]) orgMap[org] = { org, totalScore: 0, memberCount: 0, totalScans: 0, reachSet: new Set() };
    orgMap[org].totalScore += ind.score;
    orgMap[org].memberCount += 1;
    orgMap[org].totalScans += ind.uniqueCount;
    // 소속 단위 교류 다양성 = 그 소속 구성원들이 스캔한 "다른 소속"들의 합집합 크기
    (byScanner[ind.empId] || []).forEach(sid => {
      const sOrg = orgOf(sid);
      if (sOrg && sOrg !== org) orgMap[org].reachSet.add(sOrg);
    });
  });
  const orgRanking = Object.keys(attendanceCountByOrg).map(org => {
    const bucket = orgMap[org] || { org, totalScore: 0, memberCount: 0, totalScans: 0, reachSet: new Set() };
    const attendanceCount = attendanceCountByOrg[org];
    const avgScore = attendanceCount > 0 ? Math.round((bucket.totalScore / attendanceCount) * 10) / 10 : 0;
    return {
      org, totalScore: bucket.totalScore, memberCount: bucket.memberCount, totalScans: bucket.totalScans,
      attendanceCount, avgScore, orgReachCount: bucket.reachSet.size
    };
  }).sort((a, b) => b.avgScore - a.avgScore);

  const individualByScore = individual.slice().sort((a, b) => b.score - a.score);
  const individualByDiversity = individual.slice()
    .sort((a, b) => (b.orgDiversity - a.orgDiversity) || (b.roleDiversity - a.roleDiversity) || (b.uniqueCount - a.uniqueCount));
  const orgByReach = orgRanking.slice().sort((a, b) => b.orgReachCount - a.orgReachCount);

  return { individualByScore, orgRanking, individualByDiversity, orgByReach };
}

// 관리자 PIN을 맞게 입력한 경우에만 통계를 내려줍니다 (전체 공개 아님).
// ① 개인 랭킹 TOP10  ② 소속별 랭킹 TOP10  ③ 교류 다양성(소속수·직급수) 개인 TOP10  ④ 교류 다양성 소속 TOP10
function actionGetNetworkStats_(p) {
  if (String(p.pin || "") !== String(ADMIN_PIN)) return { ok: false, message: "암호가 올바르지 않습니다." };
  const a = buildNetworkAnalytics_();
  return {
    ok: true,
    individualTop10: a.individualByScore.slice(0, 10),
    orgTop10: a.orgRanking.slice(0, 10),
    individualDiversityTop10: a.individualByDiversity.slice(0, 10),
    orgDiversityTop10: a.orgByReach.slice(0, 10)
  };
}

// "랭킹현황" 시트에 개인/소속 랭킹을 자동으로 써줍니다. 이 시트가 없으면 자동으로 만듭니다.
// 이 시트를 구글시트에서 "뷰어" 권한으로 공유해두면, 공유받은 사람은 사이트에 접속하지 않고도
// 시트를 열어두기만 하면 몇 분 간격으로 갱신되는 최신 랭킹을 실시간으로 볼 수 있습니다.
function updateLeaderboardSheet_() {
  const a = buildNetworkAnalytics_();
  const ss = ss_();
  let sh = ss.getSheetByName(SHEET_NAMES.LEADERBOARD_VIEW);
  if (!sh) sh = ss.insertSheet(SHEET_NAMES.LEADERBOARD_VIEW);
  sh.clear();

  sh.getRange(1, 1, 1, 2).setValues([["마지막 갱신", Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd HH:mm:ss")]]);

  const top10 = a.individualByScore.slice(0, 10);
  sh.getRange(3, 1, 1, 4).setValues([["개인 랭킹 TOP10", "소속", "점수", "스캔수"]]);
  if (top10.length) sh.getRange(4, 1, top10.length, 4).setValues(top10.map(r => [r.name, r.org, r.score, r.uniqueCount]));

  const orgStart = 4 + Math.max(top10.length, 1) + 1;
  sh.getRange(orgStart, 1, 1, 4).setValues([["소속별 랭킹", "평균점수", "출석인원", "참여인원"]]);
  if (a.orgRanking.length) {
    sh.getRange(orgStart + 1, 1, a.orgRanking.length, 4).setValues(a.orgRanking.map(o => [o.org, o.avgScore, o.attendanceCount, o.memberCount]));
  }
}

// 배포 후 관리자가 Apps Script 편집기에서 이 함수를 딱 한 번 선택해서 실행(▶ 실행)하면,
// 이후 5분 간격으로 "랭킹현황" 시트가 자동 갱신되도록 예약됩니다. (다시 실행해도 안전 —
// 기존 예약을 지우고 새로 만들 뿐입니다.)
function installLeaderboardAutoUpdate_() {
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === "updateLeaderboardSheet_") ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger("updateLeaderboardSheet_").timeBased().everyMinutes(5).create();
  updateLeaderboardSheet_();
}

// ---------- 설문조사 결과 비공개 보호용 암호 ----------
// 설문조사 결과는 전체 공개하지 않고, 이 암호를 아는 담당자만 조회할 수 있습니다.
// 반드시 아래 기본값을 실제 사용할 암호로 바꾼 뒤 다시 배포(새 배포 또는 배포 관리에서 수정)하세요.
const ADMIN_PIN = "0000";

// ---------- 설문조사 (만족도 / 종합평가) ----------
function actionSubmitSurvey_(p) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const roster = sheetToObjects_(SHEET_NAMES.ROSTER);
    const match = roster.find(r => String(r.empId) === String(p.empId) && String(r.name).trim() === String(p.name).trim());
    if (!match) return { ok: false, message: "명단에서 사번/성명을 찾을 수 없습니다. 다시 확인해주세요." };

    const existing = sheetToObjects_(SHEET_NAMES.SURVEY_RESPONSES);
    if (existing.find(r => String(r.empId) === String(p.empId))) {
      return { ok: false, message: "이미 설문에 참여하셨습니다. 소중한 의견 감사합니다." };
    }

    appendRow_(SHEET_NAMES.SURVEY_RESPONSES, {
      empId: p.empId, name: p.name, org: p.org || match.org, role: p.role || match.role || "",
      item1: p.item1, item2: p.item2, item3: p.item3, item4: p.item4, item5: p.item5,
      comment: p.comment || "", submittedAt: new Date().toISOString()
    });
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

// 관리자 PIN을 맞게 입력한 경우에만 항목별 평균/응답 목록을 내려줍니다 (전체 공개 아님).
function actionGetSurveyResults_(p) {
  if (String(p.pin || "") !== String(ADMIN_PIN)) return { ok: false, message: "암호가 올바르지 않습니다." };
  const rows = sheetToObjects_(SHEET_NAMES.SURVEY_RESPONSES);
  const items = ["item1", "item2", "item3", "item4", "item5"];
  const averages = {};
  items.forEach(key => {
    const nums = rows.map(r => Number(r[key])).filter(n => !isNaN(n));
    averages[key] = nums.length ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10 : 0;
  });
  return { ok: true, count: rows.length, averages, list: rows };
}

// ---------- 라우팅 ----------

function route_(action, p) {
  switch (action) {
    case "checkIn": return actionCheckIn_(p);
    case "getAttendanceList": return actionGetAttendanceList_();
    case "getRosterCount": return actionGetRosterCount_();
    case "getProfile": return actionGetProfile_(p);
    case "getOrInitProfile": return actionGetOrInitProfile_(p);
    case "saveProfile": return actionSaveProfile_(p);
    case "uploadPhoto": return actionUploadPhoto_(p);
    case "logScan": return actionLogScan_(p);
    case "getMyScans": return actionGetMyScans_(p);
    case "getSchedule": return actionGetSchedule_();
    case "getMaterials": return actionGetMaterials_();
    case "getMaterialsGate": return actionGetMaterialsGate_(p);
    case "logMaterialView": return actionLogMaterialView_(p);
    case "getMaterialFile": return actionGetMaterialFile_(p);
    case "getBanners": return actionGetBanners_();
    case "getCommunityPosters": return actionGetCommunityPosters_(p);
    case "likePoster": return actionLikePoster_(p);
    case "getRoomAssignment": return actionGetRoomAssignment_();
    case "getMealGroups": return actionGetMealGroups_();
    case "getLeaderboard": return actionGetLeaderboard_(p);
    case "getNetworkStats": return actionGetNetworkStats_(p);
    case "submitSurvey": return actionSubmitSurvey_(p);
    case "getSurveyResults": return actionGetSurveyResults_(p);
    default: return { ok: false, message: "알 수 없는 요청입니다: " + action };
  }
}

// 예상치 못한 서버 오류(락 대기시간 초과 등 접속 폭주 상황 포함)가 나면, 원본 에러 문구 대신
// 사용자에게 보여줄 친절한 안내 문구로 바꿔서 돌려줍니다. (원본 에러는 debug 필드에 남겨둡니다)
function friendlyErrorResponse_(err) {
  return { ok: false, message: "지금 접속이 많이 몰려 있습니다. 잠시 후 다시 시도해주세요.", debug: String(err) };
}

function doGet(e) {
  try {
    const p = e.parameter || {};
    const result = route_(p.action, p);
    return json_(result);
  } catch (err) {
    return json_(friendlyErrorResponse_(err));
  }
}

function doPost(e) {
  try {
    const p = JSON.parse(e.postData.contents);
    const result = route_(p.action, p);
    return json_(result);
  } catch (err) {
    return json_(friendlyErrorResponse_(err));
  }
}
