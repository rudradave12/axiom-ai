import React from 'react';
import DOMPurify from 'dompurify';

interface MarkdownProps {
  content: string;
  style?: React.CSSProperties;
}

export function Markdown({ content, style }: MarkdownProps): React.JSX.Element {
  const parseMarkdown = (text: string): string => {
    if (!text) return '';

    // Safe base HTML escape
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Code blocks with syntax box
    html = html.replace(/```(\w*)\n([\s\S]*?)\n```/g, (_, lang, code) => {
      const escapedCode = code.trim();
      return `<div style="background-color:#1e293b;border:1px solid #334155;border-radius:6px;margin:8px 0;overflow:hidden;font-family:monospace;">
        <div style="background-color:#0f172a;padding:6px 12px;border-bottom:1px solid #334155;display:flex;justify-content:space-between;align-items:center;font-size:0.8em;color:#94a3b8;">
          <span>${lang ? lang.toUpperCase() : 'CODE'}</span>
        </div>
        <pre style="padding:12px;margin:0;overflow-x:auto;color:#e2e8f0;font-size:0.9em;"><code>${escapedCode}</code></pre>
      </div>`;
    });

    // Inline code blocks
    html = html.replace(/`(.*?)`/g, '<code style="background-color:rgba(255,255,255,0.08);padding:2px 6px;border-radius:4px;font-family:monospace;font-size:0.9em;color:#f43f5e;">$1</code>');

    // Headers
    html = html.replace(/^### (.*?)$/gm, '<h3 style="font-size:1.2em;font-weight:700;margin-top:12px;margin-bottom:6px;color:#ffffff;">$1</h3>');
    html = html.replace(/^## (.*?)$/gm, '<h2 style="font-size:1.4em;font-weight:700;margin-top:16px;margin-bottom:8px;color:#ffffff;">$1</h2>');
    html = html.replace(/^# (.*?)$/gm, '<h1 style="font-size:1.6em;font-weight:800;margin-top:20px;margin-bottom:10px;color:#ffffff;">$1</h1>');

    // Blockquotes / Citations
    html = html.replace(/^&gt;\s?(.*?)$/gm, '<blockquote style="border-left:4px solid #3b82f6;padding-left:12px;margin:8px 0;color:#94a3b8;font-style:italic;">$1</blockquote>');

    // Lists
    html = html.replace(/^\s*-\s+(.*?)$/gm, '<li style="margin-left:16px;margin-bottom:4px;list-style-type:disc;">$1</li>');
    html = html.replace(/^\s*\*\s+(.*?)$/gm, '<li style="margin-left:16px;margin-bottom:4px;list-style-type:disc;">$1</li>');

    // Bold & Italics
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Advanced Tables
    const lines = html.split('\n');
    let inTable = false;
    let tableRows: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('|') && line.endsWith('|')) {
        if (!inTable) {
          inTable = true;
          tableRows = [];
        }
        const cells = line.split('|').slice(1, -1).map(c => c.trim());
        
        // Check if it's separator row
        const isSeparator = cells.every(c => c.match(/^:?-+:?$/));
        if (!isSeparator) {
          const isHeader = tableRows.length === 0;
          const rowHtml = `<tr style="border-bottom:1px solid #334155;">
            ${cells.map(c => `<${isHeader ? 'th' : 'td'} style="padding:8px 12px;text-align:left;font-weight:${isHeader ? '800' : '400'};">${c}</${isHeader ? 'th' : 'td'}>`).join('')}
          </tr>`;
          tableRows.push(rowHtml);
        }
        lines[i] = ''; // clear for replacement
      } else {
        if (inTable) {
          inTable = false;
          lines[i - 1] = `<table style="width:100%;border-collapse:collapse;margin:12px 0;border:1px solid #334155;font-size:0.9em;color:#e2e8f0;">
            ${tableRows.join('')}
          </table>\n` + lines[i];
        }
      }
    }
    
    // Final table boundary flush if line ends in table
    if (inTable) {
      lines[lines.length - 1] = `<table style="width:100%;border-collapse:collapse;margin:12px 0;border:1px solid #334155;font-size:0.9em;color:#e2e8f0;">
        ${tableRows.join('')}
      </table>`;
    }
    
    html = lines.join('\n');

    // Newlines mapping to linebreaks
    html = html.replace(/\n/g, '<br />');

    return html;
  };

  const rawHtml = parseMarkdown(content);
  const sanitizedHtml = typeof window !== 'undefined' ? DOMPurify.sanitize(rawHtml) : rawHtml;

  return (
    <span
      style={style}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}

export default Markdown;
