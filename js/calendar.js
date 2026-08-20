/**
 * @fileoverview 출석 달력 렌더링, 날짜별 세부 기록 모달 및 챌린지 배지 뷰를 제어하는 모듈
 * @author 마음쉼 개발팀
 */

import { getHistoryRecords, getChallengeBadges } from './storage.js';

let currentDateView = new Date();

/**
 * 달력 연/월을 이전달로 이동합니다.
 * @param {Function} onRenderCallback - 렌더링 완료 후 콜백
 */
export function navigatePrevMonth(onRenderCallback) {
  currentDateView.setMonth(currentDateView.getMonth() - 1);
  renderCalendar();
  if (onRenderCallback) onRenderCallback();
}

/**
 * 달력 연/월을 다음달로 이동합니다.
 * @param {Function} onRenderCallback - 렌더링 완료 후 콜백
 */
export function navigateNextMonth(onRenderCallback) {
  currentDateView.setMonth(currentDateView.getMonth() + 1);
  renderCalendar();
  if (onRenderCallback) onRenderCallback();
}

/**
 * 📅 기록 탭의 출석 달력을 렌더링합니다.
 */
export function renderCalendar() {
  const monthYearEl = document.getElementById('calendar-month-year');
  const calendarGrid = document.getElementById('calendar-grid');

  if (!monthYearEl || !calendarGrid) return;

  const year = currentDateView.getFullYear();
  const month = currentDateView.getMonth(); // 0-indexed

  monthYearEl.textContent = `${year}년 ${month + 1}월`;
  calendarGrid.innerHTML = '';

  // 1. 이번 달의 첫 번째 날과 마지막 날 계산
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0(일) ~ 6(토)
  const totalDaysInMonth = lastDayOfMonth.getDate();

  // 2. 명상 기록 데이터 맵 생성 (날짜 -> 레코드 배열)
  const records = getHistoryRecords();
  /** @type {Record<string, typeof records>} */
  const recordMap = {};

  records.forEach(rec => {
    if (!recordMap[rec.date]) recordMap[rec.date] = [];
    recordMap[rec.date].push(rec);
  });

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // 3. 이전 달 빈 셀 채우기
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const dayDiv = document.createElement('div');
    dayDiv.className = 'calendar-day other-month';
    dayDiv.textContent = String(prevMonthLastDay - i);
    calendarGrid.appendChild(dayDiv);
  }

  // 4. 이번 달 날짜 셀 채우기
  for (let day = 1; day <= totalDaysInMonth; day++) {
    const dayDiv = document.createElement('div');
    dayDiv.className = 'calendar-day';

    const monthStr = String(month + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const fullDateStr = `${year}-${monthStr}-${dayStr}`;

    dayDiv.textContent = String(day);

    if (fullDateStr === todayStr) {
      dayDiv.classList.add('today');
    }

    const dayRecords = recordMap[fullDateStr];
    if (dayRecords && dayRecords.length > 0) {
      dayDiv.classList.add('has-meditation');
      const badge = document.createElement('span');
      badge.className = 'meditated-badge';
      badge.textContent = '🧘';
      dayDiv.appendChild(badge);
    }

    // 셀 클릭 이벤트 - 상세 기록 모달
    dayDiv.addEventListener('click', () => {
      openDateDetailsModal(fullDateStr, dayRecords || []);
    });

    calendarGrid.appendChild(dayDiv);
  }
}

/**
 * 지정한 날짜의 명상 수행 세부 기록 모달을 엽니다.
 * @param {string} dateStr - 날짜 문자열 (YYYY-MM-DD)
 * @param {Array<import('./storage.js').MeditationRecord>} records - 해당 날짜 기록 레코드
 */
function openDateDetailsModal(dateStr, records) {
  const modal = document.getElementById('modal-date-details');
  const titleEl = document.getElementById('date-details-title');
  const contentEl = document.getElementById('date-details-content');

  if (!modal || !contentEl) return;

  const [y, m, d] = dateStr.split('-');
  if (titleEl) titleEl.textContent = `${y}년 ${Number(m)}월 ${Number(d)}일 기록`;

  contentEl.innerHTML = '';

  if (records.length === 0) {
    contentEl.innerHTML = `
      <div class="text-center" style="padding: 20px 0; color: rgba(255,255,255,0.7);">
        이 날은 진행한 명상이 없습니다. 🌿
      </div>
    `;
  } else {
    records.forEach(rec => {
      const item = document.createElement('div');
      item.className = 'glass-card';
      item.style.marginBottom = '10px';
      item.style.padding = '14px';

      item.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <span style="font-weight: 700; font-size: 0.95rem;">${rec.title}</span>
          <span style="font-size: 0.8rem; background: rgba(255,255,255,0.2); padding: 2px 8px; border-radius: 10px;">${rec.time}</span>
        </div>
        <div style="font-size: 0.85rem; color: rgba(255,255,255,0.85);">
          🏷️ 카테고리: ${rec.category} · ⏱ ${rec.duration}분 명상
        </div>
      `;
      contentEl.appendChild(item);
    });
  }

  modal.classList.remove('hidden');
}

/**
 * 🏆 챌린지 배지 목록을 렌더링합니다.
 */
export function renderChallengeBadges() {
  const container = document.getElementById('badges-container');
  if (!container) return;

  const badges = getChallengeBadges();
  container.innerHTML = '';

  badges.forEach(badge => {
    const badgeEl = document.createElement('div');
    badgeEl.className = `badge-item ${badge.unlocked ? 'unlocked' : ''}`;

    badgeEl.innerHTML = `
      <span class="badge-icon">${badge.icon}</span>
      <span class="badge-name">${badge.name}</span>
      <span style="font-size: 0.65rem; margin-top: 2px; color: rgba(255,255,255,0.7);">
        ${badge.unlocked ? '달성 완료!' : `${badge.requiredDays}일 연속`}
      </span>
    `;

    container.appendChild(badgeEl);
  });
}
