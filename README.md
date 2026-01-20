# Smart TV Cast

A web application for casting to multiple smart TVs simultaneously with automatic device discovery. Unlike standard Chrome casting, this application allows you to cast the same content to multiple screens at once without needing to manually enter IP addresses.

## Features

- 🔍 **Automatic Device Discovery**: Automatically finds Chromecast devices on your network using Bonjour/mDNS
- 📺 **Multi-Device Casting**: Cast to multiple TVs simultaneously (not possible with standard Chrome casting)
- 🏷️ **Device Names**: Shows the friendly names of discovered devices
- 🌐 **Web Interface**: Easy-to-use web interface for device management and casting control
- 🔄 **Real-time Updates**: WebSocket-based real-time device discovery and status updates
- 📊 **Activity Logging**: Track casting operations and device events

## Requirements

- Node.js (v14 or higher)
- Chromecast devices on the same network

## Installation

1. Clone the repository:
```bash
git clone https://github.com/NatuurlijkLevi/smart-tv-cast.git
cd smart-tv-cast
```

2. Install dependencies:
```bash
npm install
```

## Usage

1. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

2. Open your browser and navigate to:
```
http://localhost:3000
```

3. The application will automatically discover Chromecast devices on your network

4. Select one or more devices from the discovered list

5. Enter a URL to cast (can be a video URL, webpage, etc.)

6. Click "Cast to Selected Devices" to start casting

## How It Works

### Device Discovery

The application uses Bonjour/mDNS (Multicast DNS) to discover Chromecast devices on your local network. This means:
- No need to manually enter IP addresses
- Devices are automatically detected when they come online
- Device names are retrieved from the devices themselves

### Multi-Device Casting

The application maintains separate connections to each selected device and can:
- Cast the same content to multiple devices simultaneously
- Control each device independently
- Monitor the status of each active cast

### Architecture

- **Backend (Node.js + Express)**: Handles device discovery, casting operations, and WebSocket communication
- **Frontend (HTML/CSS/JS)**: Provides the user interface for device selection and casting control
- **WebSocket**: Enables real-time updates for device discovery and status changes

## API Endpoints

### GET /api/devices
Returns a list of all discovered devices.

### POST /api/cast
Start casting to selected devices.

**Request body:**
```json
{
  "deviceIds": ["device-1", "device-2"],
  "url": "https://example.com/video.mp4"
}
```

### POST /api/stop
Stop casting on selected devices.

**Request body:**
```json
{
  "deviceIds": ["device-1", "device-2"]
}
```

### GET /api/status
Get the status of active casting sessions.

## Troubleshooting

### No devices found
- Ensure your Chromecast devices are powered on and connected to the same network
- Verify that your firewall isn't blocking mDNS traffic (port 5353)
- Check that the server and Chromecast devices are on the same subnet

### Casting fails
- Make sure the URL is publicly accessible
- Check that your devices support the content type you're trying to cast
- Verify network connectivity between the server and Chromecast devices

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.