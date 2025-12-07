/**
 * Handle paste events and convert rich text formatting to markdown
 */
export function handleFormattedPaste(e: React.ClipboardEvent<HTMLTextAreaElement>, currentValue: string, onUpdate: (value: string) => void) {
    // Get clipboard data
    const clipboardData = e.clipboardData;

    // Try to get HTML content (rich text)
    let htmlContent = clipboardData.getData('text/html');

    if (htmlContent) {
        e.preventDefault();

        // Clean up Word/Office HTML garbage
        htmlContent = cleanWordHtml(htmlContent);

        // Parse HTML and convert to markdown-like format
        const converted = convertHtmlToMarkdown(htmlContent);

        // Get cursor position
        const target = e.target as HTMLTextAreaElement;
        const start = target.selectionStart;
        const end = target.selectionEnd;

        // Insert converted text at cursor position
        const newValue = currentValue.substring(0, start) + converted + currentValue.substring(end);
        onUpdate(newValue);

        // Set cursor position after inserted text
        setTimeout(() => {
            target.selectionStart = target.selectionEnd = start + converted.length;
            target.focus();
        }, 0);
    }
    // If no HTML, let default paste happen (plain text)
}

/**
 * Clean up Word/Office HTML to remove CSS and style tags
 */
function cleanWordHtml(html: string): string {
    // Remove style tags and their contents
    html = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

    // Remove XML/Office namespace tags
    html = html.replace(/<\?xml[^>]*>/gi, '');
    html = html.replace(/<\/?o:[^>]*>/gi, '');
    html = html.replace(/<\/?w:[^>]*>/gi, '');
    html = html.replace(/<\/?m:[^>]*>/gi, '');

    // Remove comments
    html = html.replace(/<!--[\s\S]*?-->/g, '');

    // Remove class, style, and mso- attributes
    html = html.replace(/\s*class="[^"]*"/gi, '');
    html = html.replace(/\s*style="[^"]*"/gi, '');
    html = html.replace(/\s*mso-[^=]*="[^"]*"/gi, '');

    // Remove empty spans and divs
    html = html.replace(/<span[^>]*>\s*<\/span>/gi, '');
    html = html.replace(/<div[^>]*>\s*<\/div>/gi, '');

    return html;
}

/**
 * Convert HTML to markdown-like format
 */
function convertHtmlToMarkdown(html: string): string {
    // Create a temporary div to parse HTML
    const temp = document.createElement('div');
    temp.innerHTML = html;

    // Get all paragraphs
    const paragraphs = Array.from(temp.querySelectorAll('p'));

    if (paragraphs.length === 0) {
        // No paragraphs, process normally
        return processNode(temp).replace(/\n{3,}/g, '\n\n').trim();
    }

    const lines: string[] = [];
    let currentLine = '';

    for (let i = 0; i < paragraphs.length; i++) {
        const p = paragraphs[i];
        const text = processNode(p).trim();

        if (!text) continue;

        // Check if paragraph starts with bold (new category)
        const firstChild = p.firstChild;
        let startsWithBold = false;

        if (firstChild) {
            if (firstChild.nodeType === Node.ELEMENT_NODE) {
                const elem = firstChild as HTMLElement;
                startsWithBold = elem.tagName === 'STRONG' || elem.tagName === 'B';
            }
        }

        if (startsWithBold) {
            // New category - save previous and start new
            if (currentLine.trim()) {
                lines.push(currentLine.trim());
            }
            currentLine = text;
        } else {
            // Continuation - merge with space
            if (currentLine) {
                // Add space if current line doesn't end with space and new text doesn't start with space
                const needsSpace = !currentLine.endsWith(' ') && !text.startsWith(' ');
                currentLine += (needsSpace ? ' ' : '') + text;
            } else {
                currentLine = text;
            }
        }
    }

    // Add final line
    if (currentLine.trim()) {
        lines.push(currentLine.trim());
    }

    return lines.join('\n');
}

/**
 * Process HTML nodes recursively
 */
function processNode(node: Node): string {
    let result = '';

    if (node.nodeType === Node.TEXT_NODE) {
        // Preserve the text as-is
        return node.textContent || '';
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        const tagName = element.tagName.toLowerCase();

        // Get text content of children
        let childContent = '';
        node.childNodes.forEach(child => {
            childContent += processNode(child);
        });

        // Handle different tags
        switch (tagName) {
            case 'strong':
            case 'b':
                return `**${childContent}**`;

            case 'em':
            case 'i':
                return `*${childContent}*`;

            case 'br':
                return ' ';  // Convert BR to space, not newline

            case 'p':
            case 'div':
                // Don't add newlines here - handled in convertHtmlToMarkdown
                return childContent;

            case 'li':
                return `• ${childContent}`;

            case 'ul':
            case 'ol':
                return childContent;

            case 'span':
                return childContent;

            default:
                return childContent;
        }
    }

    return result;
}
