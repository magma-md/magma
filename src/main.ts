import {
    app,
    BrowserWindow,
    Menu,
    MenuItem,
    MenuItemConstructorOptions,
} from "electron";
import path from "node:path";
import {fileURLToPath} from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
    const win = new BrowserWindow({
        width: 1280,
        height: 768,
        minHeight: 100,
        minWidth: 300,
        webPreferences: {
            preload: path.join(__dirname, "../../dist/backend/preload.js"),
        },
    });

    win.loadFile("renderer/index.html").then();
    return win;
}

app.whenReady().then(() => {
    createWindow();

    app.on("activate", () => {
        if(BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on("window-all-closed", () => {
    if(process.platform !== "darwin") {
        app.quit();
    }
});
