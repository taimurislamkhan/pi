import serial
import json
import time
from http.server import BaseHTTPRequestHandler, HTTPServer
import threading
from urllib.parse import parse_qs, urlparse

# Global variables to store the latest data and progress values
serial_data = {}
progress_value = 0
direction = 1  # 1 for increasing, -1 for decreasing
animation_running = False

class SerialHandler:
    def __init__(self, port='/dev/ttyUSB0', baud_rate=9600):
        self.port = port
        self.baud_rate = baud_rate
        self.ser = None
        self.connected = False
        
    def connect(self):
        try:
            self.ser = serial.Serial(self.port, self.baud_rate, timeout=1)
            self.connected = True
            print(f"Connected to {self.port} at {self.baud_rate} baud")
            return True
        except Exception as e:
            print(f"Failed to connect to serial port: {e}")
            self.connected = False
            return False
            
    def read_data(self):
        if not self.connected:
            return None
            
        try:
            if self.ser.in_waiting > 0:
                line = self.ser.readline().decode('utf-8').strip()
                try:
                    # Assuming data comes in as JSON
                    data = json.loads(line)
                    return data
                except json.JSONDecodeError:
                    # If not JSON, return as plain text
                    return {"raw_data": line}
        except Exception as e:
            print(f"Error reading serial data: {e}")
            
        return None
        
    def send_command(self, command):
        if not self.connected:
            return False
            
        try:
            self.ser.write(f"{command}\n".encode('utf-8'))
            return True
        except Exception as e:
            print(f"Error sending command: {e}")
            return False
            
    def close(self):
        if self.connected and self.ser:
            self.ser.close()
            self.connected = False

class RequestHandler(BaseHTTPRequestHandler):
    def _set_headers(self, content_type='application/json'):
        self.send_response(200)
        self.send_header('Content-type', content_type)
        self.send_header('Access-Control-Allow-Origin', '*')  # Allow CORS
        self.end_headers()
        
    def do_GET(self):
        global serial_data, progress_value, direction, animation_running
        
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        if path == '/data':
            # Return the latest serial data
            self._set_headers()
            self.wfile.write(json.dumps(serial_data).encode())
            
        elif path == '/progress':
            # Return the current progress value
            self._set_headers()
            self.wfile.write(json.dumps({
                "progress": progress_value,
                "direction": direction,
                "running": animation_running
            }).encode())
            
        elif path == '/start_animation':
            # Start the progress animation
            animation_running = True
            progress_value = 0
            direction = 1
            
            self._set_headers()
            self.wfile.write(json.dumps({"status": "animation_started"}).encode())
            
        elif path == '/stop_animation':
            # Stop the progress animation
            animation_running = False
            
            self._set_headers()
            self.wfile.write(json.dumps({"status": "animation_stopped"}).encode())
            
        elif path == '/':
            # Serve a simple status page
            self._set_headers('text/html')
            status_html = """
            <!DOCTYPE html>
            <html>
            <head>
                <title>Serial Handler Status</title>
                <meta http-equiv="refresh" content="5">
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .status { padding: 10px; border-radius: 5px; margin: 10px 0; }
                    .connected { background-color: #d4edda; color: #155724; }
                    .disconnected { background-color: #f8d7da; color: #721c24; }
                </style>
            </head>
            <body>
                <h1>Serial Handler Status</h1>
                <div class="status %s">
                    <p>Serial Connection: %s</p>
                </div>
                <div>
                    <h2>Latest Data:</h2>
                    <pre>%s</pre>
                </div>
                <div>
                    <h2>Progress Animation:</h2>
                    <p>Value: %d</p>
                    <p>Direction: %s</p>
                    <p>Running: %s</p>
                </div>
            </body>
            </html>
            """ % (
                "connected" if serial_handler.connected else "disconnected",
                "Connected" if serial_handler.connected else "Disconnected",
                json.dumps(serial_data, indent=2),
                progress_value,
                "Increasing" if direction == 1 else "Decreasing",
                "Yes" if animation_running else "No"
            )
            self.wfile.write(status_html.encode())
        else:
            # Not found
            self.send_response(404)
            self.end_headers()
    
    def do_POST(self):
        global serial_data
        
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        if path == '/command':
            # Get the POST data length
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length).decode('utf-8')
            
            try:
                command_data = json.loads(post_data)
                command = command_data.get('command')
                
                if command:
                    success = serial_handler.send_command(command)
                    
                    self._set_headers()
                    self.wfile.write(json.dumps({
                        "status": "success" if success else "failed",
                        "command": command
                    }).encode())
                else:
                    self._set_headers()
                    self.wfile.write(json.dumps({
                        "status": "error",
                        "message": "No command provided"
                    }).encode())
            except json.JSONDecodeError:
                self._set_headers()
                self.wfile.write(json.dumps({
                    "status": "error",
                    "message": "Invalid JSON data"
                }).encode())
        else:
            # Not found
            self.send_response(404)
            self.end_headers()

def update_progress():
    global progress_value, direction, animation_running
    
    while True:
        if animation_running:
            # Update progress value
            progress_value += direction
            
            # Change direction at limits
            if progress_value >= 100:
                direction = -1
                time.sleep(1)  # Pause at 100%
            elif progress_value <= 0 and direction == -1:
                animation_running = False
                
        time.sleep(0.05)  # Update every 50ms

def read_serial_data():
    global serial_data
    
    while True:
        if serial_handler.connected:
            data = serial_handler.read_data()
            if data:
                serial_data = data
                
        time.sleep(0.1)  # Check for new data every 100ms

if __name__ == "__main__":
    # Create and connect to serial port
    serial_handler = SerialHandler()
    
    # Try to connect, but continue even if connection fails
    # This allows the HTTP server to start and the connection can be retried later
    serial_handler.connect()
    
    # Start the HTTP server
    server_address = ('', 8000)  # Empty string means listen on all available interfaces
    httpd = HTTPServer(server_address, RequestHandler)
    
    # Start threads for serial data reading and progress animation
    serial_thread = threading.Thread(target=read_serial_data, daemon=True)
    progress_thread = threading.Thread(target=update_progress, daemon=True)
    
    serial_thread.start()
    progress_thread.start()
    
    print(f"Server running at http://localhost:8000")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        httpd.server_close()
        serial_handler.close()
        print("Server stopped.")
