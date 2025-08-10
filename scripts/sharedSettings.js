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

    return Object.freeze(safe);
  }

  if (typeof window !== 'undefined') {
    window.absoluteTimeShared = {
      getDefaultSettings: getDefaultSettings,
      coerceSettings: coerceSettings,
    };
  }
})();
