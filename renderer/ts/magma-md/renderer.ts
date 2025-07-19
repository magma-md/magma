class MagmaRenderer {
    private rules: MarkdownRule[] = [
        // headings
        {
            pattern: /^(#{1,6})\s(.+)$/gm,
            replacement: (_, hashes, content) => {
                const sizes = {
                    1: 'text-4xl',
                    2: 'text-3xl',
                    3: 'text-2xl',
                    4: 'text-xl',
                    5: 'text-lg',
                    6: 'text-base'
                };
                return `<h${hashes.length} class="font-bold ${sizes[hashes.length as keyof typeof sizes]} mb-4 mt-6">${content}</h${hashes.length}>`;
            }
        },
        // code blocks - must come before inline code
        {
            pattern: /^```([\s\S]*?)```$/gm,
            replacement: (_, content) => {
                const firstNewline = content.indexOf('\n');
                const language = firstNewline > -1 ? content.slice(0, firstNewline).trim() : '';
                const actualContent = firstNewline > -1 ? content.slice(firstNewline + 1) : content;
                const escapedContent = actualContent
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#039;')
                    .trim();

                return [
                    `<pre class="bg-zinc-900 rounded relative px-2 py-0.5 border border-zinc-800">`,
                    `<code class="font-mono text-sm leading-4 whitespace-pre block ${language ? `language-${language}` : ''}">${escapedContent}</code>`,
                    language ? `<span class="absolute right-1 top-0.5 text-xs font-mono text-zinc-500 bg-zinc-800 rounded-sm px-1">${language}</span>` : '',
                    '</pre>'
                ].join('');
            }
        },
        // bold
        {
            pattern: /\*\*(.+?)\*\*/g,
            replacement: (_, content) => `<strong class="font-bold">${content}</strong>`
        },
        // italic
        {
            pattern: /\*(.+?)\*/g,
            replacement: (_, content) => `<em class="italic">${content}</em>`
        },
        // strikethrough
        {
            pattern: /~~(.+?)~~/g,
            replacement: (_, content) => `<s class="line-through">${content}</s>`
        },
        // inline code
        {
            pattern: /`(.+?)`/g,
            replacement: (_, content) => `<code class="bg-zinc-800 rounded px-1 py-0.5 font-mono text-sm">${content}</code>`
        },
        // link(s)
        {
            pattern: /\[(.+?)]\((.+?)\)/g,
            replacement: (_, text, url) => {
                const escapedUrl = url.replace(/'/g, "\\'");
                return `<a href="${url}" class="text-orange-500 hover:text-orange-400 underline" onclick="event.preventDefault(); window.electron?.openExternal('${escapedUrl}');">${text}</a>
                `.trim();
            }
        },
        // image(s)
        {
            pattern: /!\[(.+?)]\((.+?)\)/g,
            replacement: (_, alt, src) => `<img src="${src}" alt="${alt}" class="max-w-full h-auto rounded-lg my-4">`
        },
        // list
        {
            pattern: /^[-*]\s(.+)$/gm,
            replacement: (_, content) => `<li class="ml-4 list-disc list-inside mb-1">${content}</li>`
        },
        // numbered lists
        {
            pattern: /^\d+[.)]\s(.+)$/gm,
            replacement: (_, content) => `<li class="ml-4 list-decimal list-inside mb-1">${content}</li>`
        },
        // blockquotes
        {
            pattern: /^>\s(.+)$/gm,
            replacement: (_, content) => `<blockquote class="border-l-4 border-orange-500 pl-4 my-4 italic">${content}</blockquote>`
        },
        // horizontal rules
        {
            pattern: /^([-*_]){3,}$/gm,
            replacement: () => '<hr class="my-8 border-t border-zinc-700">'
        }
    ];

    render(contents: string): string {
        let html = contents;
        
        for(const rule of this.rules) {
            html = html.replace(rule.pattern, (...args) => rule.replacement(...args));
        }

        html = html.replace(
            /^(?!<[a-z])[^<\n].+/gm, match => `<p class="mb-4 leading-relaxed">${match}</p>`
        );
        
        return html;
    }
}

export default MagmaRenderer;
