# StakeMaster UI Application

This application combines a web-based UI (HTML/JavaScript) with a Python backend for serial communication, packaged as a desktop application using Electron.js for Raspberry Pi.

## System Overview

- **Frontend**: HTML/JavaScript UI (your existing code)
- **Backend**: Python script for serial communication
- **Desktop Wrapper**: Electron.js to package everything as a native application

## Installation on Raspberry Pi

### Prerequisites

1. Install Node.js and npm:
```bash
sudo apt update
sudo apt install nodejs npm
```

2. Install Python and required packages:
```bash
sudo apt update
sudo apt install python3 python3-pip
pip3 install pyserial
```

### Setup

1. Clone or copy this directory to your Raspberry Pi.

2. Install Node.js dependencies:
```bash
cd /path/to/project
npm install
```

3. Configure serial port (if needed):
   - Open `serial_handler.py`
   - Change the default port from `/dev/ttyUSB0` to your actual serial port
   - Default baud rate is 9600, change if needed

## Running the Application

### Development Mode

Run the application in development mode:
```bash
npm start
```

### Package for Raspberry Pi

Create a standalone application:
```bash
npm run package-pi
```

This will create a distributable application in the `dist` folder.

### Auto-start on Boot

To make the application start automatically when the Raspberry Pi boots:

1. Create a desktop entry:
```bash
sudo nano /etc/xdg/autostart/stakemaster.desktop
```

2. Add the following content:
```
[Desktop Entry]
Type=Application
Name=StakeMaster UI
Exec=/path/to/dist/StakeMasterUI
```

## Serial Communication Protocol

The Python backend expects serial data in JSON format. For example:
```json
{"tip1": 75, "tip2": 30, "tip3": 50, "tip4": 10}
```

You can also send commands to the serial device using the API endpoint:
```
POST http://localhost:8000/command
Content-Type: application/json
{"command": "YOUR_COMMAND_HERE"}
```

## API Endpoints

The Python backend provides the following HTTP endpoints:

- `GET /data` - Get the latest serial data
- `GET /progress` - Get the current progress animation state
- `GET /start_animation` - Start the progress animation
- `GET /stop_animation` - Stop the progress animation
- `POST /command` - Send a command to the serial port

## Customization

- Modify `serial_handler.py` to handle your specific serial data format
- Update `serial-ui.js` to process and display the data as needed
- Adjust the animation speed in both files if needed

## Troubleshooting

- **Serial Port Access**: You may need to add your user to the `dialout` group:
  ```bash
  sudo usermod -a -G dialout $USER
  ```
  Then reboot the Raspberry Pi.

- **Python Backend Not Starting**: Check the Electron console for errors:
  ```bash
  npm start -- --enable-logging
  ```

- **UI Not Updating**: Check the browser console for any JavaScript errors
