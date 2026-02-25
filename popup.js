const browserAPI = typeof chrome !== 'undefined' ? chrome : browser;

document.addEventListener('DOMContentLoaded', () => {
  const status = document.getElementById('status');
  const optionsBtn = document.getElementById('optionsBtn');
  const powerToggle = document.getElementById('powerToggle');
  const imageOpacitySlider = document.getElementById('imageOpacity');
  const videoOpacitySlider = document.getElementById('videoOpacity');
  const imageOpacityValue = document.getElementById('imageOpacityValue');
  const videoOpacityValue = document.getElementById('videoOpacityValue');
  const globalMode = document.getElementById('globalMode');

  let debounceTimer;
  let currentSettings = {};

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

  // Listen for storage changes to sync theme across views
  browserAPI.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.theme) {
      applyTheme(changes.theme.newValue);
    }
  });

  // Load current stats
  function loadSettings() {
    browserAPI.storage.local.get([
      'isBlockerEnabled', 'cssRules', 'theme',
      'imageOpacity', 'videoOpacity', 'mediaOpacity',
      'customOpacity', 'customSelectors', 'domains',
      'excludedDomains', 'applyToAllDomains'
    ], (result) => {
      currentSettings = result;
      const isEnabled = result.isBlockerEnabled !== undefined ? result.isBlockerEnabled : true;
      powerToggle.checked = isEnabled;

      const theme = result.theme || 'auto';
      applyTheme(theme);

      // Initialize sliders
      if (result.imageOpacity !== undefined) {
        imageOpacitySlider.value = result.imageOpacity;
        imageOpacityValue.textContent = `${result.imageOpacity}%`;
      }
      if (result.videoOpacity !== undefined) {
        videoOpacitySlider.value = result.videoOpacity;
        videoOpacityValue.textContent = `${result.videoOpacity}%`;
      }

      // Initialize global mode
      globalMode.checked = result.applyToAllDomains !== undefined ? result.applyToAllDomains : true;

      updateStatusDisplay(isEnabled, result.cssRules);
    });
  }

  function updateStatusDisplay(isEnabled, cssRules) {
    if (!isEnabled) {
      updateStatus('Blocker is Inactive', 'inactive');
    } else if (cssRules && cssRules.length > 0) {
      updateStatus('Blocker is Active', 'active');
    } else {
      updateStatus('No active filters');
    }
  }

  // Update filters and save to storage
  function updateFilters() {
    const settings = {
      action: 'updateFilters',
      isBlockerEnabled: powerToggle.checked,
      imageOpacity: parseInt(imageOpacitySlider.value),
      videoOpacity: parseInt(videoOpacitySlider.value),
      mediaOpacity: currentSettings.mediaOpacity !== undefined ? currentSettings.mediaOpacity : 30,
      customOpacity: currentSettings.customOpacity !== undefined ? currentSettings.customOpacity : 30,
      customSelectors: currentSettings.customSelectors || '',
      domains: currentSettings.domains || [],
      excludedDomains: currentSettings.excludedDomains || [],
      applyToAllDomains: globalMode.checked,
      theme: currentSettings.theme || 'auto'
    };

    // Update local cache immediately
    Object.assign(currentSettings, settings);
    delete currentSettings.action; // Don't save action to storage local if it happened to be there

    browserAPI.runtime.sendMessage(settings, (response) => {
      if (browserAPI.runtime.lastError) {
        console.warn('Communication error:', browserAPI.runtime.lastError);
      }
      if (response && response.cssRules) {
        updateStatusDisplay(settings.isBlockerEnabled, response.cssRules);
      }
    });
  }

  // Toggle blocker state
  powerToggle.addEventListener('change', updateFilters);
  globalMode.addEventListener('change', updateFilters);

  // slider event listeners
  imageOpacitySlider.addEventListener('input', () => {
    imageOpacityValue.textContent = `${imageOpacitySlider.value}%`;
    updateFilters();
  });

  videoOpacitySlider.addEventListener('input', () => {
    videoOpacityValue.textContent = `${videoOpacitySlider.value}%`;
    updateFilters();
  });

  optionsBtn.addEventListener('click', () => {
    browserAPI.runtime.openOptionsPage();
  });

  loadSettings();
});