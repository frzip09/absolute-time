/**
 * Popup JavaScript for Absolute Time Chrome Extension
 */

//#region Constants and Default State
/**
 * Creates default settings object
 * @returns {Object} Default settings
 */
const createDefaultSettings = () => Object.freeze({
  enabled: true,
  debug: false,
});

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
  text: enabled ? 'Extension Active' : 'Extension Disabled',
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

//#region Browser API Wrappers
/**
 * Loads settings from browser storage
 * @returns {Promise<Object>} Promise resolving to settings
 */
const loadSettings = async () => {
  if (!unifiedBrowser || !unifiedBrowser.isSupported) {
    return defaultSettings;
  }
  
  try {
    const result = await unifiedBrowser.storage.get(defaultSettings);
    return result || defaultSettings;
  } catch (error) {
    console.error('Failed to load settings:', error);
    return defaultSettings;
  }
};

/**
 * Saves settings to browser storage and notifies content scripts
 * @param {Object} settings - Settings to save
 * @returns {Promise<void>} Promise resolving when save is complete
 */
const saveSettings = async (settings) => {
  if (!unifiedBrowser || !unifiedBrowser.isSupported) {
    throw new Error('Browser API not supported');
  }
  
  try {
    await unifiedBrowser.storage.set(settings);
    await notifyContentScripts(settings);
  } catch (error) {
    console.error('Failed to save settings:', error);
    throw error;
  }
};

/**
 * Notifies content scripts of settings changes
 * @param {Object} settings - New settings
 * @returns {Promise<void>} Promise resolving when notifications are sent
 */
const notifyContentScripts = async (settings) => {
  if (!unifiedBrowser || !unifiedBrowser.isSupported) {
    return;
  }
  
  try {
    const tabs = await unifiedBrowser.tabs.query({ url: '*://*.github.com/*' });
    const notifications = tabs.map(tab => 
      sendMessageToTab(tab.id, {
        type: 'settingsChanged',
        settings: settings
      })
    );
    await Promise.allSettled(notifications);
  } catch (error) {
    console.error('Failed to notify content scripts:', error);
  }
};

/**
 * Sends message to a specific tab
 * @param {number} tabId - Tab ID
 * @param {Object} message - Message to send
 * @returns {Promise<void>} Promise resolving when message is sent
 */
const sendMessageToTab = async (tabId, message) => {
  if (!unifiedBrowser || !unifiedBrowser.isSupported) {
    return;
  }
  
  try {
    await unifiedBrowser.tabs.sendMessage(tabId, message);
  } catch (error) {
    // Ignore errors for tabs without content script
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
  if (unifiedBrowser && unifiedBrowser.isSupported) {
    unifiedBrowser.runtime.openOptionsPage();
  }
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
    statusText.textContent = 'Error loading settings';
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

  if (elements.enabledToggle) {
    elements.enabledToggle.addEventListener('click', handlers.enabledToggle);
  }
  if (elements.debugToggle) {
    elements.debugToggle.addEventListener('click', handlers.debugToggle);
  }
  if (elements.optionsLink) {
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