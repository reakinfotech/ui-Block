let currentRules = [];

function parseFilters(filters) {
  const rules = [];
  const cssRules = [];
  let ruleId = 1;

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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateFilters') {
    const { networkRules, cssRules } = parseFilters(message.filters);

    // Update network rules
    chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: currentRules.map(rule => rule.id),
      addRules: networkRules
    });
    currentRules = networkRules;

    // Store CSS rules
    chrome.storage.sync.set({ cssRules: cssRules });
  }
});

// Load filters on startup
chrome.storage.sync.get(['filters'], (result) => {
  if (result.filters) {
    const { networkRules, cssRules } = parseFilters(result.filters);
    chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: currentRules.map(rule => rule.id),
      addRules: networkRules
    });
    currentRules = networkRules;
    chrome.storage.sync.set({ cssRules: cssRules });
  }
});
