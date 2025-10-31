(() => {
  'use strict';

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

  /**
   * WeakMap to store original attributes of formatted elements
   * This prevents memory leaks and allows efficient revert operations
   */
  const originalAttributes = new WeakMap();

  /**
   * Pending elements to be processed in the next animation frame
   */
  let pendingElements = new Set();

  /**
   * RequestAnimationFrame ID for batched updates
   */
  let scheduledAnimationFrame = null;
  //#endregion

  //#region Logging Utilities
  /**
   * Creates a logging function based on debug setting
   * @param {boolean} debugEnabled - Whether debug logging is enabled
   * @returns {Function} Logging function
   */
  const createLogger =
    (debugEnabled) =>
    (...args) => {
      if (debugEnabled) {
        console.log('[absolute-time]', ...args);
      }
    };

  /**
   * Adds visual debug indicator to an element
   * @param {HTMLElement} element - Element to mark
   */
  const addDebugIndicator = (element) => {
    if (!settings.debug) return;

    const originalBorder = element.style.border;
    element.style.border = '2px solid #0969da';
    element.style.transition = 'border 0.3s ease-out';

    setTimeout(() => {
      element.style.border = originalBorder;
      setTimeout(() => {
        element.style.transition = '';
      }, 300);
    }, 500);
  };

  //#endregion

  //#region Settings Management
  /**
   * Loads settings from Chrome storage
   * @returns {Promise<Object>} Promise resolving to settings object
   */
  const loadSettings = () => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      return new Promise((resolve) => {
        chrome.storage.sync.get(createDefaultSettings(), (loadedSettings) => {
          const normalized =
            typeof window !== 'undefined' && window.absoluteTimeShared
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
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace !== 'sync') return;
        const updated = {};
        ['enabled', 'debug', 'dateStyle', 'showWeekday', 'showTime', 'includeSeconds'].forEach(
          (key) => {
            if (Object.prototype.hasOwnProperty.call(changes, key)) {
              updated[key] = changes[key].newValue;
            }
          }
        );
        if (Object.keys(updated).length > 0) {
          onSettingsChange(updated);
        }
      });
    }
  };
  //#endregion

  //#region Time Formatting Logic
  /**
   * Stores original attributes of an element in WeakMap
   * @param {HTMLElement} element - The relative-time element
   */
  const storeOriginalAttributes = (element) => {
    if (originalAttributes.has(element)) return;

    const attrs = {
      format: element.getAttribute('format'),
      formatStyle: element.getAttribute('format-style'),
      weekday: element.getAttribute('weekday'),
      hour: element.getAttribute('hour'),
      minute: element.getAttribute('minute'),
      second: element.getAttribute('second'),
    };

    originalAttributes.set(element, attrs);
  };

  /**
   * Checks if an element needs formatting
   * @param {HTMLElement} element - The relative-time element
   * @returns {boolean} Whether the element needs formatting
   */
  const needsFormatting = (element) => element.getAttribute('data-formatted') !== 'true';

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
  const getElementYear = (element) => new Date(element.getAttribute('datetime')).getFullYear();

  /**
   * List of GitHub route patterns to ignore
   * @constant {string[]}
   */
  const ignoredRoutes = Object.freeze(['/issues', '/discussions']);

  /**
   * Checks if current page should be ignored based on route patterns
   * @returns {boolean} Whether current page should be ignored
   */
  const isIgnoredRoute = () => {
    const pathname = window.location.pathname;
    return ignoredRoutes.some((route) => pathname.includes(route));
  };

  /**
   * Checks if current page is an action page
   * @returns {boolean} Whether current page includes "/action"
   */
  const isActionPage = () => window.location.pathname.includes('/actions');

  /**
   * Applies base formatting attributes to an element
   * @param {HTMLElement} element - The relative-time element
   * @returns {HTMLElement} The formatted element
   */
  const applyBaseFormatting = (element, currentSettings) => {
    storeOriginalAttributes(element);
    element.setAttribute('format', 'datetime');
    const style = currentSettings?.dateStyle || 'short';
    element.setAttribute('format-style', style);
    element.setAttribute('data-formatted', 'true');
    return element;
  };

  /**
   * Applies year-specific formatting to an element
   * @param {HTMLElement} element - The relative-time element
   * @param {number} currentYear - Current year
   * @returns {HTMLElement} The formatted element
   */
  const applyYearFormatting = (element, currentYear, currentSettings) => {
    const policy = currentSettings?.showWeekday || 'olderYears';
    const elementYear = getElementYear(element);
    const shouldShowWeekday =
      policy === 'always' || (policy === 'olderYears' && elementYear < currentYear);
    if (shouldShowWeekday) {
      element.setAttribute('weekday', 'narrow');
    } else {
      element.removeAttribute('weekday');
    }
    return element;
  };

  /**
   * Applies time formatting for action pages
   * @param {HTMLElement} element - The relative-time element
   * @returns {HTMLElement} The formatted element
   */
  const applyTimeFormatting = (element, currentSettings) => {
    const policy = currentSettings?.showTime || 'actionsOnly';
    const shouldShowTime = policy === 'always' || (policy === 'actionsOnly' && isActionPage());

    if (shouldShowTime) {
      element.setAttribute('hour', '2-digit');
      element.setAttribute('minute', '2-digit');
      if (currentSettings?.includeSeconds) {
        element.setAttribute('second', '2-digit');
      } else {
        element.removeAttribute('second');
      }
    } else {
      element.removeAttribute('hour');
      element.removeAttribute('minute');
      element.removeAttribute('second');
    }
    return element;
  };

  /**
   * Formatting pipeline for relative-time elements
   * @constant {Function[]}
   */
  const formattingPipeline = [
    (el, currentYear, currentSettings) => applyBaseFormatting(el, currentSettings),
    (el, currentYear, currentSettings) => applyYearFormatting(el, currentYear, currentSettings),
    (el, currentYear, currentSettings) => applyTimeFormatting(el, currentSettings),
  ];

  /**
   * Formats a single relative-time element
   * @param {HTMLElement} element - The relative-time element
   * @param {number} currentYear - Current year
   * @returns {HTMLElement} The formatted element
   */
  const formatSingleElement = (element, currentYear, currentSettings) => {
    const formatted = formattingPipeline.reduce(
      (el, formatFn) => formatFn(el, currentYear, currentSettings),
      element
    );

    // Add debug indicator after formatting
    addDebugIndicator(formatted);

    return formatted;
  };

  /**
   * Reverts formatting applied by this extension
   * @param {Function} logger - Logging function
   * @returns {number} Number of elements reverted
   */
  const unformatRelativeTimes = (logger) => {
    const formatted = document.querySelectorAll('relative-time[data-formatted="true"]');

    formatted.forEach((el) => {
      const original = originalAttributes.get(el);

      if (original) {
        // Restore original attributes
        Object.entries(original).forEach(([key, value]) => {
          const attrName = key === 'formatStyle' ? 'format-style' : key;
          if (value !== null) {
            el.setAttribute(attrName, value);
          } else {
            el.removeAttribute(attrName);
          }
        });
      } else {
        // Fallback: remove all formatting attributes
        const attributesToRemove = [
          'format',
          'format-style',
          'weekday',
          'hour',
          'minute',
          'second',
        ];
        attributesToRemove.forEach((attr) => el.removeAttribute(attr));
      }

      el.removeAttribute('data-formatted');
    });

    if (formatted.length > 0) {
      logger(`Reverted ${formatted.length} relative-time elements`);
    }
    return formatted.length;
  };

  /**
   * Formats all relative-time elements on the page with batched DOM operations
   * @param {boolean} enabled - Whether formatting is enabled
   * @param {Function} logger - Logging function
   * @returns {number} Number of elements updated
   */
  const formatRelativeTimes = (enabled, logger) => {
    if (!enabled) {
      // When disabled, revert any previously formatted elements
      logger('Relative time formatting is disabled');
      return unformatRelativeTimes(logger);
    }

    if (isIgnoredRoute()) {
      logger(`Skipping formatting on ignored route: ${window.location.pathname}`);
      return 0;
    }

    const timeElements = document.querySelectorAll('relative-time');
    logger(`Found ${timeElements.length} relative-time elements`);

    if (timeElements.length === 0) return 0;

    const currentYear = getCurrentYear();

    // Phase 1: Batch all DOM reads
    const elementsToUpdate = Array.from(timeElements).filter((element) => {
      // Read phase: check if element needs formatting
      return element.isConnected && element.getAttribute('datetime');
    });

    // Phase 2: Batch all DOM writes in a single operation
    const updateCount = elementsToUpdate.length;

    elementsToUpdate.forEach((element) => {
      formatSingleElement(element, currentYear, settings);
    });

    if (updateCount > 0) {
      logger(`Updated ${updateCount} relative-time elements`);
    }

    return updateCount;
  };

  /**
   * Processes pending elements in a batched manner using requestAnimationFrame
   * @param {Function} logger - Logging function
   */
  const processPendingElements = (logger) => {
    if (pendingElements.size === 0) return;

    const elementsToProcess = Array.from(pendingElements);
    pendingElements.clear();
    scheduledAnimationFrame = null;

    if (!settings.enabled || isIgnoredRoute()) {
      return;
    }

    const currentYear = getCurrentYear();

    // Phase 1: Batch DOM reads
    const validElements = elementsToProcess.filter((element) => {
      return (
        element.isConnected &&
        element.getAttribute('datetime') &&
        element.tagName === 'RELATIVE-TIME'
      );
    });

    // Phase 2: Batch DOM writes
    if (validElements.length > 0) {
      logger(`Processing ${validElements.length} pending elements in batch`);

      validElements.forEach((element) => {
        formatSingleElement(element, currentYear, settings);
      });
    }
  };

  /**
   * Schedules element formatting in the next animation frame
   * @param {HTMLElement[]} elements - Elements to format
   * @param {Function} logger - Logging function
   */
  const scheduleFormatting = (elements, logger) => {
    // Add elements to pending set
    elements.forEach((el) => pendingElements.add(el));

    // Schedule processing if not already scheduled
    if (scheduledAnimationFrame === null) {
      scheduledAnimationFrame = requestAnimationFrame(() => {
        processPendingElements(logger);
      });
    }
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
    return element.querySelectorAll('relative-time').length > 0;
  };

  /**
   * Collects relative-time elements from a mutation
   * @param {MutationRecord} mutation - DOM mutation record
   * @returns {HTMLElement[]} Array of relative-time elements to process
   */
  const collectElementsFromMutation = (mutation) => {
    const elements = [];

    if (mutation.addedNodes.length > 0) {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          if (node.tagName === 'RELATIVE-TIME') {
            elements.push(node);
          } else if (hasRelativeTimeElements(node)) {
            elements.push(...node.querySelectorAll('relative-time'));
          }
        }
      });
    }

    if (
      mutation.type === 'attributes' &&
      mutation.target.tagName === 'RELATIVE-TIME' &&
      mutation.attributeName === 'datetime'
    ) {
      elements.push(mutation.target);
    }

    return elements;
  };

  /**
   * Processes mutations to collect elements for batched formatting
   * @param {MutationRecord[]} mutations - Array of mutation records
   * @returns {HTMLElement[]} Array of elements to format
   */
  const processMutations = (mutations) => {
    const allElements = [];

    mutations.forEach((mutation) => {
      const elements = collectElementsFromMutation(mutation);
      allElements.push(...elements);
    });

    // Deduplicate elements
    return [...new Set(allElements)];
  };
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
    let pendingArgs = null;

    return (...args) => {
      pendingArgs = args;
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        formatFn(...pendingArgs);
        pendingArgs = null;
      }, delay);
    };
  };

  /**
   * Initializes the extension
   */
  const initializeExtension = async () => {
    const logger = createLogger(settings.debug);
    logger('Initializing absolute-time');

    try {
      const loadedSettings = await loadSettings();
      settings = updateSettings(settings, loadedSettings);
      logger('Settings loaded', JSON.stringify(settings));
    } catch (error) {
      logger('Failed to load settings, using defaults');
    }

    const formatWithCurrentSettings = () =>
      formatRelativeTimes(settings.enabled, createLogger(settings.debug));

    // Create debounced handler for batched formatting
    const debouncedBatchFormat = createDebouncedFormatter((elements) => {
      const currentLogger = createLogger(settings.debug);
      if (elements.length > 0) {
        scheduleFormatting(elements, currentLogger);
      }
    }, 250);

    const handleSettingsChange = (newSettings) => {
      settings = updateSettings(settings, newSettings);
      const updatedLogger = createLogger(settings.debug);
      updatedLogger('Settings changed', JSON.stringify(settings));
      // Apply formatting immediately after settings change
      formatWithCurrentSettings();
    };

    setupStorageChangeListener(handleSettingsChange);

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', formatWithCurrentSettings);
    } else {
      formatWithCurrentSettings();
    }

    const observer = new MutationObserver((mutations) => {
      const elements = processMutations(mutations);
      if (elements.length > 0) {
        const currentLogger = createLogger(settings.debug);
        currentLogger(`DOM changes detected, batching ${elements.length} elements for formatting`);
        debouncedBatchFormat(elements);
      }
    });

    const observerConfig = {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['datetime'],
    };

    if (document.body) {
      observer.observe(document.body, observerConfig);
      logger('DOM observer initialized');
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        observer.observe(document.body, observerConfig);
        logger('DOM observer initialized after DOMContentLoaded');
      });
    }

    const navHandler = () => {
      const navLogger = createLogger(settings.debug);
      navLogger('GitHub navigation event detected, formatting relative times');
      setTimeout(formatWithCurrentSettings, 1000);
    };

    document.addEventListener('turbo:load', navHandler);
    document.addEventListener('turbo:render', navHandler);
    document.addEventListener('turbo:frame-load', navHandler);
    document.addEventListener('pjax:end', navHandler);

    logger('absolute-time initialized');
  };
  //#endregion

  initializeExtension();
})();
