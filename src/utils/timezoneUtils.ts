/**
 * Timezone Utilities for Frontend
 * Converts UTC timestamps from backend to Philippines Time (UTC+8)
 * 
 * CRITICAL: Backend stores timestamps in UTC but without timezone suffix.
 * We must treat all incoming timestamps as UTC by appending 'Z' if needed.
 */

// Philippines timezone offset (UTC+8)
const PH_OFFSET_HOURS = 8;

/**
 * Normalize a timestamp string to ensure it's treated as UTC
 * Backend stores UTC timestamps without timezone suffix, which JavaScript
 * incorrectly parses as local time. This function ensures UTC interpretation.
 * @param dateString - Date string from backend
 * @returns ISO string with UTC timezone indicator
 */
function ensureUTC(dateString: string): string {
  if (!dateString) return '';
  
  // Already has timezone info
  if (dateString.endsWith('Z') || dateString.includes('+') || dateString.includes('-', 10)) {
    return dateString;
  }
  
  // Replace space with 'T' for ISO format and add 'Z' for UTC
  const normalized = dateString.replace(' ', 'T');
  return normalized + 'Z';
}

/**
 * Convert UTC date string to Philippines Time
 * @param utcDateString - ISO date string from backend (in UTC)
 * @returns Date object adjusted to Philippines timezone
 */
export function utcToPhilippines(utcDateString: string): Date {
  const normalizedDate = ensureUTC(utcDateString);
  const utcDate = new Date(normalizedDate);
  
  // Get UTC time in milliseconds
  const utcTime = utcDate.getTime();
  
  // Add Philippines offset (8 hours = 8 * 60 * 60 * 1000 milliseconds)
  const phTime = utcTime + (PH_OFFSET_HOURS * 60 * 60 * 1000);
  
  return new Date(phTime);
}

/**
 * Format UTC date string to Philippines Time string
 * @param utcDateString - ISO date string from backend (in UTC)
 * @param options - Intl.DateTimeFormatOptions for formatting
 * @returns Formatted date string in Philippines time
 */
export function formatPhilippinesDateTime(
  utcDateString: string,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!utcDateString) return '';
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Manila'
  };
  
  // CRITICAL: Ensure timestamp is treated as UTC before converting to Manila
  const normalizedDate = ensureUTC(utcDateString);
  const date = new Date(normalizedDate);
  
  return date.toLocaleString('en-US', options || defaultOptions);
}

/**
 * Format UTC date string to Philippines Date only (no time)
 * @param utcDateString - ISO date string from backend (in UTC)
 * @returns Formatted date string in Philippines time
 */
export function formatPhilippinesDate(utcDateString: string): string {
  if (!utcDateString) return '';
  
  // CRITICAL: Ensure timestamp is treated as UTC before converting to Manila
  const normalizedDate = ensureUTC(utcDateString);
  const date = new Date(normalizedDate);
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'Asia/Manila'
  });
}

/**
 * Get current Philippines time
 * @returns Date object in Philippines timezone
 */
export function getPhilippinesNow(): Date {
  // Create date in Philippines timezone
  const now = new Date();
  return new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
}

/**
 * Format date for display with Philippines timezone indicator
 * @param utcDateString - ISO date string from backend (in UTC)
 * @returns Formatted string like "Jan 16, 2026, 3:35 PM PHT"
 */
export function formatPhilippinesDateTimeWithZone(utcDateString: string): string {
  if (!utcDateString) return '';
  
  const formatted = formatPhilippinesDateTime(utcDateString);
  return `${formatted} PHT`;
}
