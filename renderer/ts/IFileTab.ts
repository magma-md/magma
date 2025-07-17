interface FileTab {
    id: string;
    filePath: string | null;
    content: string;
    isModified: boolean;
    isActive: boolean;
}