function applyCSSRules() {
  chrome.storage.sync.get(['cssRules'], (result) => {
    if (!result.cssRules) return;

    const currentHost = window.location.hostname;
    const styleSheet = document.createElement('style');
    
    let cssText = '';
    result.cssRules.forEach(rule => {
      if (rule.domain === '*' || currentHost.includes(rule.domain)) {
        cssText += `${rule.rule}\n`;
      }
    });

    styleSheet.textContent = cssText;
    document.head.appendChild(styleSheet);
  });
}

// Apply rules on page load and when storage changes
document.addEventListener('DOMContentLoaded', applyCSSRules);
chrome.storage.onChanged.addListener((changes) => {
  if (changes.cssRules) applyCSSRules();
});

