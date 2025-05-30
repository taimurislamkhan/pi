// Script to handle the Stop button functionality, spinner, slider, progress bars, and active/inactive toggle
document.addEventListener('DOMContentLoaded', function() {
  // Stop button functionality
  const stopButton = document.querySelector('.frame-119');
  const stopText = document.querySelector('.stop');
  
  if (stopButton && stopText) {
    let isPressed = false;
    
    stopButton.addEventListener('mousedown', function() {
      if (!isPressed) {
        stopText.textContent = 'Stopping';
        stopButton.classList.add('stopping');
        isPressed = true;
      } else {
        stopText.textContent = 'Stop';
        stopButton.classList.remove('stopping');
        isPressed = false;
      }
    });
  }
  
  // Spinner functionality
  const spinner = document.querySelector('.x-32');
  const spinnerIcon = document.querySelector('.svg-repo-icon-carrier6');
  
  if (spinner && spinnerIcon) {
    let isSpinning = false;
    
    spinner.addEventListener('click', function() {
      if (!isSpinning) {
        spinner.classList.add('spinning');
        isSpinning = true;
      } else {
        spinner.classList.remove('spinning');
        isSpinning = false;
      }
    });
  }
  
  // Slider functionality
  const sliderTrack = document.querySelector('.frame-522');
  const sliderHandle = document.querySelector('.frame-534');
  const percentageDisplay = document.querySelector('._0'); // The percentage display element
  
  if (sliderTrack && sliderHandle) {
    let isDragging = false;
    let startX, startLeft;
    
    // Function to update the slider position and percentage
    function updateSliderPosition(clientX) {
      const trackRect = sliderTrack.getBoundingClientRect();
      const handleWidth = sliderHandle.offsetWidth;
      
      // Calculate the new position within the bounds of the track
      let newLeft = startLeft + (clientX - startX);
      
      // Constrain the handle within the track boundaries
      newLeft = Math.max(0, Math.min(newLeft, trackRect.width - handleWidth));
      
      // Update the handle position
      sliderHandle.style.left = `${newLeft}px`;
      
      // Calculate and update the percentage
      if (percentageDisplay) {
        const percentage = Math.round((newLeft / (trackRect.width - handleWidth)) * 100);
        percentageDisplay.textContent = `${percentage}%`;
      }
      
      return newLeft;
    }
    
    // Mouse down event on the handle
    sliderHandle.addEventListener('mousedown', function(e) {
      isDragging = true;
      startX = e.clientX;
      startLeft = sliderHandle.offsetLeft;
      
      // Prevent text selection during drag
      e.preventDefault();
    });
    
    // Click event on the track to jump to position
    sliderTrack.addEventListener('click', function(e) {
      if (e.target !== sliderHandle) {
        const trackRect = sliderTrack.getBoundingClientRect();
        const handleWidth = sliderHandle.offsetWidth;
        const clickX = e.clientX - trackRect.left;
        
        // Calculate new position, centering the handle on the click position
        let newLeft = clickX - (handleWidth / 2);
        
        // Constrain within track boundaries
        newLeft = Math.max(0, Math.min(newLeft, trackRect.width - handleWidth));
        
        // Update handle position
        sliderHandle.style.left = `${newLeft}px`;
        
        // Update percentage
        if (percentageDisplay) {
          const percentage = Math.round((newLeft / (trackRect.width - handleWidth)) * 100);
          percentageDisplay.textContent = `${percentage}%`;
        }
      }
    });
    
    // Mouse move event (for dragging)
    document.addEventListener('mousemove', function(e) {
      if (isDragging) {
        updateSliderPosition(e.clientX);
      }
    });
    
    // Mouse up event (to stop dragging)
    document.addEventListener('mouseup', function() {
      isDragging = false;
    });
    
    // Mouse leave event (to stop dragging if mouse leaves the window)
    document.addEventListener('mouseleave', function() {
      isDragging = false;
    });
  }
  
  // Progress Bar functionality
  function setupProgressBar(progressBarSelector, segmentSelectors) {
    // Get all progress bars with this class
    const progressBars = document.querySelectorAll(progressBarSelector);
    if (!progressBars.length) return;
    
    // For each progress bar found
    progressBars.forEach(progressBar => {
      const segments = [];
      segmentSelectors.forEach(selector => {
        const segment = progressBar.querySelector(selector);
        if (segment) segments.push(segment);
      });
      
      if (segments.length === 0) return;
      
      // Store the original click handler
      const clickHandler = function(e) {
        // Calculate which segment was clicked based on mouse position
        const rect = progressBar.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const segmentWidth = rect.width / segments.length;
        const clickedSegmentIndex = Math.floor(clickX / segmentWidth);
        
        // Check if this progress bar is in an active tip
        const container = progressBar.closest('.frame-7, .frame-44');
        const activeButton = container?.querySelector('.frame-98, .frame-982, .frame-983, .frame-984');
        const isActive = activeButton?.querySelector('.active, .inactive')?.textContent === 'Active';
        
        // Update segments based on which one was clicked
        segments.forEach((segment, index) => {
          // If the tip is active, use orange style regardless of progress bar class
          if (isActive) {
            // If this segment should be active (up to and including the clicked segment)
            if (index <= clickedSegmentIndex) {
              // Calculate opacity based on position (1.0 to 0.2)
              const opacity = 1 - (index * 0.08);
              segment.style.background = `rgba(255, 153, 0, ${opacity})`;
            } else {
              // Reset to dark background for inactive segments
              segment.style.background = '#27292d';
            }
          } 
          // If the tip is inactive, use gray style
          else {
            if (index <= clickedSegmentIndex) {
              // Use a gradient of gray to lighter gray for active segments
              const brightness = 59 + (index * 2); // 59 to 79 (darker to lighter)
              segment.style.background = `rgb(${brightness}, ${brightness + 5}, ${brightness + 11})`;
            } else {
              // Reset to default gray background
              segment.style.background = '#3b4046';
            }
          }
        });
        
        // Update the J and mm values based on progress
        updateProgressValues(progressBar, clickedSegmentIndex, segments.length);
      };
      
      // Add click event to the progress bar
      progressBar.addEventListener('click', clickHandler);
      
      // Store the click handler on the progress bar element for later reference
      progressBar._clickHandler = clickHandler;
      
      // Set initial cursor style
      progressBar.style.cursor = 'pointer';
    });
  }
  
  // Function to update only the J value based on progress (mm stays unchanged)
  function updateProgressValues(progressBar, index, total) {
    // Find the closest parent with class frame-55, frame-554, frame-555, or frame-556
    let parentContainer = progressBar.closest('.frame-55, .frame-554, .frame-555, .frame-556');
    if (!parentContainer) return;
    
    // Find the J element within this parent container
    let jElement;
    
    // For active (orange) progress bars
    if (progressBar.classList.contains('frame-84')) {
      jElement = parentContainer.querySelector('._0-j, ._0-j3');
    }
    // For inactive (gray) progress bars
    else if (progressBar.classList.contains('frame-842')) {
      jElement = parentContainer.querySelector('._0-j2, ._0-j3');
    }
    
    if (!jElement) return;
    
    // Calculate joules value based on progress
    const progress = (index + 1) / total;
    const jValue = Math.round(progress * 100); // Example: 0-100 J
    
    // Update only the joules display element
    jElement.textContent = `${jValue} J`;
    
    // Note: We're not updating the mm value as requested
  }
  
  // Setup all orange progress bars
  setupProgressBar('.frame-84', [
    '.frame-62',
    '.frame-53',
    '.frame-54',
    '.frame-552',
    '.frame-56',
    '.frame-57',
    '.frame-59',
    '.frame-60',
    '.frame-612',
    '.frame-58'
  ]);
  
  // Setup all gray progress bars
  setupProgressBar('.frame-842', [
    '.frame-532',
    '.frame-542',
    '.frame-553',
    '.frame-562',
    '.frame-572',
    '.frame-582',
    '.frame-592',
    '.frame-602',
    '.frame-613',
    '.frame-622'
  ]);
  
  // Active/Inactive Toggle functionality
  function setupActiveInactiveToggle() {
    // Get all active buttons
    const activeButtons = document.querySelectorAll('.frame-98, .frame-983, .frame-984');
    
    // Function to set up self-toggle for a button
    function setupSelfToggle(button) {
      if (!button) return;
      
      // Get the parent container (frame-7 or frame-44)
      const container = button.closest('.frame-7, .frame-44');
      if (!container) return;
      
      // Get the text element
      const textElement = button.querySelector('.active, .inactive');
      
      // Get the indicator element
      const indicator = button.querySelector('.ellipse-1, .ellipse-12');
      
      // Get the number display element (1, 2, 3, etc.)
      const numberElement = container.querySelector('._1, ._2, ._3, ._4, ._5, ._6, ._7, ._8');
      
      // Get the J and mm elements
      const jElement = container.querySelector('._0-j, ._0-j2, ._0-j3');
      const mmElement = container.querySelector('._0-mm, ._0-mm2');
      
      // Track the current state
      let isActive = textElement && textElement.textContent === 'Active';
      
      // Set initial state based on the text content
      if (isActive) {
        // Set active indicator
        if (indicator) {
          indicator.style.background = '#51da6a';
          indicator.style.borderColor = '#3fb254';
          indicator.style.boxShadow = '0px 0px 12px 0px rgba(81, 218, 106, 0.77)';
        }
        
        // Set active container background
        container.style.background = '#373a40'; // Brighter background
        
        // Brighten text elements
        if (numberElement) numberElement.style.color = '#f5f6f6';
        if (jElement) jElement.style.color = '#f5f6f6';
        if (mmElement) mmElement.style.color = '#f5f6f6';
      } else {
        // Set inactive indicator
        if (indicator) {
          indicator.style.background = '#df4c4c';
          indicator.style.borderColor = '#a93737';
          indicator.style.boxShadow = '0px 0px 12px 0px rgba(223, 76, 76, 0.77)';
        }
        
        // Set inactive container background
        container.style.background = '#2a2c30'; // Dimmer background
        
        // Dim text elements
        if (numberElement) numberElement.style.color = '#7f8891';
        if (jElement) jElement.style.color = '#7f8891';
        if (mmElement) mmElement.style.color = '#7f8891';
      }
      
      // Add click event listener
      button.addEventListener('click', function() {
        // Toggle the state
        isActive = !isActive;
        
        // Update text content
        if (textElement) {
          textElement.textContent = isActive ? 'Active' : 'Inactive';
        }
        
        // Update indicator color
        if (indicator) {
          if (isActive) {
            indicator.style.background = '#51da6a';
            indicator.style.borderColor = '#3fb254';
            indicator.style.boxShadow = '0px 0px 12px 0px rgba(81, 218, 106, 0.77)';
          } else {
            indicator.style.background = '#df4c4c';
            indicator.style.borderColor = '#a93737';
            indicator.style.boxShadow = '0px 0px 12px 0px rgba(223, 76, 76, 0.77)';
          }
        }
        
        // Update container background and text elements
        if (isActive) {
          // Set active container background
          container.style.background = '#373a40'; // Brighter background
          
          // Brighten text elements
          if (numberElement) numberElement.style.color = '#f5f6f6';
          if (jElement) jElement.style.color = '#f5f6f6';
          if (mmElement) mmElement.style.color = '#f5f6f6';
        } else {
          // Set inactive container background
          container.style.background = '#2a2c30'; // Dimmer background
          
          // Dim text elements
          if (numberElement) numberElement.style.color = '#7f8891';
          if (jElement) jElement.style.color = '#7f8891';
          if (mmElement) mmElement.style.color = '#7f8891';
        }
        
        // Update progress bar
        const progressBar = container.querySelector('.frame-84, .frame-842');
        if (progressBar) {
          const segments = progressBar.querySelectorAll('div');
          
          if (isActive) {
            // Change to active (orange) style
            progressBar.style.background = '#27292d';
            segments.forEach((segment, index) => {
              const opacity = 1 - (index * 0.08);
              segment.style.background = `rgba(255, 153, 0, ${opacity})`;
            });
            
            // Make progress bar clickable
            progressBar.style.pointerEvents = 'auto';
            progressBar.style.cursor = 'pointer';
            
            // Re-add click event listener if it was removed
            if (progressBar._clickHandler && !progressBar._hasClickListener) {
              progressBar.addEventListener('click', progressBar._clickHandler);
              progressBar._hasClickListener = true;
            }
          } else {
            // Change to inactive (gray) style
            progressBar.style.background = '#25272a';
            segments.forEach(segment => {
              segment.style.background = '#3b4046';
            });
            
            // Make progress bar non-clickable
            progressBar.style.pointerEvents = 'none';
            progressBar.style.cursor = 'default';
            
            // Remove click event listener
            if (progressBar._clickHandler) {
              progressBar.removeEventListener('click', progressBar._clickHandler);
              progressBar._hasClickListener = false;
            }
          }
        }
      });
    }
    
    // Set up self-toggle for each button
    activeButtons.forEach(button => {
      setupSelfToggle(button);
    });
    
    // Also set up self-toggle for inactive buttons
    const inactiveButtons = document.querySelectorAll('.frame-982, .frame-984');
    inactiveButtons.forEach(button => {
      setupSelfToggle(button);
    });
  }
  
  // Initialize active/inactive toggle functionality
  setupActiveInactiveToggle();
  
  // Checkbox functionality for ellipse-13 elements
  function setupCheckboxes() {
    // Define the active and inactive text colors
    const ACTIVE_COLOR = '#f5f6f6';
    const INACTIVE_COLOR = '#7f8891';
    
    // Create "Successful" message elements for Heat, Cool, and Cycle Complete
    function createSuccessfulElement(textElement, index) {
      const successful = document.createElement('div');
      successful.className = `frame-success-${index}`;
      successful.style.background = '#34c759';
      successful.style.borderRadius = '8px';
      successful.style.padding = '10px 24px 10px 24px';
      successful.style.display = 'none'; // Initially hidden
      successful.style.flexDirection = 'row';
      successful.style.gap = '12px';
      successful.style.alignItems = 'center';
      successful.style.justifyContent = 'flex-start';
      successful.style.position = 'absolute';
      successful.style.right = '0px';
      
      // Position based on the text element's position
      successful.style.top = `${textElement.offsetTop - 1}px`;
      
      // Create inner text element
      const successfulText = document.createElement('div');
      successfulText.className = 'successful';
      successfulText.textContent = 'Successful';
      successfulText.style.color = '#185527';
      successfulText.style.textAlign = 'center';
      successfulText.style.fontFamily = '"SuisseIntlMono-Regular", sans-serif';
      successfulText.style.fontSize = '14px';
      successfulText.style.lineHeight = '18px';
      successfulText.style.letterSpacing = '-0.02em';
      successfulText.style.fontWeight = '400';
      successfulText.style.position = 'relative';
      
      successful.appendChild(successfulText);
      
      // Add to parent container
      const frame115 = document.querySelector('.frame-115');
      if (frame115) {
        frame115.appendChild(successful);
      }
      
      return successful;
    }
    
    // Define the mapping between text elements, checkboxes, and success frames
    const mappings = [
      {
        text: '.home',
        checkbox: '.frame-533',
        successFrame: '.frame-97'
      },
      {
        text: '.work-position',
        checkbox: '.frame-593',
        successFrame: '.frame-985'
      },
      {
        text: '.encoder-zero',
        checkbox: '.frame-563',
        successFrame: '.frame-99'
      },
      {
        text: '.heat',
        checkbox: '.frame-573',
        createSuccessFrame: true
      },
      {
        text: '.cool',
        checkbox: '.frame-603',
        createSuccessFrame: true
      },
      {
        text: '.cycle-complete',
        checkbox: '.frame-614',
        createSuccessFrame: true
      }
    ];
    
    // Process each mapping
    mappings.forEach((mapping, index) => {
      const textElement = document.querySelector(mapping.text);
      const checkboxElement = document.querySelector(mapping.checkbox);
      
      if (!textElement || !checkboxElement) return;
      
      // Create success frame if needed
      let successFrame = null;
      if (mapping.successFrame) {
        successFrame = document.querySelector(mapping.successFrame);
      } else if (mapping.createSuccessFrame) {
        successFrame = createSuccessfulElement(textElement, `custom-${index}`);
      }
      
      // Make checkbox clickable
      checkboxElement.style.cursor = 'pointer';
      
      // Check if checkbox already has an ellipse
      let ellipse = checkboxElement.querySelector('.ellipse-13');
      let isChecked = !!ellipse;
      
      // Set initial state
      if (isChecked) {
        textElement.style.color = ACTIVE_COLOR;
        textElement.style.fontFamily = '"SuisseIntl-Medium", sans-serif';
        textElement.style.fontWeight = '500';
        if (successFrame) successFrame.style.display = 'flex';
      } else {
        textElement.style.color = INACTIVE_COLOR;
        textElement.style.fontFamily = '"SuisseIntl-Regular", sans-serif';
        textElement.style.fontWeight = '400';
        if (successFrame) successFrame.style.display = 'none';
      }
      
      // Add click handler to checkbox
      checkboxElement.addEventListener('click', function() {
        isChecked = !isChecked;
        
        if (isChecked) {
          // Create ellipse if it doesn't exist
          if (!ellipse) {
            ellipse = document.createElement('div');
            ellipse.className = 'ellipse-13';
            
            // Style the ellipse
            ellipse.style.background = '#51da6a';
            ellipse.style.borderRadius = '50%';
            ellipse.style.borderStyle = 'solid';
            ellipse.style.borderColor = '#3fb254';
            ellipse.style.borderWidth = '1px';
            ellipse.style.width = '18px';
            ellipse.style.height = '18px';
            ellipse.style.position = 'absolute';
            ellipse.style.left = '50%';
            ellipse.style.translate = '-50%';
            ellipse.style.top = 'calc(50% - -9px)';
            ellipse.style.boxShadow = '0px 0px 24px 0px rgba(81, 218, 106, 0.88)';
            ellipse.style.transformOrigin = '0 0';
            ellipse.style.transform = 'rotate(-90deg) scale(1, 1)';
            
            checkboxElement.appendChild(ellipse);
          }
          
          // Show ellipse
          ellipse.style.display = 'block';
          
          // Update text style
          textElement.style.color = ACTIVE_COLOR;
          textElement.style.fontFamily = '"SuisseIntl-Medium", sans-serif';
          textElement.style.fontWeight = '500';
          
          // Show success message
          if (successFrame) successFrame.style.display = 'flex';
        } else {
          // Hide ellipse
          if (ellipse) ellipse.style.display = 'none';
          
          // Update text style
          textElement.style.color = INACTIVE_COLOR;
          textElement.style.fontFamily = '"SuisseIntl-Regular", sans-serif';
          textElement.style.fontWeight = '400';
          
          // Hide success message
          if (successFrame) successFrame.style.display = 'none';
        }
      });
      
      // Add click handler to text element as well for better UX
      textElement.style.cursor = 'pointer';
      textElement.addEventListener('click', function() {
        // Simulate click on the checkbox
        checkboxElement.click();
      });
    });
  }
  
  // Initialize checkbox functionality
  setupCheckboxes();
  
  // Cross button functionality to hide banner
  const crossButton = document.querySelector('.frame4');
  const banner = document.querySelector('.frame-5');
  
  if (crossButton && banner) {
    crossButton.addEventListener('click', function() {
      banner.style.display = 'none';
    });
  }
});
