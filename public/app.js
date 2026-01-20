// WebSocket connection
let ws;
let devices = [];
let selectedDevices = new Set();

// DOM Elements
const devicesListEl = document.getElementById('devices-list');
const connectionStatusEl = document.getElementById('connection-status');
const deviceCountEl = document.getElementById('device-count');
const urlInputEl = document.getElementById('url-input');
const castBtnEl = document.getElementById('cast-btn');
const stopBtnEl = document.getElementById('stop-btn');
const selectAllBtnEl = document.getElementById('select-all-btn');
const deselectAllBtnEl = document.getElementById('deselect-all-btn');
const activeCastsEl = document.getElementById('active-casts');
const logsEl = document.getElementById('logs');

// Initialize WebSocket connection
function connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    
    ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
        connectionStatusEl.textContent = '🟢 Connected';
        connectionStatusEl.classList.add('connected');
        addLog('Connected to server', 'success');
    };
    
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'devices') {
            devices = data.devices;
            updateDevicesList();
            updateDeviceCount();
        }
    };
    
    ws.onclose = () => {
        connectionStatusEl.textContent = '🔴 Disconnected';
        connectionStatusEl.classList.remove('connected');
        addLog('Disconnected from server', 'error');
        
        // Attempt to reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000);
    };
    
    ws.onerror = (error) => {
        addLog('WebSocket error occurred', 'error');
    };
}

// Update devices list display
function updateDevicesList() {
    if (devices.length === 0) {
        devicesListEl.innerHTML = `
            <div class="no-devices">
                <p>🔍 Searching for devices...</p>
                <p class="hint">Make sure your Chromecast devices are on the same network</p>
            </div>
        `;
        return;
    }
    
    devicesListEl.innerHTML = devices.map(device => `
        <div class="device-card ${selectedDevices.has(device.id) ? 'selected' : ''}" 
             data-device-id="${device.id}"
             onclick="toggleDeviceSelection('${device.id}')">
            <div class="device-name">📺 ${device.name}</div>
            <div class="device-info">Type: ${device.type}</div>
            <div class="device-info">IP: ${device.host}:${device.port}</div>
            <span class="device-status">Available</span>
        </div>
    `).join('');
}

// Toggle device selection
function toggleDeviceSelection(deviceId) {
    if (selectedDevices.has(deviceId)) {
        selectedDevices.delete(deviceId);
    } else {
        selectedDevices.add(deviceId);
    }
    
    updateDevicesList();
    updateCastButton();
}

// Update device count display
function updateDeviceCount() {
    const count = devices.length;
    deviceCountEl.textContent = `${count} device${count !== 1 ? 's' : ''} found`;
}

// Update cast button state
function updateCastButton() {
    const hasSelection = selectedDevices.size > 0;
    const hasUrl = urlInputEl.value.trim() !== '';
    
    castBtnEl.disabled = !hasSelection || !hasUrl;
    stopBtnEl.disabled = !hasSelection;
}

// Select all devices
selectAllBtnEl.addEventListener('click', () => {
    devices.forEach(device => selectedDevices.add(device.id));
    updateDevicesList();
    updateCastButton();
    addLog(`Selected all ${devices.length} devices`, 'info');
});

// Deselect all devices
deselectAllBtnEl.addEventListener('click', () => {
    selectedDevices.clear();
    updateDevicesList();
    updateCastButton();
    addLog('Deselected all devices', 'info');
});

// Cast to selected devices
castBtnEl.addEventListener('click', async () => {
    const url = urlInputEl.value.trim();
    
    if (!url) {
        addLog('Please enter a URL to cast', 'error');
        return;
    }
    
    if (selectedDevices.size === 0) {
        addLog('Please select at least one device', 'error');
        return;
    }
    
    castBtnEl.disabled = true;
    castBtnEl.textContent = '⏳ Casting...';
    
    try {
        const response = await fetch('/api/cast', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                deviceIds: Array.from(selectedDevices),
                url: url
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            const successCount = result.results.filter(r => r.success).length;
            const failCount = result.results.filter(r => !r.success).length;
            
            addLog(`Cast started on ${successCount} device(s)${failCount > 0 ? `, ${failCount} failed` : ''}`, 'success');
            
            result.results.forEach(r => {
                if (r.success) {
                    addLog(`✓ ${r.deviceName}: Casting started`, 'success');
                } else {
                    addLog(`✗ ${r.deviceName}: ${r.error}`, 'error');
                }
            });
            
            updateActiveCasts();
        } else {
            addLog(`Cast failed: ${result.error}`, 'error');
        }
    } catch (error) {
        addLog(`Error: ${error.message}`, 'error');
    } finally {
        castBtnEl.disabled = false;
        castBtnEl.textContent = '▶️ Cast to Selected Devices';
    }
});

// Stop casting on selected devices
stopBtnEl.addEventListener('click', async () => {
    if (selectedDevices.size === 0) {
        addLog('Please select at least one device', 'error');
        return;
    }
    
    stopBtnEl.disabled = true;
    stopBtnEl.textContent = '⏳ Stopping...';
    
    try {
        const response = await fetch('/api/stop', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                deviceIds: Array.from(selectedDevices)
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            const successCount = result.results.filter(r => r.success).length;
            addLog(`Stopped casting on ${successCount} device(s)`, 'success');
            
            result.results.forEach(r => {
                if (r.success) {
                    addLog(`✓ ${r.deviceName}: Stopped`, 'success');
                } else {
                    addLog(`✗ ${r.deviceName}: ${r.error}`, 'error');
                }
            });
            
            updateActiveCasts();
        } else {
            addLog(`Stop failed: ${result.error}`, 'error');
        }
    } catch (error) {
        addLog(`Error: ${error.message}`, 'error');
    } finally {
        stopBtnEl.disabled = false;
        stopBtnEl.textContent = '⏹️ Stop Casting';
    }
});

// Update active casts display
async function updateActiveCasts() {
    try {
        const response = await fetch('/api/status');
        const result = await response.json();
        
        if (result.activeCasts.length === 0) {
            activeCastsEl.innerHTML = '<p class="no-active">No active casting sessions</p>';
        } else {
            activeCastsEl.innerHTML = result.activeCasts.map(cast => `
                <div class="active-cast-item">
                    <strong>${cast.deviceName}</strong><br>
                    <small>Host: ${cast.deviceHost}</small>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error updating active casts:', error);
    }
}

// Add log entry
function addLog(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${type}`;
    logEntry.innerHTML = `<span class="timestamp">[${timestamp}]</span> ${message}`;
    
    logsEl.insertBefore(logEntry, logsEl.firstChild);
    
    // Keep only last 50 log entries
    while (logsEl.children.length > 50) {
        logsEl.removeChild(logsEl.lastChild);
    }
}

// Update URL input listener
urlInputEl.addEventListener('input', updateCastButton);

// Periodically update active casts
setInterval(updateActiveCasts, 5000);

// Initialize
connectWebSocket();
updateCastButton();
addLog('Application started', 'info');
