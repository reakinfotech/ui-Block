let currentRules = [];

function parseFilters(imageOpacity, videoOpacity, mediaOpacity, customOpacity, customSelectors, domains, excludedDomains = [], applyToAll = false, isBlockerEnabled = true) {
  if (!isBlockerEnabled) {
    return { cssRules: [] };
  }

  const cssRules = [];
  const imageOpacityValue = imageOpacity / 100;
  const videoOpacityValue = videoOpacity / 100;
  const mediaOpacityValue = mediaOpacity / 100;
  const customOpacityValue = customOpacity / 100;

  const generateRules = (domain) => {
    cssRules.push({
      domain: domain,
      rule: `img { opacity: ${imageOpacityValue} !important; transition: opacity 0.3s ease !important; }`
    });

    cssRules.push({
      domain: domain,
      rule: `video { opacity: ${videoOpacityValue} !important; transition: opacity 0.3s ease !important; }`
    });

    cssRules.push({
      domain: domain,
      rule: `audio, iframe, svg, canvas { opacity: ${mediaOpacityValue} !important; transition: opacity 0.3s ease !important; }`
    });

    if (customSelectors && customSelectors.trim()) {
      const selectors = customSelectors.split(',').map(s => s.trim()).filter(s => s);
      if (selectors.length > 0) {
        cssRules.push({
          domain: domain,
          rule: `${selectors.join(', ')} { opacity: ${customOpacityValue} !important; transition: opacity 0.3s ease !important; }`
        });
      }
    }
  };

  if (applyToAll) {
    generateRules('*');
  } else if (domains && domains.length > 0) {
    domains.forEach(domain => generateRules(domain));
  }

  return { cssRules };
}

function handleMessage(message, sender, sendResponse) {
  if (message.action === 'updateFilters') {
    const { cssRules } = parseFilters(
      message.imageOpacity,
      message.videoOpacity,
      message.mediaOpacity,
      message.customOpacity,
      message.customSelectors,
      message.domains,
      message.excludedDomains,
      message.applyToAllDomains,
      message.isBlockerEnabled
    );

    const settings = {
      cssRules: cssRules,
      imageOpacity: message.imageOpacity,
      videoOpacity: message.videoOpacity,
      mediaOpacity: message.mediaOpacity,
      customOpacity: message.customOpacity,
      customSelectors: message.customSelectors,
      domains: message.domains,
      excludedDomains: message.excludedDomains,
      applyToAllDomains: message.applyToAllDomains,
      isBlockerEnabled: message.isBlockerEnabled,
      theme: message.theme || 'auto'
    };

    chrome.storage.local.set(settings, () => {
      broadcastUpdate(cssRules, message.excludedDomains, message.isBlockerEnabled);
      if (sendResponse) sendResponse({ success: true });
    });
    return true; // Keep message channel open for async response
  }
}

function broadcastUpdate(cssRules, excludedDomains, isBlockerEnabled = true) {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, {
        action: 'updateStyles',
        cssRules: cssRules,
        excludedDomains: excludedDomains,
        isBlockerEnabled: isBlockerEnabled
      }).catch(() => { });
    });
  });
}

function handleStorageLoad(result) {
  // Fix storage persistence - use defaults ONLY if values are truly missing
  const imageOpacity = result.imageOpacity !== undefined ? result.imageOpacity : 30;
  const videoOpacity = result.videoOpacity !== undefined ? result.videoOpacity : 30;
  const mediaOpacity = result.mediaOpacity !== undefined ? result.mediaOpacity : 30;
  const customOpacity = result.customOpacity !== undefined ? result.customOpacity : 30;
  const customSelectors = result.customSelectors || '';
  const domains = result.domains || [];
  const excludedDomains = result.excludedDomains || [];
  const applyToAllDomains = result.applyToAllDomains || false;
  const isBlockerEnabled = result.isBlockerEnabled !== undefined ? result.isBlockerEnabled : true;
  const theme = result.theme || 'auto';

  const { cssRules } = parseFilters(
    imageOpacity,
    videoOpacity,
    mediaOpacity,
    customOpacity,
    customSelectors,
    domains,
    excludedDomains,
    applyToAllDomains,
    isBlockerEnabled
  );

  // If we are missing any keys, initialize them. Otherwise, don't overwrite user settings.
  const needsInit = result.imageOpacity === undefined || result.isBlockerEnabled === undefined;

  if (needsInit) {
    chrome.storage.local.set({
      cssRules: cssRules,
      imageOpacity,
      videoOpacity,
      mediaOpacity,
      customOpacity,
      customSelectors,
      domains,
      excludedDomains,
      applyToAllDomains,
      isBlockerEnabled,
      theme
    });
  }

  broadcastUpdate(cssRules, excludedDomains, isBlockerEnabled);
}

chrome.runtime.onMessage.addListener(handleMessage);

chrome.storage.local.get(['imageOpacity', 'videoOpacity', 'mediaOpacity', 'customOpacity', 'customSelectors', 'domains', 'excludedDomains', 'applyToAllDomains', 'isBlockerEnabled', 'theme'], handleStorageLoad);