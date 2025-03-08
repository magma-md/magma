interface Window {
    electron: {
        openExternal: (url: string) => Promise<void>;
    };
}
