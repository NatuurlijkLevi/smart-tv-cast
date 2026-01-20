const Client = require('castv2-client').Client;
const DefaultMediaReceiver = require('castv2-client').DefaultMediaReceiver;

class CastManager {
  constructor() {
    this.activeClients = new Map();
  }

  async castToDevices(deviceIds, url, devicesMap) {
    const results = [];

    for (const deviceId of deviceIds) {
      const device = devicesMap.get(deviceId);
      
      if (!device) {
        results.push({
          deviceId,
          success: false,
          error: 'Device not found'
        });
        continue;
      }

      try {
        const result = await this.castToDevice(device, url);
        results.push({
          deviceId,
          deviceName: device.name,
          success: true,
          ...result
        });
      } catch (error) {
        results.push({
          deviceId,
          deviceName: device.name,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  async castToDevice(device, url) {
    return new Promise((resolve, reject) => {
      const client = new Client();
      
      client.connect(device.host, () => {
        client.launch(DefaultMediaReceiver, (err, player) => {
          if (err) {
            client.close();
            return reject(err);
          }

          const media = {
            contentId: url,
            contentType: 'text/html',
            streamType: 'BUFFERED'
          };

          player.on('status', (status) => {
            console.log(`Status from ${device.name}:`, status);
          });

          player.load(media, { autoplay: true }, (err, status) => {
            if (err) {
              client.close();
              return reject(err);
            }

            // Store the active client for later control
            this.activeClients.set(device.id, { client, player, device });

            resolve({
              status: 'playing',
              mediaSessionId: status.mediaSessionId
            });
          });
        });
      });

      client.on('error', (err) => {
        reject(err);
      });
    });
  }

  async stopCasting(deviceIds) {
    const results = [];

    for (const deviceId of deviceIds) {
      const activeClient = this.activeClients.get(deviceId);
      
      if (!activeClient) {
        results.push({
          deviceId,
          success: false,
          error: 'No active casting session'
        });
        continue;
      }

      try {
        await this.stopDevice(deviceId);
        results.push({
          deviceId,
          deviceName: activeClient.device.name,
          success: true
        });
      } catch (error) {
        results.push({
          deviceId,
          deviceName: activeClient.device.name,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  async stopDevice(deviceId) {
    return new Promise((resolve, reject) => {
      const activeClient = this.activeClients.get(deviceId);
      
      if (!activeClient) {
        return reject(new Error('No active session'));
      }

      const { player, client } = activeClient;

      player.stop((err) => {
        client.close();
        this.activeClients.delete(deviceId);
        
        if (err) {
          return reject(err);
        }
        
        resolve();
      });
    });
  }

  stopAll() {
    const deviceIds = Array.from(this.activeClients.keys());
    
    deviceIds.forEach(deviceId => {
      try {
        const { client } = this.activeClients.get(deviceId);
        client.close();
      } catch (error) {
        console.error(`Error stopping device ${deviceId}:`, error);
      }
    });

    this.activeClients.clear();
  }

  getActiveCasts() {
    return Array.from(this.activeClients.entries()).map(([deviceId, { device }]) => ({
      deviceId,
      deviceName: device.name,
      deviceHost: device.host
    }));
  }
}

module.exports = CastManager;
