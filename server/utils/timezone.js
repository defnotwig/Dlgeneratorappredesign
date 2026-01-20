/**
 * Timezone Utility for Philippines Standard Time (PST/PHT) - UTC+8
 * ================================================================
 * All timestamps in the system should use this utility for consistency.
 * 
 * CRITICAL: This file ensures all displayed timestamps are in Manila time.
 */

// Philippines timezone identifier
const PH_TIMEZONE = 'Asia/Manila';
const PH_OFFSET_HOURS = 8;

/**
 * Get current datetime in Philippines timezone
 * @returns {Date} Current time adjusted to Philippines timezone for display
 */
function getPhilippinesNow() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: PH_TIMEZONE }));
}

/**
 * Convert a UTC date to Philippines timezone
 * @param {Date|string} utcDate - UTC date object or ISO string
 * @returns {Date} Date adjusted to Philippines timezone
 */
function utcToPhilippines(utcDate) {
  if (!utcDate) return null;
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  return new Date(date.toLocaleString('en-US', { timeZone: PH_TIMEZONE }));
}

/**
 * Format a date/time for display in Philippines timezone
 * @param {Date|string} date - Date to format (assumes UTC if no timezone)
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string in Philippines time
 */
function formatPhilippinesDateTime(date, options = {}) {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions = {
    timeZone: PH_TIMEZONE,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    ...options
  };
  
  return dateObj.toLocaleString('en-US', defaultOptions);
}

/**
 * Format date only (no time) in Philippines timezone
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
function formatPhilippinesDate(date) {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleDateString('en-US', {
    timeZone: PH_TIMEZONE,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Format time only in Philippines timezone
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted time string (e.g., "3:35 PM")
 */
function formatPhilippinesTime(date) {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleTimeString('en-US', {
    timeZone: PH_TIMEZONE,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Get current Philippines time as ISO string (for database storage)
 * Note: Better to store UTC and convert on display, but this is for cases
 * where we need to store local time explicitly.
 * @returns {string} ISO string of current Philippines time
 */
function getPhilippinesISOString() {
  const now = new Date();
  // Create a date string in Philippines timezone
  const phString = now.toLocaleString('en-US', { 
    timeZone: PH_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  // Parse and format as ISO-like string
  const [datePart, timePart] = phString.split(', ');
  const [month, day, year] = datePart.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${timePart}+08:00`;
}

/**
 * Format datetime with timezone indicator for Lark messages
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted string with PHT indicator (e.g., "January 16, 2026 at 1:18 PM PHT")
 */
function formatForLark(date = null) {
  const dateObj = date ? (typeof date === 'string' ? new Date(date) : date) : new Date();
  
  const formatted = dateObj.toLocaleString('en-US', {
    timeZone: PH_TIMEZONE,
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  
  return `${formatted} PHT`;
}

/**
 * Format datetime for Lark card display (shorter format)
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted string (e.g., "Jan 16, 2026, 1:18 PM")
 */
function formatForLarkCard(date = null) {
  const dateObj = date ? (typeof date === 'string' ? new Date(date) : date) : new Date();
  
  return dateObj.toLocaleString('en-US', {
    timeZone: PH_TIMEZONE,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Get Manila-time SQL timestamp for use in queries
 * Since SQLite's CURRENT_TIMESTAMP is UTC, this provides a Manila-time string
 * @returns {string} Formatted datetime string for SQL
 */
function getManilaTimestampForSQL() {
  const now = new Date();
  return now.toLocaleString('sv-SE', { 
    timeZone: PH_TIMEZONE 
  }).replace(' ', 'T');
}

export {
  PH_TIMEZONE,
  getPhilippinesNow,
  utcToPhilippines,
  formatPhilippinesDateTime,
  formatPhilippinesDate,
  formatPhilippinesTime,
  getPhilippinesISOString,
  formatForLark,
  formatForLarkCard,
  getManilaTimestampForSQL
};

export default {
  PH_TIMEZONE,
  getPhilippinesNow,
  utcToPhilippines,
  formatPhilippinesDateTime,
  formatPhilippinesDate,
  formatPhilippinesTime,
  getPhilippinesISOString,
  formatForLark,
  formatForLarkCard,
  getManilaTimestampForSQL
};
