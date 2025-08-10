/**
 * Popup JavaScript for Absolute Time Chrome Extension
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
  optionsLink: 'optionsLink',
  headerTitle: 'headerTitle',
  headerSubtitle: 'headerSubtitle',
  enableTitle: 'enableTitle',
  enableDesc: 'enableDesc',
  debugTitle: 'debugTitle',
  debugDesc: 'debugDesc',
});

const defaultSettings = createDefaultSettings();
const selectors = createSelectors();
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
  text: enabled ? chrome.i18n.getMessage('popupStatusEnabled') : chrome.i18n.getMessage('popupStatusDisabled'),
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
    enableTitle: getElementById(selectors.enableTitle),
    enableDesc: getElementById(selectors.enableDesc),
    debugTitle: getElementById(selectors.debugTitle),
    debugDesc: getElementById(selectors.debugDesc),
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
  if (elements.headerTitle) elements.headerTitle.textContent = chrome.i18n.getMessage('popupHeaderTitle');
  if (elements.headerSubtitle) elements.headerSubtitle.textContent = chrome.i18n.getMessage('popupHeaderSubtitle');
  if (elements.enableTitle) elements.enableTitle.textContent = chrome.i18n.getMessage('popupEnableTitle');
  if (elements.enableDesc) elements.enableDesc.textContent = chrome.i18n.getMessage('popupEnableDescription');
  if (elements.debugTitle) elements.debugTitle.textContent = chrome.i18n.getMessage('popupDebugTitle');
  if (elements.debugDesc) elements.debugDesc.textContent = chrome.i18n.getMessage('popupDebugDescription');

  // Sync aria labels from i18n
  if (elements.enabledToggle && typeof elements.enabledToggle.setAttribute === 'function') {
    elements.enabledToggle.setAttribute('aria-label', chrome.i18n.getMessage('toggleAriaEnable'));
  }
  if (elements.debugToggle && typeof elements.debugToggle.setAttribute === 'function') {
    elements.debugToggle.setAttribute('aria-label', chrome.i18n.getMessage('toggleAriaDebug'));
  }

  return {
    toggles: updatedToggles,
    status: updatedStatus,
  };
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
  } catch (error) {
    console.error('Failed to toggle setting:', error);
    handleSettingsError();
  }
};

/**
 * Creates options link click handler
 * @returns {Function} Event handler function
 */
const createOptionsHandler = () => (event) => {
  event.preventDefault();
  chrome.runtime.openOptionsPage();
  window.close();
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
    statusText.textContent = chrome.i18n.getMessage('errorLoadingSettings');
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
    optionsLink: getElementById(selectors.optionsLink),
  };

  const handlers = {
    enabledToggle: createToggleHandler('enabled'),
    debugToggle: createToggleHandler('debug'),
    optionsLink: createOptionsHandler(),
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
  if (elements.optionsLink) {
    elements.optionsLink.textContent = chrome.i18n.getMessage('popupOpenOptions');
    elements.optionsLink.addEventListener('click', handlers.optionsLink);
  }

  return { elements, handlers };
};
//#endregion

//#region Initialization
/**
 * Initializes the popup
 * @returns {Promise<void>} Promise resolving when initialization is complete
 */
const initializePopup = async () => {
  try {
    const settings = await loadSettings();
    updateUiElements(settings);
    setupEventListeners();
    return { success: true, settings };
  } catch (error) {
    console.error('Failed to initialize popup:', error);
    handleSettingsError();
    return { success: false, error };
  }
};

/**
 * Handles DOM ready state and initializes popup
 * @returns {void}
 */
const handleDomReady = () => {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePopup);
  } else {
    initializePopup();
  }
};
//#endregion

handleDomReady(); 