export default class CustomMenu {
    private handlers: Map<string, () => void> = new Map();

    constructor() {
        this.initializeWhenReady();
    }

    private initializeWhenReady(): void {
        if(document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.init();
            });
        } else {
            setTimeout(() => this.init(), 100);
        }
    }

    private init(): void {
        console.log('CustomMenu initializing...');

        this.registerHandlers();
        this.setupDropdowns();
        this.setupGlobalClickHandler();

        console.log('CustomMenu initialized');
    }

    private registerHandlers(): void {
        this.handlers.set('toggle-preview', () => {
            const previewButton = document.getElementById('preview-button');
            if(previewButton) {
                previewButton.click();
            }
        });

        this.handlers.set('quit', () => {
            if(window.api) {
                window.api.send('app:quit');
            }
        });

        this.handlers.set('undo', () => document.execCommand('undo'));
        this.handlers.set('redo', () => document.execCommand('redo'));
        this.handlers.set('cut', () => document.execCommand('cut'));
        this.handlers.set('copy', () => document.execCommand('copy'));
        this.handlers.set('paste', () => document.execCommand('paste'));
        this.handlers.set('select-all', () => document.execCommand('selectAll'));

        this.handlers.set('zoom-in', () => {
            if(window.api) {
                window.api.send('app:zoom-in');
            }
        });

        this.handlers.set('zoom-out', () => {
            if(window.api) {
                window.api.send('app:zoom-out');
            }
        });

        this.handlers.set('reset-zoom', () => {
            if(window.api) {
                window.api.send('app:reset-zoom');
            }
        });

        this.handlers.set('toggle-fullscreen', () => {
            if(window.api) {
                window.api.send('app:toggle-fullscreen');
            }
        });

        this.handlers.set('new-file', () => {
            if(window.fileOperations) {
                window.fileOperations.newFile();
            } else if(window.api) {
                window.api.send('file:new');
            }
        });

        this.handlers.set('open-file', () => {
            if(window.fileOperations) {
                window.fileOperations.openFile();
            } else if(window.api) {
                window.api.send('file:open');
            }
        });

        this.handlers.set('save-file', () => {
            if(window.fileOperations) {
                window.fileOperations.saveFile();
            } else if(window.api) {
                window.api.send('file:save');
            }
        });

        this.handlers.set('save-as', () => {
            if(window.fileOperations) {
                window.fileOperations.saveFileAs();
            } else if(window.api) {
                window.api.send('file:save-as');
            }
        });

        this.handlers.set('preferences', () => {
            if(window.api) {
                window.api.send('app:preferences');
            }
        });
    }

    private setupDropdowns(): void {
        const fileMenu = document.getElementById('file-menu');
        const editMenu = document.getElementById('edit-menu');
        const viewMenu = document.getElementById('view-menu');

        if(fileMenu) {
            fileMenu.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleDropdown('file-dropdown');
            });
        }

        if(editMenu) {
            editMenu.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleDropdown('edit-dropdown');
            });
        }

        if(viewMenu) {
            viewMenu.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleDropdown('view-dropdown');
            });
        }

        const dropdownItems = document.querySelectorAll('.dropdown-item');
        dropdownItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const handler = this.handlers.get(item.id);
                if(handler) {
                    handler();
                }
                this.closeAllDropdowns();
            });
        });

        console.log('Dropdown setup complete. Found', dropdownItems.length, 'dropdown items');
    }

    private toggleDropdown(dropdownId: string): void {
        const dropdown = document.getElementById(dropdownId);
        if(!dropdown) {
            console.log('Dropdown not found:', dropdownId);
            return;
        }

        const isVisible = dropdown.style.display === 'block';
        this.closeAllDropdowns();

        if(!isVisible) {
            dropdown.style.display = 'block';
            console.log('Showing dropdown:', dropdownId);
        }
    }

    private closeAllDropdowns(): void {
        const dropdowns = document.querySelectorAll('.dropdown-content');
        dropdowns.forEach(dropdown => {
            (dropdown as HTMLElement).style.display = 'none';
        });
    }

    private setupGlobalClickHandler(): void {
        document.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            if(!target.closest('.dropdown')) {
                this.closeAllDropdowns();
            }
        });
    }
}