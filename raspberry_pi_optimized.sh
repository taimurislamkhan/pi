#!/bin/bash

# StakeMaster UI Application - Raspberry Pi Optimization Script
# This script optimizes the application for better performance on Raspberry Pi

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
echo "       StakeMaster UI - Raspberry Pi Optimization"
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

# Kill any running instances
print_status "Stopping any running instances..."
pkill -f electron || true
pkill -f node || true
pkill -f serial_handler.py || true

# Create a custom Electron startup script with optimizations
print_status "Creating optimized startup script..."
cat > start_optimized.sh << 'EOF'
#!/bin/bash

# Disable hardware acceleration which causes issues on Raspberry Pi
export ELECTRON_DISABLE_GPU=1
export ELECTRON_NO_ASAR=1
export ELECTRON_ENABLE_LOGGING=1

# Disable vsync errors
export ELECTRON_DISABLE_VSYNC=1

# Reduce memory usage
export NODE_OPTIONS="--max-old-space-size=256"

# Start the application
npm start
EOF

chmod +x start_optimized.sh
print_status "Created optimized startup script: start_optimized.sh"

# Create a desktop file for autostart with optimizations
print_status "Creating optimized desktop entry..."
CURRENT_DIR=$(pwd)
DESKTOP_ENTRY="[Desktop Entry]
Type=Application
Name=StakeMaster UI
Exec=$CURRENT_DIR/start_optimized.sh
Path=$CURRENT_DIR
Terminal=false
X-GNOME-Autostart-enabled=true"

# Create the autostart directory if it doesn't exist
AUTOSTART_DIR="/etc/xdg/autostart"
if [ ! -d "$AUTOSTART_DIR" ]; then
    sudo mkdir -p $AUTOSTART_DIR
fi

echo "$DESKTOP_ENTRY" | sudo tee $AUTOSTART_DIR/stakemaster.desktop > /dev/null
sudo chmod +x $AUTOSTART_DIR/stakemaster.desktop
print_status "Created optimized desktop entry for autostart"

# Optimize Raspberry Pi configuration
print_status "Checking for Raspberry Pi configuration optimization..."
if [ -f "/boot/config.txt" ]; then
    print_status "Found Raspberry Pi config.txt, checking for optimizations..."
    
    # Check if GPU memory is already configured
    if grep -q "^gpu_mem=" /boot/config.txt; then
        print_status "GPU memory already configured in config.txt"
    else
        print_warning "Adding GPU memory configuration to config.txt"
        echo "# StakeMaster UI optimization - allocate more memory to GPU" | sudo tee -a /boot/config.txt > /dev/null
        echo "gpu_mem=128" | sudo tee -a /boot/config.txt > /dev/null
    fi
    
    # Check if OpenGL driver is already configured
    if grep -q "^dtoverlay=vc4-kms-v3d" /boot/config.txt; then
        print_status "OpenGL driver already configured in config.txt"
    else
        print_warning "Adding OpenGL driver configuration to config.txt"
        echo "# StakeMaster UI optimization - enable OpenGL driver" | sudo tee -a /boot/config.txt > /dev/null
        echo "dtoverlay=vc4-kms-v3d" | sudo tee -a /boot/config.txt > /dev/null
    fi
    
    print_warning "Note: You'll need to reboot for these changes to take effect"
else
    print_warning "Could not find Raspberry Pi config.txt. Skipping configuration optimization."
fi

# Final instructions
echo ""
echo "=========================================================="
echo "              Optimization Complete!"
echo "=========================================================="
echo ""
print_status "To start the optimized application, run:"
echo "./start_optimized.sh"
echo ""
print_status "If you're still experiencing performance issues:"
echo "1. Make sure your Raspberry Pi is not overheating (check with 'vcgencmd measure_temp')"
echo "2. Consider using a Raspberry Pi 4 with at least 2GB RAM for best performance"
echo "3. Close other applications running on your Raspberry Pi"
echo "4. Reboot your Raspberry Pi to apply all optimizations"
echo ""
read -p "Would you like to start the optimized application now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Starting optimized application..."
    ./start_optimized.sh
else
    print_status "You can start the application later with './start_optimized.sh'"
fi
