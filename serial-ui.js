// JavaScript to handle communication with the Python backend
document.addEventListener('DOMContentLoaded', function() {
  // API endpoint for the Python backend
  const API_BASE_URL = 'http://localhost:8000';
  
  // Reference to the progress bar for tip 1
  const progressBar = document.querySelector('.frame-87 .frame-7 .frame-84');
  const progressSegments = progressBar ? Array.from(progressBar.querySelectorAll('div')) : [];
  const jValueElement = document.querySelector('.frame-87 .frame-7 .frame-55 .frame-65 .frame-61 ._0-j');
  
  // Function to update the progress bar UI
  function updateProgressBar(value) {
    if (!progressBar || !jValueElement) return;
    
    // Update the J value display
    jValueElement.textContent = `${value} J`;
    
    // Update the segments
    progressSegments.forEach((segment, index) => {
      const segmentThreshold = (index + 1) * (100 / progressSegments.length);
      
      if (value >= segmentThreshold - (100 / progressSegments.length)) {
        // Calculate opacity based on position (1.0 to 0.2)
        const opacity = 1 - (index * 0.08);
        segment.style.background = `rgba(255, 153, 0, ${opacity})`;
      } else {
        segment.style.background = '#27292d';
      }
    });
  }
  
  // Function to fetch the latest progress data
  function fetchProgressData() {
    fetch(`${API_BASE_URL}/progress`)
      .then(response => response.json())
      .then(data => {
        // Update the UI with the progress value
        updateProgressBar(data.progress);
      })
      .catch(error => {
        console.error('Error fetching progress data:', error);
      });
  }
  
  // Function to fetch the latest serial data
  function fetchSerialData() {
    fetch(`${API_BASE_URL}/data`)
      .then(response => response.json())
      .then(data => {
        // Process the serial data
        console.log('Serial data:', data);
        
        // Here you can add code to update other UI elements based on the serial data
        // For example, if your serial data includes progress information for other tips
      })
      .catch(error => {
        console.error('Error fetching serial data:', error);
      });
  }
  
  // Function to start the progress animation
  function startProgressAnimation() {
    fetch(`${API_BASE_URL}/start_animation`)
      .then(response => response.json())
      .then(data => {
        console.log('Animation started:', data);
      })
      .catch(error => {
        console.error('Error starting animation:', error);
      });
  }
  
  // Function to stop the progress animation
  function stopProgressAnimation() {
    fetch(`${API_BASE_URL}/stop_animation`)
      .then(response => response.json())
      .then(data => {
        console.log('Animation stopped:', data);
      })
      .catch(error => {
        console.error('Error stopping animation:', error);
      });
  }
  
  // Function to send a command to the serial port
  function sendSerialCommand(command) {
    fetch(`${API_BASE_URL}/command`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ command }),
    })
      .then(response => response.json())
      .then(data => {
        console.log('Command sent:', data);
      })
      .catch(error => {
        console.error('Error sending command:', error);
      });
  }
  
  // Set up polling for progress and serial data
  setInterval(fetchProgressData, 50);  // Poll every 50ms for smooth animation
  setInterval(fetchSerialData, 500);   // Poll every 500ms for serial data
  
  // Add a button to start the animation (you can remove this if not needed)
  const startButton = document.createElement('button');
  startButton.textContent = 'Start Progress Animation';
  startButton.style.position = 'fixed';
  startButton.style.bottom = '20px';
  startButton.style.right = '20px';
  startButton.style.zIndex = '1000';
  startButton.style.padding = '10px';
  startButton.style.backgroundColor = '#ff9900';
  startButton.style.border = 'none';
  startButton.style.borderRadius = '5px';
  startButton.style.cursor = 'pointer';
  
  startButton.addEventListener('click', startProgressAnimation);
  document.body.appendChild(startButton);
  
  // If Electron API is available, set up restart functionality
  if (window.electronAPI) {
    const restartButton = document.createElement('button');
    restartButton.textContent = 'Restart Python Backend';
    restartButton.style.position = 'fixed';
    restartButton.style.bottom = '60px';
    restartButton.style.right = '20px';
    restartButton.style.zIndex = '1000';
    restartButton.style.padding = '10px';
    restartButton.style.backgroundColor = '#cccccc';
    restartButton.style.border = 'none';
    restartButton.style.borderRadius = '5px';
    restartButton.style.cursor = 'pointer';
    
    restartButton.addEventListener('click', () => {
      window.electronAPI.restartPython();
    });
    document.body.appendChild(restartButton);
  }
});
