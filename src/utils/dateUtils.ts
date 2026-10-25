/**
 * Safely converts any date input into a JavaScript Date object or null.
 * Supports:
 * - ISO text strings (e.g. "2026-10-24T18:50:30.000Z")
 * - Brazilian date strings (e.g. "24/10/2026" or "24/10/2026 18:50")
 * - Firestore Timestamp objects (with .toDate() or .seconds)
 * - Date instances and numbers
 * - Empty string, null, or undefined -> returns null
 */
export function toDate(val: any): Date | null {
  if (val === null || val === undefined || val === '') {
    return null;
  }

  if (val instanceof Date) {
    return isNaN(val.getTime()) ? null : val;
  }

  if (typeof val === 'object') {
    if (typeof val.toDate === 'function') {
      try {
        const d = val.toDate();
        if (d instanceof Date && !isNaN(d.getTime())) return d;
      } catch {
        // ignore
      }
    }
    if (typeof val.seconds === 'number') {
      const d = new Date(val.seconds * 1000);
      if (!isNaN(d.getTime())) return d;
    }
  }

  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return null;

    // Check for Brazilian date format: dd/mm/yyyy or dd/mm/yyyy hh:mm or dd/mm/yyyy, hh:mm:ss
    const brRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[,\s]+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/;
    const match = trimmed.match(brRegex);
    if (match) {
      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;
      const year = parseInt(match[3], 10);
      const hours = match[4] ? parseInt(match[4], 10) : 0;
      const minutes = match[5] ? parseInt(match[5], 10) : 0;
      const seconds = match[6] ? parseInt(match[6], 10) : 0;

      const parsed = new Date(year, month, day, hours, minutes, seconds);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }

    const parsedIso = new Date(trimmed);
    if (!isNaN(parsedIso.getTime())) {
      return parsedIso;
    }
  }

  if (typeof val === 'number') {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }

  return null;
}

/**
 * Safely formats any date input into a Brazilian Portuguese date/time string (dd/mm/yyyy HH:MM)
 */
export function formatDateTime(val: any, fallbackStr: string = ''): string {
  const dateObj = toDate(val);
  if (!dateObj) {
    return typeof val === 'string' ? val : fallbackStr;
  }

  try {
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return typeof val === 'string' ? val : fallbackStr;
  }
}

/**
 * Safely formats any date input into a Brazilian Portuguese date-only string (dd/mm/yyyy)
 */
export function formatDateOnly(val: any, fallbackStr: string = ''): string {
  const dateObj = toDate(val);
  if (!dateObj) {
    return typeof val === 'string' ? val : fallbackStr;
  }

  try {
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();

    return `${day}/${month}/${year}`;
  } catch {
    return typeof val === 'string' ? val : fallbackStr;
  }
}
