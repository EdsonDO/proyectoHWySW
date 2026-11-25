import { APP_CONFIG } from './config.js';

export function nowLocal() {
  return new Date();
}

export function formatLocalIso(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayIso() {
  return formatLocalIso(nowLocal());
}

export function offsetDay(days) {
  const d = nowLocal();
  d.setDate(d.getDate() + days);
  return formatLocalIso(d);
}

export function offsetFromDate(isoDate, days) {
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(y, m - 1, d + days);
  return formatLocalIso(dt);
}

export function parseLocalDate(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatShortDate(isoDate) {
  if (!isoDate) return '—';
  return parseLocalDate(isoDate).toLocaleDateString(APP_CONFIG.locale, {
    day: '2-digit',
    month: 'short'
  });
}

export function formatLongHeaderDate(date = nowLocal()) {
  return date.toLocaleDateString(APP_CONFIG.locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

export function formatMonthTitle(ym) {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(APP_CONFIG.locale, {
    month: 'long',
    year: 'numeric'
  });
}

export function daysBetween(isoStart, isoEnd = todayIso()) {
  const start = parseLocalDate(isoStart);
  const end = parseLocalDate(isoEnd);
  return Math.round((end - start) / 86400000);
}

export function formatTimestamp(isoString) {
  const dt = new Date(isoString);
  return dt.toLocaleString(APP_CONFIG.locale, {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}
