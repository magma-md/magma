export default class KeyboardShortcuts {
    constructor() {
        this.setupKeyboardShortcuts();
    }

    private setupKeyboardShortcuts(): void {
        document.addEventListener('keydown', (event) => {
            const ctrlOrCmd = event.ctrlKey || event.metaKey;

            if(ctrlOrCmd) {
                switch(event.key.toLowerCase()) {
                    case 'o':
                        event.preventDefault();
                        if (window.fileOperations) {
                            window.fileOperations.openFile();
                        } else {
                            window.api.send('file:open');
                        }
                        break;
                    case 's':
                        event.preventDefault();
                        if(event.shiftKey) {
                            if (window.fileOperations) {
                                window.fileOperations.saveFileAs();
                            } else {
                                window.api.send('file:save-as');
                            }
                        } else {
                            if (window.fileOperations) {
                                window.fileOperations.saveFile();
                            } else {
                                window.api.send('file:save');
                            }
                        }
                        break;
                    case 'n':
                        event.preventDefault();
                        if (window.fileOperations) {
                            window.fileOperations.newFile();
                        } else {
                            window.api.send('file:new');
                        }
                        break;
                }
            }
        });
    }
}
