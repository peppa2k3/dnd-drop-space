import i18n from '../i18n/config';

export function formatNumber(value, options, locale = i18n.language) {
  return new Intl.NumberFormat(locale || 'vi', options).format(value);
}

export function formatBytes(bytes, locale = i18n.language) {
  if (!bytes || bytes <= 0) return `${formatNumber(0, undefined, locale)} B`;
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${formatNumber(value, { maximumFractionDigits: exponent && value < 10 ? 1 : 0 }, locale)} ${units[exponent]}`;
}

export function formatPercent(ratio, locale = i18n.language) {
  return formatNumber(ratio, { style: 'percent', maximumFractionDigits: 1 }, locale);
}

export function formatDateTime(date, locale = i18n.language) {
  return new Intl.DateTimeFormat(locale || 'vi', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date));
}

export function formatRelativeTime(date, locale = i18n.language) {
  const seconds = (new Date(date).getTime() - Date.now()) / 1000;
  const abs = Math.abs(seconds);
  const [unit, divisor] = abs < 60 ? ['second', 1]
    : abs < 3600 ? ['minute', 60]
      : abs < 86400 ? ['hour', 3600]
        : abs < 2592000 ? ['day', 86400]
          : abs < 31536000 ? ['month', 2592000] : ['year', 31536000];
  return new Intl.RelativeTimeFormat(locale || 'vi', { numeric: 'auto', style: 'long' })
    .format(Math.round(seconds / divisor), unit);
}

export function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return null;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}
