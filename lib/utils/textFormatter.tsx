import React from 'react';

/**
 * Parse text with markdown-like formatting
 * **text** → bold
 * \n → line break
 */
export function parseFormattedText(input: string | unknown) {
    // SAFETY: Ensure we have a valid string
    if (!input) return null;

    let text: string;
    if (typeof input === 'string') {
        text = input;
    } else if (Array.isArray(input)) {
        text = input.filter((t): t is string => t && typeof t === 'string').join(', ');
    } else if (typeof input === 'object' && input !== null) {
        try {
            text = JSON.stringify(input);
        } catch {
            return null;
        }
    } else {
        text = String(input);
    }

    if (!text) return null;

    // Split by actual newlines and \n
    const lines = text.split(/\n|\\n/);

    return lines.map((line: string, lineIdx: number) => {
        const parts: React.ReactElement[] = [];
        let currentText = line;
        let partIdx = 0;

        // Find all **bold** patterns
        const boldPattern = /\*\*([^*]+)\*\*/g;
        let lastIndex = 0;
        let match;

        while ((match = boldPattern.exec(currentText)) !== null) {
            // Add text before bold
            if (match.index > lastIndex) {
                parts.push(
                    <span key={`${lineIdx}-${partIdx++}`}>
                        {currentText.substring(lastIndex, match.index)}
                    </span>
                );
            }

            // Add bold text
            parts.push(
                <strong key={`${lineIdx}-${partIdx++}`}>
                    {match[1]}
                </strong>
            );

            lastIndex = match.index + match[0].length;
        }

        // Add remaining text
        if (lastIndex < currentText.length) {
            parts.push(
                <span key={`${lineIdx}-${partIdx++}`}>
                    {currentText.substring(lastIndex)}
                </span>
            );
        }

        return (
            <span key={lineIdx}>
                {parts.length > 0 ? parts : currentText}
                {lineIdx < lines.length - 1 && <br />}
            </span>
        );
    });
}
