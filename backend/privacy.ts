import { app, session, BrowserWindow } from 'electron';

const AD_PATTERNS = [
    "adserver.com",
    "doubleclick.net",
    "ads", 
    "banner"
];

app.on('ready', () => {
    const filter = { urls: ["*://*/*"] };
    session.defaultSession.webRequest.onBeforeRequest(filter, (details, callback) => {
        const cancel = AD_PATTERNS.some(pattern => details.url.includes(pattern));

        if (cancel) {
            console.log("Blocking ad request: ", details.url);
            callback({ cancel: true });
        } else {
            callback({ cancel: false });
        }
    });

    const win = new BrowserWindow({
        webPreferences: {
            preload: __dirname + "/backend/preload.js",
            webviewTag: true
        }
    });
    win.loadURL("https://example.com");
});
