const { contextBridge, shell, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    openExternal: (url) => shell.openExternal(url)
});

// Expose IPC API to renderer process
contextBridge.exposeInMainWorld('api', {
    send: (channel, ...args) => {
        // Whitelist channels
        const validChannels = [
            'app:minimize', 
            'app:maximize', 
            'app:close', 
            'app:quit',
            'app:toggle-fullscreen',
            'app:zoom-in',
            'app:zoom-out',
            'app:reset-zoom',
            'file:new',
            'file:open',
            'file:save',
            'file:save-as',
            'app:preferences',
            'display-app-menu'
        ];
        
        if (validChannels.includes(channel)) {
            ipcRenderer.send(channel, ...args);
        }
    },
    receive: (channel, func) => {
        // Whitelist channels
        const validChannels = [
            'file:opened',
            'file:saved',
            'file:save-as-requested',
            'file:tab-changed',
            'file:tab-closed',
            'menu:open-file',
            'menu:save-file',
            'menu:save-file-as'
        ];
        
        if (validChannels.includes(channel)) {
            ipcRenderer.on(channel, (event, ...args) => func(...args));
        }
    }
});
