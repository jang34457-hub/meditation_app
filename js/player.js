/**
 * @fileoverview 유튜브 힐링 명상 비디오 플레이어 제어, 전면 시네마 뷰 전환, 일시정지/재생/완료 인터랙션 모듈
 * @author 마음쉼 개발팀
 */

import { saveMeditationRecord, calculateStreakDays, getChallengeBadges } from './storage.js';

/**
 * 테마별 유튜브 명상 콘텐츠 매핑 정보 (JSDoc)
 * @typedef {Object} ThemeYouTubeContent
 * @property {string} ytid - 유튜브 비디오 ID
 * @property {string} title - 명상 비디오 제목
 * @property {string} category - 카테고리
 */

/** @type {Record<string, ThemeYouTubeContent>} */
export const THEME_YOUTUBE_MAP = {
  '마음 안정': {
    ytid: 'XTPneQHiGY4',
    title: '심신안정 스트레스 정화 싱잉볼 힐링 + 숲 새소리',
    category: '마음 안정'
  },
  '호흡': {
    ytid: 'lYJ17n_oUkA',
    title: '머리가 맑아지는 숲소리 ASMR (새소리, 바람소리)',
    category: '호흡'
  },
  '수면': {
    ytid: '-bGZS8wr-mU',
    title: '티벳 싱잉볼 연주 (222Hz) 수면 유도 명상',
    category: '수면'
  },
  '집중': {
    ytid: 'RtPwBk0pqKE',
    title: '하루 10분 긴장이완 및 편안한 명상 음악',
    category: '집중'
  },
  '아침': {
    ytid: 'pywxuQJk3vc',
    title: '숲을 걷는 효과, 힐링 음악 및 새소리',
    category: '아침'
  }
};

/**
 * 명상 세션 실행 상태
 */
let sessionState = {
  category: '마음 안정',
  durationMinutes: 5,
  remainingSeconds: 300,
  intervalId: null,
  isPaused: false,
  iframeElement: null
};

/**
 * 선택한 명상 테마와 시간에 맞춰 전면 시네마 뷰로 전환하고 유튜브 영상을 플레이합니다.
 * @param {string} category - 명상 테마 카테고리
 * @param {number} durationMinutes - 명상 세션 시간(분)
 */
export function startCinemaMeditationSession(category, durationMinutes) {
  const content = THEME_YOUTUBE_MAP[category] || THEME_YOUTUBE_MAP['마음 안정'];
  
  sessionState.category = category;
  sessionState.durationMinutes = durationMinutes;
  sessionState.remainingSeconds = durationMinutes * 60;
  sessionState.isPaused = false;

  const setupView = document.getElementById('meditate-setup-view');
  const playerView = document.getElementById('meditate-player-view');
  const titleEl = document.getElementById('cinema-med-title');
  const iframeHolder = document.getElementById('youtube-iframe-holder');
  const pausePlayBtn = document.getElementById('btn-toggle-pause-play');

  if (!setupView || !playerView || !iframeHolder) return;

  if (titleEl) {
    titleEl.textContent = `${category} 명상 (${durationMinutes}분) · ${content.title}`;
  }

  if (pausePlayBtn) {
    pausePlayBtn.textContent = '⏸️ 일시정지';
  }

  // 1. 유튜브 iframe 생성 (JS API enablejsapi=1)
  iframeHolder.innerHTML = `
    <iframe 
      id="youtube-player-iframe"
      src="https://www.youtube.com/embed/${content.ytid}?enablejsapi=1&autoplay=1&controls=1&rel=0" 
      title="${content.title}" 
      frameborder="0" 
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
      allowfullscreen>
    </iframe>
  `;

  sessionState.iframeElement = document.getElementById('youtube-player-iframe');

  // 2. 화면 전환: 설정 카드 뷰 숨기고 전면 플레이어 뷰 노출
  setupView.classList.add('hidden');
  playerView.classList.remove('hidden');
  playerView.scrollIntoView({ behavior: 'smooth' });

  // 3. 타이머 카운트다운 인터벌 시작
  updateCountdownDisplay();
  if (sessionState.intervalId) clearInterval(sessionState.intervalId);
  sessionState.intervalId = setInterval(tickSessionTimer, 1000);
}

/**
 * 틱 카운트다운
 */
function tickSessionTimer() {
  if (sessionState.isPaused) return;

  sessionState.remainingSeconds -= 1;
  updateCountdownDisplay();

  if (sessionState.remainingSeconds <= 0) {
    finishMeditationSession();
  }
}

/**
 * 카운트다운 mm:ss 갱신
 */
function updateCountdownDisplay() {
  const countdownEl = document.getElementById('cinema-countdown');
  if (!countdownEl) return;

  const minutes = Math.floor(sessionState.remainingSeconds / 60);
  const seconds = sessionState.remainingSeconds % 60;
  countdownEl.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * 일시정지 / 재생 토글 기능 (비디오 및 소리 멈춤 제어)
 */
export function togglePausePlayMeditation() {
  const pausePlayBtn = document.getElementById('btn-toggle-pause-play');
  const iframe = sessionState.iframeElement;

  if (sessionState.isPaused) {
    // 재생 재개
    sessionState.isPaused = false;
    if (pausePlayBtn) pausePlayBtn.textContent = '⏸️ 일시정지';

    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
    }
  } else {
    // 일시정지 (비디오 & 음악 멈춤)
    sessionState.isPaused = true;
    if (pausePlayBtn) pausePlayBtn.textContent = '▶️ 재생하기';

    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
    }
  }
}

/**
 * 명상 세션을 성공적으로 완결하고 비디오를 멈춘 뒤 모달을 표시합니다.
 */
export function finishMeditationSession() {
  stopAndResetPlayer();

  // localStorage 저장
  saveMeditationRecord({
    duration: sessionState.durationMinutes,
    category: sessionState.category,
    title: `${sessionState.category} 명상`
  });

  // 스트릭 및 배지 해금 체크
  const streakDays = calculateStreakDays();
  const badges = getChallengeBadges();

  const modalComp = document.getElementById('modal-completion');
  const durationText = document.getElementById('comp-duration-text');
  const streakText = document.getElementById('comp-streak-text');

  if (durationText) durationText.textContent = `${sessionState.durationMinutes}분`;
  if (streakText) streakText.textContent = `🔥 ${streakDays}일 연속`;

  const badgeAlert = document.getElementById('comp-badge-alert');
  const badgeNameEl = document.getElementById('comp-badge-name');
  
  const newlyUnlocked = badges.find(b => b.unlocked && b.requiredDays === streakDays);
  if (newlyUnlocked && badgeAlert && badgeNameEl) {
    badgeNameEl.textContent = `${newlyUnlocked.icon} ${newlyUnlocked.name} (${newlyUnlocked.requiredDays}일 연속 명상)`;
    badgeAlert.classList.remove('hidden');
  } else if (badgeAlert) {
    badgeAlert.classList.add('hidden');
  }

  // 모달 표출
  if (modalComp) modalComp.classList.remove('hidden');
}

/**
 * 명상 플레이를 완전 중단하고 비디오/소리를 멈춘 뒤 화면을 설정 뷰로 복귀시킵니다.
 */
export function stopAndResetPlayer() {
  if (sessionState.intervalId) clearInterval(sessionState.intervalId);

  const iframe = sessionState.iframeElement;
  if (iframe && iframe.contentWindow) {
    iframe.contentWindow.postMessage('{"event":"command","func":"stopVideo","args":""}', '*');
  }

  const iframeHolder = document.getElementById('youtube-iframe-holder');
  if (iframeHolder) iframeHolder.innerHTML = '';

  const setupView = document.getElementById('meditate-setup-view');
  const playerView = document.getElementById('meditate-player-view');

  if (playerView) playerView.classList.add('hidden');
  if (setupView) setupView.classList.remove('hidden');

  sessionState.isPaused = false;
  sessionState.iframeElement = null;
}
