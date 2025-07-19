import {app, BrowserWindow, ipcMain} from "electron";
import path from "node:path";
import {fileURLToPath} from "node:url";
import process from "node:process";
import {createApplicationMenu} from "./Menu.js";
import IoUtility from "@utilities/IoUtility";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1280,
        height: 768,
        minHeight: 300,
        minWidth: 600,
        webPreferences: {
            preload: path.join(__dirname, "../../backend/preload.cjs"),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false,
            webviewTag: false
        },
        frame: false,
        roundedCorners: true,
        transparent: true
    });

    createApplicationMenu(mainWindow);

    mainWindow.loadFile("renderer/index.html").then();

    mainWindow.webContents.on('before-input-event', (_, input) => {
        if(input.control && input.shift && input.key.toLowerCase() === 'i') {
            mainWindow.webContents.openDevTools();
        }
    });

    app.on("window-all-closed", () => {
        if(process.platform === "darwin") return;

        app.quit();
    });

    ipcMain.on('app:minimize', () => {
        if(!mainWindow) return;

        mainWindow.minimize();
    });

    ipcMain.on('app:maximize', () => {
        if(!mainWindow) return;

        if(mainWindow.isMaximized()) {
            mainWindow.unmaximize();
        } else {
            mainWindow.maximize();
        }
    });

    ipcMain.on('app:close', () => {
        if(!mainWindow) return;

        mainWindow.close();
    });

    ipcMain.on('app:quit', () => {
        app.quit();
    });

    ipcMain.on('app:toggle-fullscreen', () => {
        if(!mainWindow) return;

        mainWindow.setFullScreen(!mainWindow.isFullScreen());
    });

    ipcMain.on('app:zoom-in', () => {
        if(!mainWindow) return;

        const currentZoom = mainWindow.webContents.getZoomFactor();
        mainWindow.webContents.setZoomFactor(currentZoom + 0.1);
    });

    ipcMain.on('app:zoom-out', () => {
        if(!mainWindow) return;

        const currentZoom = mainWindow.webContents.getZoomFactor();
        mainWindow.webContents.setZoomFactor(Math.max(0.1, currentZoom - 0.1));
    });

    ipcMain.on('app:reset-zoom', () => {
        if(!mainWindow) return;

        mainWindow.webContents.setZoomFactor(1.0);
    });

    ipcMain.on('file:new', () => {
        mainWindow.webContents.send('file:opened', {filePath: null, content: ''});
    });

    ipcMain.on('file:open', async(_, args) => {
        try {
            if(args && args.filePath) {
                const filePath = args.filePath;

                const fs = require('fs');
                if(!fs.existsSync(filePath)) {
                    mainWindow.webContents.send('file:not-found', {filePath});
                    return;
                }

                try {
                    const content = await IoUtility.readFile(filePath);
                    mainWindow.webContents.send('file:opened', {filePath, content});
                } catch(error) {
                    console.error('Error opening specific file:', error);
                }
                return;
            }

            const filePaths = await IoUtility.promptOpen({
                properties: ['openFile'],
                filters: [
                    {name: 'Markdown', extensions: ['md', 'markdown']},
                    {name: 'Text', extensions: ['txt']},
                    {name: 'All Files', extensions: ['*']}
                ]
            });

            if(filePaths && filePaths.length > 0) {
                const filePath = filePaths[0];
                const content = await IoUtility.readFile(filePath);
                mainWindow.webContents.send('file:opened', {filePath, content});
            }
        } catch(error) {
            console.error('Error opening file:', error);
        }
    });

    ipcMain.on('file:save', async(_, {filePath, content}) => {
        try {
            if(!filePath) {
                mainWindow.webContents.send('file:save-as-requested', {content});
                return;
            }

            await IoUtility.writeFile(filePath, content);
            mainWindow.webContents.send('file:saved', {filePath, success: true});
        } catch(error) {
            console.error('Error saving file:', error);
            if(error instanceof Error)
                mainWindow.webContents.send('file:saved', {filePath, success: false, error: error.message});
            else
                mainWindow.webContents.send('file:saved', {filePath, success: false, error: error});
        }
    });

    ipcMain.on('file:save-as', async(_, {content}) => {
        try {
            const filePath = await IoUtility.promptSave({
                filters: [
                    {name: 'Markdown', extensions: ['md']},
                    {name: 'Text', extensions: ['txt']},
                    {name: 'All Files', extensions: ['*']}
                ]
            });

            if(filePath) {
                await IoUtility.writeFile(filePath, content);
                mainWindow.webContents.send('file:saved', {filePath, success: true});
            }
        } catch(error) {
            console.error('Error saving file:', error);
            if(!error) return;

            if(error instanceof Error)
                mainWindow.webContents.send('file:saved', {success: false, error: error.message});
            else
                mainWindow.webContents.send('file:saved', {success: false, error: error});
        }
    });

    ipcMain.on('app:preferences', () => {
        // todo: add preferences
    });

    ipcMain.on('file:locate', async(_, {filePath}) => {
        try {
            const filePaths = await IoUtility.promptOpen({
                properties: ['openFile'],
                filters: [
                    {name: 'Markdown', extensions: ['md', 'markdown']},
                    {name: 'Text', extensions: ['txt']},
                    {name: 'All Files', extensions: ['*']}
                ]
            });

            if(filePaths && filePaths.length > 0) {
                const newFilePath = filePaths[0];
                const content = await IoUtility.readFile(newFilePath);

                mainWindow.webContents.send('file:located', {
                    oldFilePath: filePath,
                    newFilePath,
                    content
                });
            }
        } catch(error) {
            console.error('Error locating file:', error);
        }
    });

    return mainWindow;
}

app.whenReady().then(() => {
    createWindow();

    app.on("activate", () => {
        if(BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
