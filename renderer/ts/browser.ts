import { Tab } from './tabs.js';

interface BrowserElements {
    tabList: HTMLElement | null;
    webviewsContainer: HTMLElement | null;
    urlInput: HTMLInputElement | null;
    newTabButton: HTMLElement | null;
    backButton: HTMLElement | null;
    forwardButton: HTMLElement | null;
    reloadButton: HTMLElement | null;
    goButton: HTMLElement | null;
}

export class Browser {
    private tabs: Map<number, Tab>;
    private activeTabId: number | null;
    private tabCounter: number;
    private tabList!: HTMLElement;
    private webviewsContainer!: HTMLElement;
    private urlInput!: HTMLInputElement;
    private newTabButton!: HTMLElement;
    private backButton!: HTMLElement;
    private forwardButton!: HTMLElement;
    private reloadButton!: HTMLElement;
    private goButton!: HTMLElement;

    constructor() {
        this.tabs = new Map();
        this.activeTabId = null;
        this.tabCounter = 0;
        
        this.initializeElements();
        this.attachEventListeners();
    }

    private initializeElements() {
        const elements: BrowserElements = {
            tabList: document.getElementById('tab-list'),
            webviewsContainer: document.getElementById('webviews-container'),
            urlInput: document.getElementById('url') as HTMLInputElement,
            newTabButton: document.getElementById('new-tab'),
            backButton: document.getElementById('back'),
            forwardButton: document.getElementById('forward'),
            reloadButton: document.getElementById('reload'),
            goButton: document.getElementById('go-button')
        };

        for (const [key, element] of Object.entries(elements)) {
            if (!element) {
                throw new Error(`Required element ${key} not found`);
            }
        }

        this.tabList = elements.tabList!;
        this.webviewsContainer = elements.webviewsContainer!;
        this.urlInput = elements.urlInput!;
        this.newTabButton = elements.newTabButton!;
        this.backButton = elements.backButton!;
        this.forwardButton = elements.forwardButton!;
        this.reloadButton = elements.reloadButton!;
        this.goButton = elements.goButton!;
        
        this.webviewsContainer.innerHTML = '';
    }

    private attachEventListeners() {
        this.newTabButton.addEventListener('click', () => this.createTab());
        this.goButton.addEventListener('click', () => this.navigate());
        this.urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.navigate();
        });
        
        this.backButton.addEventListener('click', () => {
            const webview = this.getActiveWebview();
            if (webview) webview.goBack();
        });
        this.forwardButton.addEventListener('click', () => {
            const webview = this.getActiveWebview();
            if (webview) webview.goForward();
        });
        this.reloadButton.addEventListener('click', () => {
            const webview = this.getActiveWebview();
            if (webview) webview.reload();
        });
    }

    createTab() {
        const id = ++this.tabCounter;
        const tab = new Tab(id);
        
        this.tabs.set(id, tab);
        this.tabList.appendChild(tab.element);
        this.webviewsContainer.appendChild(tab.webview);
        
        tab.element.addEventListener('click', (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.classList.contains('close-tab')) {
                this.closeTab(id);
            } else {
                this.activateTab(id);
            }
        });

        tab.webview.addEventListener('dom-ready', () => {
            if (this.activeTabId === id) {
                this.activateTab(id);
            }
        });

        tab.webview.addEventListener('did-start-loading', () => {
            tab.element.classList.add('loading');
        });

        tab.webview.addEventListener('did-stop-loading', () => {
            tab.element.classList.remove('loading');
            const titleSpan = tab.element.querySelector('span');
            if (titleSpan) {
                titleSpan.textContent = tab.webview.getTitle() || 'New Tab';
            }
        });

        if (this.activeTabId) {
            const oldTab = this.tabs.get(this.activeTabId);
            if (oldTab) {
                oldTab.element.classList.remove('bg-zinc-600');
                oldTab.webview.classList.add('hidden');
            }
        }

        tab.element.classList.add('bg-zinc-600');
        tab.webview.classList.remove('hidden');
        this.activeTabId = id;
    }

    activateTab(id: number) {
        if (this.activeTabId) {
            const oldTab = this.tabs.get(this.activeTabId);
            if (oldTab) {
                oldTab.element.classList.remove('bg-zinc-600');
                oldTab.webview.classList.add('hidden');
            }
        }

        const newTab = this.tabs.get(id);
        if (newTab) {
            newTab.element.classList.add('bg-zinc-600');
            newTab.webview.classList.remove('hidden');
            this.activeTabId = id;
            
            // Only try to get URL if webview is ready
            try {
                const url = newTab.webview.getURL();
                this.urlInput.value = url || '';
            } catch (e) {
                // Webview not ready yet, ignore
            }
        }
    }

    closeTab(id: number) {
        const tab = this.tabs.get(id);
        if (tab) {
            tab.element.remove();
            tab.webview.remove();
            this.tabs.delete(id);

            if (this.activeTabId === id) {
                const lastTab = Array.from(this.tabs.keys()).pop();
                if (lastTab) {
                    this.activateTab(lastTab);
                } else {
                    this.createTab();
                }
            }
        }
    }

    navigate() {
        const url = this.urlInput.value;
        const webview = this.getActiveWebview();
        if (webview) {
            try {
                webview.loadURL(this.formatUrl(url));
            } catch (e) {
                console.error('Failed to navigate:', e);
            }
        }
    }

    getActiveWebview() {
        return this.activeTabId ? this.tabs.get(this.activeTabId)?.webview : null;
    }

    getActiveTabId(): number | null {
        return this.activeTabId;
    }

    private formatUrl(url: string): string {
        if (!/^https?:\/\//i.test(url)) {
            return `https://${url}`;
        }
        return url;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Browser();
});
