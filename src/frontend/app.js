// app.js — Frontend Controller

document.addEventListener('DOMContentLoaded', () => {
  const checkApiBtn = document.getElementById('checkApiBtn');
  const statusIndicator = document.getElementById('statusIndicator');
  const apiResponse = document.getElementById('apiResponse');

  const BACKEND_URL = 'http://localhost:5000/health';

  async function checkBackendStatus() {
    statusIndicator.textContent = 'Checking...';
    statusIndicator.className = 'status-indicator status-offline';
    apiResponse.textContent = 'Sending request to ' + BACKEND_URL + '...';

    try {
      const start = performance.now();
      const response = await fetch(BACKEND_URL);
      const latency = Math.round(performance.now() - start);

      if (response.ok) {
        const data = await response.json();
        
        // Update indicator to online
        statusIndicator.textContent = 'Online';
        statusIndicator.className = 'status-indicator status-online';

        // Display formatted response
        apiResponse.textContent = JSON.stringify({
          status: response.status,
          statusText: response.statusText,
          latency: `${latency}ms`,
          body: data
        }, null, 2);
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      // Update indicator to offline
      statusIndicator.textContent = 'Offline';
      statusIndicator.className = 'status-indicator status-offline';

      apiResponse.textContent = JSON.stringify({
        error: 'Failed to connect to backend',
        details: error.message,
        hint: 'Make sure your .NET API is running locally on http://localhost:5000'
      }, null, 2);
    }
  }

  // Bind click event
  checkApiBtn.addEventListener('click', checkBackendStatus);

  // Initial trigger check
  checkBackendStatus();
});
