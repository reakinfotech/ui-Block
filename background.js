let currentRules = [];
let blockedRequests = new Set();

function parseFilters(filters, imageOpacity, videoOpacity, customOpacity, customSelectors, domains) {
  const cssRules = [];
  const imageOpacityValue = imageOpacity / 100;
  const videoOpacityValue = videoOpacity / 100;
  const customOpacityValue = customOpacity / 100;

  // Only apply rules if domains are specified
  if (domains && domains.length > 0) {
    domains.forEach(domain => {
      // Add rules for images and videos with separate opacity values for each domain
      cssRules.push({
        domain: domain,
        rule: `img { opacity: ${imageOpacityValue} !important; filter: opacity(0.5) !important; }`
      });

      cssRules.push({
        domain: domain,
        rule: `video { opacity: ${videoOpacityValue} !important; filter: opacity(0.5) !important; }`
      });

      // Add custom selectors if provided
      if (customSelectors && customSelectors.trim()) {
        const selectors = customSelectors.split(',').map(s => s.trim()).filter(s => s);
        if (selectors.length > 0) {
          cssRules.push({
            domain: domain,
            rule: `${selectors.join(', ')} { opacity: ${customOpacityValue} !important; filter: opacity(0.5) !important; }`
          });
        }
      }
    });
  }

  return { cssRules };
}

// Track blocked requests using declarativeNetRequest
chrome.declarativeNetRequest.onRuleMatchedDebug?.addListener((info) => {
  if (info.action.type === 'block') {
    blockedRequests.add(info.request.url);
    // Clear the blocked request after 5 minutes to prevent memory leaks
    setTimeout(() => {
      blockedRequests.delete(info.request.url);
    }, 5 * 60 * 1000);
  }
});

function handleMessage(message, sender, sendResponse) {
  if (message.action === 'updateFilters') {
    const { cssRules } = parseFilters(
      message.filters || '', 
      message.imageOpacity,
      message.videoOpacity,
      message.customOpacity,
      message.customSelectors,
      message.domains
    );

    // Store CSS rules and settings
    chrome.storage.sync.set({ 
      cssRules: cssRules,
      imageOpacity: message.imageOpacity,
      videoOpacity: message.videoOpacity,
      customOpacity: message.customOpacity,
      customSelectors: message.customSelectors,
      domains: message.domains
    });

    // Send message to content script to update styles
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          action: 'updateStyles',
          cssRules: cssRules
        }).catch(() => {
          // Ignore errors for tabs that can't receive messages
        });
      });
    });
  }
}

function handleStorageLoad(result) {
  const { cssRules } = parseFilters(
    result.filters || '',
    result.imageOpacity || 30,
    result.videoOpacity || 30,
    result.customOpacity || 30,
    result.customSelectors || '',
    result.domains || []
  );

  chrome.storage.sync.set({ 
    cssRules: cssRules,
    imageOpacity: result.imageOpacity || 30,
    videoOpacity: result.videoOpacity || 30,
    customOpacity: result.customOpacity || 30,
    customSelectors: result.customSelectors || '',
    domains: result.domains || []
  });

  // Apply styles to all existing tabs
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, {
        action: 'updateStyles',
        cssRules: cssRules
      }).catch(() => {
        // Ignore errors for tabs that can't receive messages
      });
    });
  });
}

// Register message listener
chrome.runtime.onMessage.addListener(handleMessage);

// Load filters on startup
chrome.storage.sync.get(['filters', 'imageOpacity', 'videoOpacity', 'customOpacity', 'customSelectors', 'domains'], handleStorageLoad);