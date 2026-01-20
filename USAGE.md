# Usage Examples

## Basic Usage

### 1. Starting the Server

```bash
# Install dependencies
npm install

# Start the server
npm start
```

The server will start on port 3000 by default. You can change the port using the PORT environment variable:

```bash
PORT=8080 npm start
```

### 2. Accessing the Web Interface

Open your browser and navigate to:
```
http://localhost:3000
```

## Common Use Cases

### Case 1: Cast a YouTube Video to Multiple TVs

1. Start the server
2. Open the web interface
3. Wait for devices to appear (they will auto-discover)
4. Select multiple devices by clicking on them
5. Enter a YouTube video URL in the URL field:
   ```
   https://www.youtube.com/watch?v=dQw4w9WgXcQ
   ```
6. Click "Cast to Selected Devices"

### Case 2: Display a Website on All TVs

1. Select all devices using the "Select All" button
2. Enter a website URL:
   ```
   https://example.com
   ```
3. Click "Cast to Selected Devices"

### Case 3: Show a Video File

1. Select your target devices
2. Enter the URL of a video file (MP4, WebM, etc.):
   ```
   https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4
   ```
3. Click "Cast to Selected Devices"

### Case 4: Stop Casting

1. Select the devices you want to stop
2. Click "Stop Casting"

## API Usage Examples

If you want to integrate with the API programmatically:

### Get All Devices

```bash
curl http://localhost:3000/api/devices
```

Response:
```json
{
  "devices": [
    {
      "id": "Living_Room_TV-192_168_1_10",
      "name": "Living Room TV",
      "host": "192.168.1.10",
      "port": 8009,
      "type": "chromecast"
    }
  ]
}
```

### Start Casting

```bash
curl -X POST http://localhost:3000/api/cast \
  -H "Content-Type: application/json" \
  -d '{
    "deviceIds": ["Living_Room_TV-192_168_1_10", "Bedroom_TV-192_168_1_11"],
    "url": "https://example.com/video.mp4"
  }'
```

Response:
```json
{
  "success": true,
  "results": [
    {
      "deviceId": "Living_Room_TV-192_168_1_10",
      "deviceName": "Living Room TV",
      "success": true,
      "status": "playing"
    }
  ]
}
```

### Stop Casting

```bash
curl -X POST http://localhost:3000/api/stop \
  -H "Content-Type: application/json" \
  -d '{
    "deviceIds": ["Living_Room_TV-192_168_1_10"]
  }'
```

### Get Active Casts

```bash
curl http://localhost:3000/api/status
```

Response:
```json
{
  "activeCasts": [
    {
      "deviceId": "Living_Room_TV-192_168_1_10",
      "deviceName": "Living Room TV",
      "deviceHost": "192.168.1.10"
    }
  ]
}
```

## Advanced Usage

### Running as a Background Service (Linux)

Create a systemd service file at `/etc/systemd/system/smart-tv-cast.service`:

```ini
[Unit]
Description=Smart TV Cast Service
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/smart-tv-cast
ExecStart=/usr/bin/node server.js
Restart=always
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl enable smart-tv-cast
sudo systemctl start smart-tv-cast
```

### Running with Docker

Create a `Dockerfile`:

```dockerfile
FROM node:18

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 3000
CMD ["node", "server.js"]
```

Build and run:
```bash
docker build -t smart-tv-cast .
docker run -p 3000:3000 --net=host smart-tv-cast
```

Note: `--net=host` is required for mDNS device discovery to work.

## Tips and Best Practices

1. **Network Configuration**: Ensure the server and all Chromecast devices are on the same subnet
2. **Firewall**: Allow mDNS traffic (UDP port 5353) and Chromecast communication (TCP port 8009)
3. **Content URLs**: Use publicly accessible URLs or URLs within your local network
4. **Multiple Screens**: Test with 2-3 devices first before scaling to many devices
5. **Performance**: The server can handle multiple simultaneous casts, but network bandwidth may become a bottleneck

## Troubleshooting

### Devices Not Appearing

1. Check that devices are on the same network
2. Verify mDNS isn't blocked by firewall
3. Restart the Chromecast devices
4. Check the server logs for errors

### Casting Fails

1. Verify the URL is accessible from the server
2. Check content type compatibility
3. Ensure devices aren't already casting from another source
4. Check network connectivity

### WebSocket Connection Issues

1. Check browser console for errors
2. Verify the server is running
3. Check for proxy/firewall blocking WebSocket connections
