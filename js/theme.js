/**
 * @fileoverview 시간대별 감지, 자연 배경 이미지 및 감성 인사말을 관리하는 모듈
 * @author 마음쉼 개발팀
 */

/**
 * 시간대별 테마 정보 인터페이스 정의 (JSDoc)
 * @typedef {Object} ThemeInfo
 * @property {string} name - 시간대 명칭 ('새벽' | '아침' | '낮' | '저녁' | '밤')
 * @property {string} title - 인사말 타이틀
 * @property {string} subtitle - 인사말 서브 텍스트
 * @property {string} recTitle - 오늘의 추천 명상 제목
 * @property {string} recCategory - 추천 명상 카테고리
 * @property {number} recDuration - 추천 명상 시간(분)
 */

/** @type {Record<string, ThemeInfo>} */
const THEME_DATA = {
  '새벽': {
    name: '새벽',
    title: '🌄 차분한 안개 숲속입니다.',
    subtitle: '새로운 기운과 함께 조용히 내면을 깨워보세요.',
    recTitle: '맑은 정신을 여는 숲속 호흡',
    recDesc: '새벽의 차분하고 조용한 안개 숲 기운 속에서 깊은 호흡을 가다듬어보세요.',
    recCategory: '호흡',
    recDuration: 5
  },
  '아침': {
    name: '아침',
    title: '🌅 좋은 아침입니다.',
    subtitle: '오늘도 잠시 마음을 편안하게 쉬어가세요.',
    recTitle: '마음을 편안하게 하는 아침 명상',
    recDesc: '따스한 아침 햇살과 새소리를 배경으로 상쾌하고 활기찬 하루를 시작하세요.',
    recCategory: '아침',
    recDuration: 5
  },
  '낮': {
    name: '낮',
    title: '☀️ 햇살이 비추는 숲속입니다.',
    subtitle: '바쁜 일상 속 오아시스 같은 휴식을 선물하세요.',
    recTitle: '집중력을 깨우는 10분 이완',
    recDesc: '업무와 일상의 스트레스에서 벗어나 명확한 피로 회복과 집중력을 되찾으세요.',
    recCategory: '집중',
    recDuration: 10
  },
  '저녁': {
    name: '저녁',
    title: '🌆 노을이 깃든 잔잔한 호수입니다.',
    subtitle: '오늘 하루 지쳤던 수고와 마음을 비워내세요.',
    recTitle: '하루의 스트레스를 씻어내는 명상',
    recDesc: '붉은 노을빛처럼 오늘 하루 쌓였던 수고와 지친 마음의 긴장을 비워내세요.',
    recCategory: '마음 안정',
    recDuration: 10
  },
  '밤': {
    name: '밤',
    title: '🌙 고요한 밤하늘 아래입니다.',
    subtitle: '깊은 수면과 평온한 이완을 맞이해보세요.',
    recTitle: '편안한 잠자리를 돕는 수면 이완',
    recDesc: '고요한 밤하늘과 222Hz 싱잉볼의 울림으로 편안하고 깊은 수면에 빠져보세요.',
    recCategory: '수면',
    recDuration: 15
  }
};

/**
 * 현재 로컬 시간을 기준으로 시간대 명칭을 반환합니다.
 * @returns {string} 시간대 명칭 ('새벽' | '아침' | '낮' | '저녁' | '밤')
 */
export function getCurrentTimePeriod() {
  const now = new Date();
  const hours = now.getHours();

  if (hours >= 4 && hours < 7) {
    return '새벽';
  } else if (hours >= 7 && hours < 11) {
    return '아침';
  } else if (hours >= 11 && hours < 17) {
    return '낮';
  } else if (hours >= 17 && hours < 20) {
    return '저녁';
  } else {
    return '밤';
  }
}

/**
 * 지정된 시간대 또는 현재 로컬 시간 기준으로 배경 테마 및 DOM 요소를 업데이트합니다.
 * @param {string} [overrideTheme] - 수동으로 지정할 테마 ('auto' | '새벽' | '아침' | '낮' | '저녁' | '밤')
 * @param {number} [customMinutes] - 사용자 환경 설정에서 지정한 선호 명상 시간(분)
 * @returns {ThemeInfo & { recDuration: number }} 적용된 테마 정보 객체
 */
export function applyTheme(overrideTheme = 'auto', customMinutes) {
  let period = overrideTheme;
  
  if (!period || period === 'auto' || !THEME_DATA[period]) {
    period = getCurrentTimePeriod();
  }

  const themeInfo = THEME_DATA[period];

  // 1. Body 테마 클래스 교체
  document.body.className = '';
  document.body.classList.add(`theme-${period}`);

  // 2. 홈 탭 인사말, 시각 및 추천 명상 카드 업데이트
  const timeBadge = document.getElementById('current-time-badge');
  const greetingTitle = document.getElementById('greeting-title');
  const greetingSub = document.getElementById('greeting-sub');
  
  const recTitle = document.getElementById('rec-title');
  const recDesc = document.getElementById('rec-desc');
  const recCategory = document.getElementById('rec-category');
  const recDuration = document.getElementById('rec-duration');

  if (timeBadge) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    timeBadge.textContent = `${period} · ${timeStr}`;
  }

  const displayDuration = customMinutes || themeInfo.recDuration || 5;

  if (greetingTitle) greetingTitle.textContent = themeInfo.title;
  if (greetingSub) greetingSub.textContent = themeInfo.subtitle;
  if (recTitle) recTitle.textContent = themeInfo.recTitle;
  if (recDesc) recDesc.textContent = themeInfo.recDesc;
  if (recCategory) recCategory.textContent = `🏷️ ${themeInfo.recCategory}`;
  if (recDuration) recDuration.textContent = `⏱ ${displayDuration}분`;

  return {
    ...themeInfo,
    recDuration: displayDuration
  };
}
