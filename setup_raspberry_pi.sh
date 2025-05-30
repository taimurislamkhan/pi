#!/bin/bash

# StakeMaster UI Application Setup Script for Raspberry Pi
# This script automates the installation and setup process

# Text colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print status messages
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

# Function to print warning messages
print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function to print error messages
print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if a command succeeded
check_success() {
    if [ $? -eq 0 ]; then
        print_status "$1"
    else
        print_error "$2"
        exit 1
    fi
}

# Welcome message
echo "=========================================================="
echo "       StakeMaster UI Application Setup for Raspberry Pi"
echo "=========================================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_warning "This script is not running as root. Some operations might fail."
    print_warning "Consider running with 'sudo' if you encounter permission issues."
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Update package lists
print_status "Updating package lists..."
sudo apt update
check_success "Package lists updated successfully." "Failed to update package lists."

# Install Node.js and npm
print_status "Installing Node.js and npm..."
sudo apt install -y nodejs npm
check_success "Node.js and npm installed successfully." "Failed to install Node.js and npm."

# Check Node.js and npm versions
NODE_VERSION=$(node -v)
NPM_VERSION=$(npm -v)
print_status "Installed Node.js version: $NODE_VERSION"
print_status "Installed npm version: $NPM_VERSION"

# Install Python and pip
print_status "Installing Python3 and pip..."
sudo apt install -y python3 python3-pip
check_success "Python3 and pip installed successfully." "Failed to install Python3 and pip."

# Install Python dependencies using a virtual environment (safest approach)
print_status "Setting up Python environment..."

# Install venv package if not already installed
print_status "Making sure venv module is available..."
sudo apt install -y python3-venv
check_success "Python venv module installed." "Failed to install Python venv module."

# Create a virtual environment
print_status "Creating a Python virtual environment..."

# Remove any existing virtual environment
if [ -d "stakemaster_venv" ]; then
    print_status "Removing existing virtual environment..."
    rm -rf stakemaster_venv
fi

python3 -m venv stakemaster_venv
check_success "Virtual environment created successfully." "Failed to create virtual environment."

# Activate the virtual environment
print_status "Activating virtual environment..."
source stakemaster_venv/bin/activate
check_success "Virtual environment activated." "Failed to activate virtual environment."

# Upgrade pip within the virtual environment
print_status "Upgrading pip in virtual environment..."
pip3 install --upgrade pip
check_success "Pip upgraded successfully." "Failed to upgrade pip."

# Install dependencies in the virtual environment
print_status "Installing dependencies in virtual environment..."
pip3 install pyserial
check_success "Python dependencies installed successfully." "Failed to install Python dependencies."

# Deactivate the virtual environment
deactivate

# Make sure serial_handler.py has the correct shebang
print_status "Updating Python path in scripts..."

# Check if the file exists first
if [ -f "serial_handler.py" ]; then
    # Add shebang if it doesn't exist, or replace if it does
    if grep -q "^#!" serial_handler.py; then
        sed -i '1s|^#!.*$|#!/usr/bin/env python3|' serial_handler.py
    else
        sed -i '1i#!/usr/bin/env python3' serial_handler.py
    fi
    check_success "Python script updated with correct path." "Failed to update Python script."
else
    print_warning "serial_handler.py not found. Skipping shebang update."
fi

# Create a wrapper script to run the Python script with the virtual environment
print_status "Creating wrapper script for Python backend..."
cat > run_python_backend.sh << 'EOF'
#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
source "$DIR/stakemaster_venv/bin/activate"
python3 "$DIR/serial_handler.py"
EOF

chmod +x run_python_backend.sh
check_success "Wrapper script created." "Failed to create wrapper script."

# Update the main.js file to use the wrapper script if it exists
if [ -f "main.js" ]; then
    print_status "Updating main.js to use the wrapper script..."
    sed -i "s|path.join(__dirname, 'serial_handler.py')|path.join(__dirname, 'run_python_backend.sh')|g" main.js
    check_success "main.js updated." "Failed to update main.js."
else
    print_warning "main.js not found. Skipping update."
fi

print_status "Python environment setup complete."

# Add user to dialout group for serial port access
print_status "Adding user to dialout group for serial port access..."
sudo usermod -a -G dialout $USER
check_success "User added to dialout group." "Failed to add user to dialout group."
print_warning "You may need to log out and log back in for the group changes to take effect."

# Install application dependencies
print_status "Installing Node.js application dependencies..."
npm install
check_success "Application dependencies installed successfully." "Failed to install application dependencies."

# Create autostart directory if it doesn't exist
AUTOSTART_DIR="/etc/xdg/autostart"
if [ ! -d "$AUTOSTART_DIR" ]; then
    print_status "Creating autostart directory..."
    sudo mkdir -p $AUTOSTART_DIR
    check_success "Autostart directory created." "Failed to create autostart directory."
fi

# Create desktop entry for autostart
print_status "Creating desktop entry for autostart..."
CURRENT_DIR=$(pwd)
DESKTOP_ENTRY="[Desktop Entry]
Type=Application
Name=StakeMaster UI
Exec=npm start --prefix $CURRENT_DIR
Path=$CURRENT_DIR
Terminal=false
X-GNOME-Autostart-enabled=true"

echo "$DESKTOP_ENTRY" | sudo tee $AUTOSTART_DIR/stakemaster.desktop > /dev/null
check_success "Desktop entry created." "Failed to create desktop entry."

# Set permissions for the desktop entry
sudo chmod +x $AUTOSTART_DIR/stakemaster.desktop
check_success "Desktop entry permissions set." "Failed to set desktop entry permissions."

# Package the application (optional)
read -p "Would you like to package the application for distribution? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Packaging application..."
    npm run package-pi
    check_success "Application packaged successfully." "Failed to package application."
    
    # Update desktop entry to use the packaged application
    DIST_PATH="$CURRENT_DIR/dist/StakeMasterUI-linux-armv7l/StakeMasterUI"
    PACKAGE_DESKTOP_ENTRY="[Desktop Entry]
Type=Application
Name=StakeMaster UI
Exec=$DIST_PATH
Path=$CURRENT_DIR/dist/StakeMasterUI-linux-armv7l
Terminal=false
X-GNOME-Autostart-enabled=true"

    echo "$PACKAGE_DESKTOP_ENTRY" | sudo tee $AUTOSTART_DIR/stakemaster.desktop > /dev/null
    check_success "Desktop entry updated to use packaged application." "Failed to update desktop entry."
fi

# Set up for first run
print_status "Setting up for first run..."
chmod +x serial_handler.py
check_success "Made serial handler executable." "Failed to make serial handler executable."

# Final instructions
echo ""
echo "=========================================================="
echo "                      Setup Complete!"
echo "=========================================================="
echo ""
print_status "The StakeMaster UI application has been set up successfully."
print_status "To start the application manually, run: npm start"
print_warning "You may need to reboot for all changes to take effect."
echo ""
read -p "Would you like to start the application now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Starting application..."
    npm start
else
    print_status "You can start the application later with 'npm start'."
fi

echo ""
print_status "Thank you for installing StakeMaster UI!"
