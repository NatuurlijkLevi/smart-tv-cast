const EventEmitter = require('events');
const { Bonjour } = require('bonjour-service');

class DeviceDiscovery extends EventEmitter {
  constructor() {
    super();
    this.devices = new Map();
    this.bonjour = null;
    this.browser = null;
  }

  start() {
    try {
      // Create Bonjour instance for device discovery
      this.bonjour = new Bonjour();
      
      // Browse for Chromecast devices using the _googlecast._tcp service
      this.browser = this.bonjour.find({ type: 'googlecast' }, (service) => {
        const device = {
          id: this.generateDeviceId(service),
          name: service.name || service.txt?.fn || 'Unknown Device',
          host: service.referer?.address || service.host || 'unknown',
          port: service.port || 8009,
          type: 'chromecast',
          txtRecord: service.txt || {}
        };

        this.devices.set(device.id, device);
        this.emit('deviceFound', device);
      });

      // Listen for services going down
      this.browser.on('down', (service) => {
        const deviceId = this.generateDeviceId(service);
        const device = this.devices.get(deviceId);
        
        if (device) {
          this.devices.delete(deviceId);
          this.emit('deviceLost', device);
        }
      });

      console.log('Device discovery started using Bonjour');
    } catch (error) {
      console.error('Failed to start device discovery:', error);
      console.log('Running without automatic device discovery.');
    }
  }

  stop() {
    if (this.browser) {
      try {
        this.browser.stop();
      } catch (error) {
        console.error('Error stopping browser:', error);
      }
    }
    
    if (this.bonjour) {
      try {
        this.bonjour.destroy();
      } catch (error) {
        console.error('Error destroying bonjour:', error);
      }
    }
    
    this.devices.clear();
  }

  generateDeviceId(service) {
    // Generate a unique ID based on service name and host
    const host = service.referer?.address || service.host || 'unknown';
    const name = service.name || 'unknown';
    return `${name}-${host}`.replace(/[^a-zA-Z0-9-]/g, '_');
  }

  getDevices() {
    return Array.from(this.devices.values());
  }

  getDevice(deviceId) {
    return this.devices.get(deviceId);
  }
}

module.exports = DeviceDiscovery;
