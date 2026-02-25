const browserAPI = typeof chrome !== 'undefined' ? chrome : browser;

document.addEventListener('DOMContentLoaded', () => {
  const imageOpacitySlider = document.getElementById('imageOpacity');
  const videoOpacitySlider = document.getElementById('videoOpacity');
  const mediaOpacitySlider = document.getElementById('mediaOpacity');
  const customOpacitySlider = document.getElementById('customOpacity');
  const opacityValues = document.querySelectorAll('.opacity-value');
  const customSelectors = document.getElementById('customSelectors');
  const status = document.getElementById('status');
  const domainList = document.getElementById('domainList');
  const excludeList = document.getElementById('excludeList');
  const addDomainBtn = document.getElementById('addDomainBtn');
  const addExcludeBtn = document.getElementById('addExcludeBtn');
  const updateBtn = document.getElementById('updateBtn');
  const saveBtn = document.getElementById('saveBtn');
  const applyToAllDomainsCheckbox = document.getElementById('applyToAllDomains');
  const globalPowerToggle = document.getElementById('globalPowerToggle');
  const domainSection = document.getElementById('domainSection');
  const themeToggle = document.getElementById('themeToggle');

  // Load saved settings
  function loadSettings() {
    browserAPI.storage.local.get(['imageOpacity', 'videoOpacity', 'mediaOpacity', 'customOpacity', 'customSelectors', 'domains', 'excludedDomains', 'applyToAllDomains', 'isBlockerEnabled', 'theme'], (result) => {
      if (result.imageOpacity !== undefined) {
        imageOpacitySlider.value = result.imageOpacity;
        opacityValues[0].textContent = `${result.imageOpacity}%`;
      }
      if (result.videoOpacity !== undefined) {
        videoOpacitySlider.value = result.videoOpacity;
        opacityValues[1].textContent = `${result.videoOpacity}%`;
      }
      if (result.mediaOpacity !== undefined) {
        mediaOpacitySlider.value = result.mediaOpacity;
        opacityValues[2].textContent = `${result.mediaOpacity}%`;
      }
      if (result.customOpacity !== undefined) {
        customOpacitySlider.value = result.customOpacity;
        opacityValues[3].textContent = `${result.customOpacity}%`;
      }
      if (result.customSelectors) {
        customSelectors.value = result.customSelectors;
      }
      if (result.applyToAllDomains !== undefined) {
        applyToAllDomainsCheckbox.checked = result.applyToAllDomains;
        toggleDomainSection(result.applyToAllDomains);
      }
      if (result.isBlockerEnabled !== undefined) {
        globalPowerToggle.checked = result.isBlockerEnabled;
      }

      const theme = result.theme || 'auto';
      applyTheme(theme);

      domainList.innerHTML = '';
      excludeList.innerHTML = '';
      if (result.domains) {
        result.domains.forEach(domain => addDomainItem(domainList, domain));
      }
      if (result.excludedDomains) {
        result.excludedDomains.forEach(domain => addDomainItem(excludeList, domain));
      }
    });
  }

  function applyTheme(theme) {
    document.documentElement.classList.remove('light-theme', 'dark-theme');
    if (theme === 'light') document.documentElement.classList.add('light-theme');
    if (theme === 'dark') document.documentElement.classList.add('dark-theme');

    // Update icon
    if (theme === 'dark') {
      themeToggle.textContent = '☀️';
    } else if (theme === 'light') {
      themeToggle.textContent = '🌙';
    } else {
      themeToggle.textContent = '🌓';
    }
  }

  // Toggle Theme
  themeToggle.addEventListener('click', () => {
    browserAPI.storage.local.get(['theme'], (result) => {
      const currentTheme = result.theme || 'auto';
      let nextTheme = 'dark';

      if (currentTheme === 'dark') nextTheme = 'light';
      else if (currentTheme === 'light') nextTheme = 'auto';

      browserAPI.storage.local.set({ theme: nextTheme }, () => {
        applyTheme(nextTheme);
        // Also update background script if necessary, though it primarily cares about CSS filters
        browserAPI.runtime.sendMessage({ action: 'themeChanged', theme: nextTheme });
      });
    });
  });

  // Toggle domain section visibility
  function toggleDomainSection(applyToAll) {
    domainSection.style.opacity = applyToAll ? '0.5' : '1';
    domainSection.style.pointerEvents = applyToAll ? 'none' : 'auto';
  }

  // Update opacity value display
  function updateOpacity(slider, valueDisplay) {
    valueDisplay.textContent = `${slider.value}%`;
  }

  // Save settings to storage
  function saveSettings(silent = false) {
    const settings = {
      imageOpacity: parseInt(imageOpacitySlider.value),
      videoOpacity: parseInt(videoOpacitySlider.value),
      mediaOpacity: parseInt(mediaOpacitySlider.value),
      customOpacity: parseInt(customOpacitySlider.value),
      customSelectors: customSelectors.value,
      domains: getDomainsList(domainList),
      excludedDomains: getDomainsList(excludeList),
      applyToAllDomains: applyToAllDomainsCheckbox.checked,
      isBlockerEnabled: globalPowerToggle.checked
    };

    browserAPI.storage.local.set(settings, () => {
      if (!silent) showStatus('Profile Saved', 'success');
    });
  }

  // Update filters
  function updateFilters() {
    browserAPI.storage.local.get(['theme'], (themeResult) => {
      browserAPI.runtime.sendMessage({
        action: 'updateFilters',
        imageOpacity: parseInt(imageOpacitySlider.value),
        videoOpacity: parseInt(videoOpacitySlider.value),
        mediaOpacity: parseInt(mediaOpacitySlider.value),
        customOpacity: parseInt(customOpacitySlider.value),
        customSelectors: customSelectors.value,
        domains: getDomainsList(domainList),
        excludedDomains: getDomainsList(excludeList),
        applyToAllDomains: applyToAllDomainsCheckbox.checked,
        isBlockerEnabled: globalPowerToggle.checked,
        theme: themeResult.theme || 'auto'
      }, (response) => {
        if (browserAPI.runtime.lastError) {
          console.warn('Communication error:', browserAPI.runtime.lastError);
        }
        showStatus('Filters Updated', 'success');
      });
    });
  }

  function showStatus(message, type) {
    status.textContent = message;
    status.className = `status ${type} show`;
    setTimeout(() => { status.className = 'status'; }, 3000);
  }

  function getDomainsList(listElement) {
    const domainInputs = listElement.querySelectorAll('input[type="text"]');
    return Array.from(domainInputs).map(input => input.value.trim()).filter(Boolean);
  }

  function addDomainItem(listElement, domain = '') {
    const domainItem = document.createElement('div');
    domainItem.className = 'domain-item';
    domainItem.innerHTML = `
      <input type="text" value="${domain}" placeholder="example.com">
      <button class="remove-domain btn btn-outline" style="padding: 4px 8px;">×</button>
    `;
    listElement.appendChild(domainItem);
    domainItem.querySelector('.remove-domain').addEventListener('click', () => domainItem.remove());
  }

  addDomainBtn.addEventListener('click', () => addDomainItem(domainList));
  addExcludeBtn.addEventListener('click', () => addDomainItem(excludeList));
  applyToAllDomainsCheckbox.addEventListener('change', () => toggleDomainSection(applyToAllDomainsCheckbox.checked));

  imageOpacitySlider.addEventListener('input', () => {
    updateOpacity(imageOpacitySlider, opacityValues[0]);
    updateFilters();
  });
  videoOpacitySlider.addEventListener('input', () => {
    updateOpacity(videoOpacitySlider, opacityValues[1]);
    updateFilters();
  });
  mediaOpacitySlider.addEventListener('input', () => {
    updateOpacity(mediaOpacitySlider, opacityValues[2]);
    updateFilters();
  });
  customOpacitySlider.addEventListener('input', () => {
    updateOpacity(customOpacitySlider, opacityValues[3]);
    updateFilters();
  });

  saveBtn.addEventListener('click', () => saveSettings());
  updateBtn.addEventListener('click', () => {
    saveSettings(true);
    updateFilters();
  });

  globalPowerToggle.addEventListener('change', () => {
    saveSettings(true);
    updateFilters();
  });

  loadSettings();
});
