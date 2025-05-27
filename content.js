// Create and inject style element
const styleElement = document.createElement('style');
document.head.appendChild(styleElement);

// Function to update styles
function updateStyles(cssRules) {
  let cssText = '';
  const currentHost = window.location.hostname;
  
  cssRules.forEach(rule => {
    // Apply global rules or exact domain matches
    if (rule.domain === '*' || rule.domain === currentHost) {
      cssText += rule.rule + '\n';
    }
  });

  styleElement.textContent = cssText;
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateStyles') {
    updateStyles(message.cssRules);
  }
});

// Load initial styles
chrome.storage.sync.get(['cssRules'], (result) => {
  if (result.cssRules) {
    updateStyles(result.cssRules);
  }
});

