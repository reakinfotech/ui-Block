// Create and inject style element
const styleElement = document.createElement('style');
document.head.appendChild(styleElement);

// Function to update styles
function updateStyles(cssRules, excludedDomains = [], isBlockerEnabled = true) {
  const currentHost = window.location.hostname;

  // Check if blocker is globally disabled or current host is excluded
  if (!isBlockerEnabled || excludedDomains.some(domain => currentHost.includes(domain))) {
    styleElement.textContent = '';
    return;
  }

  let cssText = '';
  cssRules.forEach(rule => {
    // Apply global rules or exact domain matches
    if (rule.domain === '*' || currentHost.includes(rule.domain)) {
      cssText += rule.rule + '\n';
    }
  });

  styleElement.textContent = cssText;
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateStyles') {
    updateStyles(message.cssRules, message.excludedDomains, message.isBlockerEnabled);
  }
});

// Load initial styles
chrome.storage.local.get(['cssRules', 'excludedDomains', 'isBlockerEnabled'], (result) => {
  if (result.cssRules) {
    updateStyles(result.cssRules, result.excludedDomains || [], result.isBlockerEnabled !== undefined ? result.isBlockerEnabled : true);
  }
});

