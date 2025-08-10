(() => {
  "use strict";
  
  //#region State Management
  /**
   * Creates default settings configuration
   * @returns {Object} Default settings
   */
  const createDefaultSettings = () => window.absoluteTimeShared.getDefaultSettings();

  /**
   * Creates new settings object with updates
   * @param {Object} currentSettings - Current settings state
   * @param {Object} updates - Settings updates to apply
   * @returns {Object} Updated settings object
   */
  const updateSettings = (currentSettings, updates) => 
    Object.freeze({ ...currentSettings, ...updates });

  let settings = createDefaultSettings();
  //#endregion

  //#region Logging Utilities
  /**
   * Creates a logging function based on debug setting
   * @param {boolean} debugEnabled - Whether debug logging is enabled
   * @returns {Function} Logging function
   */
  const createLogger = (debugEnabled) => (...args) => {
    if (debugEnabled) {
      console.log("[absolute-time]", ...args);
    }
  };

  //#endregion

  //#region Settings Management
  /**
   * Loads settings from Chrome storage
   * @returns {Promise<Object>} Promise resolving to settings object
   */
  const loadSettings = () => {
    if (typeof chrome !== "undefined" && chrome.storage) {
      return new Promise((resolve) => {
        chrome.storage.sync.get(createDefaultSettings(), (loadedSettings) => {
          const normalized = (typeof window !== 'undefined' && window.absoluteTimeShared)
            ? window.absoluteTimeShared.coerceSettings(loadedSettings)
            : Object.freeze({ ...createDefaultSettings(), ...loadedSettings });
          resolve(normalized);
        });
      });
    }
    return Promise.resolve(createDefaultSettings());
  };

  // No runtime message listeners are needed. Content script reacts to
  // settings via chrome.storage.onChanged exclusively.

  /**
   * Sets up storage change listener to react to settings updates
   * @param {Function} onSettingsChange - Callback for settings changes
   */
  const setupStorageChangeListener = (onSettingsChange) => {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace !== "sync") return;
        const updated = {};
        ["enabled","debug","dateStyle","showWeekday","showTime","includeSeconds"].forEach((key) => {
          if (Object.prototype.hasOwnProperty.call(changes, key)) {
            updated[key] = changes[key].newValue;
          }
        });
        if (Object.keys(updated).length > 0) {
          onSettingsChange(updated);
        }
      });
    }
  };
  //#endregion

  //#region Time Formatting Logic
  /**
   * Checks if an element needs formatting
   * @param {HTMLElement} element - The relative-time element
   * @returns {boolean} Whether the element needs formatting
   */
  const needsFormatting = (element) => 
    element.getAttribute("data-formatted") !== "true";

  /**
   * Gets the current year for date comparisons
   * @returns {number} Current year
   */
  const getCurrentYear = () => new Date().getFullYear();

  /**
   * Extracts year from a relative-time element
   * @param {HTMLElement} element - The relative-time element
   * @returns {number} Year from the element's datetime attribute
   */
  const getElementYear = (element) => 
    new Date(element.getAttribute("datetime")).getFullYear();

  /**
   * List of GitHub route patterns to ignore
   * @constant {string[]}
   */
  const ignoredRoutes = Object.freeze([
    "/issues",
    "/discussions"
  ]);

  /**
   * Checks if current page should be ignored based on route patterns
   * @returns {boolean} Whether current page should be ignored
   */
  const isIgnoredRoute = () => {
    const pathname = window.location.pathname;
    return ignoredRoutes.some(route => pathname.includes(route));
  };

  /**
   * Checks if current page is an action page
   * @returns {boolean} Whether current page includes "/action"
   */
  const isActionPage = () => window.location.pathname.includes("/actions");

  /**
   * Applies base formatting attributes to an element
   * @param {HTMLElement} element - The relative-time element
   * @returns {HTMLElement} The formatted element
   */
  const applyBaseFormatting = (element, currentSettings) => {
    element.setAttribute("format", "datetime");
    const style = currentSettings?.dateStyle || "short";
    element.setAttribute("format-style", style);
    element.setAttribute("data-formatted", "true");
    return element;
  };

  /**
   * Applies year-specific formatting to an element
   * @param {HTMLElement} element - The relative-time element
   * @param {number} currentYear - Current year
   * @returns {HTMLElement} The formatted element
   */
  const applyYearFormatting = (element, currentYear, currentSettings) => {
    const policy = currentSettings?.showWeekday || "olderYears";
    const elementYear = getElementYear(element);
    const shouldShowWeekday =
      policy === "always" || (policy === "olderYears" && elementYear < currentYear);
    if (shouldShowWeekday) {
      element.setAttribute("weekday", "narrow");
    } else {
      element.removeAttribute("weekday");
    }
    return element;
  };

  /**
   * Applies time formatting for action pages
   * @param {HTMLElement} element - The relative-time element
   * @returns {HTMLElement} The formatted element
   */
  const applyTimeFormatting = (element, currentSettings) => {
    const policy = currentSettings?.showTime || "actionsOnly";
    const shouldShowTime =
      policy === "always" || (policy === "actionsOnly" && isActionPage());

    if (shouldShowTime) {
      element.setAttribute("hour", "2-digit");
      element.setAttribute("minute", "2-digit");
      if (currentSettings?.includeSeconds) {
        element.setAttribute("second", "2-digit");
      } else {
        element.removeAttribute("second");
      }
    } else {
      element.removeAttribute("hour");
      element.removeAttribute("minute");
      element.removeAttribute("second");
    }
    return element;
  };

  /**
   * Formats a single relative-time element
   * @param {HTMLElement} element - The relative-time element
   * @param {number} currentYear - Current year
   * @returns {HTMLElement} The formatted element
   */
  const formatSingleElement = (element, currentYear, currentSettings) => {
    return [
      (el) => applyBaseFormatting(el, currentSettings),
      (el) => applyYearFormatting(el, currentYear, currentSettings),
      (el) => applyTimeFormatting(el, currentSettings)
    ].reduce((el, formatFn) => formatFn(el), element);
  };

  /**
   * Reverts formatting applied by this extension
   * @param {Function} logger - Logging function
   * @returns {number} Number of elements reverted
   */
  const unformatRelativeTimes = (logger) => {
    const formatted = document.querySelectorAll('relative-time[data-formatted="true"]');
    const attributesToRemove = [
      'format',
      'format-style',
      'weekday',
      'hour',
      'minute',
      'second',
      'data-formatted'
    ];

    formatted.forEach((el) => {
      attributesToRemove.forEach((attr) => el.removeAttribute(attr));
    });

    if (formatted.length > 0) {
      logger(`Reverted ${formatted.length} relative-time elements`);
    }
    return formatted.length;
  };

  /**
   * Formats all relative-time elements on the page
   * @param {boolean} enabled - Whether formatting is enabled
   * @param {Function} logger - Logging function
   * @returns {number} Number of elements updated
   */
  const formatRelativeTimes = (enabled, logger) => {
    if (!enabled) {
      // When disabled, revert any previously formatted elements
      logger("Relative time formatting is disabled");
      return unformatRelativeTimes(logger);
    }

    if (isIgnoredRoute()) {
      logger(`Skipping formatting on ignored route: ${window.location.pathname}`);
      return 0;
    }

    const timeElements = document.querySelectorAll("relative-time");
    logger(`Found ${timeElements.length} relative-time elements`);

    const currentYear = getCurrentYear();
    
    const updatedElements = Array.from(timeElements)
      .map(element => formatSingleElement(element, currentYear, settings));

    const updatedCount = updatedElements.length;
    
    if (updatedCount > 0) {
      logger(`Updated ${updatedCount} relative-time elements`);
    }

    return updatedCount;
  };
  //#endregion

  //#region DOM Utilities
  /**
   * Checks if an element contains relative-time elements
   * @param {HTMLElement} element - Element to check
   * @returns {boolean} Whether element contains relative-time elements
   */
  const hasRelativeTimeElements = (element) => {
    if (!element || !element.querySelectorAll) {
      return false;
    }
    return element.querySelectorAll("relative-time").length > 0;
  };

  /**
   * Checks if a mutation should trigger formatting
   * @param {MutationRecord} mutation - DOM mutation record
   * @returns {boolean} Whether formatting should be triggered
   */
  const shouldTriggerFormatting = (mutation) => {
    if (mutation.addedNodes.length > 0) {
      return Array.from(mutation.addedNodes).some(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          return node.tagName === "RELATIVE-TIME" || hasRelativeTimeElements(node);
        }
        return false;
      });
    }
    
    return mutation.type === "attributes" &&
           mutation.target.tagName === "RELATIVE-TIME" &&
           mutation.attributeName === "datetime";
  };

  /**
   * Processes mutations to determine if formatting is needed
   * @param {MutationRecord[]} mutations - Array of mutation records
   * @returns {boolean} Whether any mutation requires formatting
   */
  const processMutations = (mutations) => 
    mutations.some(shouldTriggerFormatting);
  //#endregion

  //#region Initialization and Event Handling
  /**
   * Creates a debounced version of the format function
   * @param {Function} formatFn - Function to debounce
   * @param {number} delay - Debounce delay in milliseconds
   * @returns {Function} Debounced function
   */
  const createDebouncedFormatter = (formatFn, delay = 250) => {
    let timeoutId;
    return () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(formatFn, delay);
    };
  };

  /**
   * Initializes the extension
   */
  const initializeExtension = async () => {
    const logger = createLogger(settings.debug);
    logger("Initializing absolute-time");

    try {
      const loadedSettings = await loadSettings();
      settings = updateSettings(settings, loadedSettings);
      logger("Settings loaded", JSON.stringify(settings));
    } catch (error) {
      logger("Failed to load settings, using defaults");
    }

    const formatWithCurrentSettings = () => 
      formatRelativeTimes(settings.enabled, createLogger(settings.debug));

    const debouncedFormat = createDebouncedFormatter(formatWithCurrentSettings);

    const handleSettingsChange = (newSettings) => {
      settings = updateSettings(settings, newSettings);
      const updatedLogger = createLogger(settings.debug);
      updatedLogger("Settings changed", JSON.stringify(settings));
      // Apply formatting immediately after settings change
      formatWithCurrentSettings();
    };

    setupStorageChangeListener(handleSettingsChange);

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", formatWithCurrentSettings);
    } else {
      formatWithCurrentSettings();
    }

    const observer = new MutationObserver((mutations) => {
      if (processMutations(mutations)) {
        const currentLogger = createLogger(settings.debug);
        currentLogger("DOM changes detected, formatting relative times");
        debouncedFormat();
      }
    });

    const observerConfig = {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["datetime"],
    };

    if (document.body) {
      observer.observe(document.body, observerConfig);
      logger("DOM observer initialized");
    } else {
      document.addEventListener("DOMContentLoaded", () => {
        observer.observe(document.body, observerConfig);
        logger("DOM observer initialized after DOMContentLoaded");
      });
    }

    const navHandler = () => {
      const navLogger = createLogger(settings.debug);
      navLogger("GitHub navigation event detected, formatting relative times");
      setTimeout(formatWithCurrentSettings, 1000);
    };

    document.addEventListener("turbo:load", navHandler);
    document.addEventListener("turbo:render", navHandler);
    document.addEventListener("turbo:frame-load", navHandler);
    document.addEventListener("pjax:end", navHandler);

    logger("absolute-time initialized");
  };
  //#endregion

  initializeExtension();
})();
