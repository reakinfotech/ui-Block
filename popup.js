document.addEventListener('DOMContentLoaded', () => {
  const status = document.getElementById('status');
  const optionsBtn = document.getElementById('optionsBtn');

  // Function to update status message
  function updateStatus(message, type = '') {
    status.innerHTML = message;
    status.className = `status ${type}`;
  }

  // Function to handle errors
  function handleError(error, context) {
    console.error(`[UI-Block] Error in ${context}:`, error);
    updateStatus(`Error: ${error.message}`, 'error');
  }

  // Check current filter status
  function checkFilterStatus() {
    chrome.storage.sync.get(['cssRules'], (result) => {
      if (chrome.runtime.lastError) {
        handleError(chrome.runtime.lastError, 'checking filter status');
        return;
      }

      if (result.cssRules && result.cssRules.length > 0) {
        updateStatus('Filters are active', 'success');
      } else {
        updateStatus('No filters are currently active');
      }
    });
  }

  // Open options page
  optionsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  // Initial status check
  checkFilterStatus();
}); 