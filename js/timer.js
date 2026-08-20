/**
 * @fileoverview 명상 세션 카운트다운 타이머, SVG 애니메이션, 웹 오디오 종소리 및 모달을 관리하는 모듈
 * @author 마음쉼 개발팀
 */

import { saveMeditationRecord, calculateStreakDays, getChallengeBadges } from './storage.js';

/**
 * 명상 타이머 상태 객체
 */
let timerState = {
  totalSeconds: 300,
  remainingSeconds: 300,
  category: '호흡',
  title: '편안한 호흡 명상',
  intervalId: null,
  isPaused: false,
  audioCtx: null,
  gainNode: null
};

// SVG 원 둘레 길이 (2 * PI * 88 = 552.92)
const CIRCLE_CIRCUMFERENCE = 553;

/**
 * Web Audio API를 활용하여 감성적인 명상 종소리(Ambient Chime)를 생성 및 재생합니다.
 * @param {number} volumeRatio - 볼륨 비율 (0.0 ~ 1.0)
 */
function playCompletionBellSound(volumeRatio = 0.8) {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // 차분하고 그윽한 맑은 힐링 주파수 (432Hz)
    osc.type = 'sine';
    osc.frequency.setValueAtTime(432, ctx.currentTime);

    // 부드러운 하모닉 톤 추가
    osc.frequency.exponentialRampToValueAtTime(216, ctx.currentTime + 3.0);

    // 볼륨 엔벨로프 (Fading out)
    gain.gain.setValueAtTime(0.01, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(volumeRatio * 0.7, ctx.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 3.5);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 3.6);
  } catch (error) {
    console.error('웹 오디오 사운드 재생 중 예외 발생:', error);
    // 예외 원인: 브라우저의 오디오 자동재생 제한 규정(Autoplay Policy)으로 인해 사용자 인터랙션 이전 오디오 생성 차단
  }
}

/**
 * 타이머 화면을 초기화하고 풀스크린 모달을 엽니다.
 * @param {number} durationMinutes - 명상 세션 시간(분)
 * @param {string} category - 명상 카테고리
 * @param {string} title - 명상 세션 제목
 */
export function startTimerSession(durationMinutes, category, title) {
  const totalSec = durationMinutes * 60;
  
  timerState.totalSeconds = totalSec;
  timerState.remainingSeconds = totalSec;
  timerState.category = category || '호흡 명상';
  timerState.title = title || `${category} 명상`;
  timerState.isPaused = false;

  // DOM 요소 참조
  const modalTimer = document.getElementById('modal-timer');
  const badgeEl = document.getElementById('timer-category-badge');
  const titleEl = document.getElementById('timer-title');
  const pauseBtn = document.getElementById('btn-pause-timer');

  if (badgeEl) badgeEl.textContent = `🏷️ ${timerState.category}`;
  if (titleEl) titleEl.textContent = timerState.title;
  if (pauseBtn) pauseBtn.textContent = '일시정지';

  updateTimerDisplay();

  if (modalTimer) modalTimer.classList.remove('hidden');

  // 카운트다운 인터벌 시작
  if (timerState.intervalId) clearInterval(timerState.intervalId);
  timerState.intervalId = setInterval(tickTimer, 1000);
}

/**
 * 매 초마다 실행되는 카운트다운 틱 함
 */
function tickTimer() {
  if (timerState.isPaused) return;

  timerState.remainingSeconds -= 1;
  updateTimerDisplay();

  if (timerState.remainingSeconds <= 0) {
    finishTimerSession();
  }
}

/**
 * SVG 타이머 숫자 및 원형 서클 프로그레스 바를 업데이트합니다.
 */
function updateTimerDisplay() {
  const minutes = Math.floor(timerState.remainingSeconds / 60);
  const seconds = timerState.remainingSeconds % 60;
  const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const displayText = document.getElementById('timer-display-text');
  const progressCircle = document.getElementById('timer-progress-circle');

  if (displayText) displayText.textContent = timeStr;

  if (progressCircle) {
    // 남은 시간 비율 (1.0 -> 0.0)
    const ratio = timerState.remainingSeconds / timerState.totalSeconds;
    const strokeOffset = CIRCLE_CIRCUMFERENCE * (1 - ratio);
    progressCircle.style.strokeDashoffset = String(strokeOffset);
  }
}

/**
 * 일시정지 / 재개 토글
 */
export function togglePauseTimer() {
  timerState.isPaused = !timerState.isPaused;
  const pauseBtn = document.getElementById('btn-pause-timer');
  if (pauseBtn) {
    pauseBtn.textContent = timerState.isPaused ? '▶ 재개하기' : '일시정지';
  }
}

/**
 * 명상 세션을 도중에 취소/종료합니다.
 */
export function stopTimerSession() {
  if (timerState.intervalId) clearInterval(timerState.intervalId);
  const modalTimer = document.getElementById('modal-timer');
  if (modalTimer) modalTimer.classList.add('hidden');
}

/**
 * 명상 카운트다운이 성공적으로 완료되었을 때 실행되는 처리 함수
 */
function finishTimerSession() {
  stopTimerSession();

  // 1. 완결 종소리 오디오 재생
  const volumeSlider = document.getElementById('timer-volume');
  const volumeVal = volumeSlider ? Number(volumeSlider.value) / 100 : 0.8;
  playCompletionBellSound(volumeVal);

  // 2. localStorage에 기록 데이터 자동 추가
  const durationMinutes = Math.round(timerState.totalSeconds / 60) || 1;
  saveMeditationRecord({
    duration: durationMinutes,
    category: timerState.category,
    title: timerState.title
  });

  // 3. 연속 명상 스트릭 및 배지 해금 상태 검사
  const streakDays = calculateStreakDays();
  const badges = getChallengeBadges();

  // 4. 완료 모달 데이터 바인딩
  const modalComp = document.getElementById('modal-completion');
  const durationText = document.getElementById('comp-duration-text');
  const streakText = document.getElementById('comp-streak-text');

  if (durationText) durationText.textContent = `${durationMinutes}분`;
  if (streakText) streakText.textContent = `🔥 ${streakDays}일 연속`;

  // 획득한 신규 배지 알림 확인
  const badgeAlert = document.getElementById('comp-badge-alert');
  const badgeNameEl = document.getElementById('comp-badge-name');
  
  const newlyUnlocked = badges.find(b => b.unlocked && b.requiredDays === streakDays);
  if (newlyUnlocked && badgeAlert && badgeNameEl) {
    badgeNameEl.textContent = `${newlyUnlocked.icon} ${newlyUnlocked.name} (${newlyUnlocked.requiredDays}일 연속 명상)`;
    badgeAlert.classList.remove('hidden');
  } else if (badgeAlert) {
    badgeAlert.classList.add('hidden');
  }

  // 5. 완료 모달 표시
  if (modalComp) modalComp.classList.remove('hidden');
}
