/* OomBam schedule automation v20.13.3 — Thailand time (ICT / UTC+7) */
(() => {
  'use strict';
  const THAI_TZ = 'Asia/Bangkok';
  const pad = n => String(Math.max(0, n)).padStart(2, '0');

  const thaiDateKey = (date = new Date()) => {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: THAI_TZ, year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(date);
    const get = t => parts.find(p => p.type === t)?.value;
    return `${get('year')}-${get('month')}-${get('day')}`;
  };

  const eventInstant = el => new Date(`${el.dataset.date}T${el.dataset.time || '00:00'}:00+07:00`);

  const prettyDateTime = el => {
    const d = eventInstant(el);
    const date = new Intl.DateTimeFormat('en-GB', {
      timeZone: THAI_TZ, day: '2-digit', month: 'short', year: 'numeric'
    }).format(d).toUpperCase();
    if (!el.dataset.time) return `${date} · TIME TBA · ICT`;
    const time = new Intl.DateTimeFormat('en-US', {
      timeZone: THAI_TZ, hour: 'numeric', minute: '2-digit', hour12: true
    }).format(d);
    return `${date} · ${time} ICT`;
  };

  function orderEvents(scope = document) {
    const today = thaiDateKey();
    const list = scope.querySelector('[data-active-events]');
    const events = [...scope.querySelectorAll('[data-schedule-event]')];
    if (!list) return events;
    const upcoming = [], past = [];
    events.forEach(el => {
      const isPast = el.dataset.date < today;
      const isToday = el.dataset.date === today;
      el.classList.toggle('is-past', isPast);
      el.classList.toggle('is-today', isToday);
      const oldBadge = el.querySelector('.schedule-today-badge');
      if (oldBadge && !isToday) oldBadge.remove();
      if (isToday && !oldBadge) {
        const badge = document.createElement('span');
        badge.className = 'schedule-today-badge';
        badge.textContent = 'TODAY';
        (el.querySelector('time,.solo-schedule-when,.solo-schedule-meta') || el).appendChild(badge);
      }
      (isPast ? past : upcoming).push(el);
    });
    upcoming.sort((a,b) => eventInstant(a)-eventInstant(b));
    past.sort((a,b) => eventInstant(b)-eventInstant(a));
    [...upcoming, ...past].forEach(el => list.appendChild(el));
    return upcoming;
  }

  function statusMarkup(el) {
    let dots = '';
    if (el.dataset.public === 'true') dots += '<span class="status-dot status-public"></span>';
    if (el.dataset.private === 'true') dots += '<span class="status-dot status-private"></span>';
    if (el.dataset.gifts === 'true') dots += '<span class="status-dot status-gifts"></span>';
    const words = [];
    if (el.dataset.public === 'true') words.push('Public');
    if (el.dataset.private === 'true') words.push('Private');
    if (el.dataset.gifts === 'true') words.push('Gifts allowed');
    return dots + (words.length ? `<span>${words.join(' · ')}</span>` : '');
  }

  function setupHome() {
    const panel = document.querySelector('[data-schedule-page="home"]');
    if (!panel) return;
    const active = orderEvents(panel);
    const next = active[0];
    if (!next) return;

    const title = panel.querySelector('[data-next-title]');
    const meta = panel.querySelector('[data-next-meta]');
    const stat = panel.querySelector('[data-next-status]');
    const label = panel.querySelector('[data-countdown-label]');
    const date = panel.querySelector('[data-countdown-date]');
    const out = {
      days: panel.querySelector('[data-days]'),
      hours: panel.querySelector('[data-hours]'),
      minutes: panel.querySelector('[data-minutes]'),
    };

    if (title) title.textContent = `${next.dataset.person} · ${next.dataset.title}`;
    if (meta) meta.textContent = `${prettyDateTime(next)}${next.dataset.venue ? ' · ' + next.dataset.venue : ''}`;
    if (stat) stat.innerHTML = statusMarkup(next);
    if (date) date.textContent = '';
    if (!next.dataset.time && label) label.textContent = 'TIME TO BE ANNOUNCED';

    const render = (totalMs) => {
      const totalSeconds = Math.max(0, Math.floor(totalMs / 1000));
      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      if (out.days) out.days.textContent = pad(days);
      if (out.hours) out.hours.textContent = pad(hours);
      if (out.minutes) out.minutes.textContent = pad(minutes);
    };

    const tick = () => {
      const today = thaiDateKey();
      const now = Date.now();
      const start = eventInstant(next).getTime();
      const isToday = next.dataset.date === today;
      panel.classList.toggle('has-today-event', isToday);
      if (!next.dataset.time) {
        if (label) label.textContent = isToday ? 'HAPPENING TODAY · TIME TBA' : 'TIME TO BE ANNOUNCED';
        render(0);
        return;
      }

      if (isToday) {
        if (next.dataset.time && now < start) {
          if (label) label.textContent = 'STARTS TODAY';
          render(start - now);
        } else {
          if (label) label.textContent = 'HAPPENING TODAY';
          render(0);
        }
      } else {
        if (label) label.textContent = 'STARTS IN';
        render(start - now);
      }
    };

    tick();
    const timer = window.setInterval(tick, 1000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });

    // At midnight in Thailand, reload once so the finished event moves to Past Events
    // and the next combined Oom/Bam/OomBam event becomes the countdown target.
    let knownThaiDate = thaiDateKey();
    window.setInterval(() => {
      const currentThaiDate = thaiDateKey();
      if (currentThaiDate !== knownThaiDate) {
        clearInterval(timer);
        window.location.reload();
      }
    }, 30000);
  }

  function setupSolo() {
    document.querySelectorAll('.updates-section--schedule').forEach(section => orderEvents(section));
  }

  const boot = () => { setupHome(); setupSolo(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
