/**
 * Options Page JavaScript for Absolute Time Chrome Extension
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
  saveNotification: 'saveNotification',
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
    ? 'Extension Active - Converting relative times to absolute dates'
    : 'Extension Disabled - Relative times will display as normal',
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
    
    setTimeout(() => {
      notification.textContent = notificationConfig.success.message;
      notification.style.background = notificationConfig.success.background;
    }, 300);
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
    statusText.textContent = 'Error loading settings - Please refresh the page';
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
  };

  const handlers = {
    enabledToggle: createToggleHandler('enabled'),
    debugToggle: createToggleHandler('debug'),
  };

  if (elements.enabledToggle) {
    elements.enabledToggle.addEventListener('click', handlers.enabledToggle);
  }
  if (elements.debugToggle) {
    elements.debugToggle.addEventListener('click', handlers.debugToggle);
  }

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
    if (unifiedBrowser && unifiedBrowser.isSupported) {
      unifiedBrowser.storage.addChangeListener(handleStorageChanges);
    }
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