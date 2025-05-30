from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import os

def control_progress_bar():
    # Path to the current directory
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Get the absolute path to the HTML file
    html_file_path = os.path.join(current_dir, "index.html")
    file_url = f"file:///{html_file_path.replace(os.sep, '/')}"
    
    # Setup Chrome options
    options = webdriver.ChromeOptions()
    options.add_argument("--start-maximized")
    
    # Initialize the driver
    driver = webdriver.Chrome(options=options)
    
    try:
        # Open the HTML file
        driver.get(file_url)
        
        # Wait for the page to load
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CLASS_NAME, "frame-84"))
        )
        
        # Get the progress bar for tip 1
        progress_bar = driver.find_element(By.CSS_SELECTOR, ".frame-87 .frame-7 .frame-84")
        
        # Get all segments in the progress bar
        segments = progress_bar.find_elements(By.CSS_SELECTOR, "div")
        total_segments = len(segments)
        
        # Get the J value element
        j_value_element = driver.find_element(By.CSS_SELECTOR, ".frame-87 .frame-7 .frame-55 .frame-65 .frame-61 ._0-j")
        
        print("Starting progress animation...")
        
        # Progress from 0 to 100
        for i in range(total_segments + 1):
            if i > 0:
                # Calculate progress percentage
                progress = (i / total_segments) * 100
                j_value = int(progress)
                
                # Update the J value display
                driver.execute_script(f"arguments[0].textContent = '{j_value} J';", j_value_element)
                
                # Update the segments
                for j in range(total_segments):
                    if j < i:
                        # Calculate opacity based on position (1.0 to 0.2)
                        opacity = 1 - (j * 0.08)
                        driver.execute_script(
                            f"arguments[0].style.background = 'rgba(255, 153, 0, {opacity})';", 
                            segments[j]
                        )
                    else:
                        driver.execute_script(
                            "arguments[0].style.background = '#27292d';", 
                            segments[j]
                        )
            
            # Pause to show the animation
            time.sleep(0.2)
        
        # Pause at 100%
        time.sleep(1)
        
        # Progress from 100 back to 0
        for i in range(total_segments, -1, -1):
            # Calculate progress percentage
            progress = (i / total_segments) * 100
            j_value = int(progress)
            
            # Update the J value display
            driver.execute_script(f"arguments[0].textContent = '{j_value} J';", j_value_element)
            
            # Update the segments
            for j in range(total_segments):
                if j < i:
                    # Calculate opacity based on position (1.0 to 0.2)
                    opacity = 1 - (j * 0.08)
                    driver.execute_script(
                        f"arguments[0].style.background = 'rgba(255, 153, 0, {opacity})';", 
                        segments[j]
                    )
                else:
                    driver.execute_script(
                        "arguments[0].style.background = '#27292d';", 
                        segments[j]
                    )
            
            # Pause to show the animation
            time.sleep(0.2)
        
        print("Progress animation completed!")
        
        # Wait a moment before closing
        time.sleep(2)
        
    except Exception as e:
        print(f"An error occurred: {e}")
    
    finally:
        # Close the browser
        driver.quit()

if __name__ == "__main__":
    control_progress_bar()
