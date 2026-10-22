/* MBTI 판정기 v2.1 — 글 한 편에서 지표별 근거를 세어 MBTI를 정합니다.
   논문 4.2 ①(글의 주제 어휘가 판정을 끌었다)을 규칙으로 옮긴 것이며, 실제 성격 검사가 아닙니다.
   v2.1: 열린 질문의 흔한 답 표현(실력, 재밌다, 내킬 때, 루틴 등) 추가.
   v1 대비: 단어 목록 확장, 부정 표현 처리("계획 없이", "좋아하지 않는다"), 문장 패턴 근거, 흔한 단어 가중치 낮춤. */
(function (root) {
  "use strict";

  var MAX_LEN = 5000;

  // 항목: "단어" 또는 "단어:가중치" (영어는 단어 단위, 한국어는 포함 여부) / 정규식은 [RegExp, 가중치, 표시 이름]
  var LEX = {
    E: [
      "여럿이", "모여서", "동호회", "함께하", "같이 운동", "사람들을 만나",
      "함께", "다 같이", "같이 하", "같이 밥", "같이 놀", "친구들", "친구랑", "친구와", "친구들과", "사람들과", "사람들이랑", "여러분",
      "모임", "형님", "사랑합니다", "파티", "축제", "만나", "어울", "수다", "놀았", "놀러", "회의", "팀원", "동아리", "이끄",
      "먼저 말", "말을 걸", "말을 꺼", "친해", "단체", "공연", "무대", "토론", "대화하", "캠핑", "축구", "노래방", "에너지가 생",
      "사람들 사이", "우리:0.3", "사람들:0.5", "친구:0.5",
      "we", "us", "our", "together", "friends", "people", "everyone", "party", "you:0.5", "your:0.5", "yourself"
    ],
    I: [
      "혼자서", "혼자 하", "혼자하", "조용히", "나 혼자", "혼자만의", "집중",
      "혼자", "조용", "내면", "스스로", "나만의", "집에서", "집에 ", "새벽", "일기", "책을 읽", "책 읽", "깊은 대화", "한두 명",
      "지쳐", "쉬어야", "들여다", "생각하게", "생각하", "생각해", "생각:0.5", "고민", "상상", "소설", "글을 쓰", "혼잣",
      "저는:0.5", "제가:0.5", "저의:0.5", "나는:0.5", "내가:0.5", "나라면",
      "i:0.5", "me:0.5", "my:0.5", "myself", "alone", "quiet", "think"
    ],
    S: [
      "몸이", "몸을", "땀", "근육", "맛있", "눈으로", "손에",
      "헬스", "운동", "기구", "맨몸", "노래", "가사", "자격증", "대학교", "실무", "경험", "구체", "실제", "현실", "직접", "몸으로", "손으로",
      "만져", "현장", "요리", "레시피", "재료", "저울", "숙소", "항공권", "예약", "표로", "노트", "라면", "떡볶이", "모래", "버스",
      "선풍기", "모터", "분해", "조립", "축구", "캠핑", "산책", "빗소리", "골목", "지도", "영상", "매출", "예산",
      [/\d+\s?(시|일|주|월|년|%|개|번|회|분|시간)/g, 0.5, "숫자·날짜"],
      "practical", "detail", "fact", "real"
    ],
    N: [
      "깨달", "생각이 떠오", "다르게 보", "큰 그림", "새로운 방식",
      "창의", "상상", "의미", "가능성", "꿈", "영감", "본질", "별이", "별을", "별처럼", "별빛", "밤하늘", "우주", "세계", "미래", "아이디어",
      "개념", "철학", "비전", "언젠가", "상징", "이론", "원리", "구조", "흐름", "관점", "질문", "반례", "정교", "변화", "연결",
      "기획", "전략", "방향", "이야기를 만들", "소설", "왜 사는", "좋은 삶", "삶의", "성장", "어떤 사람이 될",
      "stars", "star", "constellation", "dream", "imagine", "hope", "become", "wiser", "meaning", "future"
    ],
    T: [
      "실력", "느는", "늘어", "잘하", "이기", "합리", "이득", "손해", "가성비", "비용", "가격", "장단점", "기준", "조건", "완성도", "꼼꼼", "실용", "도움이 되", "쓸모",
      "분석", "논리", "효율", "이유", "원인", "결과", "성과", "전문", "지식", "실무", "요구사항", "취득", "체득", "인재", "판단",
      "객관", "정확", "비교", "해결", "데이터", "기술", "근거", "따져", "따지", "반박", "허점", "이론", "원리", "점검", "확인",
      "우선순위", "처리", "예산", "항목", "매출", "설득", "명확", "질을 높", "피드백", "주장", "구조", "숫자", "감정보다", "토론:0.5", "철학:0.5", "생각을 정리",
      "logic", "analysis", "efficient", "reason", "result", "skill", "knowledge"
    ],
    F: [
      "좋아져", "기분이 좋", "재밌", "재미", "뿌듯", "보람", "감동", "마음이 편", "배려", "미안", "응원", "신나", "좋아서:0.5",
      "스트레스", "힐링", "자신감", "마음", "사랑", "감사", "영광", "행복", "즐거", "즐겁", "기분", "위로", "설레", "가슴", "눈물", "고마",
      "외로", "슬프", "따뜻", "공감", "기쁘", "기뻤", "느낌", "느낀", "감정", "아픔", "힘들", "곁에", "챙기", "챙긴", "반겨",
      "편안", "웃으", "웃을", "살아 있다", "힘이 되", "돕", "봉사", "소외",
      "love", "heart", "feel", "happy", "thank", "kind", "hope"
    ],
    J: [
      "정해 놓", "정해 두", "규칙적", "루틴", "꼬박꼬박", "일정한", "시간을 정", "계획적",
      "계획", "목표", "졸업", "준비", "일정", "체계", "순서", "마감", "먼저 ", "그 후", "이후", "단계", "규칙", "꾸준", "매일",
      "미리", " 전 ", "점검", "우선순위", "예약", "정해", "정하고", "정한", "지킨", "반드시", "꼭 ", "관리", "역할", "주간", "매주",
      "매달", "기록", "메모", "레시피를 정확", "정리:0.5",
      [/(하기로|보기로|타기로)\s?했/g, 0.5, "~기로 했다"],
      [/[0-9]+\s?(시|월|일|주|년)/g, 0.5, "날짜·시각"],
      "plan", "goal", "schedule", "deadline", "organize", "step"
    ],
    P: [
      "내킬 때", "시간 날 때", "생각날 때", "가끔", "아무 때나", "그날 기분", "자유롭", "되는 대로", "상황 봐서", "유연",
      "하거나", "안된다면", "따라부르", "즉흥", "그때그때", "자유", "즐기", "마음을 놓", "마실", "아마", "어쩌면", "갑자기", "충동",
      "여행", "그냥", "일단", "대충", "발길", "닿는 대로", "가는 대로", "기분 따라", "내키는", "이것저것", "부딪히", "모르지만",
      "그때 가서", "내일 일은", "상관없", "예상하지 못", "시간 가는 줄", "바로 행동", "밤새", "밤늦게",
      "maybe", "might", "whatever", "spontaneous", "free", "perhaps"
    ]
  };
  // 부정: 단어 바로 뒤에 이런 말이 오면 그 단어는 근거에서 뺍니다. J 단어가 부정되면 P 근거로 셉니다.
  var NEG_AFTER = /^[^.!?\n]{0,5}?(없|않|안 |싫|못 )/;
  var NEG_BEFORE = /(안|못)\s$/;

  var AXES = [
    { l: "E", r: "I", desc: "외향 / 내향", def: "I" },
    { l: "S", r: "N", desc: "감각 / 직관", def: "S" },
    { l: "T", r: "F", desc: "사고 / 감정", def: "F" },
    { l: "J", r: "P", desc: "판단 / 인식", def: "P" }
  ];
  var LEVEL = [null, "매우 낮음", "낮음", "보통", "높음"];

  function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

  var COMPILED = {};
  Object.keys(LEX).forEach(function (k) {
    COMPILED[k] = LEX[k].map(function (item) {
      if (Array.isArray(item)) return { word: item[2], w: item[1], re: item[0], pattern: true };
      var m = item.match(/^(.*):([\d.]+)$/);
      var word = m ? m[1] : item, w = m ? parseFloat(m[2]) : 1;
      var en = /^[a-z' ]+$/.test(word);
      var re = en ? new RegExp("\\b" + escapeRe(word) + "\\b", "g") : new RegExp(escapeRe(word), "g");
      return { word: word.trim(), w: w, re: re, pattern: false };
    });
  });

  function textLength(t) { return String(t || "").replace(/\s+/g, "").length; }
  function lengthLevel(n) { return n < 40 ? 1 : n < 120 ? 2 : n < 300 ? 3 : 4; }

  // 한 글자(예: J)의 근거를 센다. 부정된 J 근거는 bonusP 로 돌려준다.
  function scoreLetter(text, letter) {
    var total = 0, hits = [], negated = 0;
    COMPILED[letter].forEach(function (e) {
      e.re.lastIndex = 0;
      var m, n = 0;
      while ((m = e.re.exec(text)) !== null) {
        if (m[0] === "") { e.re.lastIndex++; continue; }
        var after = text.slice(m.index + m[0].length, m.index + m[0].length + 8);
        var before = text.slice(Math.max(0, m.index - 3), m.index);
        if (!e.pattern && (NEG_AFTER.test(after) || NEG_BEFORE.test(before))) { negated += e.w; continue; }
        n++;
      }
      if (n) { total += n * e.w; hits.push(e.word + (n > 1 ? "×" + n : "")); }
    });
    return { total: total, hits: hits, negated: negated };
  }

  // 글 한 편을 판정한다
  function judge(raw) {
    var text = String(raw || "").toLowerCase().slice(0, MAX_LEN);
    var len = textLength(text);
    var axes = AXES.map(function (ax) {
      var a = scoreLetter(text, ax.l), b = scoreLetter(text, ax.r);
      if (ax.l === "J" && a.negated) { b.total += a.negated; b.hits.push("계획 없음"); }
      a.total = Math.round(a.total * 10) / 10; b.total = Math.round(b.total * 10) / 10;
      var pick = a.total > b.total ? ax.l : b.total > a.total ? ax.r : ax.def;
      return { ax: ax, left: a, right: b, pick: pick, weak: Math.abs(a.total - b.total) < 1 };
    });
    var evidence = axes.reduce(function (s, x) { return s + x.left.total + x.right.total; }, 0);
    var weakCount = axes.filter(function (x) { return x.weak; }).length;
    var level = lengthLevel(len);
    if (weakCount >= 2) level = Math.min(level, 2);
    else if (weakCount === 1) level = Math.min(level, 3);
    var hold = evidence < 1;
    return { type: hold ? null : axes.map(function (x) { return x.pick; }).join(""), axes: axes, len: len, evidence: evidence, weakCount: weakCount, level: hold ? 1 : level };
  }

  // 문장 단위로 앞부분만 잘라 다시 판정한다 (길이에 따른 흔들림)
  function splitSentences(t) {
    var parts = String(t).match(/[^.!?。\n]+[.!?。"”']*/g) || [];
    return parts.map(function (s) { return s.trim(); }).filter(Boolean);
  }
  function truncationTest(t) {
    var s = splitSentences(t);
    if (s.length < 3) return null;
    var k1 = Math.max(1, Math.ceil(s.length / 3)), k2 = Math.max(k1 + 1, Math.ceil(s.length * 2 / 3));
    if (k2 >= s.length) k2 = s.length - 1;
    return [
      { label: "앞 " + k1 + "문장", text: s.slice(0, k1).join(" ") },
      { label: "앞 " + k2 + "문장", text: s.slice(0, k2).join(" ") },
      { label: "전체 " + s.length + "문장", text: s.join(" ") }
    ].map(function (r) { var j = judge(r.text); return { label: r.label, len: j.len, type: j.type }; });
  }

  var api = { judge: judge, truncationTest: truncationTest, textLength: textLength, lengthLevel: lengthLevel, AXES: AXES, LEVEL: LEVEL, version: "v2.1" };
  if (typeof module === "object" && module.exports) module.exports = api; else root.MBTIJudge = api;
})(this);
