interface MarkdownRule {
    pattern: RegExp;
    replacement: (match: string, ...args: string[]) => string;
}