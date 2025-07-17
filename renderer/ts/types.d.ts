interface Window {
    electron: {
        openExternal: (url: string) => Promise<void>;
    };
    api: {
        send: (channel: string, ...args: any[]) => void;
        receive: (channel: string, func: (...args: any[]) => void) => void;
    };
    fileOperations: {
        newFile: () => void;
        openFile: () => void;
        saveFile: () => void;
        saveFileAs: () => void;
    };
}
