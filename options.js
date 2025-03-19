document.addEventListener('DOMContentLoaded', () => {
  const filterInput = document.getElementById('filterInput');
  const saveBtn = document.getElementById('saveBtn');
  const status = document.getElementById('status');

  // Load saved filters
  chrome.storage.sync.get(['filters'], (result) => {
    filterInput.value = result.filters || '';
  });

  // Save filters
  saveBtn.addEventListener('click', () => {
    const filters = filterInput.value;
    chrome.storage.sync.set({ filters: filters }, () => {
      status.textContent = 'Filters saved!';
      chrome.runtime.sendMessage({ action: 'updateFilters', filters: filters });
      setTimeout(() => status.textContent = '', 2000);
    });
  });
});
