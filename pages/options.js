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
  // New selectors for preview, selectors, and import/export
  livePreviewTitle: 'livePreviewTitle',
  livePreviewDesc: 'livePreviewDesc',
  previewRecentLabel: 'previewRecentLabel',
  previewRecentValue: 'previewRecentValue',
  previewThisWeekLabel: 'previewThisWeekLabel',
  previewThisWeekValue: 'previewThisWeekValue',
  previewOlderYearLabel: 'previewOlderYearLabel',
  previewOlderYearValue: 'previewOlderYearValue',
  previewActionLabel: 'previewActionLabel',
  previewActionValue: 'previewActionValue',
  selectorTargetingTitle: 'selectorTargetingTitle',
  selectorTargetingDesc: 'selectorTargetingDesc',
  selectorListLabel: 'selectorListLabel',
  selectorList: 'selectorList',
  selectorInput: 'selectorInput',
  selectorAddButton: 'selectorAddButton',
  importExportTitle: 'importExportTitle',
  importExportDesc: 'importExportDesc',
  exportButton: 'exportButton',
  importButton: 'importButton',
  importContainer: 'importContainer',
  importTextarea: 'importTextarea',
  importApplyButton: 'importApplyButton',
});

/**
 * Creates notification configuration
 * @returns {Object} Notification config
 */
const createNotificationConfig = () => Object.freeze({
  success: {
    message: (typeof chrome !== 'undefined' && chrome.i18n) 
      ? chrome.i18n.getMessage('notificationSaved') 
      : 'Settings saved successfully!',
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
    // Normalize settings to ensure only valid enum/boolean values are used
    const coerced = window.absoluteTimeShared.coerceSettings(result || {});
    return coerced;
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
    // New elements
    tooltipEnable: document.getElementById('tooltipEnable'),
    tooltipDebug: document.getElementById('tooltipDebug'),
    tooltipDateStyle: document.getElementById('tooltipDateStyle'),
    tooltipShowWeekday: document.getElementById('tooltipShowWeekday'),
    tooltipShowTime: document.getElementById('tooltipShowTime'),
    tooltipIncludeSeconds: document.getElementById('tooltipIncludeSeconds'),
    selectorInput: getElementById(selectors.selectorInput),
    selectorAddButton: getElementById(selectors.selectorAddButton),
    exportButton: getElementById(selectors.exportButton),
    importButton: getElementById(selectors.importButton),
    importApplyButton: getElementById(selectors.importApplyButton),
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

  // Localize tooltips
  if (elements.tooltipEnable) {
    elements.tooltipEnable.setAttribute('data-tooltip', chrome.i18n.getMessage('helpTooltipEnable'));
  }
  if (elements.tooltipDebug) {
    elements.tooltipDebug.setAttribute('data-tooltip', chrome.i18n.getMessage('helpTooltipDebug'));
  }
  if (elements.tooltipDateStyle) {
    elements.tooltipDateStyle.setAttribute('data-tooltip', chrome.i18n.getMessage('helpTooltipDateStyle'));
  }
  if (elements.tooltipShowWeekday) {
    elements.tooltipShowWeekday.setAttribute('data-tooltip', chrome.i18n.getMessage('helpTooltipShowWeekday'));
  }
  if (elements.tooltipShowTime) {
    elements.tooltipShowTime.setAttribute('data-tooltip', chrome.i18n.getMessage('helpTooltipShowTime'));
  }
  if (elements.tooltipIncludeSeconds) {
    elements.tooltipIncludeSeconds.setAttribute('data-tooltip', chrome.i18n.getMessage('helpTooltipIncludeSeconds'));
  }

  // Localize new sections
  const livePreviewTitle = getElementById(selectors.livePreviewTitle);
  if (livePreviewTitle) livePreviewTitle.textContent = chrome.i18n.getMessage('livePreviewTitle');
  
  const livePreviewDesc = getElementById(selectors.livePreviewDesc);
  if (livePreviewDesc) livePreviewDesc.textContent = chrome.i18n.getMessage('livePreviewDesc');
  
  const previewRecentLabel = getElementById(selectors.previewRecentLabel);
  if (previewRecentLabel) previewRecentLabel.textContent = chrome.i18n.getMessage('previewRecent');
  
  const previewThisWeekLabel = getElementById(selectors.previewThisWeekLabel);
  if (previewThisWeekLabel) previewThisWeekLabel.textContent = chrome.i18n.getMessage('previewThisWeek');
  
  const previewOlderYearLabel = getElementById(selectors.previewOlderYearLabel);
  if (previewOlderYearLabel) previewOlderYearLabel.textContent = chrome.i18n.getMessage('previewOlderYear');
  
  const previewActionLabel = getElementById(selectors.previewActionLabel);
  if (previewActionLabel) previewActionLabel.textContent = chrome.i18n.getMessage('previewAction');

  const selectorTargetingTitle = getElementById(selectors.selectorTargetingTitle);
  if (selectorTargetingTitle) selectorTargetingTitle.textContent = chrome.i18n.getMessage('selectorTargetingTitle');
  
  const selectorTargetingDesc = getElementById(selectors.selectorTargetingDesc);
  if (selectorTargetingDesc) selectorTargetingDesc.textContent = chrome.i18n.getMessage('selectorTargetingDesc');
  
  const selectorListLabel = getElementById(selectors.selectorListLabel);
  if (selectorListLabel) selectorListLabel.textContent = chrome.i18n.getMessage('selectorListLabel');
  
  if (elements.selectorInput) {
    elements.selectorInput.placeholder = chrome.i18n.getMessage('selectorAddPlaceholder');
  }
  
  if (elements.selectorAddButton) {
    elements.selectorAddButton.textContent = chrome.i18n.getMessage('selectorAddButton');
  }

  const importExportTitle = getElementById(selectors.importExportTitle);
  if (importExportTitle) importExportTitle.textContent = chrome.i18n.getMessage('importExportTitle');
  
  const importExportDesc = getElementById(selectors.importExportDesc);
  if (importExportDesc) importExportDesc.textContent = chrome.i18n.getMessage('importExportDesc');
  
  if (elements.exportButton) {
    elements.exportButton.textContent = chrome.i18n.getMessage('exportButton');
  }
  
  if (elements.importButton) {
    elements.importButton.textContent = chrome.i18n.getMessage('importButton');
  }
  
  if (elements.importApplyButton) {
    elements.importApplyButton.textContent = chrome.i18n.getMessage('importApplyButton');
  }

  const importTextarea = getElementById(selectors.importTextarea);
  if (importTextarea) {
    importTextarea.placeholder = chrome.i18n.getMessage('importPlaceholder');
  }

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
    updateLivePreview(newSettings);
    await showSaveNotification();
  } catch (error) {
    console.error('Failed to toggle setting:', error);
    const msg = (typeof chrome !== 'undefined' && chrome.i18n)
      ? chrome.i18n.getMessage('notificationErrorSave')
      : 'Failed to save settings';
    await showErrorNotification(msg);
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
      updateLivePreview(next);
      await showSaveNotification();
    });
  }

  if (elements.showWeekdaySelect) {
    elements.showWeekdaySelect.addEventListener('change', async (e) => {
      const current = await loadSettings();
      const next = updateSettings(current, { showWeekday: e.target.value });
      await saveSettings(next);
      updateUiElements(next);
      updateLivePreview(next);
      await showSaveNotification();
    });
  }

  if (elements.showTimeSelect) {
    elements.showTimeSelect.addEventListener('change', async (e) => {
      const current = await loadSettings();
      const next = updateSettings(current, { showTime: e.target.value });
      await saveSettings(next);
      updateUiElements(next);
      updateLivePreview(next);
      await showSaveNotification();
    });
  }

  if (elements.resetDefaultsButton) {
    elements.resetDefaultsButton.addEventListener('click', async () => {
      const defaults = createDefaultSettings();
      await saveSettings(defaults);
      updateUiElements(defaults);
      updateLivePreview(defaults);
      renderSelectorList(defaults.customSelectors);
      await showSaveNotification();
    });
  }

  // Selector management event listeners
  const selectorAddButton = getElementById(selectors.selectorAddButton);
  const selectorInput = getElementById(selectors.selectorInput);
  
  if (selectorAddButton) {
    selectorAddButton.addEventListener('click', async () => {
      const input = getElementById(selectors.selectorInput);
      if (input && input.value) {
        await addSelector(input.value);
      }
    });
  }

  if (selectorInput) {
    selectorInput.addEventListener('keypress', async (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (e.target.value) {
          await addSelector(e.target.value);
        }
      }
    });
  }

  // Import/Export event listeners
  const exportButton = getElementById(selectors.exportButton);
  if (exportButton) {
    exportButton.addEventListener('click', exportSettings);
  }

  const importButton = getElementById(selectors.importButton);
  const importContainer = getElementById(selectors.importContainer);
  if (importButton && importContainer) {
    importButton.addEventListener('click', () => {
      const isVisible = importContainer.style.display !== 'none';
      importContainer.style.display = isVisible ? 'none' : 'block';
    });
  }

  const importApplyButton = getElementById(selectors.importApplyButton);
  if (importApplyButton) {
    importApplyButton.addEventListener('click', async () => {
      const textarea = getElementById(selectors.importTextarea);
      if (textarea && textarea.value) {
        await importSettings(textarea.value);
      }
    });
  }

  return { elements, handlers };
};
//#endregion

//#region Live Preview Functions
/**
 * Formats a date according to current settings
 * @param {Date} date - Date to format
 * @param {Object} settings - Current settings
 * @param {boolean} isActionPage - Whether to simulate action page
 * @returns {string} Formatted date string
 */
const formatDateWithSettings = (date, settings, isActionPage = false) => {
  const currentYear = new Date().getFullYear();
  const dateYear = date.getFullYear();
  
  const options = {
    year: 'numeric',
    month: settings.dateStyle === 'long' ? 'long' : (settings.dateStyle === 'medium' ? 'short' : 'numeric'),
    day: 'numeric',
  };

  // Add weekday based on policy
  const shouldShowWeekday = 
    settings.showWeekday === 'always' || 
    (settings.showWeekday === 'olderYears' && dateYear < currentYear);
  
  if (shouldShowWeekday) {
    options.weekday = 'short';
  }

  // Add time based on policy
  const shouldShowTime = 
    settings.showTime === 'always' || 
    (settings.showTime === 'actionsOnly' && isActionPage);
  
  if (shouldShowTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
    if (settings.includeSeconds) {
      options.second = '2-digit';
    }
  }

  return date.toLocaleString('en-US', options);
};

/**
 * Updates the live preview with current settings
 * @param {Object} settings - Current settings
 */
const updateLivePreview = (settings) => {
  const now = new Date();
  
  // Recent: 2 hours ago
  const recentDate = new Date(now - 2 * 60 * 60 * 1000);
  const previewRecentValue = getElementById(selectors.previewRecentValue);
  if (previewRecentValue) {
    previewRecentValue.textContent = formatDateWithSettings(recentDate, settings, false);
  }

  // This week: 3 days ago
  const thisWeekDate = new Date(now - 3 * 24 * 60 * 60 * 1000);
  const previewThisWeekValue = getElementById(selectors.previewThisWeekValue);
  if (previewThisWeekValue) {
    previewThisWeekValue.textContent = formatDateWithSettings(thisWeekDate, settings, false);
  }

  // Older year: last year
  const olderYearDate = new Date(now);
  olderYearDate.setFullYear(now.getFullYear() - 1);
  const previewOlderYearValue = getElementById(selectors.previewOlderYearValue);
  if (previewOlderYearValue) {
    previewOlderYearValue.textContent = formatDateWithSettings(olderYearDate, settings, false);
  }

  // Action page: simulate action page timestamp
  const actionDate = new Date(now - 6 * 60 * 60 * 1000);
  const previewActionValue = getElementById(selectors.previewActionValue);
  if (previewActionValue) {
    previewActionValue.textContent = formatDateWithSettings(actionDate, settings, true);
  }
};
//#endregion

//#region Selector Management Functions
/**
 * Renders the selector list
 * @param {Array<string>} selectors - Array of selector strings
 */
const renderSelectorList = (selectors) => {
  const listElement = getElementById(selectors.selectorList);
  if (!listElement) return;

  if (!selectors || selectors.length === 0) {
    listElement.innerHTML = `<div style="color: #6b7280; font-size: 14px; padding: 12px;">${chrome.i18n.getMessage('selectorListEmpty')}</div>`;
    return;
  }

  listElement.innerHTML = selectors.map(selector => `
    <div class="selector-tag" role="listitem">
      <span>${selector}</span>
      <button 
        class="selector-tag-remove" 
        data-selector="${selector}"
        aria-label="${chrome.i18n.getMessage('selectorRemoveAria')}: ${selector}"
        type="button"
      >×</button>
    </div>
  `).join('');

  // Add event listeners to remove buttons
  listElement.querySelectorAll('.selector-tag-remove').forEach(button => {
    button.addEventListener('click', async (e) => {
      const selectorToRemove = e.target.getAttribute('data-selector');
      const currentSettings = await loadSettings();
      const newSelectors = currentSettings.customSelectors.filter(s => s !== selectorToRemove);
      
      if (newSelectors.length === 0) {
        await showErrorNotification(chrome.i18n.getMessage('selectorListEmpty'));
        return;
      }

      const newSettings = updateSettings(currentSettings, { customSelectors: newSelectors });
      await saveSettings(newSettings);
      renderSelectorList(newSettings.customSelectors);
      await showSaveNotification();
    });
  });
};

/**
 * Adds a new selector
 * @param {string} selector - Selector to add
 */
const addSelector = async (selector) => {
  const trimmed = selector.trim();
  if (!trimmed) return;

  const currentSettings = await loadSettings();
  
  if (currentSettings.customSelectors.includes(trimmed)) {
    await showErrorNotification('Selector already exists');
    return;
  }

  const newSelectors = [...currentSettings.customSelectors, trimmed];
  const newSettings = updateSettings(currentSettings, { customSelectors: newSelectors });
  await saveSettings(newSettings);
  renderSelectorList(newSettings.customSelectors);
  
  const input = getElementById(selectors.selectorInput);
  if (input) input.value = '';
  
  await showSaveNotification();
};
//#endregion

//#region Import/Export Functions
/**
 * Exports settings to JSON and copies to clipboard
 */
const exportSettings = async () => {
  try {
    const settings = await loadSettings();
    const json = JSON.stringify(settings, null, 2);
    
    await navigator.clipboard.writeText(json);
    await showSaveNotification();
    
    const notification = getElementById(selectors.saveNotification);
    if (notification) {
      notification.textContent = chrome.i18n.getMessage('exportSuccess');
    }
  } catch (error) {
    console.error('Export failed:', error);
    await showErrorNotification('Failed to export settings');
  }
};

/**
 * Imports settings from JSON
 * @param {string} jsonString - JSON string to import
 */
const importSettings = async (jsonString) => {
  try {
    const parsed = JSON.parse(jsonString);
    const coerced = window.absoluteTimeShared.coerceSettings(parsed);
    
    await saveSettings(coerced);
    updateUiElements(coerced);
    updateLivePreview(coerced);
    renderSelectorList(coerced.customSelectors);
    
    const textarea = getElementById(selectors.importTextarea);
    if (textarea) textarea.value = '';
    
    const container = getElementById(selectors.importContainer);
    if (container) container.style.display = 'none';
    
    await showSaveNotification();
    
    const notification = getElementById(selectors.saveNotification);
    if (notification) {
      notification.textContent = chrome.i18n.getMessage('importSuccess');
    }
  } catch (error) {
    console.error('Import failed:', error);
    await showErrorNotification(chrome.i18n.getMessage('importError'));
  }
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
    updateLivePreview(settings);
    renderSelectorList(settings.customSelectors);
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
    updateLivePreview(settings);
    renderSelectorList(settings.customSelectors);
    setupEventListeners();
    chrome.storage.onChanged.addListener(handleStorageChanges);
    return { success: true, settings };
  } catch (error) {
    console.error('Failed to initialize options page:', error);
    handleSettingsError();
    const msg = (typeof chrome !== 'undefined' && chrome.i18n)
      ? chrome.i18n.getMessage('errorLoadingSettingsOptions')
      : 'Failed to load settings';
    await showErrorNotification(msg);
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