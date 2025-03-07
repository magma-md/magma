export interface TabInterface {
    id: number;
    url: string;
    webview: Electron.WebviewTag;
    element: HTMLDivElement;
}

export class Tab implements TabInterface {
    id: number;
    url: string;
    webview: Electron.WebviewTag;
    element: HTMLDivElement;

    constructor(id: number, url: string = 'https://mi.fly.dev') {
        this.id = id;
        this.url = url;
        this.webview = this.createWebview(url);
        this.element = this.createTabElement();
    }

    private createWebview(url: string): Electron.WebviewTag {
        const webview = document.createElement('webview') as Electron.WebviewTag;
        webview.setAttribute('src', url);
        webview.className = 'w-full h-full border-none hidden';
        webview.id = `webview-${this.id}`;
    
        webview.addEventListener('dom-ready', () => {
            console.log('Webview dom-ready');
            webview.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                console.log('Right-click detected, opening devTools');
                webview.openDevTools();
            });
        });
    
        return webview;
    }

    private createTabElement(): HTMLDivElement {
        const tab = document.createElement('div');
        tab.className = `flex items-center px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded mr-1
                         cursor-pointer transition-colors duration-200`;
        tab.innerHTML = `
            <span class="mr-2">New Tab</span>
            <button class="close-tab">&times;</button>
        `;
        return tab;
    }
}
