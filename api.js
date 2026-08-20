/* ===========================================================
   API 레이어
   - CONFIG.APPS_SCRIPT_URL 이 비어있으면 자동으로 MOCK(가짜 백엔드, localStorage)으로 동작
   - 값이 채워져 있으면 실제 Google Apps Script 웹앱으로 통신
   - 페이지 코드는 이 레이어의 함수만 호출하면 되고, mock/실서버 여부를 신경쓰지 않아도 됨
=========================================================== */
(function () {
  const IS_MOCK = !window.CONFIG.APPS_SCRIPT_URL;
  const LS_KEY = "gn2026_mock_db";

  // MOCK 모드 테스트용 — backend/Code.gs의 NETWORK_EVENT_TARGETS 기본값과 동일 (현재 테스트 기준 10번째만)
  const NETWORK_EVENT_TARGETS = [10];

  function loadDB() {
    let db = null;
    try { db = JSON.parse(localStorage.getItem(LS_KEY)); } catch (e) {}
    if (!db) {
      db = {
        roster: window.MOCK_SEED.roster.slice(),
        attendance: (window.MOCK_SEED.attendance || []).slice(),
        profiles: window.MOCK_SEED.profiles.slice(),
        scanlog: (window.MOCK_SEED.scanlog || []).slice(),
        schedule: window.MOCK_SEED.schedule.slice(),
        surveyResponses: [],
        materialViews: [],
        communityPosters: (window.MOCK_SEED.communityPosters || []).slice(),
        posterLikes: []
      };
      saveDB(db);
    }
    return db;
  }
  function saveDB(db) { localStorage.setItem(LS_KEY, JSON.stringify(db)); }

  function delay(ms) { return new Promise(res => setTimeout(res, ms || 250)); }

  // Code.gs의 splitKeywords_ 와 동일한 규칙 (쉼표/공백 구분 문자열 -> 배열)
  function splitKeywords_(raw) {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    return String(raw).split(/[,，\s]+/).map(s => s.trim()).filter(Boolean);
  }
  function toDisplayProfile_(p) {
    return { ...p, keywords: splitKeywords_(p.keywords) };
  }

  // ---------- 네트워킹 랭킹전 계산 (Code.gs의 LEADERBOARD_CONFIG / actionGetLeaderboard_ 와 동일 로직) ----------
  // 숫자는 운영 중 조정 가능한 기본값이며, backend/Code.gs 쪽 값과 반드시 함께 맞춰주세요.
  const LEADERBOARD_CONFIG = {
    POINTS_PER_SCAN: 10,
    CROSS_ORG_BONUS: 10,
    MILESTONES: [
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
  function computeLeaderboard_(db, myEmpId) {
    const orgCache = {}, nameCache = {};
    function orgOf(empId) {
      const key = String(empId);
      if (key in orgCache) return orgCache[key];
      const pr = db.profiles.find(r => String(r.empId) === key);
      const ro = db.roster.find(r => String(r.empId) === key);
      return (orgCache[key] = (pr && pr.org) || (ro && ro.org) || "");
    }
    function nameOf(empId) {
      const key = String(empId);
      if (key in nameCache) return nameCache[key];
      const pr = db.profiles.find(r => String(r.empId) === key);
      const ro = db.roster.find(r => String(r.empId) === key);
      return (nameCache[key] = (pr && pr.name) || (ro && ro.name) || key);
    }
    const byScanner = {};
    db.scanlog.forEach(row => {
      const scannerId = String(row.scannerId);
      (byScanner[scannerId] = byScanner[scannerId] || []).push(String(row.scannedId));
    });
    const individual = Object.keys(byScanner).map(empId => {
      const scannedIds = byScanner[empId];
      const myOrg = orgOf(empId);
      const crossOrgCount = scannedIds.filter(sid => orgOf(sid) && orgOf(sid) !== myOrg).length;
      const uniqueCount = scannedIds.length;
      return { empId, name: nameOf(empId), org: myOrg, uniqueCount, crossOrgCount, score: computeLeaderboardScore_(uniqueCount, crossOrgCount) };
    });
    individual.sort((a, b) => b.score - a.score);
    const top10 = individual.slice(0, 10);

    // 소속별 평균 점수 = 점수 합계 ÷ 그 소속 출석체크 인원수 (Code.gs의 actionGetLeaderboard_와 동일 로직)
    const attendanceCountByOrg = {};
    db.attendance.forEach(a => {
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
    const orgRanking = Object.keys(attendanceCountByOrg).map(org => {
      const bucket = orgMap[org] || { org, totalScore: 0, memberCount: 0, totalScans: 0 };
      const attendanceCount = attendanceCountByOrg[org];
      const avgScore = attendanceCount > 0 ? Math.round((bucket.totalScore / attendanceCount) * 10) / 10 : 0;
      return { ...bucket, attendanceCount, avgScore };
    }).sort((a, b) => b.avgScore - a.avgScore);
    let me = null;
    if (myEmpId) {
      const idx = individual.findIndex(i => String(i.empId) === String(myEmpId));
      me = idx !== -1
        ? { ...individual[idx], rank: idx + 1 }
        : { empId: myEmpId, name: nameOf(myEmpId), org: orgOf(myEmpId), uniqueCount: 0, crossOrgCount: 0, score: 0, rank: null };
    }
    const stats = {
      totalParticipants: individual.length,
      totalScans: individual.reduce((sum, i) => sum + i.uniqueCount, 0),
      maxScans: individual.length ? Math.max(...individual.map(i => i.uniqueCount)) : 0,
      avgScans: individual.length ? Math.round((individual.reduce((sum, i) => sum + i.uniqueCount, 0) / individual.length) * 10) / 10 : 0
    };
    return { ok: true, top10, orgRanking, me, stats, config: LEADERBOARD_CONFIG };
  }

  // 관리자 통계(교류 다양성 등) — MOCK 모드용. backend/Code.gs의 buildNetworkAnalytics_와 동일 로직입니다.
  function computeNetworkStats_(db, pin) {
    if (String(pin || "") !== String(MOCK_ADMIN_PIN)) return { ok: false, message: "암호가 올바르지 않습니다." };
    const orgCache = {}, nameCache = {}, roleCache = {};
    function orgOf(empId) {
      const key = String(empId);
      if (key in orgCache) return orgCache[key];
      const pr = db.profiles.find(r => String(r.empId) === key);
      const ro = db.roster.find(r => String(r.empId) === key);
      return (orgCache[key] = (pr && pr.org) || (ro && ro.org) || "");
    }
    function nameOf(empId) {
      const key = String(empId);
      if (key in nameCache) return nameCache[key];
      const pr = db.profiles.find(r => String(r.empId) === key);
      const ro = db.roster.find(r => String(r.empId) === key);
      return (nameCache[key] = (pr && pr.name) || (ro && ro.name) || key);
    }
    function roleOf(empId) {
      const key = String(empId);
      if (key in roleCache) return roleCache[key];
      const pr = db.profiles.find(r => String(r.empId) === key);
      const ro = db.roster.find(r => String(r.empId) === key);
      return (roleCache[key] = (pr && pr.role) || (ro && ro.role) || "");
    }
    const byScanner = {};
    db.scanlog.forEach(row => {
      const scannerId = String(row.scannerId);
      (byScanner[scannerId] = byScanner[scannerId] || []).push(String(row.scannedId));
    });
    const individual = Object.keys(byScanner).map(empId => {
      const scannedIds = byScanner[empId];
      const myOrg = orgOf(empId);
      const crossOrgCount = scannedIds.filter(sid => orgOf(sid) && orgOf(sid) !== myOrg).length;
      const uniqueCount = scannedIds.length;
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
    db.attendance.forEach(a => {
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
    return {
      ok: true,
      individualTop10: individualByScore.slice(0, 10),
      orgTop10: orgRanking.slice(0, 10),
      individualDiversityTop10: individualByDiversity.slice(0, 10),
      orgDiversityTop10: orgByReach.slice(0, 10)
    };
  }

  // 라이브 퀴즈쇼/설문조사 결과 비공개 보호용 암호 (MOCK 모드 테스트용 — backend/Code.gs의 ADMIN_PIN 기본값과 동일)
  const MOCK_ADMIN_PIN = "0000";

  // 실서버 호출 — GAS는 커스텀 헤더/JSON Content-Type을 쓰면 CORS 프리플라이트에 걸리므로
  // text/plain 으로 보내고 서버(Code.gs)에서 JSON.parse 하는 방식을 사용합니다.
  //
  // 650명이 몰리는 상황에서는 네트워크 혼잡이나 Apps Script의 동시실행 한도로 인해
  // 요청이 일시적으로 실패하거나 응답이 늦어질 수 있습니다. 이를 대비해 실패 시
  // 짧은 대기 후 자동으로 몇 차례 재시도하고, 그래도 실패하면 사용자에게 다시 시도해달라는
  // 안내를 보여주는 것으로 부드럽게 처리합니다(화면이 그냥 멈춘 것처럼 보이지 않도록).
  //
  // 재시도는 안전합니다 — 출석체크/스캔/설문 등 서버의 쓰기 액션들은 모두 "이미 처리됨"을
  // 먼저 확인하는 구조라, 같은 요청이 두 번 도착해도 중복 반영되지 않습니다.
  async function fetchOnce_(action, payload) {
    const url = window.CONFIG.APPS_SCRIPT_URL;
    if (action.startsWith("get")) {
      const qs = new URLSearchParams({ action, ...payload }).toString();
      const res = await fetch(`${url}?${qs}`, { method: "GET" });
      return await res.json();
    }
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action, ...payload })
    });
    return await res.json();
  }

  async function callServer(action, payload, retries) {
    const maxRetries = retries == null ? 2 : retries; // 최초 1회 + 최대 2회 재시도 = 총 3회 시도
    let lastErr;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fetchOnce_(action, payload);
      } catch (err) {
        lastErr = err;
        if (attempt < maxRetries) await delay(400 * Math.pow(2, attempt)); // 400ms, 800ms
      }
    }
    console.error("callServer failed after retries:", action, lastErr);
    return { ok: false, message: "네트워크가 원활하지 않습니다. 잠시 후 다시 시도해주세요." };
  }

  const API = {
    mode: IS_MOCK ? "MOCK" : "LIVE",

    // ---------- 출석체크 ----------
    async checkIn({ empId, name, org }) {
      if (IS_MOCK) {
        await delay();
        const db = loadDB();
        const match = db.roster.find(r => r.empId === empId && r.name === name);
        if (!match) return { ok: false, message: "명단에서 사번/성명을 찾을 수 없습니다. 다시 확인해주세요." };
        if (db.attendance.find(a => a.empId === empId)) return { ok: false, message: "이미 출석 처리되었습니다." };
        db.attendance.unshift({ empId, name, org: org || match.org, role: match.role || "", time: new Date().toISOString() });
        saveDB(db);
        return { ok: true };
      }
      return callServer("checkIn", { empId, name, org });
    },

    async getAttendanceList() {
      if (IS_MOCK) { await delay(150); return { ok: true, list: loadDB().attendance }; }
      return callServer("getAttendanceList", {});
    },

    // 전체 명단 인원수만 반환 (개인정보 노출 없이 출석 게이지 차트용)
    async getRosterCount() {
      if (IS_MOCK) { await delay(100); return { ok: true, count: loadDB().roster.length }; }
      return callServer("getRosterCount", {});
    },

    // ---------- 개인 프로필 / QR 네트워킹 ----------
    async getProfileByEmpId(empId) {
      if (IS_MOCK) {
        await delay(150);
        const p = loadDB().profiles.find(p => p.empId === empId);
        return p ? { ok: true, profile: toDisplayProfile_(p) } : { ok: false, message: "아직 명함을 만들지 않았습니다. 먼저 명함을 만들어주세요." };
      }
      return callServer("getProfile", { empId });
    },

    // 1단계: 사번+성명을 명단과 대조하고, 기존 명함이 있으면 그 값을 그대로 돌려줍니다 (편집화면 채우기용)
    async getOrInitProfile({ empId, name }) {
      if (IS_MOCK) {
        await delay(200);
        const db = loadDB();
        const match = db.roster.find(r => r.empId === empId && r.name === name);
        if (!match) return { ok: false, message: "명단에서 사번/성명을 찾을 수 없습니다. 다시 확인해주세요." };
        const existing = db.profiles.find(p => p.empId === empId);
        if (existing) return { ok: true, isNew: false, profile: { ...existing } };
        return { ok: true, isNew: true, profile: { empId, name: match.name, org: match.org, role: "", keywords: "", intro: "", photo: "" } };
      }
      return callServer("getOrInitProfile", { empId, name });
    },

    // 2단계: 실제로 명함을 생성/수정 저장
    async saveProfile({ empId, name, org, role, keywords, intro }) {
      if (IS_MOCK) {
        await delay(300);
        const db = loadDB();
        const match = db.roster.find(r => r.empId === empId && r.name === name);
        if (!match) return { ok: false, message: "명단에서 사번/성명을 찾을 수 없습니다. 다시 확인해주세요." };
        const idx = db.profiles.findIndex(p => p.empId === empId);
        if (idx === -1) {
          db.profiles.push({ empId, name, org: org || match.org, role: role || "", keywords: keywords || "", intro: intro || "", photo: "" });
        } else {
          db.profiles[idx] = { ...db.profiles[idx], name, org: org || match.org, role: role || "", keywords: keywords || "", intro: intro || "" };
        }
        saveDB(db);
        const saved = db.profiles.find(p => p.empId === empId);
        return { ok: true, profile: toDisplayProfile_(saved) };
      }
      return callServer("saveProfile", { empId, name, org, role, keywords, intro });
    },

    async logScan({ scannerId, scannedId }) {
      if (IS_MOCK) {
        await delay(150);
        if (scannerId === scannedId) return { ok: false, message: "본인 QR입니다." };
        const db = loadDB();
        const already = db.scanlog.find(s => s.scannerId === scannerId && s.scannedId === scannedId);
        let firstScanRank = null; // NETWORK_EVENT_TARGETS에 지정된 순번의 당첨자에게만 값이 채워짐
        if (!already) {
          const isFirstScanForThisPerson = !db.scanlog.some(s => s.scannerId === scannerId);
          db.scanlog.unshift({ scannerId, scannedId, time: new Date().toISOString() });
          if (isFirstScanForThisPerson) {
            const rank = new Set(db.scanlog.map(s => s.scannerId)).size;
            if (NETWORK_EVENT_TARGETS.indexOf(rank) !== -1) firstScanRank = rank;
          }
        }
        saveDB(db);
        const profile = db.profiles.find(p => p.empId === scannedId);
        return {
          ok: true,
          profile: profile ? toDisplayProfile_(profile) : { empId: scannedId, name: "(미등록 프로필)", org: "", role: "", keywords: [], intro: "" },
          firstScanRank
        };
      }
      return callServer("logScan", { scannerId, scannedId });
    },

    async getMyScans(scannerId) {
      if (IS_MOCK) {
        await delay(150);
        const db = loadDB();
        const rows = db.scanlog.filter(s => s.scannerId === scannerId);
        const list = rows.map(r => {
          const p = db.profiles.find(p => p.empId === r.scannedId);
          return { ...(p ? toDisplayProfile_(p) : { empId: r.scannedId, name: "(미등록 프로필)", org: "", role: "", keywords: [] }), scannedAt: r.time };
        });
        return { ok: true, list };
      }
      return callServer("getMyScans", { scannerId });
    },

    // 사진 업로드 — 구글계정 불필요 (구글폼 대신 이 웹페이지에서 직접 받아 Drive에 저장)
    async uploadPhoto({ empId, filename, mimeType, dataBase64 }) {
      if (IS_MOCK) {
        await delay(400);
        const db = loadDB();
        const idx = db.profiles.findIndex(p => p.empId === empId);
        if (idx === -1) return { ok: false, message: "먼저 명함을 만든 뒤 사진을 등록해주세요." };
        const dataUrl = `data:${mimeType};base64,${dataBase64}`;
        db.profiles[idx].photo = dataUrl;
        saveDB(db);
        return { ok: true, photo: dataUrl };
      }
      return callServer("uploadPhoto", { empId, filename, mimeType, dataBase64 });
    },

    // ---------- 일정표 ----------
    async getSchedule() {
      if (IS_MOCK) { await delay(150); return { ok: true, list: loadDB().schedule }; }
      return callServer("getSchedule", {});
    },

    // ---------- 발표자료 / 배너 (정적 설정, Sheet로 관리 가능) ----------
    async getMaterials() {
      if (IS_MOCK) { await delay(100); return { ok: true, list: window.MOCK_SEED.materials }; }
      return callServer("getMaterials", {});
    },

    // 발표자료 페이지 전용 — 출석 여부 확인 + 자료 목록을 한 번의 요청으로 함께 받습니다.
    // (기존에는 getAttendanceList로 전체 명단을 받아 직접 대조 후, getMaterials를 또 호출하는
    // 2회 왕복 방식이었는데, 이를 합쳐서 로딩 속도를 개선합니다.)
    async getMaterialsGate({ empId, name }) {
      if (IS_MOCK) {
        await delay(150);
        const db = loadDB();
        const eid = String(empId || "").trim(), nm = String(name || "").trim();
        const attended = !!eid && !!nm && db.attendance.some(a => String(a.empId).trim() === eid && String(a.name).trim() === nm);
        if (!attended) return { ok: true, attended: false, list: [] };
        return { ok: true, attended: true, list: window.MOCK_SEED.materials };
      }
      return callServer("getMaterialsGate", { empId: empId || "", name: name || "" });
    },
    async getBanners() {
      if (IS_MOCK) { await delay(100); return { ok: true, list: window.MOCK_SEED.banners }; }
      return callServer("getBanners", {});
    },

    // ---------- 공동체 활동 포스터 갤러리 + 좋아요 ----------
    async getCommunityPosters(empId) {
      if (IS_MOCK) {
        await delay(150);
        const db = loadDB();
        const eid = String(empId || "").trim();
        const countById = {}, likedByMeSet = new Set();
        db.posterLikes.forEach(l => {
          const id = String(l.id);
          countById[id] = (countById[id] || 0) + 1;
          if (eid && String(l.empId).trim() === eid) likedByMeSet.add(id);
        });
        const list = db.communityPosters.map(row => {
          const id = String(row.id);
          return {
            id, org: row.org || "", title: row.title || "", imageUrl: row.imageUrl || "", category: row.category || "",
            likeCount: countById[id] || 0, likedByMe: likedByMeSet.has(id)
          };
        });
        return { ok: true, list };
      }
      return callServer("getCommunityPosters", { empId: empId || "" });
    },

    async likePoster({ empId, id }) {
      if (IS_MOCK) {
        await delay(150);
        const db = loadDB();
        const eid = String(empId || "").trim(), pid = String(id || "").trim();
        if (!eid) return { ok: false, message: "먼저 사번·성명을 확인해주세요." };
        if (!pid) return { ok: false, message: "포스터 정보를 찾을 수 없습니다." };
        const already = db.posterLikes.some(l => String(l.id) === pid && String(l.empId).trim() === eid);
        if (already) return { ok: false, message: "이미 이 포스터에 좋아요를 누르셨습니다." };
        db.posterLikes.push({ id: pid, empId: eid, time: new Date().toISOString() });
        saveDB(db);
        const likeCount = db.posterLikes.filter(l => String(l.id) === pid).length;
        return { ok: true, likeCount };
      }
      return callServer("likePoster", { empId: empId || "", id: id || "" });
    },

    // 발표자료 열람 기록 (누가 언제 어떤 자료를 열었는지) — 유출 발생 시 추적용
    async logMaterialView({ empId, name, org, materialTitle }) {
      if (IS_MOCK) {
        await delay(80);
        const db = loadDB();
        db.materialViews = db.materialViews || [];
        db.materialViews.push({ empId, name, org: org || "", materialTitle: materialTitle || "", viewedAt: new Date().toISOString() });
        saveDB(db);
        return { ok: true };
      }
      return callServer("logMaterialView", { empId, name, org, materialTitle });
    },

    // 발표자료 원본 파일을 pdf.js로 직접 그리기 위해 서버를 통해 받아옵니다.
    // (구글드라이브 파일을 브라우저가 직접 가져오면 CORS로 막히는 경우가 많아, 항상 서버를 거칩니다.)
    async getMaterialFile({ file }) {
      if (IS_MOCK) {
        await delay(150);
        return { ok: false, message: "MOCK 모드에서는 실제 파일 미리보기를 지원하지 않습니다. 실제 배포 후 확인해주세요." };
      }
      return callServer("getMaterialFile", { file });
    },

    // 파일 내용 전체가 아니라, 이 파일에 맞는 구글 임베드 주소만 가볍게 받아옵니다
    // (구글 슬라이드 원본이면 슬라이드 전용 임베드, 그 외엔 드라이브 미리보기 주소).
    async getMaterialEmbedUrl({ file }) {
      if (IS_MOCK) {
        await delay(100);
        const m = String(file || "").match(/\/d\/([^/]+)/) || String(file || "").match(/[?&]id=([^&]+)/);
        const id = m ? m[1] : file;
        return id ? { ok: true, embedUrl: `https://drive.google.com/file/d/${id}/preview` }
                   : { ok: false, message: "등록된 파일이 없습니다." };
      }
      return callServer("getMaterialEmbedUrl", { file });
    },

    // ---------- 방배정표 ----------
    async getRoomAssignment() {
      if (IS_MOCK) { await delay(150); return { ok: true, list: window.MOCK_SEED.rooms || [] }; }
      return callServer("getRoomAssignment", {});
    },

    // ---------- 식사조 (사무총장 동행 식사 일정) ----------
    async getMealGroups() {
      if (IS_MOCK) { await delay(150); return { ok: true, list: window.MOCK_SEED.mealGroups || [] }; }
      return callServer("getMealGroups", {});
    },

    // ---------- 네트워킹 랭킹전 ----------
    async getLeaderboard(empId) {
      if (IS_MOCK) { await delay(200); return computeLeaderboard_(loadDB(), empId); }
      return callServer("getLeaderboard", { empId: empId || "" });
    },

    // 관리자 전용 — 개인/소속 랭킹 TOP10 + 교류 다양성(소속수·직급수 기준) TOP10. PIN 필요.
    async getNetworkStats(pin) {
      if (IS_MOCK) { await delay(200); return computeNetworkStats_(loadDB(), pin); }
      return callServer("getNetworkStats", { pin: pin || "" });
    },

    // ---------- 설문조사 (만족도 / 종합평가) ----------
    async submitSurvey({ empId, name, org, role, item1, item2, item3, item4, item5, comment }) {
      if (IS_MOCK) {
        await delay(200);
        const db = loadDB();
        const match = db.roster.find(r => r.empId === empId && r.name === name);
        if (!match) return { ok: false, message: "명단에서 사번/성명을 찾을 수 없습니다. 다시 확인해주세요." };
        if (db.surveyResponses.find(r => r.empId === empId)) return { ok: false, message: "이미 설문에 참여하셨습니다. 소중한 의견 감사합니다." };
        db.surveyResponses.push({
          empId, name, org: org || match.org, role: role || match.role || "",
          item1, item2, item3, item4, item5, comment: comment || "", submittedAt: new Date().toISOString()
        });
        saveDB(db);
        return { ok: true };
      }
      return callServer("submitSurvey", { empId, name, org, role, item1, item2, item3, item4, item5, comment });
    },

    async getSurveyResults(pin) {
      if (IS_MOCK) {
        await delay(150);
        if (String(pin || "") !== MOCK_ADMIN_PIN) return { ok: false, message: "암호가 올바르지 않습니다." };
        const rows = loadDB().surveyResponses;
        const items = ["item1", "item2", "item3", "item4", "item5"];
        const averages = {};
        items.forEach(key => {
          const nums = rows.map(r => Number(r[key])).filter(n => !isNaN(n));
          averages[key] = nums.length ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10 : 0;
        });
        return { ok: true, count: rows.length, averages, list: rows };
      }
      return callServer("getSurveyResults", { pin });
    }
  };

  window.API = API;
})();
