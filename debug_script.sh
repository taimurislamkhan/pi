#!/bin/bash

# Debug script for StakeMaster UI Application
# This script helps diagnose and fix common issues

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

# Welcome message
echo "=========================================================="
echo "       StakeMaster UI Application Debug Tool"
echo "=========================================================="
echo ""

# Check if Electron is running and kill it if needed
print_status "Checking for running Electron processes..."
if pgrep -f electron > /dev/null; then
    print_warning "Found running Electron processes. Attempting to terminate..."
    pkill -f electron
    sleep 2
    if pgrep -f electron > /dev/null; then
        print_error "Failed to terminate Electron processes. Trying force kill..."
        pkill -9 -f electron
    else
        print_status "Electron processes terminated successfully."
    fi
else
    print_status "No running Electron processes found."
fi

# Check if Python backend is running and kill it if needed
print_status "Checking for running Python backend processes..."
if pgrep -f serial_handler.py > /dev/null; then
    print_warning "Found running Python backend processes. Attempting to terminate..."
    pkill -f serial_handler.py
    sleep 2
    if pgrep -f serial_handler.py > /dev/null; then
        print_error "Failed to terminate Python processes. Trying force kill..."
        pkill -9 -f serial_handler.py
    else
        print_status "Python processes terminated successfully."
    fi
else
    print_status "No running Python backend processes found."
fi

# Check if the required files exist
print_status "Checking for required files..."
MISSING_FILES=0

check_file() {
    if [ ! -f "$1" ]; then
        print_error "Missing file: $1"
        MISSING_FILES=$((MISSING_FILES+1))
    else
        print_status "Found file: $1"
    fi
}

check_file "index.html"
check_file "script.js"
check_file "serial-ui.js"
check_file "main.js"
check_file "serial_handler.py"

if [ $MISSING_FILES -gt 0 ]; then
    print_error "Found $MISSING_FILES missing files. Please ensure all required files are present."
else
    print_status "All required files are present."
fi

# Check if the virtual environment exists
print_status "Checking Python virtual environment..."
if [ ! -d "stakemaster_venv" ]; then
    print_warning "Python virtual environment not found. It will be created when you run setup_raspberry_pi.sh."
else
    print_status "Python virtual environment found."
    
    # Check if pyserial is installed in the virtual environment
    print_status "Checking if pyserial is installed in the virtual environment..."
    if source stakemaster_venv/bin/activate && pip list | grep -q pyserial; then
        print_status "pyserial is installed in the virtual environment."
        deactivate
    else
        print_warning "pyserial is not installed in the virtual environment. Run setup_raspberry_pi.sh to fix this."
        deactivate
    fi
fi

# Check if npm dependencies are installed
print_status "Checking npm dependencies..."
if [ ! -d "node_modules" ]; then
    print_warning "Node modules not found. Run 'npm install' to install dependencies."
else
    print_status "Node modules found."
fi

# Provide exit options
echo ""
echo "=========================================================="
echo "                   Debug Report Complete"
echo "=========================================================="
echo ""
print_status "If you were experiencing a black screen issue:"
echo "1. The issue has been fixed in main.js to show proper error messages"
echo "2. Run 'npm start -- --enable-logging' to see detailed logs"
echo "3. Press Ctrl+C in the terminal to exit if the app freezes"
echo ""
print_status "To start the application with debugging enabled:"
echo "npm start -- --enable-logging"
echo ""
print_status "To completely reset the application:"
echo "./setup_raspberry_pi.sh"
echo ""
