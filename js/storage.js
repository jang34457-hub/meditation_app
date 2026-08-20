/**
 * @fileoverview localStorage를 활용하여 명상 기록, 유저 설정, 통계 및 챌린지 배지를 관리하는 스토리지 모듈
 * @author 마음쉼 개발팀
 */

/**
 * 명상 세션 기록 단일 개체 정의 (JSDoc)
 * @typedef {Object} MeditationRecord
 * @property {string} id - 고유 식별자
 * @property {string} date - 연-월-일 (YYYY-MM-DD)
 * @property {string} time - 시:분 (HH:MM)
 * @property {number} duration - 명상 시간(분)
 * @property {string} category - 명상 카테고리
 * @property {string} title - 명상 제목
 */

/**
 * 유저 환경 설정 개체 정의 (JSDoc)
 * @typedef {Object} UserSettings
 * @property {number} defaultMinutes - 기본 선호 명상 시간(분)
 * @property {string} themeOverride - 수동 배경 테마 설정 ('auto' | '새벽' | '아침' | '낮' | '저녁' | '밤')
 * @property {number} soundVolume - 기본 오디오 볼륨 (0~100)
 */

/**
 * 챌린지 배지 정보 개체 정의 (JSDoc)
 * @typedef {Object} ChallengeBadge
 * @property {string} id - 배지 아이디
 * @property {string} name - 배지 이름
 * @property {string} icon - 배지 이모지 아이콘
 * @property {number} requiredDays - 달성에 필요한 연속 일수
 * @property {boolean} unlocked - 해금 여부
 */

const STORAGE_KEYS = {
  HISTORY: 'mindful_meditation_history',
  SETTINGS: 'mindful_user_settings'
};

/**
 * 기본 환경 설정값
 * @type {UserSettings}
 */
const DEFAULT_SETTINGS = {
  defaultMinutes: 5,
  themeOverride: 'auto',
  soundVolume: 80
};

/**
 * 명상 기록 목록을 localStorage에서 읽어옵니다.
 * @returns {MeditationRecord[]} 명상 기록 배열
 */
export function getHistoryRecords() {
  try {
    const rawData = localStorage.getItem(STORAGE_KEYS.HISTORY);
    return rawData ? JSON.parse(rawData) : [];
  } catch (error) {
    console.error('명상 기록 데이터를 불러오는 중 오류가 발생했습니다:', error);
    // 오류 발생 원인: localStorage 데이터 손상 또는 사용자 보안 설정에 의한 브라우저 접근 제한
    return [];
  }
}

/**
 * 새로운 명상 성공 세션을 localStorage에 저장합니다.
 * @param {Omit<MeditationRecord, 'id' | 'date' | 'time'>} recordData - 추가할 명상 정보
 * @returns {MeditationRecord} 저장된 명상 레코드
 */
export function saveMeditationRecord(recordData) {
  try {
    const records = getHistoryRecords();
    const now = new Date();
    
    // YYYY-MM-DD 형식 추출 (로컬 시간 기준)
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;

    /** @type {MeditationRecord} */
    const newRecord = {
      id: `med_${Date.now()}`,
      date: dateStr,
      time: timeStr,
      duration: Number(recordData.duration),
      category: recordData.category,
      title: recordData.title
    };

    records.unshift(newRecord); // 최근 기록이 가장 앞에 오도록 저장
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(records));
    return newRecord;
  } catch (error) {
    console.error('명상 기록 저장 실패:', error);
    throw new Error('localStorage 용량이 초과되었거나 보안 설정으로 저장이 거부되었습니다.');
  }
}

/**
 * 유저 설정 정보를 저장소에서 가져옵니다.
 * @returns {UserSettings} 설정 정보 객체
 */
export function getUserSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch (error) {
    console.error('설정 정보를 가져오는 중 오류가 발생했습니다:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * 유저 설정 정보를 저장소에 저장합니다.
 * @param {Partial<UserSettings>} newSettings - 변경할 설정값
 * @returns {UserSettings} 업데이트된 설정 정보
 */
export function saveUserSettings(newSettings) {
  try {
    const current = getUserSettings();
    const updated = { ...current, ...newSettings };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('설정 저장 실패:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * 연속 명상 일수 (Streak 🔥)를 자동 계산합니다.
 * @returns {number} 연속 일수
 */
export function calculateStreakDays() {
  const records = getHistoryRecords();
  if (records.length === 0) return 0;

  // 유일한 날짜 목록 추출 (내림차순 정렬)
  const uniqueDates = Array.from(new Set(records.map(r => r.date))).sort().reverse();
  if (uniqueDates.length === 0) return 0;

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  // 오늘 또는 어제 명상한 기록이 없으면 연속 스트릭 0일
  if (!uniqueDates.includes(todayStr) && !uniqueDates.includes(yesterdayStr)) {
    return 0;
  }

  let streak = 0;
  let checkDate = uniqueDates.includes(todayStr) ? new Date(today) : new Date(yesterday);

  while (true) {
    const dateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
    if (uniqueDates.includes(dateStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1); // 하루 전으로 이동
    } else {
      break;
    }
  }

  return streak;
}

/**
 * 핵심 명상 통계 데이터를 집계하여 반환합니다.
 * @returns {{ monthCount: number, totalMinutes: number, streakDays: number, favoriteCategory: string }} 통계 요약
 */
export function getStatsSummary() {
  const records = getHistoryRecords();
  const streakDays = calculateStreakDays();

  const now = new Date();
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  let monthCount = 0;
  let totalMinutes = 0;
  /** @type {Record<string, number>} */
  const categoryCounts = {};

  records.forEach(rec => {
    totalMinutes += rec.duration;
    
    if (rec.date.startsWith(currentYearMonth)) {
      monthCount++;
    }

    categoryCounts[rec.category] = (categoryCounts[rec.category] || 0) + 1;
  });

  // 최애 카테고리 산출
  let favoriteCategory = '-';
  let maxCount = 0;
  for (const [cat, count] of Object.entries(categoryCounts)) {
    if (count > maxCount) {
      maxCount = count;
      favoriteCategory = cat;
    }
  }

  return {
    monthCount,
    totalMinutes,
    streakDays,
    favoriteCategory
  };
}

/**
 * 챌린지 배지 상태 목록을 가져옵니다.
 * @returns {ChallengeBadge[]} 배지 목록
 */
export function getChallengeBadges() {
  const streakDays = calculateStreakDays();

  /** @type {ChallengeBadge[]} */
  const badges = [
    { id: 'badge_3d', name: '씨앗 🌱', icon: '🌱', requiredDays: 3, unlocked: streakDays >= 3 },
    { id: 'badge_7d', name: '새싹 🌿', icon: '🌿', requiredDays: 7, unlocked: streakDays >= 7 },
    { id: 'badge_14d', name: '나무 🌳', icon: '🌳', requiredDays: 14, unlocked: streakDays >= 14 },
    { id: 'badge_30d', name: '숲 🌲', icon: '🌲', requiredDays: 30, unlocked: streakDays >= 30 }
  ];

  return badges;
}
