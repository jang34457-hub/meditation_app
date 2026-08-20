/**
 * @fileoverview 마음쉼 명상 서비스의 3-카드 홈 화면, 명상 탭 세션 및 비디오 플레이 제어 메인 오케스트레이터
 * @author 마음쉼 개발팀
 */

import { applyTheme } from './theme.js';
import { 
  getStatsSummary, 
  getUserSettings, 
  saveUserSettings 
} from './storage.js';
import { 
  startCinemaMeditationSession, 
  togglePausePlayMeditation, 
  finishMeditationSession, 
  stopAndResetPlayer 
} from './player.js';
import { 
  renderCalendar, 
  renderChallengeBadges, 
  navigatePrevMonth, 
  navigateNextMonth 
} from './calendar.js';

/**
 * 전역 앱 초기화
 */
document.addEventListener('DOMContentLoaded', () => {
  try {
    initApp();
  } catch (error) {
    console.error('마음쉼 서비스 초기화 중 오류가 발생했습니다:', error);
    // 오류 원인: DOM 요소 부재 또는 브라우저 모듈 호환성 문제
  }
});

function initApp() {
  const settings = getUserSettings();

  // 1. 테마 적용
  applyTheme(settings.themeOverride);

  // 2. 4대 메뉴 내비게이션 초기화
  initNavigation();

  // 3. 홈 화면 3개 카드 구조 데이터 동기화
  refreshHomeScreen();

  // 4. 명상 탭 및 전면 플레이어 컨트롤러 초기화
  initMeditationTab();

  // 5. 달력 및 기록 탭 이벤트 초기화
  initCalendarEvents();

  // 6. 설정 탭 이벤트 초기화
  initSettingsTab();

  // 7. 모달 이벤트 초기화
  initModalEvents();
}

/**
 * 4개 메뉴 (홈, 명상, 기록, 설정) 내비게이션 바인딩
 */
function initNavigation() {
  const allNavItems = document.querySelectorAll('.nav-item');
  const tabContents = document.querySelectorAll('.tab-content');

  allNavItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetTabId = item.getAttribute('data-tab');
      if (!targetTabId) return;

      // 이전 진행 중이던 비디오 플레이어가 있다면 탭 이동 시 멈춤 및 리셋
      stopAndResetPlayer();

      // 설정 화면 탈출 및 탭 이동 시 자동 저장 보장
      saveTabSettings();

      allNavItems.forEach(nav => {
        if (nav.getAttribute('data-tab') === targetTabId) {
          nav.classList.add('active');
        } else {
          nav.classList.remove('active');
        }
      });

      tabContents.forEach(tab => {
        if (tab.id === targetTabId) {
          tab.classList.add('active');
        } else {
          tab.classList.remove('active');
        }
      });

      if (targetTabId === 'tab-home') refreshHomeScreen();
      if (targetTabId === 'tab-history') refreshHistoryScreen();
      if (targetTabId === 'tab-settings') loadSettingsToTab();
    });
  });
}

/**
 * 🏠 홈 화면 3개 카드 (1. Intro -> 2. 명상 시작하기 -> 3. 나의 명상 기록) 수치 동기화
 */
function refreshHomeScreen() {
  const settings = getUserSettings();
  applyTheme(settings.themeOverride, settings.defaultMinutes);

  const stats = getStatsSummary();

  // Card 3: 나의 명상 기록 수치 동기화
  const streakCountEl = document.getElementById('home-streak-count');
  const monthCountEl = document.getElementById('home-month-count');
  const totalTimeEl = document.getElementById('home-total-time');

  if (streakCountEl) streakCountEl.textContent = `${stats.streakDays}일 연속 명상 중`;
  if (monthCountEl) monthCountEl.textContent = `${stats.monthCount}회`;
  if (totalTimeEl) totalTimeEl.textContent = `${stats.totalMinutes}분`;
}

/**
 * 🧘 명상 탭 세션 시작 및 유튜브 영상 컨트롤러 등록
 */
function initMeditationTab() {
  const catCards = document.querySelectorAll('.category-card');
  const durationBtns = document.querySelectorAll('.duration-btn');

  const settings = getUserSettings();
  const currentTheme = applyTheme(settings.themeOverride, settings.defaultMinutes);

  let selectedCategory = currentTheme.recCategory || '호흡';
  let selectedDuration = currentTheme.recDuration || settings.defaultMinutes || 5;

  // 현재 시간대 카테고리에 맞춰 버튼 active 상태 동기화
  catCards.forEach(card => {
    if (card.getAttribute('data-category') === selectedCategory) {
      card.classList.add('active');
    } else {
      card.classList.remove('active');
    }
  });

  catCards.forEach(card => {
    card.addEventListener('click', () => {
      catCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      selectedCategory = card.getAttribute('data-category') || '호흡';
    });
  });

  const customSlider = /** @type {HTMLInputElement} */ (document.getElementById('custom-minutes-slider'));
  const sliderValueText = document.getElementById('slider-value-text');
  const customCard = document.querySelector('.custom-duration-card');

  // 설정값(selectedDuration)에 맞춰 시간 버튼 및 슬라이더 초기 동기화
  let matchedInitialBtn = false;
  durationBtns.forEach(btn => {
    const btnMinutes = Number(btn.getAttribute('data-minutes'));
    if (btnMinutes === selectedDuration) {
      btn.classList.add('active');
      matchedInitialBtn = true;
    } else {
      btn.classList.remove('active');
    }
  });

  if (customSlider) customSlider.value = String(selectedDuration);
  if (sliderValueText) sliderValueText.textContent = String(selectedDuration);
  if (!matchedInitialBtn && customCard) customCard.classList.add('active');

  // 윗칸 5분, 10분, 20분 3개 버튼 클릭 이벤트
  durationBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      durationBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (customCard) customCard.classList.remove('active');

      const minutesVal = Number(btn.getAttribute('data-minutes')) || 5;
      selectedDuration = minutesVal;

      // 슬라이더 및 표출 숫자 양방향 연동
      if (customSlider) customSlider.value = String(minutesVal);
      if (sliderValueText) sliderValueText.textContent = String(minutesVal);
    });
  });

  // 아래칸 시간 직접 입력 카드 슬라이더 조절 이벤트
  if (customSlider) {
    customSlider.addEventListener('input', () => {
      const val = Number(customSlider.value) || 5;
      selectedDuration = val;
      if (sliderValueText) sliderValueText.textContent = String(val);

      // 드래그 수치에 맞춰 윗칸 프리셋 버튼 및 customCard active 연동
      let matched = false;
      durationBtns.forEach(btn => {
        const btnMinutes = Number(btn.getAttribute('data-minutes'));
        if (btnMinutes === val) {
          btn.classList.add('active');
          matched = true;
        } else {
          btn.classList.remove('active');
        }
      });

      if (!matched && customCard) {
        customCard.classList.add('active');
      } else if (customCard) {
        customCard.classList.remove('active');
      }
    });
  }

  // 1. 명상 탭에서 [선택한 명상 시작하기] 클릭
  const startBtn = document.getElementById('btn-start-meditation-session');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      startCinemaMeditationSession(selectedCategory, selectedDuration);
    });
  }

  // 2. 홈 탭 Card 2의 [▶ 지금 명상 시작하기] 클릭 (홈 카드 표기 테마 및 시간과 100% 동기화)
  const homeStartBtn = document.getElementById('btn-home-start-meditation');
  if (homeStartBtn) {
    homeStartBtn.addEventListener('click', () => {
      const settings = getUserSettings();
      const currentTheme = applyTheme(settings.themeOverride, settings.defaultMinutes);
      switchTab('tab-meditate');
      startCinemaMeditationSession(currentTheme.recCategory, currentTheme.recDuration);
    });
  }

  // 2-2. 홈 탭 Card 2 내부의 [⚙️ 설정] 버튼 클릭 (설정 탭으로 이동)
  const cardSettingsBtn = document.getElementById('btn-card-settings');
  if (cardSettingsBtn) {
    cardSettingsBtn.addEventListener('click', () => {
      switchTab('tab-settings');
    });
  }

  // 3. 홈 탭 Card 3의 [📅 나의 명상 기록 자세히 보기] 클릭
  const homeGoHistoryBtn = document.getElementById('btn-home-go-history');
  if (homeGoHistoryBtn) {
    homeGoHistoryBtn.addEventListener('click', () => {
      switchTab('tab-history');
    });
  }

  // 4. 전면 비디오 컨트롤러 (일시정지/재생 & 명상 완료)
  const pausePlayBtn = document.getElementById('btn-toggle-pause-play');
  const finishMedBtn = document.getElementById('btn-finish-meditation');

  if (pausePlayBtn) {
    pausePlayBtn.addEventListener('click', togglePausePlayMeditation);
  }

  if (finishMedBtn) {
    finishMedBtn.addEventListener('click', finishMeditationSession);
  }
}

/**
 * 📅 기록 탭 동기화
 */
function refreshHistoryScreen() {
  const stats = getStatsSummary();

  const monthCountEl = document.getElementById('stat-month-count');
  const totalTimeEl = document.getElementById('stat-total-time');
  const streakDaysEl = document.getElementById('stat-streak-days');
  const favCategoryEl = document.getElementById('stat-fav-category');

  if (monthCountEl) monthCountEl.textContent = `${stats.monthCount}회`;
  if (totalTimeEl) totalTimeEl.textContent = `${stats.totalMinutes}분`;
  if (streakDaysEl) streakDaysEl.textContent = `${stats.streakDays}일`;
  if (favCategoryEl) favCategoryEl.textContent = stats.favoriteCategory;

  renderCalendar();
  renderChallengeBadges();
}

/**
 * 달력 이동 버튼 이벤트 등록
 */
function initCalendarEvents() {
  const prevBtn = document.getElementById('btn-prev-month');
  const nextBtn = document.getElementById('btn-next-month');

  if (prevBtn) prevBtn.addEventListener('click', () => navigatePrevMonth());
  if (nextBtn) nextBtn.addEventListener('click', () => navigateNextMonth());
}

/**
 * ⚙️ 설정 탭 이벤트 등록 (항목 변경 시 실시간 자동 저장 및 화면 즉시 반영)
 */
function initSettingsTab() {
  const settingSlider = /** @type {HTMLInputElement} */ (document.getElementById('setting-minutes-slider'));
  const settingSliderValueText = document.getElementById('setting-slider-value-text');
  const themeSelect = document.getElementById('tab-setting-theme-override');
  const volumeSlider = document.getElementById('tab-setting-sound-volume');

  const autoSaveHandler = () => {
    saveTabSettings();
    refreshHomeScreen();
    initMeditationTab();
  };

  if (settingSlider) {
    settingSlider.addEventListener('input', () => {
      const val = Number(settingSlider.value) || 5;
      if (settingSliderValueText) settingSliderValueText.textContent = String(val);
      autoSaveHandler();
    });
    settingSlider.addEventListener('change', autoSaveHandler);
  }

  if (themeSelect) themeSelect.addEventListener('change', autoSaveHandler);
  if (volumeSlider) {
    volumeSlider.addEventListener('input', autoSaveHandler);
    volumeSlider.addEventListener('change', autoSaveHandler);
  }
}

function loadSettingsToTab() {
  const settings = getUserSettings();
  const settingSlider = /** @type {HTMLInputElement} */ (document.getElementById('setting-minutes-slider'));
  const settingSliderValueText = document.getElementById('setting-slider-value-text');
  const themeSelect = /** @type {HTMLSelectElement} */ (document.getElementById('tab-setting-theme-override'));
  const volumeSlider = /** @type {HTMLInputElement} */ (document.getElementById('tab-setting-sound-volume'));

  if (settingSlider) settingSlider.value = String(settings.defaultMinutes);
  if (settingSliderValueText) settingSliderValueText.textContent = String(settings.defaultMinutes);
  if (themeSelect) themeSelect.value = settings.themeOverride;
  if (volumeSlider) volumeSlider.value = String(settings.soundVolume);
}

function saveTabSettings() {
  const settingSlider = /** @type {HTMLInputElement} */ (document.getElementById('setting-minutes-slider'));
  const themeSelect = /** @type {HTMLSelectElement} */ (document.getElementById('tab-setting-theme-override'));
  const volumeSlider = /** @type {HTMLInputElement} */ (document.getElementById('tab-setting-sound-volume'));

  const newDefaultTime = Number(settingSlider?.value) || 5;
  const newTheme = themeSelect?.value || 'auto';
  const newVolume = Number(volumeSlider?.value) || 80;

  saveUserSettings({
    defaultMinutes: newDefaultTime,
    themeOverride: newTheme,
    soundVolume: newVolume
  });

  applyTheme(newTheme, newDefaultTime);
}

/**
 * 완결 모달 액션 등록
 */
function initModalEvents() {
  const completeToHomeBtn = document.getElementById('btn-complete-to-home');
  const completeToHistoryBtn = document.getElementById('btn-complete-to-history');
  const modalComp = document.getElementById('modal-completion');

  if (completeToHomeBtn) {
    completeToHomeBtn.addEventListener('click', () => {
      if (modalComp) modalComp.classList.add('hidden');
      switchTab('tab-home');
    });
  }

  if (completeToHistoryBtn) {
    completeToHistoryBtn.addEventListener('click', () => {
      if (modalComp) modalComp.classList.add('hidden');
      switchTab('tab-history');
    });
  }

  const closeDateModalBtn = document.getElementById('btn-close-date-modal');
  const dateModal = document.getElementById('modal-date-details');
  if (closeDateModalBtn && dateModal) {
    closeDateModalBtn.addEventListener('click', () => dateModal.classList.add('hidden'));
  }
}

/**
 * 탭 내비게이션 프로그램적 전환
 * @param {string} tabId - 이동할 탭 아이디 ('tab-home' | 'tab-meditate' | 'tab-history' | 'tab-settings')
 */
function switchTab(tabId) {
  const allNavItems = document.querySelectorAll('.nav-item');
  const tabContents = document.querySelectorAll('.tab-content');

  allNavItems.forEach(item => {
    if (item.getAttribute('data-tab') === tabId) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  tabContents.forEach(tab => {
    if (tab.id === tabId) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });

  if (tabId === 'tab-home') refreshHomeScreen();
  if (tabId === 'tab-history') refreshHistoryScreen();
  if (tabId === 'tab-settings') loadSettingsToTab();
}
