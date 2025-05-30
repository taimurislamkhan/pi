const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

// Keep a global reference of the window object to prevent garbage collection
let mainWindow;
let pythonProcess;

function createWindow() {
  // Create the browser window with Raspberry Pi optimizations
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js'),
      // Disable hardware acceleration for better performance on Raspberry Pi
      offscreen: false,
      // Reduce resource usage
      backgroundThrottling: false,
      // Disable web security for local content (safe for this use case)
      webSecurity: false
    },
    // Enable fullscreen for Raspberry Pi
    fullscreen: true,
    kiosk: true,
    // Disable frame for cleaner look
    frame: false,
    // Improve performance
    show: false,
    backgroundColor: '#000000'
  });

  // Load the index.html file with error handling
  mainWindow.loadFile('index.html')
    .catch(err => {
      console.error('Failed to load index.html:', err);
      // Show an error message instead of black screen
      mainWindow.webContents.executeJavaScript(`
        document.body.innerHTML = '<div style="padding: 20px; font-family: Arial, sans-serif;">' +
          '<h1>Error Loading Application</h1>' +
          '<p>There was an error loading the application:</p>' +
          '<pre style="background: #f0f0f0; padding: 10px;">${err.toString().replace(/'/g, '\'')}\n\nCheck the console for more details.</pre>' +
          '<button onclick="window.close()" style="padding: 8px 16px; margin-top: 20px;">Close Application</button>' +
        '</div>';
        document.body.style.background = '#fff';
      `);
    });
  
  // Add error handler for page failures
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error(`Page failed to load: ${errorDescription} (${errorCode})`);
    // Show an error message
    mainWindow.webContents.executeJavaScript(`
      document.body.innerHTML = '<div style="padding: 20px; font-family: Arial, sans-serif;">' +
        '<h1>Failed to Load Page</h1>' +
        '<p>Error: ${errorDescription.replace(/'/g, '\'')} (${errorCode})</p>' +
        '<button onclick="window.close()" style="padding: 8px 16px; margin-top: 20px;">Close Application</button>' +
      '</div>';
      document.body.style.background = '#fff';
    `);
  });

  // Hide the menu bar for a cleaner interface
  mainWindow.setMenuBarVisibility(false);

  // Only show window when ready to avoid flickering
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open DevTools in development (comment out for production)
  // mainWindow.webContents.openDevTools();

  // Handle window close
  mainWindow.on('closed', function () {
    mainWindow = null;
    // Kill Python process when app closes
    if (pythonProcess) {
      pythonProcess.kill();
    }
  });
}

function startPythonBackend() {
  // Check if Python script exists
  if (!fs.existsSync(path.join(__dirname, 'serial_handler.py'))) {
    console.error('serial_handler.py not found!');
    return;
  }

  // Start the Python backend process
  // Use 'python3' on Raspberry Pi, 'python' on Windows
  const pythonExecutable = process.platform === 'win32' ? 'python' : 'python3';
  
  pythonProcess = spawn(pythonExecutable, [path.join(__dirname, 'serial_handler.py')]);

  pythonProcess.stdout.on('data', (data) => {
    console.log(`Python stdout: ${data}`);
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error(`Python stderr: ${data}`);
  });

  pythonProcess.on('close', (code) => {
    console.log(`Python process exited with code ${code}`);
  });
}

// When Electron has finished initialization
app.whenReady().then(() => {
  createWindow();
  startPythonBackend();

  app.on('activate', function () {
    // On macOS, re-create a window when the dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Handle any IPC messages from the renderer process
ipcMain.on('restart-python', () => {
  if (pythonProcess) {
    pythonProcess.kill();
  }
  startPythonBackend();
});
