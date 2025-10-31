(function () {
  'use strict';

  function getDefaultSettings() {
    return Object.freeze({
      enabled: true,
      debug: false,
      // formatting controls
      dateStyle: 'short', // short | medium | long
      showWeekday: 'olderYears', // never | olderYears | always
      showTime: 'actionsOnly', // never | actionsOnly | always
      includeSeconds: false,
      // exclusion patterns (array of pattern strings)
      exclusionPatterns: [],
    });
  }

  function coerceSettings(partial) {
    const defaults = getDefaultSettings();
    const safe = Object.assign({}, defaults, partial || {});
    // clamp enums
    const dateStyles = ['short', 'medium', 'long'];
    if (!dateStyles.includes(safe.dateStyle)) safe.dateStyle = defaults.dateStyle;

    const weekdayPolicies = ['never', 'olderYears', 'always'];
    if (!weekdayPolicies.includes(safe.showWeekday)) safe.showWeekday = defaults.showWeekday;

    const timePolicies = ['never', 'actionsOnly', 'always'];
    if (!timePolicies.includes(safe.showTime)) safe.showTime = defaults.showTime;

    safe.includeSeconds = Boolean(safe.includeSeconds);
    safe.enabled = Boolean(safe.enabled);
    safe.debug = Boolean(safe.debug);
    
    // Ensure exclusionPatterns is an array
    if (!Array.isArray(safe.exclusionPatterns)) {
      safe.exclusionPatterns = defaults.exclusionPatterns;
    }

    return Object.freeze(safe);
  }

  if (typeof window !== 'undefined') {
    window.absoluteTimeShared = {
      getDefaultSettings: getDefaultSettings,
      coerceSettings: coerceSettings,
    };
  }

  /**
   * Utility functions for exclusion pattern matching
   */

  /**
   * Converts a pattern string with wildcards to a regex
   * Supports * (match any sequence) and specific path segments
   * @param {string} pattern - Pattern string like "github.com/:owner/:repo/issues/*"
   * @returns {RegExp} Regular expression for matching
   */
  function patternToRegex(pattern) {
    // Escape special regex characters except * and :
    let escaped = pattern
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
      // Replace :param with [^/]+ to match any segment
      .replace(/:[^/]+/g, '[^/]+')
      // Replace * with .* to match any sequence
      .replace(/\*/g, '.*');
    
    return new RegExp('^' + escaped + '$');
  }

  /**
   * Tests if a URL matches an exclusion pattern
   * @param {string} url - Full URL or pathname to test
   * @param {string} pattern - Pattern to match against
   * @returns {boolean} Whether the URL matches the pattern
   */
  function matchesPattern(url, pattern) {
    if (!url || !pattern) return false;
    
    try {
      const urlObj = new URL(url);
      const fullPath = urlObj.hostname + urlObj.pathname;
      const regex = patternToRegex(pattern);
      return regex.test(fullPath);
    } catch (e) {
      // If URL parsing fails, try matching against the raw string
      const regex = patternToRegex(pattern);
      return regex.test(url);
    }
  }

  /**
   * Checks if current page matches any exclusion pattern
   * @param {string[]} patterns - Array of exclusion patterns
   * @param {string} currentUrl - Current page URL (defaults to window.location.href)
   * @returns {boolean} Whether current page is excluded
   */
  function isPageExcluded(patterns, currentUrl) {
    if (!Array.isArray(patterns) || patterns.length === 0) {
      return false;
    }
    
    const url = currentUrl || (typeof window !== 'undefined' ? window.location.href : '');
    return patterns.some(pattern => matchesPattern(url, pattern));
  }

  // Export utility functions
  if (typeof window !== 'undefined' && window.absoluteTimeShared) {
    window.absoluteTimeShared.patternToRegex = patternToRegex;
    window.absoluteTimeShared.matchesPattern = matchesPattern;
    window.absoluteTimeShared.isPageExcluded = isPageExcluded;
  }
})();
