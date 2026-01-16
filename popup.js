document.addEventListener('DOMContentLoaded', () => {
  const status = document.getElementById('status');
  const optionsBtn = document.getElementById('optionsBtn');
  const powerToggle = document.getElementById('powerToggle');

  // Function to update status message
  function updateStatus(message, type = '') {
    status.innerHTML = message;
    status.className = `status ${type}`;
  }

  // Apply theme to body
  function applyTheme(theme) {
    document.documentElement.classList.remove('light-theme', 'dark-theme');
    if (theme === 'light') document.documentElement.classList.add('light-theme');
    if (theme === 'dark') document.documentElement.classList.add('dark-theme');
  }

  // Load current stats
  function loadSettings() {
    chrome.storage.local.get(['isBlockerEnabled', 'cssRules', 'theme'], (result) => {
      const isEnabled = result.isBlockerEnabled !== undefined ? result.isBlockerEnabled : true;
      powerToggle.checked = isEnabled;

      const theme = result.theme || 'auto';
      applyTheme(theme);

      if (!isEnabled) {
        updateStatus('Blocker is Inactive', 'inactive');
      } else if (result.cssRules && result.cssRules.length > 0) {
        updateStatus('Blocker is Active', 'active');
      } else {
        updateStatus('No active filters');
      }
    });
  }

  // Toggle blocker state
  powerToggle.addEventListener('change', () => {
    const isEnabled = powerToggle.checked;

    chrome.storage.local.get(['imageOpacity', 'videoOpacity', 'mediaOpacity', 'customOpacity', 'customSelectors', 'domains', 'excludedDomains', 'applyToAllDomains', 'theme'], (result) => {
      chrome.runtime.sendMessage({
        action: 'updateFilters',
        isBlockerEnabled: isEnabled,
        imageOpacity: result.imageOpacity !== undefined ? result.imageOpacity : 30,
        videoOpacity: result.videoOpacity !== undefined ? result.videoOpacity : 30,
        mediaOpacity: result.mediaOpacity !== undefined ? result.mediaOpacity : 30,
        customOpacity: result.customOpacity !== undefined ? result.customOpacity : 30,
        customSelectors: result.customSelectors || '',
        domains: result.domains || [],
        excludedDomains: result.excludedDomains || [],
        applyToAllDomains: result.applyToAllDomains || false,
        theme: result.theme || 'auto'
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.warn('Communication error:', chrome.runtime.lastError);
        }
        loadSettings();
      });
    });
  });

  optionsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  loadSettings();
});