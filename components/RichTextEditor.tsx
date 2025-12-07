'use client';

import { useRef, useEffect } from 'react';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    minHeight?: string;
}

export default function RichTextEditor({ value, onChange, placeholder, className, minHeight = '150px' }: RichTextEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const isUpdatingRef = useRef(false);

    // Convert markdown-like format to HTML for display
    const markdownToHtml = (text: string): string => {
        if (!text) return '';

        // Split by lines
        const lines = text.split('\n');

        return lines.map(line => {
            // Convert **text** to <strong>text</strong>
            let html = line.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
            // Convert *text* to <em>text</em>
            html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
            return html;
        }).join('<br>');
    };

    // Convert HTML back to markdown-like format
    const htmlToMarkdown = (html: string): string => {
        // Create temp element
        const temp = document.createElement('div');
        temp.innerHTML = html;

        const lines: string[] = [];
        let currentLine = '';

        const processNode = (node: Node) => {
            if (node.nodeType === Node.TEXT_NODE) {
                currentLine += node.textContent || '';
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                const elem = node as HTMLElement;
                const tag = elem.tagName.toLowerCase();

                switch (tag) {
                    case 'strong':
                    case 'b':
                        currentLine += '**';
                        node.childNodes.forEach(child => processNode(child));
                        currentLine += '**';
                        break;
                    case 'em':
                    case 'i':
                        currentLine += '*';
                        node.childNodes.forEach(child => processNode(child));
                        currentLine += '*';
                        break;
                    case 'br':
                        // Only break on actual BR tags (user pressed Enter)
                        if (currentLine.trim()) {
                            lines.push(currentLine.trim());
                        }
                        currentLine = '';
                        break;
                    case 'div':
                        // Process children first
                        node.childNodes.forEach(child => processNode(child));
                        // Only create new line if this div actually has a BR or is followed by another div
                        // Otherwise, just continue the current line
                        break;
                    case 'p':
                        // Paragraphs from Word - don't break unless it's a new category
                        node.childNodes.forEach(child => processNode(child));
                        // Don't auto-break - let text flow naturally
                        break;
                    default:
                        node.childNodes.forEach(child => processNode(child));
                }
            }
        };

        temp.childNodes.forEach(node => processNode(node));

        // Add any remaining text as final line
        if (currentLine.trim()) {
            lines.push(currentLine.trim());
        }

        // If only one line, return it directly
        return lines.length === 1 ? lines[0] : lines.join('\n');
    };

    // Update editor content when value changes externally
    useEffect(() => {
        if (editorRef.current && !isUpdatingRef.current) {
            const html = markdownToHtml(value);
            if (editorRef.current.innerHTML !== html) {
                editorRef.current.innerHTML = html;
            }
        }
    }, [value]);

    const handleInput = () => {
        if (editorRef.current) {
            isUpdatingRef.current = true;
            const markdown = htmlToMarkdown(editorRef.current.innerHTML);
            onChange(markdown);
            setTimeout(() => {
                isUpdatingRef.current = false;
            }, 0);
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();

        // Get HTML from clipboard
        const html = e.clipboardData.getData('text/html');

        if (html) {
            // Clean and insert HTML
            const cleaned = cleanPastedHtml(html);
            document.execCommand('insertHTML', false, cleaned);
        } else {
            // Plain text fallback
            const text = e.clipboardData.getData('text/plain');
            document.execCommand('insertText', false, text);
        }
    };

    const cleanPastedHtml = (html: string): string => {
        // Remove style tags
        html = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
        // Remove comments
        html = html.replace(/<!--[\s\S]*?-->/g, '');
        // Remove Office namespace tags
        html = html.replace(/<\/?[owm]:[^>]*>/gi, '');
        // Remove class and style attributes
        html = html.replace(/\s*(class|style|mso-[^=]*)="[^"]*"/gi, '');

        // Parse HTML
        const temp = document.createElement('div');
        temp.innerHTML = html;

        // Get all paragraphs
        const paragraphs = Array.from(temp.querySelectorAll('p'));

        if (paragraphs.length > 0) {
            const result: string[] = [];
            let currentLine = '';

            paragraphs.forEach((p) => {
                // Check if paragraph starts with bold
                const firstChild = p.firstChild;
                let startsWithBold = false;

                if (firstChild && firstChild.nodeType === Node.ELEMENT_NODE) {
                    const elem = firstChild as HTMLElement;
                    startsWithBold = elem.tagName === 'STRONG' || elem.tagName === 'B';
                }

                const text = p.innerHTML.trim();

                if (!text) return;

                if (startsWithBold && currentLine) {
                    // New category - save previous line and start new
                    result.push(currentLine);
                    currentLine = text;
                } else if (currentLine) {
                    // Continuation - add space
                    currentLine += ' ' + text;
                } else {
                    // First line
                    currentLine = text;
                }
            });

            // Add last line
            if (currentLine) {
                result.push(currentLine);
            }

            // Join with <br> tags
            return result.join('<br>');
        }

        // Fallback: just clean empty elements
        html = html.replace(/<p[^>]*>\s*<\/p>/gi, '');
        html = html.replace(/<div[^>]*>\s*<\/div>/gi, '');
        html = html.replace(/<span[^>]*>\s*<\/span>/gi, '');

        return html.trim();
    };

    return (
        <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            onPaste={handlePaste}
            className={`${className} focus:outline-none focus:ring-2 focus:ring-blue-500`}
            style={{
                minHeight,
                whiteSpace: 'normal',
                wordWrap: 'break-word',
                overflowWrap: 'break-word'
            }}
            data-placeholder={placeholder}
            suppressContentEditableWarning
        />
    );
}
