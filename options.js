document.addEventListener('DOMContentLoaded', () => {
  const imageOpacitySlider = document.getElementById('imageOpacity');
  const videoOpacitySlider = document.getElementById('videoOpacity');
  const customOpacitySlider = document.getElementById('customOpacity');
  const opacityValues = document.querySelectorAll('.opacity-value');
  const customSelectors = document.getElementById('customSelectors');
  const status = document.getElementById('status');
  const domainList = document.getElementById('domainList');
  const addDomainBtn = document.getElementById('addDomainBtn');
  const updateBtn = document.getElementById('updateBtn');
  const saveBtn = document.getElementById('saveBtn');

  // Load saved settings
  chrome.storage.sync.get(['imageOpacity', 'videoOpacity', 'customOpacity', 'customSelectors', 'domains'], (result) => {
    if (result.imageOpacity) {
      imageOpacitySlider.value = result.imageOpacity;
      opacityValues[0].textContent = `${result.imageOpacity}%`;
    }
    if (result.videoOpacity) {
      videoOpacitySlider.value = result.videoOpacity;
      opacityValues[1].textContent = `${result.videoOpacity}%`;
    }
    if (result.customOpacity) {
      customOpacitySlider.value = result.customOpacity;
      opacityValues[2].textContent = `${result.customOpacity}%`;
    }
    if (result.customSelectors) {
      customSelectors.value = result.customSelectors;
    }
    if (result.domains) {
      result.domains.forEach(domain => addDomainItem(domain));
    }
  });

  // Update opacity value display
  function updateOpacity(slider, valueDisplay) {
    const opacity = slider.value;
    valueDisplay.textContent = `${opacity}%`;
  }

  // Save settings to storage
  function saveSettings() {
    const settings = {
      imageOpacity: parseInt(imageOpacitySlider.value),
      videoOpacity: parseInt(videoOpacitySlider.value),
      customOpacity: parseInt(customOpacitySlider.value),
      customSelectors: customSelectors.value,
      domains: getDomainsList()
    };

    chrome.storage.sync.set(settings, () => {
      showStatus('Settings saved', 'success');
    });
  }

  // Update filters
  function updateFilters() {
    const domains = getDomainsList();
    const imageOpacityValue = imageOpacitySlider.value / 100;
    const videoOpacityValue = videoOpacitySlider.value / 100;
    const customOpacityValue = customOpacitySlider.value / 100;
    let newFilters = '';

    domains.forEach(domain => {
      // Add rules for images and videos with separate opacity values
      newFilters += `${domain}##img:style(opacity: ${imageOpacityValue}, filter:'opacity(0.5)')\n`;
      newFilters += `${domain}##video:style(opacity: ${videoOpacityValue}, filter:'opacity(0.5)')\n`;
    });

    chrome.runtime.sendMessage({ 
      action: 'updateFilters', 
      filters: newFilters,
      imageOpacity: imageOpacitySlider.value,
      videoOpacity: videoOpacitySlider.value,
      customOpacity: customOpacitySlider.value,
      customSelectors: customSelectors.value,
      domains: domains
    }, () => {
      showStatus('Filters updated', 'success');
    });
  }

  // Show status message
  function showStatus(message, type) {
    status.textContent = message;
    status.className = `status ${type}`;
    setTimeout(() => {
      status.textContent = '';
      status.className = 'status';
    }, 3000);
  }

  // Get list of domains from the UI
  function getDomainsList() {
    const domainInputs = domainList.querySelectorAll('input[type="text"]');
    return Array.from(domainInputs)
      .map(input => input.value.trim())
      .filter(Boolean);
  }

  // Add new domain item to the list
  function addDomainItem(domain = '') {
    const domainItem = document.createElement('div');
    domainItem.className = 'domain-item';
    domainItem.innerHTML = `
      <input type="text" value="${domain}" placeholder="Enter domain (e.g., example.com)">
      <button class="remove-domain">Remove</button>
    `;
    domainList.appendChild(domainItem);

    // Add event listeners
    const domainInput = domainItem.querySelector('input[type="text"]');
    const removeBtn = domainItem.querySelector('.remove-domain');

    removeBtn.addEventListener('click', () => {
      domainItem.remove();
    });
  }

  // Add domain button click handler
  addDomainBtn.addEventListener('click', () => {
    addDomainItem();
  });

  // Event listeners
  imageOpacitySlider.addEventListener('input', () => updateOpacity(imageOpacitySlider, opacityValues[0]));
  videoOpacitySlider.addEventListener('input', () => updateOpacity(videoOpacitySlider, opacityValues[1]));
  customOpacitySlider.addEventListener('input', () => updateOpacity(customOpacitySlider, opacityValues[2]));
  
  // Button click handlers
  saveBtn.addEventListener('click', saveSettings);
  updateBtn.addEventListener('click', () => {
    saveSettings();
    updateFilters();
  });
});
