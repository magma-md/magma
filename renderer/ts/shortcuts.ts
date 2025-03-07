import { Browser } from './browser.js';

export class ShortcutManager {
    private browser: Browser;

    constructor(browser: Browser) {
        this.browser = browser;
        this.attachShortcutListeners();
    }

    private attachShortcutListeners(): void {
        document.addEventListener('keydown', (e: KeyboardEvent) => {
            if (document.activeElement?.tagName === 'INPUT') {
                return;
            }

            if (e.ctrlKey) {
                switch (e.key.toLowerCase()) {
                    case 't':
                        e.preventDefault();
                        this.browser.createTab();
                        break;

                    case 'w':
                        e.preventDefault();
                        const activeTabId = this.browser.getActiveTabId();
                        if (activeTabId !== null) {
                            this.browser.closeTab(activeTabId);
                        }
                        break;

                    case 'r':
                        e.preventDefault();
                        const activeWebview = this.browser.getActiveWebview();
                        if (activeWebview) {
                            activeWebview.reload();
                        }
                        break;
                }
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const browser = new Browser();
    new ShortcutManager(browser);
    // Create the first tab after initialization
    browser.createTab();
});
