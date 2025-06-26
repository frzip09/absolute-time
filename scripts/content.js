(() => {
  "use strict";
  
  //#region State Management
  /**
   * Creates default settings configuration
   * @returns {Object} Default settings
   */
  const createDefaultSettings = () => Object.freeze({
    enabled: true,
    debug: false,
  });

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
  const createLogger = (debugEnabled) => (message) => {
    if (debugEnabled) {
      console.log("[absolute-time]", message);
    }
  };

  const log = createLogger(settings.debug);
  //#endregion

  //#region Settings Management
  /**
   * Loads settings from Chrome storage
   * @returns {Promise<Object>} Promise resolving to settings object
   */
  const loadSettings = () => {
    if (typeof chrome !== "undefined" && chrome.storage) {
      return new Promise((resolve) => {
        chrome.storage.sync.get(settings, (loadedSettings) => {
          if (loadedSettings) {
            resolve(loadedSettings);
          } else {
            resolve(createDefaultSettings());
          }
        });
      });
    }
    return Promise.resolve(createDefaultSettings());
  };

  /**
   * Handles settings change messages
   * @param {Object} message - Message object
   * @returns {Object|null} New settings or null if not a settings message
   */
  const handleSettingsMessage = (message) => {
    if (message.type === "settingsChanged") {
      return message.settings;
    }
    return null;
  };

  /**
   * Sets up message listener for settings changes
   * @param {Function} onSettingsChange - Callback for settings changes
   */
  const setupMessageListener = (onSettingsChange) => {
    if (typeof chrome !== "undefined" && chrome.runtime) {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        const newSettings = handleSettingsMessage(message);
        if (newSettings) {
          onSettingsChange(newSettings);
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
  const applyBaseFormatting = (element) => {
    element.setAttribute("format", "datetime");
    element.setAttribute("format-style", "short");
    element.setAttribute("data-formatted", "true");
    return element;
  };

  /**
   * Applies year-specific formatting to an element
   * @param {HTMLElement} element - The relative-time element
   * @param {number} currentYear - Current year
   * @returns {HTMLElement} The formatted element
   */
  const applyYearFormatting = (element, currentYear) => {
    const elementYear = getElementYear(element);
    if (elementYear < currentYear) {
      element.setAttribute("weekday", "narrow");
    }
    return element;
  };

  /**
   * Applies time formatting for action pages
   * @param {HTMLElement} element - The relative-time element
   * @returns {HTMLElement} The formatted element
   */
  const applyTimeFormatting = (element) => {
    if (isActionPage()) {
      element.setAttribute("hour", "2-digit");
      element.setAttribute("minute", "2-digit");
    }
    return element;
  };

  /**
   * Formats a single relative-time element
   * @param {HTMLElement} element - The relative-time element
   * @param {number} currentYear - Current year
   * @returns {HTMLElement} The formatted element
   */
  const formatSingleElement = (element, currentYear) => {
    if (!needsFormatting(element)) {
      return element;
    }

    return [
      applyBaseFormatting,
      (el) => applyYearFormatting(el, currentYear),
      applyTimeFormatting
    ].reduce((el, formatFn) => formatFn(el), element);
  };

  /**
   * Formats all relative-time elements on the page
   * @param {boolean} enabled - Whether formatting is enabled
   * @param {Function} logger - Logging function
   * @returns {number} Number of elements updated
   */
  const formatRelativeTimes = (enabled, logger) => {
    if (!enabled) {
      logger("Relative time formatting is disabled");
      return 0;
    }

    if (isIgnoredRoute()) {
      logger(`Skipping formatting on ignored route: ${window.location.pathname}`);
      return 0;
    }

    const timeElements = document.querySelectorAll("relative-time");
    logger(`Found ${timeElements.length} relative-time elements`);

    const currentYear = getCurrentYear();
    
    const updatedElements = Array.from(timeElements)
      .filter(needsFormatting)
      .map(element => formatSingleElement(element, currentYear));

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
    };

    setupMessageListener(handleSettingsChange);

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

    document.addEventListener("turbo:load", () => {
      const navLogger = createLogger(settings.debug);
      navLogger("GitHub navigation event detected, formatting relative times");
      setTimeout(formatWithCurrentSettings, 1000);
    });

    logger("absolute-time initialized");
  };
  //#endregion

  initializeExtension();
})();
