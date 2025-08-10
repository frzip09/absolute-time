/**
 * Options Page JavaScript for Absolute Time Chrome Extension
 */

//#region Constants and Default State
/**
 * Creates default settings object
 * @returns {Object} Default settings
 */
const createDefaultSettings = () => window.absoluteTimeShared.getDefaultSettings();

/**
 * Creates UI element selectors object
 * @returns {Object} Selectors object
 */
const createSelectors = () => Object.freeze({
  enabledToggle: 'enabledToggle',
  debugToggle: 'debugToggle',
  statusIndicator: 'statusIndicator',
  statusText: 'statusText',
  saveNotification: 'saveNotification',
  headerTitle: 'headerTitle',
  headerSubtitle: 'headerSubtitle',
  mainCardTitle: 'mainCardTitle',
  dateStyleSelect: 'dateStyleSelect',
  showWeekdaySelect: 'showWeekdaySelect',
  showTimeSelect: 'showTimeSelect',
  includeSecondsToggle: 'includeSecondsToggle',
  resetDefaultsButton: 'resetDefaultsButton',
  enableTitle: 'enableTitle',
  enableDesc: 'enableDesc',
  enableDetails: 'enableDetails',
  debugTitle: 'debugTitle',
  debugDesc: 'debugDesc',
  debugDetails: 'debugDetails',
  statusTitle: 'statusTitle',
  howItWorks: 'howItWorks',
  howItWorksDesc: 'howItWorksDesc',
  examplesTitle: 'examplesTitle',
  footerLine1: 'footerLine1',
  footerLine2: 'footerLine2',
});

/**
 * Creates notification configuration
 * @returns {Object} Notification config
 */
const createNotificationConfig = () => Object.freeze({
  success: {
    message: 'Settings saved successfully!',
    background: '#10b981',
    duration: 3000,
  },
  error: {
    background: '#ef4444',
    duration: 4000,
  },
});

const defaultSettings = createDefaultSettings();
const selectors = createSelectors();
const notificationConfig = createNotificationConfig();
//#endregion

//#region Utility Functions
/**
 * Creates new settings object with updates
 * @param {Object} currentSettings - Current settings state
 * @param {Object} updates - Updates to apply
 * @returns {Object} Updated settings object
 */
const updateSettings = (currentSettings, updates) => 
  Object.freeze({ ...currentSettings, ...updates });

/**
 * Toggles a boolean setting value
 * @param {Object} settings - Current settings
 * @param {string} key - Setting key to toggle
 * @returns {Object} New settings with toggled value
 */
const toggleSetting = (settings, key) => 
  updateSettings(settings, { [key]: !settings[key] });

/**
 * Gets DOM element by ID
 * @param {string} elementId - Element ID
 * @returns {HTMLElement|null} DOM element or null
 */
const getElementById = (elementId) => document.getElementById(elementId);

/**
 * Creates status indicator configuration based on settings
 * @param {boolean} enabled - Whether extension is enabled
 * @returns {Object} Status configuration object
 */
const createStatusConfig = (enabled) => Object.freeze({
  className: enabled ? 'status-indicator enabled' : 'status-indicator disabled',
  text: enabled 
    ? chrome.i18n.getMessage('optionsStatusEnabled')
    : chrome.i18n.getMessage('optionsStatusDisabled'),
});

/**
 * Creates toggle class configuration
 * @param {boolean} isActive - Whether toggle is active
 * @returns {Object} Toggle configuration
 */
const createToggleConfig = (isActive) => Object.freeze({
  shouldAddActive: isActive,
  className: isActive ? 'toggle-switch active' : 'toggle-switch',
});
//#endregion

//#region Chrome API Wrappers
/**
 * Loads settings from Chrome storage
 * @returns {Promise<Object>} Promise resolving to settings
 */
const loadSettings = async () => {
  try {
    const result = await chrome.storage.sync.get(defaultSettings);
    return result || defaultSettings;
  } catch (error) {
    console.error('Failed to load settings:', error);
    return defaultSettings;
  }
};

/**
 * Saves settings to Chrome storage
 * @param {Object} settings - Settings to save
 * @returns {Promise<void>} Promise resolving when save is complete
 */
const saveSettings = async (settings) => {
  try {
    await chrome.storage.sync.set(settings);
  } catch (error) {
    console.error('Failed to save settings:', error);
    throw error;
  }
};
//#endregion

//#region DOM Manipulation
/**
 * Updates toggle element class based on active state
 * @param {HTMLElement} element - Toggle element
 * @param {boolean} isActive - Whether toggle should be active
 * @returns {HTMLElement} Updated element
 */
const updateToggleClass = (element, isActive) => {
  const config = createToggleConfig(isActive);
  element.className = 'toggle-switch';
  if (config.shouldAddActive) {
    element.classList.add('active');
  }
  if (element && typeof element.setAttribute === 'function') {
    element.setAttribute('aria-checked', isActive ? 'true' : 'false');
  }
  return element;
};

/**
 * Updates status indicator element
 * @param {HTMLElement} indicator - Status indicator element
 * @param {HTMLElement} text - Status text element
 * @param {boolean} enabled - Whether extension is enabled
 * @returns {Object} Object containing updated elements
 */
const updateStatusIndicator = (indicator, text, enabled) => {
  const config = createStatusConfig(enabled);
  indicator.className = config.className;
  text.textContent = config.text;
  return { indicator, text };
};

/**
 * Updates all UI elements based on settings
 * @param {Object} settings - Current settings
 * @returns {Object} UI update results
 */
const updateUiElements = (settings) => {
  const elements = {
    enabledToggle: getElementById(selectors.enabledToggle),
    debugToggle: getElementById(selectors.debugToggle),
    statusIndicator: getElementById(selectors.statusIndicator),
    statusText: getElementById(selectors.statusText),
    headerTitle: getElementById(selectors.headerTitle),
    headerSubtitle: getElementById(selectors.headerSubtitle),
    mainCardTitle: getElementById(selectors.mainCardTitle),
    enableTitle: getElementById(selectors.enableTitle),
    enableDesc: getElementById(selectors.enableDesc),
    enableDetails: getElementById(selectors.enableDetails),
    debugTitle: getElementById(selectors.debugTitle),
    debugDesc: getElementById(selectors.debugDesc),
    debugDetails: getElementById(selectors.debugDetails),
    statusTitle: getElementById(selectors.statusTitle),
    howItWorks: getElementById(selectors.howItWorks),
    howItWorksDesc: getElementById(selectors.howItWorksDesc),
    examplesTitle: getElementById(selectors.examplesTitle),
    footerLine1: getElementById(selectors.footerLine1),
    footerLine2: getElementById(selectors.footerLine2),
    repoLink: document.getElementById('repoLink'),
    dateStyleSelect: getElementById(selectors.dateStyleSelect),
    showWeekdaySelect: getElementById(selectors.showWeekdaySelect),
    showTimeSelect: getElementById(selectors.showTimeSelect),
    includeSecondsToggle: getElementById(selectors.includeSecondsToggle),
    resetDefaultsButton: getElementById(selectors.resetDefaultsButton),
    preferencesTitle: document.getElementById('preferencesTitle'),
    showTimeTitle: document.getElementById('showTimeTitle'),
    showTimeDesc: document.getElementById('showTimeDesc'),
    showTimeOptNever: document.getElementById('showTimeOptNever'),
    showTimeOptActionsOnly: document.getElementById('showTimeOptActionsOnly'),
    showTimeOptAlways: document.getElementById('showTimeOptAlways'),
    showWeekdayTitle: document.getElementById('showWeekdayTitle'),
    showWeekdayDesc: document.getElementById('showWeekdayDesc'),
    showWeekdayOptNever: document.getElementById('showWeekdayOptNever'),
    showWeekdayOptOlderYears: document.getElementById('showWeekdayOptOlderYears'),
    showWeekdayOptAlways: document.getElementById('showWeekdayOptAlways'),
    dateStyleTitle: document.getElementById('dateStyleTitle'),
    dateStyleDesc: document.getElementById('dateStyleDesc'),
    dateStyleOptShort: document.getElementById('dateStyleOptShort'),
    dateStyleOptMedium: document.getElementById('dateStyleOptMedium'),
    dateStyleOptLong: document.getElementById('dateStyleOptLong'),
    includeSecondsTitle: document.getElementById('includeSecondsTitle'),
    includeSecondsDesc: document.getElementById('includeSecondsDesc'),
    dangerZoneTitle: document.getElementById('dangerZoneTitle'),
    // import/export removed
  };

  const updatedToggles = {
    enabled: updateToggleClass(elements.enabledToggle, settings.enabled),
    debug: updateToggleClass(elements.debugToggle, settings.debug),
  };

  const updatedStatus = updateStatusIndicator(
    elements.statusIndicator, 
    elements.statusText, 
    settings.enabled
  );

  // Localize static strings
  if (elements.headerTitle) elements.headerTitle.textContent = chrome.i18n.getMessage('optionsHeaderTitle');
  if (elements.headerSubtitle) elements.headerSubtitle.textContent = chrome.i18n.getMessage('optionsHeaderSubtitle');
  if (elements.mainCardTitle) elements.mainCardTitle.textContent = chrome.i18n.getMessage('optionsCardTitleMain');
  if (elements.enableTitle) elements.enableTitle.textContent = chrome.i18n.getMessage('optionsEnableTitle');
  if (elements.enableDesc) elements.enableDesc.textContent = chrome.i18n.getMessage('optionsEnableDesc');
  if (elements.enableDetails) elements.enableDetails.textContent = chrome.i18n.getMessage('optionsEnableDetails');
  if (elements.debugTitle) elements.debugTitle.textContent = chrome.i18n.getMessage('optionsDebugTitle');
  if (elements.debugDesc) elements.debugDesc.textContent = chrome.i18n.getMessage('optionsDebugDesc');
  if (elements.debugDetails) elements.debugDetails.textContent = chrome.i18n.getMessage('optionsDebugDetails');
  if (elements.statusTitle) elements.statusTitle.textContent = chrome.i18n.getMessage('optionsStatusTitle');
  if (elements.howItWorks) elements.howItWorks.textContent = chrome.i18n.getMessage('optionsHowItWorks');
  if (elements.howItWorksDesc) elements.howItWorksDesc.textContent = chrome.i18n.getMessage('optionsHowItWorksDesc');
  if (elements.examplesTitle) elements.examplesTitle.textContent = chrome.i18n.getMessage('optionsExamplesTitle');
  if (elements.footerLine1) elements.footerLine1.textContent = chrome.i18n.getMessage('optionsFooterLine1');
  if (elements.footerLine2) elements.footerLine2.textContent = chrome.i18n.getMessage('optionsFooterLine2');
  if (elements.repoLink) elements.repoLink.textContent = chrome.i18n.getMessage('repoLinkLabel');

  // Sync aria labels from i18n
  if (elements.enabledToggle && typeof elements.enabledToggle.setAttribute === 'function') {
    elements.enabledToggle.setAttribute('aria-label', chrome.i18n.getMessage('toggleAriaEnable'));
  }
  if (elements.debugToggle && typeof elements.debugToggle.setAttribute === 'function') {
    elements.debugToggle.setAttribute('aria-label', chrome.i18n.getMessage('toggleAriaDebug'));
  }
  if (elements.includeSecondsToggle && typeof elements.includeSecondsToggle.setAttribute === 'function') {
    elements.includeSecondsToggle.setAttribute('aria-label', chrome.i18n.getMessage('toggleAriaIncludeSeconds'));
  }
  if (elements.showTimeSelect) elements.showTimeSelect.setAttribute('aria-label', chrome.i18n.getMessage('showTimeAria'));
  if (elements.showWeekdaySelect) elements.showWeekdaySelect.setAttribute('aria-label', chrome.i18n.getMessage('showWeekdayAria'));
  if (elements.dateStyleSelect) elements.dateStyleSelect.setAttribute('aria-label', chrome.i18n.getMessage('dateStyleAria'));

  // Localize new section labels and options
  if (elements.preferencesTitle) elements.preferencesTitle.textContent = chrome.i18n.getMessage('preferencesTitle');
  if (elements.showTimeTitle) elements.showTimeTitle.textContent = chrome.i18n.getMessage('showTimeTitle');
  if (elements.showTimeDesc) elements.showTimeDesc.textContent = chrome.i18n.getMessage('showTimeDesc');
  if (elements.showTimeOptNever) elements.showTimeOptNever.textContent = chrome.i18n.getMessage('showTimeOptNever');
  if (elements.showTimeOptActionsOnly) elements.showTimeOptActionsOnly.textContent = chrome.i18n.getMessage('showTimeOptActionsOnly');
  if (elements.showTimeOptAlways) elements.showTimeOptAlways.textContent = chrome.i18n.getMessage('showTimeOptAlways');
  if (elements.showWeekdayTitle) elements.showWeekdayTitle.textContent = chrome.i18n.getMessage('showWeekdayTitle');
  if (elements.showWeekdayDesc) elements.showWeekdayDesc.textContent = chrome.i18n.getMessage('showWeekdayDesc');
  if (elements.showWeekdayOptNever) elements.showWeekdayOptNever.textContent = chrome.i18n.getMessage('showWeekdayOptNever');
  if (elements.showWeekdayOptOlderYears) elements.showWeekdayOptOlderYears.textContent = chrome.i18n.getMessage('showWeekdayOptOlderYears');
  if (elements.showWeekdayOptAlways) elements.showWeekdayOptAlways.textContent = chrome.i18n.getMessage('showWeekdayOptAlways');
  if (elements.dateStyleTitle) elements.dateStyleTitle.textContent = chrome.i18n.getMessage('dateStyleTitle');
  if (elements.dateStyleDesc) elements.dateStyleDesc.textContent = chrome.i18n.getMessage('dateStyleDesc');
  if (elements.dateStyleOptShort) elements.dateStyleOptShort.textContent = chrome.i18n.getMessage('dateStyleOptShort');
  if (elements.dateStyleOptMedium) elements.dateStyleOptMedium.textContent = chrome.i18n.getMessage('dateStyleOptMedium');
  if (elements.dateStyleOptLong) elements.dateStyleOptLong.textContent = chrome.i18n.getMessage('dateStyleOptLong');
  if (elements.includeSecondsTitle) elements.includeSecondsTitle.textContent = chrome.i18n.getMessage('includeSecondsTitle');
  if (elements.includeSecondsDesc) elements.includeSecondsDesc.textContent = chrome.i18n.getMessage('includeSecondsDesc');
  if (elements.dangerZoneTitle) elements.dangerZoneTitle.textContent = chrome.i18n.getMessage('dangerZoneTitle');
  if (elements.resetDefaultsButton) {
    elements.resetDefaultsButton.textContent = chrome.i18n.getMessage('resetDefaults');
    elements.resetDefaultsButton.setAttribute('aria-label', chrome.i18n.getMessage('resetDefaults'));
  }
  // import/export removed

  // Sync new control values
  if (elements.dateStyleSelect) elements.dateStyleSelect.value = settings.dateStyle || 'short';
  if (elements.showWeekdaySelect) elements.showWeekdaySelect.value = settings.showWeekday || 'olderYears';
  if (elements.showTimeSelect) elements.showTimeSelect.value = settings.showTime || 'actionsOnly';
  if (elements.includeSecondsToggle) updateToggleClass(elements.includeSecondsToggle, !!settings.includeSeconds);

  return {
    toggles: updatedToggles,
    status: updatedStatus,
  };
};
//#endregion

//#region Notification System
/**
 * Shows a notification with specified configuration
 * @param {HTMLElement} element - Notification element
 * @param {Object} config - Notification configuration
 * @returns {Promise<void>} Promise resolving when notification is shown
 */
const showNotification = (element, config) => {
  return new Promise((resolve) => {
    element.textContent = config.message || element.textContent;
    element.style.background = config.background || '';
    element.classList.add('show');
    
    setTimeout(() => {
      element.classList.remove('show');
      resolve();
    }, config.duration || 3000);
  });
};

/**
 * Shows success notification
 * @returns {Promise<void>} Promise resolving when notification is complete
 */
const showSaveNotification = async () => {
  const notification = getElementById(selectors.saveNotification);
  if (notification) {
    await showNotification(notification, notificationConfig.success);
  }
};

/**
 * Shows error notification with custom message
 * @param {string} message - Error message to display
 * @returns {Promise<void>} Promise resolving when notification is complete
 */
const showErrorNotification = async (message) => {
  const notification = getElementById(selectors.saveNotification);
  if (notification) {
    const errorConfig = {
      ...notificationConfig.error,
      message: message,
    };
    
    await showNotification(notification, errorConfig);
    // Reset content after it hides; keep element hidden
    setTimeout(() => {
      notification.textContent = notificationConfig.success.message;
      notification.style.background = notificationConfig.success.background;
    }, 350);
  }
};
//#endregion

//#region Event Handlers
/**
 * Creates a toggle handler for a specific setting
 * @param {string} settingKey - Setting key to toggle
 * @returns {Function} Event handler function
 */
const createToggleHandler = (settingKey) => async () => {
  try {
    const currentSettings = await loadSettings();
    const newSettings = toggleSetting(currentSettings, settingKey);
    await saveSettings(newSettings);
    updateUiElements(newSettings);
    await showSaveNotification();
  } catch (error) {
    console.error('Failed to toggle setting:', error);
    await showErrorNotification('Failed to save settings');
  }
};

/**
 * Handles settings-related errors by updating UI
 * @returns {void}
 */
const handleSettingsError = () => {
  const statusIndicator = getElementById(selectors.statusIndicator);
  const statusText = getElementById(selectors.statusText);
  
  if (statusIndicator && statusText) {
    statusIndicator.className = 'status-indicator disabled';
    statusText.textContent = chrome.i18n.getMessage('errorLoadingSettingsOptions');
  }
};
//#endregion

//#region Event Listener Setup
/**
 * Sets up all event listeners
 * @returns {Object} Event listener configuration
 */
const setupEventListeners = () => {
  const elements = {
    enabledToggle: getElementById(selectors.enabledToggle),
    debugToggle: getElementById(selectors.debugToggle),
    dateStyleSelect: getElementById(selectors.dateStyleSelect),
    showWeekdaySelect: getElementById(selectors.showWeekdaySelect),
    showTimeSelect: getElementById(selectors.showTimeSelect),
    includeSecondsToggle: getElementById(selectors.includeSecondsToggle),
    resetDefaultsButton: getElementById(selectors.resetDefaultsButton),
  };

  const handlers = {
    enabledToggle: createToggleHandler('enabled'),
    debugToggle: createToggleHandler('debug'),
    includeSecondsToggle: createToggleHandler('includeSeconds'),
  };

  const addToggleA11y = (el, handler) => {
    if (!el) return;
    el.addEventListener('click', handler);
    el.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handler();
      }
    });
  };

  addToggleA11y(elements.enabledToggle, handlers.enabledToggle);
  addToggleA11y(elements.debugToggle, handlers.debugToggle);
  addToggleA11y(elements.includeSecondsToggle, handlers.includeSecondsToggle);

  if (elements.dateStyleSelect) {
    elements.dateStyleSelect.addEventListener('change', async (e) => {
      const current = await loadSettings();
      const next = updateSettings(current, { dateStyle: e.target.value });
      await saveSettings(next);
      updateUiElements(next);
      await showSaveNotification();
    });
  }

  if (elements.showWeekdaySelect) {
    elements.showWeekdaySelect.addEventListener('change', async (e) => {
      const current = await loadSettings();
      const next = updateSettings(current, { showWeekday: e.target.value });
      await saveSettings(next);
      updateUiElements(next);
      await showSaveNotification();
    });
  }

  if (elements.showTimeSelect) {
    elements.showTimeSelect.addEventListener('change', async (e) => {
      const current = await loadSettings();
      const next = updateSettings(current, { showTime: e.target.value });
      await saveSettings(next);
      updateUiElements(next);
      await showSaveNotification();
    });
  }

  if (elements.resetDefaultsButton) {
    elements.resetDefaultsButton.addEventListener('click', async () => {
      const defaults = createDefaultSettings();
      await saveSettings(defaults);
      updateUiElements(defaults);
      await showSaveNotification();
    });
  }

  // import/export removed

  return { elements, handlers };
};
//#endregion

//#region Storage Change Handling
/**
 * Handles storage changes from other extension contexts
 * @param {Object} changes - Storage changes object
 * @param {string} namespace - Storage namespace
 * @returns {Promise<void>} Promise resolving when changes are handled
 */
const handleStorageChanges = async (changes, namespace) => {
  if (namespace === 'sync') {
    const settings = await loadSettings();
    updateUiElements(settings);
  }
};
//#endregion

//#region Initialization
/**
 * Initializes the options page
 * @returns {Promise<Object>} Promise resolving to initialization result
 */
const initializeOptions = async () => {
  try {
    const settings = await loadSettings();
    updateUiElements(settings);
    setupEventListeners();
    chrome.storage.onChanged.addListener(handleStorageChanges);
    return { success: true, settings };
  } catch (error) {
    console.error('Failed to initialize options page:', error);
    handleSettingsError();
    await showErrorNotification('Failed to load settings');
    return { success: false, error };
  }
};

/**
 * Handles DOM ready state and initializes options page
 * @returns {void}
 */
const handleDomReady = () => {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeOptions);
  } else {
    initializeOptions();
  }
};
//#endregion

handleDomReady(); 