/**
 * Browser Compatibility Layer for Chrome and Firefox Extensions
 * Provides unified API access across different browsers
 */

//#region Browser Detection
/**
 * Detects the current browser environment
 * @returns {string} Browser identifier ('chrome', 'firefox', or 'unknown')
 */
const detectBrowser = () => {
  if (typeof browser !== 'undefined' && browser.runtime) {
    return 'firefox';
  }
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    return 'chrome';
  }
  return 'unknown';
};

/**
 * Gets the appropriate browser API object
 * @returns {Object} Browser API object
 */
const getBrowserApi = () => {
  const browserType = detectBrowser();
  switch (browserType) {
    case 'firefox':
      return browser;
    case 'chrome':
      return chrome;
    default:
      return null;
  }
};
//#endregion

//#region Storage API Wrapper
/**
 * Unified storage API wrapper
 * @returns {Object} Storage API methods
 */
const createStorageApi = () => {
  const api = getBrowserApi();
  if (!api || !api.storage) {
    return null;
  }

  return {
    /**
     * Gets data from storage
     * @param {Object|string|Array} keys - Keys to retrieve
     * @returns {Promise<Object>} Promise resolving to stored data
     */
    get: (keys) => {
      if (api.storage.sync.get.length > 1) {
        // Chrome-style callback API
        return new Promise((resolve) => {
          api.storage.sync.get(keys, resolve);
        });
      } else {
        // Firefox-style promise API
        return api.storage.sync.get(keys);
      }
    },

    /**
     * Sets data in storage
     * @param {Object} items - Items to store
     * @returns {Promise<void>} Promise resolving when storage is complete
     */
    set: (items) => {
      if (api.storage.sync.set.length > 1) {
        // Chrome-style callback API
        return new Promise((resolve) => {
          api.storage.sync.set(items, resolve);
        });
      } else {
        // Firefox-style promise API
        return api.storage.sync.set(items);
      }
    },

    /**
     * Adds listener for storage changes
     * @param {Function} callback - Callback function
     */
    addChangeListener: (callback) => {
      if (api.storage.onChanged) {
        api.storage.onChanged.addListener(callback);
      }
    }
  };
};
//#endregion

//#region Tabs API Wrapper
/**
 * Unified tabs API wrapper
 * @returns {Object} Tabs API methods
 */
const createTabsApi = () => {
  const api = getBrowserApi();
  if (!api || !api.tabs) {
    return null;
  }

  return {
    /**
     * Queries for tabs matching criteria
     * @param {Object} queryInfo - Query criteria
     * @returns {Promise<Array>} Promise resolving to array of tabs
     */
    query: (queryInfo) => {
      if (api.tabs.query.length > 1) {
        // Chrome-style callback API
        return new Promise((resolve) => {
          api.tabs.query(queryInfo, resolve);
        });
      } else {
        // Firefox-style promise API
        return api.tabs.query(queryInfo);
      }
    },

    /**
     * Sends message to specific tab
     * @param {number} tabId - Tab ID
     * @param {Object} message - Message to send
     * @returns {Promise<void>} Promise resolving when message is sent
     */
    sendMessage: (tabId, message) => {
      if (api.tabs.sendMessage.length > 2) {
        // Chrome-style callback API
        return new Promise((resolve, reject) => {
          api.tabs.sendMessage(tabId, message, (response) => {
            if (api.runtime.lastError) {
              reject(api.runtime.lastError);
            } else {
              resolve(response);
            }
          });
        });
      } else {
        // Firefox-style promise API
        return api.tabs.sendMessage(tabId, message).catch(() => {
          // Ignore errors for tabs without content script
        });
      }
    }
  };
};
//#endregion

//#region Runtime API Wrapper
/**
 * Unified runtime API wrapper
 * @returns {Object} Runtime API methods
 */
const createRuntimeApi = () => {
  const api = getBrowserApi();
  if (!api || !api.runtime) {
    return null;
  }

  return {
    /**
     * Adds message listener
     * @param {Function} callback - Message listener callback
     */
    addMessageListener: (callback) => {
      if (api.runtime.onMessage) {
        api.runtime.onMessage.addListener(callback);
      }
    },

    /**
     * Opens options page
     * @returns {Promise<void>} Promise resolving when options page opens
     */
    openOptionsPage: () => {
      if (api.runtime.openOptionsPage) {
        if (api.runtime.openOptionsPage.length > 0) {
          // Chrome-style callback API
          return new Promise((resolve) => {
            api.runtime.openOptionsPage(resolve);
          });
        } else {
          // Firefox-style promise API
          return api.runtime.openOptionsPage();
        }
      }
      return Promise.resolve();
    }
  };
};
//#endregion

//#region Unified Browser API
/**
 * Creates unified browser API object
 * @returns {Object} Unified browser API
 */
const createUnifiedBrowserApi = () => {
  const storage = createStorageApi();
  const tabs = createTabsApi();
  const runtime = createRuntimeApi();

  if (!storage || !tabs || !runtime) {
    return null;
  }

  return {
    storage,
    tabs,
    runtime,
    isSupported: true,
    browserType: detectBrowser()
  };
};

// Export the unified API
const unifiedBrowser = createUnifiedBrowserApi();
//#endregion 