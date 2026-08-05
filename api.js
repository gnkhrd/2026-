/* ===========================================================
   API 레이어
   - CONFIG.APPS_SCRIPT_URL 이 비어있으면 자동으로 MOCK(가짜 백엔드, localStorage)으로 동작
   - 값이 채워져 있으면 실제 Google Apps Script 웹앱으로 통신
   - 페이지 코드는 이 레이어의 함수만 호출하면 되고, mock/실서버 여부를 신경쓰지 않아도 됨
=========================================================== */
(function () {
  const IS_MOCK = !window.CONFIG.APPS_SCRIPT_URL;
  const LS_KEY = "gn2026_mock_db";

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
        quizResponses: [],
        surveyResponses: []
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

  // 라이브 퀴즈쇼/설문조사 결과 비공개 보호용 암호 (MOCK 모드 테스트용 — backend/Code.gs의 ADMIN_PIN 기본값과 동일)
  const MOCK_ADMIN_PIN = "0000";

  // 실서버 호출 — GAS는 커스텀 헤더/JSON Content-Type을 쓰면 CORS 프리플라이트에 걸리므로
  // text/plain 으로 보내고 서버(Code.gs)에서 JSON.parse 하는 방식을 사용합니다.
  async function callServer(action, payload) {
    const url = window.CONFIG.APPS_SCRIPT_URL;
    if (action.startsWith("get")) {
      const qs = new URLSearchParams({ action, ...payload }).toString();
      const res = await fetch(`${url}?${qs}`, { method: "GET" });
      return res.json();
    }
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action, ...payload })
    });
    return res.json();
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
        if (!already) db.scanlog.unshift({ scannerId, scannedId, time: new Date().toISOString() });
        saveDB(db);
        const profile = db.profiles.find(p => p.empId === scannedId);
        return { ok: true, profile: profile ? toDisplayProfile_(profile) : { empId: scannedId, name: "(미등록 프로필)", org: "", role: "", keywords: [], intro: "" } };
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
    async getBanners() {
      if (IS_MOCK) { await delay(100); return { ok: true, list: window.MOCK_SEED.banners }; }
      return callServer("getBanners", {});
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

    // ---------- 라이브 퀴즈쇼 ----------
    async getQuizQuestions() {
      if (IS_MOCK) {
        await delay(150);
        const list = (window.MOCK_SEED.quiz || []).slice().sort((a, b) => a.order - b.order)
          .map(q => ({ qid: q.qid, question: q.question, choice1: q.choice1, choice2: q.choice2, choice3: q.choice3, choice4: q.choice4 }));
        return { ok: true, list };
      }
      return callServer("getQuizQuestions", {});
    },

    async startQuiz({ empId, name, org }) {
      if (IS_MOCK) {
        await delay(150);
        const db = loadDB();
        const match = db.roster.find(r => r.empId === empId && r.name === name);
        if (!match) return { ok: false, message: "명단에서 사번/성명을 찾을 수 없습니다. 다시 확인해주세요." };
        const idx = db.quizResponses.findIndex(r => r.empId === empId);
        if (idx !== -1) {
          if (db.quizResponses[idx].submitAt) return { ok: false, message: "이미 응시하셨습니다." };
          db.quizResponses[idx].startAt = new Date().toISOString();
        } else {
          db.quizResponses.push({ empId, name, org: org || match.org, startAt: new Date().toISOString(), submitAt: "", answers: "", correctCount: "", totalCount: "", durationSec: "" });
        }
        saveDB(db);
        return { ok: true };
      }
      return callServer("startQuiz", { empId, name, org });
    },

    // durationSec: 브라우저에서 직접 측정해 보내주는 소요시간(우선 사용). 없으면 서버(mock db) 기록 시각으로 대체 계산.
    async submitQuiz({ empId, answers, durationSec }) {
      if (IS_MOCK) {
        await delay(200);
        const db = loadDB();
        const idx = db.quizResponses.findIndex(r => r.empId === empId);
        if (idx === -1) return { ok: false, message: "먼저 '시작하기'를 눌러주세요." };
        if (db.quizResponses[idx].submitAt) return { ok: false, message: "이미 제출하셨습니다." };
        const now = new Date();
        let finalDurationSec = Number(durationSec);
        if (!Number.isFinite(finalDurationSec) || finalDurationSec < 0) {
          const startAt = new Date(db.quizResponses[idx].startAt);
          finalDurationSec = Math.max(0, Math.round((now - startAt) / 1000));
        }
        const questions = (window.MOCK_SEED.quiz || []).slice().sort((a, b) => a.order - b.order);
        let correctCount = 0;
        questions.forEach((q, i) => { if (String(answers[i]).trim() === String(q.answer).trim()) correctCount++; });
        db.quizResponses[idx] = {
          ...db.quizResponses[idx], submitAt: now.toISOString(), answers: answers.join(","),
          correctCount, totalCount: questions.length, durationSec: finalDurationSec
        };
        saveDB(db);
        return { ok: true, correctCount, totalCount: questions.length, durationSec: finalDurationSec };
      }
      return callServer("submitQuiz", { empId, answers, durationSec });
    },

    // 결과를 1) 만점자 중 가장 빠른 순 2) 소속별 평균점수(÷출석인원) 높은 순 두 가지로 정리 (Code.gs의 actionGetQuizLeaderboard_와 동일 로직)
    async getQuizLeaderboard(pin) {
      if (IS_MOCK) {
        await delay(150);
        if (String(pin || "") !== MOCK_ADMIN_PIN) return { ok: false, message: "암호가 올바르지 않습니다." };
        const db = loadDB();
        const rows = db.quizResponses.filter(r => r.submitAt);

        const perfectScorers = rows
          .filter(r => Number(r.totalCount) > 0 && Number(r.correctCount) === Number(r.totalCount))
          .slice().sort((a, b) => Number(a.durationSec) - Number(b.durationSec));

        const attendanceCountByOrg = {};
        db.attendance.forEach(a => {
          const org = a.org || "(미지정)";
          attendanceCountByOrg[org] = (attendanceCountByOrg[org] || 0) + 1;
        });
        const scoreSumByOrg = {};
        rows.forEach(r => {
          const org = r.org || "(미지정)";
          scoreSumByOrg[org] = (scoreSumByOrg[org] || 0) + Number(r.correctCount || 0);
        });
        const orgRanking = Object.keys(attendanceCountByOrg).map(org => {
          const attCount = attendanceCountByOrg[org];
          const totalScore = scoreSumByOrg[org] || 0;
          const avgScore = attCount > 0 ? Math.round((totalScore / attCount) * 100) / 100 : 0;
          return { org, totalScore, attendanceCount: attCount, avgScore };
        }).sort((a, b) => b.avgScore - a.avgScore);

        return { ok: true, perfectScorers, orgRanking };
      }
      return callServer("getQuizLeaderboard", { pin });
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
