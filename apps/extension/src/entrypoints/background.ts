// Background service worker for Salmon Wallet extension
// Handles message passing between content scripts, popup, and dApps
//
// IMPORTANT: Do NOT import from '@salmon/shared' here.
// The barrel export pulls in React, axios, crypto libs, etc. which crash
// the MV3 service worker (no DOM). Keep this file dependency-free.

const STORAGE_KEYS = {
  CONNECTION: 'salmon_connection',
  NETWORK_ID: 'salmon_active_network_id',
  TRUSTED_APPS: 'salmon_trusted_apps',
} as const;

const STASH_KEYS = {
  PASSWORD: 'password',
  DERIVED_KEY: 'derived_key_cache',
  LAST_ACTIVITY: 'salmon_last_activity',
} as const;

// Type definitions
interface MessageData {
  id: string;
  method: string;
  params?: {
    network?: string;
    [key: string]: unknown;
  };
}

interface Message {
  channel: string;
  data: MessageData;
}

interface StashMessage {
  channel: string;
  data: {
    method: 'get' | 'set' | 'delete' | 'clear';
    key?: string;
    value?: unknown;
  };
}

interface ConnectionData {
  blockchain: string;
  address: string;
}

interface StorageData {
  connection: ConnectionData | null;
  networkId: string | null;
  trustedApps: Record<string, Record<string, boolean>> | null;
}

type ResponseHandler = (data: unknown, id?: string) => void;

export default defineBackground(() => {
  // Maps to track response handlers and stashed values
  const responseHandlers = new Map<string, ResponseHandler>();
  const stashedValues = new Map<string, unknown>();

  /**
   * Get the active tab ID from the current window
   */
  const getActiveTabId = async (): Promise<number | undefined> => {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    return tabs?.[0]?.id;
  };

  /**
   * Get the list of connected tab IDs from storage
   */
  const getConnectedTabsIds = async (): Promise<number[]> => {
    return new Promise((resolve) => {
      chrome.storage.local.get('connectedTabsIds', (result) => {
        resolve(JSON.parse(result.connectedTabsIds || 'null') || []);
      });
    });
  };

  /**
   * Add a tab ID to the connected tabs list
   */
  const addConnectedTabId = async (tabId: number | undefined): Promise<void> => {
    if (tabId) {
      const tabsIds = await getConnectedTabsIds();
      if (!tabsIds.includes(tabId)) {
        await chrome.storage.local.set({
          connectedTabsIds: JSON.stringify([...tabsIds, tabId]),
        });
      }
    }
  };

  /**
   * Remove a tab ID from the connected tabs list
   */
  const removeConnectedTabId = async (tabId: number): Promise<void> => {
    const tabsIds = await getConnectedTabsIds();
    if (tabsIds.includes(tabId)) {
      await chrome.storage.local.set({
        connectedTabsIds: JSON.stringify(tabsIds.filter((id) => id !== tabId)),
      });
    }
  };

  /**
   * Clean up connected tabs list by removing closed tabs
   */
  const cleanConnectedTabs = async (): Promise<void> => {
    const allTabs = await chrome.tabs.query({});
    const allTabsIds = allTabs.map((tab) => tab?.id).filter((id): id is number => id !== undefined);
    const connectedTabsIds = await getConnectedTabsIds();

    const tabsIds = connectedTabsIds.filter((tabId) => allTabsIds.includes(tabId));
    await chrome.storage.local.set({
      connectedTabsIds: JSON.stringify(tabsIds),
    });
  };

  /**
   * Launch a popup window for user interaction (approval dialogs, etc.)
   */
  const launchPopup = (
    message: Message,
    sender: chrome.runtime.MessageSender,
    sendResponse: ResponseHandler
  ): void => {
    const searchParams = new URLSearchParams();
    searchParams.set('origin', sender.origin || '');
    searchParams.set('request', JSON.stringify(message.data));
    if (message.data.params?.network) {
      searchParams.set('network', message.data.params.network);
    }

    chrome.windows.getLastFocused(async (focusedWindow) => {
      const popup = await chrome.windows.create({
        url: 'index.html#' + searchParams.toString(),
        type: 'popup',
        width: 460,
        height: 675,
        top: focusedWindow.top,
        left: (focusedWindow.left || 0) + (focusedWindow.width || 460) - 460,
        focused: true,
      });

      const listener = (windowId: number): void => {
        if (windowId === popup.id) {
          const responseHandler = responseHandlers.get(message.data.id);
          if (responseHandler) {
            responseHandlers.delete(message.data.id);
            responseHandler({
              error: 'Operation cancelled',
              id: message.data.id,
            });
          }

          chrome.windows.onRemoved.removeListener(listener);
        }
      };

      chrome.windows.onRemoved.addListener(listener);
    });

    responseHandlers.set(message.data.id, sendResponse);
  };

  /**
   * Get connection data if the origin is trusted
   */
  const getConnection = async (
    origin: string,
    { connection, networkId, trustedApps }: StorageData
  ): Promise<ConnectionData | null> => {
    if (connection?.blockchain !== 'solana') {
      return null;
    }
    if (!networkId || !trustedApps?.[networkId]?.[origin]) {
      return null;
    }
    return connection;
  };

  /**
   * Handle connection requests from dApps
   */
  const handleConnect = async (
    message: Message,
    sender: chrome.runtime.MessageSender,
    sendResponse: ResponseHandler
  ): Promise<void> => {
    chrome.storage.local.get(
      [STORAGE_KEYS.CONNECTION, STORAGE_KEYS.NETWORK_ID, STORAGE_KEYS.TRUSTED_APPS],
      async (result) => {
        const tabId = await getActiveTabId();

        const callback: ResponseHandler = async (data, id) => {
          await sendResponse(data, id);
          await addConnectedTabId(tabId);
        };

        const data: StorageData = {
          connection: JSON.parse(result[STORAGE_KEYS.CONNECTION] || 'null'),
          networkId: JSON.parse(result[STORAGE_KEYS.NETWORK_ID] || 'null'),
          trustedApps: JSON.parse(result[STORAGE_KEYS.TRUSTED_APPS] || 'null'),
        };

        const connection = await getConnection(sender.origin || '', data);
        if (connection) {
          await callback({
            method: 'connected',
            params: {
              publicKey: connection.address,
            },
            id: message.data.id,
          });
        } else {
          launchPopup(message, sender, callback);
        }
      }
    );
  };

  /**
   * Handle disconnect requests from dApps
   */
  const handleDisconnect = async (
    message: Message,
    _sender: chrome.runtime.MessageSender,
    sendResponse: ResponseHandler
  ): Promise<void> => {
    await sendResponse({ method: 'disconnected', id: message.data.id });

    const tabId = await getActiveTabId();
    if (tabId !== undefined) {
      await removeConnectedTabId(tabId);
    }
  };

  /**
   * Handle stash operations (password storage, session management)
   */
  const handleStashOperation = (
    message: StashMessage,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response?: unknown) => void
  ): boolean | void => {
    if (message.data.method === 'get') {
      sendResponse(stashedValues.get(message.data.key || ''));
    } else if (message.data.method === 'set') {
      if (message.data.key) {
        stashedValues.set(message.data.key, message.data.value);
        if (message.data.key === STASH_KEYS.PASSWORD || message.data.key === STASH_KEYS.LAST_ACTIVITY) {
          chrome.alarms.create('salmon_lock_alarm', { delayInMinutes: 5 });
        }
      }
      sendResponse(undefined);
    } else if (message.data.method === 'delete') {
      if (message.data.key) {
        stashedValues.delete(message.data.key);
      }
      sendResponse(undefined);
    } else if (message.data.method === 'clear') {
      stashedValues.clear();
      sendResponse(undefined);
    }
    return true;
  };

  // Main message listener
  chrome.runtime.onMessage.addListener(
    (
      message: Message | StashMessage,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response?: unknown) => void
    ): boolean | void => {
      // Only handle messages from our own extension
      if (sender.id !== chrome.runtime.id) {
        return;
      }

      if (message.channel === 'salmon_contentscript_background_channel') {
        const msg = message as Message;
        if (msg.data.method === 'connect') {
          handleConnect(msg, sender, sendResponse);
        } else if (msg.data.method === 'disconnect') {
          handleDisconnect(msg, sender, sendResponse);
        } else {
          launchPopup(msg, sender, sendResponse);
        }
        // Keep response channel open for async response
        return true;
      } else if (message.channel === 'salmon_extension_background_channel') {
        const msg = message as Message;
        const responseHandler = responseHandlers.get(msg.data.id);
        responseHandlers.delete(msg.data.id);
        if (responseHandler) {
          responseHandler(msg.data, msg.data.id);
        }
      } else if (message.channel === 'salmon_extension_stash_channel') {
        return handleStashOperation(message as StashMessage, sender, sendResponse);
      }
    }
  );

  // Alarm listener for session timeout (auto-lock after 5 minutes of inactivity)
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'salmon_lock_alarm') {
      stashedValues.delete(STASH_KEYS.PASSWORD);
    }
  });

  // Tab removal listener to clean up connected tabs
  chrome.tabs.onRemoved.addListener((tabId) => {
    removeConnectedTabId(tabId);
  });

  // Open side panel when clicking the extension icon (Chrome/Edge only)
  if (import.meta.env.CHROME) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  }

  // Clean up connected tabs on startup
  cleanConnectedTabs();

  console.log('Salmon Wallet background script loaded');
});
