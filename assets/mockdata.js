/* ===========================================================
   MOCK 모드용 샘플 데이터
   실제 서비스에서는 전부 Google Sheets 데이터로 대체됩니다.
   테스트용 사번: 10001 ~ 10005
=========================================================== */
window.MOCK_SEED = {
  // role(직급)은 출석체크 화면의 "직급별 인원수" 통계에 사용됩니다.
  roster: [
    { empId: "10001", name: "김민준", org: "본부 GN컬쳐팀", role: "주임" },
    { empId: "10002", name: "이서연", org: "충남지부", role: "대리" },
    { empId: "10003", name: "박도윤", org: "경남지부", role: "과장" },
    { empId: "10004", name: "최지우", org: "광주지부", role: "주임" },
    { empId: "10005", name: "정하은", org: "인천북부아동보호전문기관", role: "팀장" }
  ],
  // 출석체크 화면의 시각화(권역별/직급별 차트)를 테스트할 때 바로 보이도록 미리 넣어둔 샘플입니다.
  // 실제로 출석체크를 진행하면 이 목록에 새 기록이 계속 추가됩니다.
  attendance: [
    { empId: "10001", name: "김민준", org: "본부 GN컬쳐팀", role: "주임", time: "2026-09-01T04:10:00.000Z" },
    { empId: "10002", name: "이서연", org: "충남지부", role: "대리", time: "2026-09-01T04:12:00.000Z" },
    { empId: "10003", name: "박도윤", org: "경남지부", role: "과장", time: "2026-09-01T04:15:00.000Z" }
  ],
  // keywords는 실제 시트와 동일하게 "쉼표로 구분된 문자열"로 저장합니다 (배열 아님).
  // 10001~10003은 이미 명함을 만든 사람, 10004~10005는 아직 안 만든 사람(정상 상태)입니다.
  profiles: [
    { empId: "10001", name: "김민준", org: "본부 GN컬쳐팀", role: "주임", keywords: "기획, 네트워킹, 커피", intro: "이번 정책연수 웹페이지 만든 사람입니다 :)", photo: "" },
    { empId: "10002", name: "이서연", org: "충남지부", role: "대리", keywords: "아동보호, 달리기", intro: "충남에서 왔습니다, 반가워요!", photo: "" },
    { empId: "10003", name: "박도윤", org: "경남지부", role: "과장", keywords: "미래성장지원, 등산", intro: "지부 자립지원 담당하고 있어요.", photo: "" }
  ],
  // 랭킹전(리더보드) 테스트용 스캔 기록 샘플 (실제로는 qr-card.html에서 서로 QR을 찍을 때마다 쌓입니다)
  // 로스터가 5명뿐이라 마일스톤(10/30/50회) 보너스는 이 샘플로는 발동하지 않습니다 — 정상입니다.
  scanlog: [
    { scannerId: "10001", scannedId: "10002", time: "2026-09-01T13:10:00.000Z" },
    { scannerId: "10001", scannedId: "10003", time: "2026-09-01T13:15:00.000Z" },
    { scannerId: "10001", scannedId: "10004", time: "2026-09-01T13:20:00.000Z" },
    { scannerId: "10002", scannedId: "10001", time: "2026-09-01T13:11:00.000Z" },
    { scannerId: "10002", scannedId: "10003", time: "2026-09-01T14:05:00.000Z" },
    { scannerId: "10003", scannedId: "10001", time: "2026-09-01T13:16:00.000Z" },
    { scannerId: "10004", scannedId: "10001", time: "2026-09-01T13:21:00.000Z" },
    { scannerId: "10004", scannedId: "10002", time: "2026-09-01T15:00:00.000Z" },
    { scannerId: "10004", scannedId: "10003", time: "2026-09-01T15:05:00.000Z" },
    { scannerId: "10004", scannedId: "10005", time: "2026-09-01T15:10:00.000Z" },
    { scannerId: "10005", scannedId: "10004", time: "2026-09-01T15:11:00.000Z" }
  ],
  // tag: 홈 화면 "오늘의 일정"에 뽑아서 보여줄 항목 표시용 키워드 (선택 입력, config.js의 HOME_SCHEDULE_KEYWORD와 매칭)
  schedule: [
    { date: "2026-09-01", time: "12:30", title: "등록 및 접수", speaker: "", tag: "오늘" },
    { date: "2026-09-01", time: "13:00", title: "개회예배", speaker: "이일하 이사장", tag: "오늘" },
    { date: "2026-09-01", time: "13:40", title: "직원소개", speaker: "", tag: "오늘" },
    { date: "2026-09-01", time: "14:00", title: "비전공유", speaker: "사무총장", tag: "" },
    { date: "2026-09-01", time: "14:50", title: "특별강연", speaker: "협의중", tag: "" },
    { date: "2026-09-01", time: "16:20", title: "기조강연 — 콜렉티브 임팩트", speaker: "이봉주 교수", tag: "" },
    { date: "2026-09-02", time: "09:30", title: "주제·사례발표 (GN 파이어사이드 챗)", speaker: "", tag: "" },
    { date: "2026-09-02", time: "13:30", title: "공동체 프로그램 (G-BU-Ting)", speaker: "", tag: "" },
    { date: "2026-09-03", time: "09:30", title: "공동체활동 결과공유", speaker: "", tag: "" },
    { date: "2026-09-03", time: "10:40", title: "장기근속 시상", speaker: "", tag: "" },
    { date: "2026-09-03", time: "11:40", title: "폐회예배", speaker: "", tag: "" }
  ],
  materials: [
    { title: "기조강연 - 콜렉티브 임팩트", speaker: "이봉주 교수", file: "" },
    { title: "주제발표1 - 사업의 패러다임 전환(CRC)", speaker: "아동권리사업부", file: "" },
    { title: "주제발표2 - 성과에서 옹호로(Advocacy)", speaker: "아동권리옹호부", file: "" },
    { title: "주제발표3 - 굿네이버스형 콜렉티브 임팩트", speaker: "임팩트사업부", file: "" }
  ],
  banners: [
    { emoji: "🛏️", title: "방배정표", url: "" },
    { emoji: "🍽️", title: "식사장소·식사조", url: "" },
    { emoji: "🗺️", title: "연수원 지도", url: "" },
    { emoji: "📋", title: "기본수칙 안내", url: "" }
  ]
};
