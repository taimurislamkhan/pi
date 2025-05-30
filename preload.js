// Preload script to expose Node.js functionality to the renderer process
const { ipcRenderer } = require('electron');

// Expose IPC functions to the window object
window.electronAPI = {
  // Function to restart the Python backend
  restartPython: () => {
    ipcRenderer.send('restart-python');
  }
};

// Notify when preload script has completed
console.log('Preload script loaded');
