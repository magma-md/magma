import { app, BrowserWindow, Menu, MenuItem, MenuItemConstructorOptions } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function createMenu() {
    const isMac = process.platform === 'darwin';
    const template: MenuItemConstructorOptions[] = [
        ...(isMac
            ? [{
                label: app.name,
                submenu: [
                    { role: 'about' as const },
                    { type: 'separator' as const },
                    { role: 'quit' as const }
                ]
            }]
            : []),
        {
            label: 'View',
            submenu: [
                { role: 'reload' as const },
                { role: 'forceReload' as const },
                {
                    label: 'Inspect Element',
                    accelerator: isMac ? 'Alt+Command+I' : 'Ctrl+Shift+I',
                    click: (_, browserWindow) => {
                        if (browserWindow instanceof BrowserWindow) {
                            browserWindow.webContents.openDevTools();
                        }
                    }
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

function createWindow() {
    const win = new BrowserWindow({
        width: 1280,
        height: 768,
        minHeight: 100,
        minWidth: 300,
        webPreferences: {
            preload: path.join(__dirname, 'dist/backend/preload.js'),
            webviewTag: true
        }
    })

    win.loadFile('renderer/index.html').then()
    return win;
}

app.whenReady().then(() => {
    createWindow()
    createMenu()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})
