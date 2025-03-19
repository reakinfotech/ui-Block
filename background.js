let currentRules = [];

function parseFilters(filters) {
  const rules = [];
  const cssRules = [];
  // Start rule IDs from a higher number to avoid conflicts with any default rules
  let ruleId = 1000;

  filters.split('\n').forEach(line => {
    line = line.trim();
    if (!line || line.startsWith('!')) return;

    // Network blocking rules
    if (line.includes('$image')) {
      const urlFilter = line.split('$')[0].replace('||', '');
      rules.push({
        id: ruleId++,
        priority: 1,
        action: { type: 'block' },
        condition: {
          urlFilter: urlFilter,
          resourceTypes: ['image']
        }
      });
    }
    else if (line.includes('$media')) {
      const urlFilter = line.split('$')[0].replace('||', '');
      rules.push({
        id: ruleId++,
        priority: 1,
        action: { type: 'block' },
        condition: {
          urlFilter: urlFilter,
          resourceTypes: ['media']
        }
      });
    }
    // CSS rules
    else if (line.includes('##')) {
      const [domain, selector] = line.split('##');
      let cssRule = selector;
      if (cssRule.includes(':style(')) {
        const [sel, style] = cssRule.split(':style(');
        cssRule = `${sel} { ${style.replace(')', '')} }`;
      }
      cssRules.push({ domain: domain || '*', rule: cssRule });
    }
  });

  return { networkRules: rules, cssRules };
}

function handleMessage(message, sender, sendResponse) {
  if (message.action === 'updateFilters') {
    const { networkRules, cssRules } = parseFilters(message.filters);

    // Get all existing dynamic rules first
    chrome.declarativeNetRequest.getDynamicRules(existingRules => {
      const existingRuleIds = existingRules.map(rule => rule.id);

      // Update network rules
      chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: existingRuleIds,
        addRules: networkRules
      }, () => {
        if (chrome.runtime.lastError) {
          console.error('Error updating rules:', chrome.runtime.lastError);
        } else {
          currentRules = networkRules;
          // Store CSS rules
          chrome.storage.sync.set({ cssRules: cssRules });
        }
      });
    });
  }
}

function handleStorageLoad(result) {
  if (result.filters) {
    const { networkRules, cssRules } = parseFilters(result.filters);

    // Get all existing dynamic rules first
    chrome.declarativeNetRequest.getDynamicRules(existingRules => {
      const existingRuleIds = existingRules.map(rule => rule.id);

      chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: existingRuleIds,
        addRules: networkRules
      }, () => {
        if (chrome.runtime.lastError) {
          console.error('Error updating rules:', chrome.runtime.lastError);
        } else {
          currentRules = networkRules;
          chrome.storage.sync.set({ cssRules: cssRules });
        }
      });
    });
  }
}

// Register named functions as listeners
chrome.runtime.onMessage.addListener(handleMessage);

// Load filters on startup
chrome.storage.sync.get(['filters'], handleStorageLoad);