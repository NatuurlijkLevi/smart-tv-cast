const EventEmitter = require('events');
const mdns = require('mdns');

class DeviceDiscovery extends EventEmitter {
  constructor() {
    super();
    this.devices = new Map();
    this.browser = null;
  }

  start() {
    try {
      // Create mDNS browser for Chromecast devices
      const sequence = [
        mdns.rst.DNSServiceResolve(),
        'DNSServiceGetAddrInfo' in mdns.dns_sd ? mdns.rst.DNSServiceGetAddrInfo() : mdns.rst.getaddrinfo({families:[4]}),
        mdns.rst.makeAddressesUnique()
      ];

      this.browser = mdns.createBrowser(mdns.tcp('googlecast'), { resolverSequence: sequence });

      this.browser.on('serviceUp', (service) => {
        const device = {
          id: this.generateDeviceId(service),
          name: service.name || 'Unknown Device',
          host: service.addresses[0],
          port: service.port || 8009,
          type: 'chromecast',
          txtRecord: service.txtRecord || {}
        };

        this.devices.set(device.id, device);
        this.emit('deviceFound', device);
      });

      this.browser.on('serviceDown', (service) => {
        const deviceId = this.generateDeviceId(service);
        const device = this.devices.get(deviceId);
        
        if (device) {
          this.devices.delete(deviceId);
          this.emit('deviceLost', device);
        }
      });

      this.browser.on('error', (error) => {
        console.error('mDNS browser error:', error);
        // If mDNS fails, we'll continue without it
        // This allows the app to run even without mDNS support
      });

      this.browser.start();
    } catch (error) {
      console.error('Failed to start device discovery:', error);
      console.log('Running without automatic device discovery. You can still add devices manually.');
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
    this.devices.clear();
  }

  generateDeviceId(service) {
    // Generate a unique ID based on service name and host
    const host = service.addresses && service.addresses[0] ? service.addresses[0] : 'unknown';
    return `${service.name || 'unknown'}-${host}`.replace(/[^a-zA-Z0-9-]/g, '_');
  }

  getDevices() {
    return Array.from(this.devices.values());
  }

  getDevice(deviceId) {
    return this.devices.get(deviceId);
  }
}

module.exports = DeviceDiscovery;
