import MagmaRenderer from "./magma-md/renderer.js";
import CustomMenu from "./Menu.js";
import KeyboardShortcuts from "./Keyboard.js";

document.addEventListener("DOMContentLoaded", () => {
    const editor = document.getElementById("editor") as HTMLTextAreaElement;
    const previewElement = document.getElementById("preview") as HTMLElement;
    const previewButton = document.getElementById("preview-button");
    const tabsContainer = document.getElementById("tabs") as HTMLElement;
    const sidebarElement = document.getElementById("sidebar") as HTMLElement;
    const renderer = new MagmaRenderer();
    let isPreview = false;

    const tabs: FileTab[] = [];
    let activeTabId: string | null = null;
    const MAX_RECENT_FILES = 10;
    let recentFiles: string[] = loadRecentFiles();

    new CustomMenu();
    new KeyboardShortcuts();

    if(!editor || !previewButton || !previewElement || !tabsContainer || !sidebarElement) return;

    previewElement.hidden = true;
    editor.hidden = false;

    initWindowControls();
    initFileHandlers();
    renderRecentFiles();

    createNewTab();

    previewButton.addEventListener("click", (event) => {
        event.preventDefault();
        togglePreview();
    });

    editor.addEventListener("input", () => {
        if(activeTabId) {
            const tab = tabs.find(t => t.id === activeTabId);
            if(tab && tab.content !== editor.value) {
                tab.content = editor.value;
                tab.isModified = true;
                updateTabElement(tab);
            }
        }
    });

    function togglePreview() {
        isPreview = !isPreview;

        editor.hidden = isPreview;
        previewElement.hidden = !isPreview;

        if(isPreview) {
            const contents = editor.value;
            if(!contents) {
                previewElement.innerHTML = '';
                return;
            }

            previewElement.innerHTML = renderer.render(contents);
        }
    }

    function initWindowControls() {
        const minimizeButton = document.getElementById('minimize-button');
        const maximizeButton = document.getElementById('maximize-button');
        const closeButton = document.getElementById('close-button');
        const buttonError = !minimizeButton || !maximizeButton || !closeButton;

        if(buttonError) return;

        minimizeButton.addEventListener('click', () => {
            window.api.send('app:minimize');
        });

        maximizeButton.addEventListener('click', () => {
            window.api.send('app:maximize');
        });

        closeButton.addEventListener('click', () => {
            window.api.send('app:close');
        });
    }

    function initFileHandlers() {
        window.api.receive('file:opened', (data: { filePath: string | null, content: string }) => {
            const {filePath, content} = data;

            if(filePath) {
                const existingTab = tabs.find(tab => tab.filePath === filePath);
                if(existingTab) {
                    setActiveTab(existingTab.id);
                    return;
                }

                addToRecentFiles(filePath);
                renderRecentFiles();
            }

            const newTab = createNewTab(filePath, content);
            setActiveTab(newTab.id);
        });

        window.api.receive('file:not-found', (data: { filePath: string }) => {
            const {filePath} = data;

            const dialog = document.createElement('div');
            dialog.className = 'fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50';

            const dialogContent = document.createElement('div');
            dialogContent.className = 'bg-zinc-900 p-6 rounded-lg shadow-lg max-w-md w-full';

            const title = document.createElement('h3');
            title.className = 'text-xl font-bold text-orange-500 mb-4';
            title.textContent = 'File cannot be found!';

            const message = document.createElement('p');
            message.className = 'text-gray-300 mb-6';
            message.textContent = `The file "${filePath.split('/').pop()}" could not be found at the specified location.`;

            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'flex justify-end space-x-4';

            const keepButton = document.createElement('button');
            keepButton.className = 'px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700';
            keepButton.textContent = 'Keep in Recents';
            keepButton.addEventListener('click', () => {
                document.body.removeChild(dialog);
            });

            const removeButton = document.createElement('button');
            removeButton.className = 'px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700';
            removeButton.textContent = 'Remove From Recents';
            removeButton.addEventListener('click', () => {
                recentFiles = recentFiles.filter(path => path !== filePath);
                saveRecentFiles();
                renderRecentFiles();

                document.body.removeChild(dialog);
            });

            const locateButton = document.createElement('button');
            locateButton.className = 'px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700';
            locateButton.textContent = 'Locate File';
            locateButton.addEventListener('click', () => {
                window.api.send('file:locate', {filePath});
                document.body.removeChild(dialog);
            });

            buttonContainer.appendChild(keepButton);
            buttonContainer.appendChild(removeButton);
            buttonContainer.appendChild(locateButton);

            dialogContent.appendChild(title);
            dialogContent.appendChild(message);
            dialogContent.appendChild(buttonContainer);
            dialog.appendChild(dialogContent);

            document.body.appendChild(dialog);

            if(document.body.contains(dialog)) {
                recentFiles = recentFiles.filter(path => path !== filePath);
                saveRecentFiles();
                renderRecentFiles();
                document.body.removeChild(dialog);
            }
        });

        window.api.receive('file:located', (data: { oldFilePath: string, newFilePath: string, content: string }) => {
            const {oldFilePath, newFilePath, content} = data;

            recentFiles = recentFiles.filter(path => path !== oldFilePath);

            addToRecentFiles(newFilePath);

            renderRecentFiles();

            const newTab = createNewTab(newFilePath, content);
            setActiveTab(newTab.id);
        });

        window.api.receive('file:saved', (data: { filePath: string, success: boolean, error?: string }) => {
            if(data.success && activeTabId) {
                const tab = tabs.find(t => t.id === activeTabId);
                if(tab) {
                    tab.filePath = data.filePath;
                    tab.isModified = false;
                    updateTabElement(tab);

                    addToRecentFiles(data.filePath);
                    renderRecentFiles();
                }
            } else if(data.error) {
                alert(`Error saving file: ${data.error}`);
            }
        });

        window.api.receive('file:save-as-requested', (data: { content: string }) => {
            window.api.send('file:save-as', {content: data.content});
        });

        window.api.receive('menu:open-file', () => {
            window.fileOperations.openFile();
        });

        window.api.receive('menu:save-file', () => {
            window.fileOperations.saveFile();
        });

        window.api.receive('menu:save-file-as', () => {
            window.fileOperations.saveFileAs();
        });
    }

    function createNewTab(filePath: string | null = null, content: string = ''): FileTab {
        const tabId = 'tab-' + Date.now();
        const newTab: FileTab = {
            id: tabId,
            filePath,
            content,
            isModified: false,
            isActive: false
        };

        tabs.push(newTab);
        createTabElement(newTab);
        setActiveTab(tabId);

        return newTab;
    }

    function createTabElement(tab: FileTab) {
        const tabElement = document.createElement('div');
        tabElement.className = 'tab flex items-center px-3 py-1 border-r border-orange-700 cursor-pointer hover:bg-zinc-800';
        tabElement.dataset.tabId = tab.id;

        const tabName = document.createElement('span');
        tabName.className = 'tab-name';
        tabName.textContent = getTabName(tab);

        const closeButton = document.createElement('span');
        closeButton.className = 'close-tab ml-2 px-1 hover:bg-zinc-700 rounded';
        closeButton.innerHTML = '&times;';
        closeButton.addEventListener('click', (e) => {
            e.stopPropagation();
            closeTab(tab.id);
        });

        tabElement.appendChild(tabName);
        tabElement.appendChild(closeButton);

        tabElement.addEventListener('click', () => {
            setActiveTab(tab.id);
        });

        tabsContainer.appendChild(tabElement);
    }

    function updateTabElement(tab: FileTab) {
        const tabElement = tabsContainer.querySelector(`[data-tab-id="${tab.id}"]`);
        if(tabElement) {
            const tabName = tabElement.querySelector('.tab-name');
            if(tabName) {
                tabName.textContent = getTabName(tab);
            }

            if(tab.isActive) {
                tabElement.classList.add('active');
            } else {
                tabElement.classList.remove('active');
            }
        }
    }

    function getTabName(tab: FileTab): string {
        let name = tab.filePath ? tab.filePath.split('/').pop() || 'Untitled' : 'Untitled';
        if(tab.isModified) {
            name += ' *';
        }
        return name;
    }

    function setActiveTab(tabId: string) {
        if(activeTabId) {
            const currentTab = tabs.find(t => t.id === activeTabId);
            if(currentTab) {
                currentTab.isActive = false;
                updateTabElement(currentTab);
            }
        }

        const newActiveTab = tabs.find(t => t.id === tabId);
        if(newActiveTab) {
            newActiveTab.isActive = true;
            activeTabId = tabId;
            updateTabElement(newActiveTab);

            editor.value = newActiveTab.content;

            if(isPreview) {
                previewElement.innerHTML = renderer.render(newActiveTab.content);
            }
        }
    }

    function closeTab(tabId: string) {
        const tabIndex = tabs.findIndex(t => t.id === tabId);
        if(tabIndex === -1) return;

        const tab = tabs[tabIndex];

        if(tab.isModified) {
            const confirmClose = confirm('This file has unsaved changes. Do you want to close it anyway?');
            if(!confirmClose) return;
        }

        const tabElement = tabsContainer.querySelector(`[data-tab-id="${tabId}"]`);
        if(tabElement) {
            tabElement.remove();
        }

        tabs.splice(tabIndex, 1);

        if(tabId === activeTabId) {
            if(tabs.length > 0) {
                const newActiveIndex = tabIndex < tabs.length ? tabIndex : tabs.length - 1;
                setActiveTab(tabs[newActiveIndex].id);
            } else {
                createNewTab();
            }
        }
    }

    function saveCurrentTab() {
        if(!activeTabId) return;

        const tab = tabs.find(t => t.id === activeTabId);
        if(!tab) return;

        window.api.send('file:save', {
            filePath: tab.filePath,
            content: tab.content
        });
    }

    function loadRecentFiles(): string[] {
        const recentFilesJson = localStorage.getItem('recentFiles');
        return recentFilesJson ? JSON.parse(recentFilesJson) : [];
    }

    function saveRecentFiles() {
        localStorage.setItem('recentFiles', JSON.stringify(recentFiles));
    }

    function addToRecentFiles(filePath: string) {
        recentFiles = recentFiles.filter(path => path !== filePath);

        recentFiles.unshift(filePath);

        if(recentFiles.length > MAX_RECENT_FILES) {
            recentFiles = recentFiles.slice(0, MAX_RECENT_FILES);
        }

        saveRecentFiles();
    }

    function renderRecentFiles() {
        sidebarElement.innerHTML = '<h3 class="text-orange-500 font-bold px-2 py-3">Recent Files</h3>';

        if(recentFiles.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'text-gray-500 italic px-2';
            emptyMessage.textContent = 'No recent files';
            sidebarElement.appendChild(emptyMessage);
            return;
        }

        const recentFilesList = document.createElement('div');
        recentFilesList.className = 'recent-files';

        recentFiles.forEach(filePath => {
            const fileItem = document.createElement('div');
            fileItem.className = 'recent-file px-2 py-1 hover:bg-zinc-800 cursor-pointer truncate';
            fileItem.title = filePath;

            fileItem.textContent = filePath.split('/').pop() || filePath;

            fileItem.addEventListener('click', () => {
                window.api.send('file:open', {filePath});
            });

            recentFilesList.appendChild(fileItem);
        });

        sidebarElement.appendChild(recentFilesList);
    }

    window.fileOperations = {
        newFile: () => createNewTab(),
        openFile: () => window.api.send('file:open'),
        saveFile: saveCurrentTab,
        saveFileAs: () => {
            if(!activeTabId) return;
            const tab = tabs.find(t => t.id === activeTabId);
            if(tab) {
                window.api.send('file:save-as', {content: tab.content});
            }
        }
    };
});
