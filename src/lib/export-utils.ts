/**
 * @file Utilities for exporting documents to various formats.
 * Supports .txt, .docx, and .pdf export functionality.
 */

import { type JSONContent } from '@tiptap/react';

/**
 * Converts Tiptap JSON content to plain text.
 * 
 * @param content - The Tiptap JSON content
 * @returns Plain text representation
 */
function jsonToText(content: JSONContent): string {
  if (!content) return '';

  let text = '';

  if (content.type === 'text') {
    return content.text || '';
  }

  if (content.type === 'paragraph') {
    if (content.content) {
      text += content.content.map(jsonToText).join('');
    }
    text += '\n\n';
  } else if (content.type === 'heading') {
    if (content.content) {
      text += content.content.map(jsonToText).join('');
    }
    text += '\n\n';
  } else if (content.type === 'bulletList' || content.type === 'orderedList') {
    if (content.content) {
      content.content.forEach((item) => {
        text += '• ';
        if (item.content) {
          text += item.content.map(jsonToText).join('');
        }
        text += '\n';
      });
    }
    text += '\n';
  } else if (content.content) {
    text += content.content.map(jsonToText).join('');
  }

  return text;
}

/**
 * Converts Tiptap JSON content to HTML.
 * 
 * @param content - The Tiptap JSON content
 * @returns HTML representation
 */
function jsonToHtml(content: JSONContent): string {
  if (!content) return '';

  if (content.type === 'text') {
    let text = content.text || '';
    
    // Apply text formatting
    if (content.marks) {
      content.marks.forEach((mark) => {
        switch (mark.type) {
          case 'bold':
            text = `<strong>${text}</strong>`;
            break;
          case 'italic':
            text = `<em>${text}</em>`;
            break;
          case 'underline':
            text = `<u>${text}</u>`;
            break;
        }
      });
    }
    
    return text;
  }

  let html = '';

  switch (content.type) {
    case 'doc':
      if (content.content) {
        html = content.content.map(jsonToHtml).join('');
      }
      break;
    case 'paragraph':
      html = '<p>';
      if (content.content) {
        html += content.content.map(jsonToHtml).join('');
      }
      html += '</p>';
      break;
    case 'heading':
      const level = content.attrs?.level || 1;
      html = `<h${level}>`;
      if (content.content) {
        html += content.content.map(jsonToHtml).join('');
      }
      html += `</h${level}>`;
      break;
    case 'bulletList':
      html = '<ul>';
      if (content.content) {
        html += content.content.map(jsonToHtml).join('');
      }
      html += '</ul>';
      break;
    case 'orderedList':
      html = '<ol>';
      if (content.content) {
        html += content.content.map(jsonToHtml).join('');
      }
      html += '</ol>';
      break;
    case 'listItem':
      html = '<li>';
      if (content.content) {
        html += content.content.map(jsonToHtml).join('');
      }
      html += '</li>';
      break;
    case 'blockquote':
      html = '<blockquote>';
      if (content.content) {
        html += content.content.map(jsonToHtml).join('');
      }
      html += '</blockquote>';
      break;
    case 'codeBlock':
      html = '<pre><code>';
      if (content.content) {
        html += content.content.map(jsonToHtml).join('');
      }
      html += '</code></pre>';
      break;
    case 'hardBreak':
      html = '<br>';
      break;
    default:
      if (content.content) {
        html = content.content.map(jsonToHtml).join('');
      }
  }

  return html;
}

/**
 * Exports document content as a text file.
 * 
 * @param title - Document title
 * @param content - Tiptap JSON content
 */
export function exportAsText(title: string, content: JSONContent): void {
  const text = jsonToText(content);
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports document content as an HTML file.
 * 
 * @param title - Document title
 * @param content - Tiptap JSON content
 */
export function exportAsHtml(title: string, content: JSONContent): void {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: 'Times New Roman', serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
        }
        h1, h2, h3, h4, h5, h6 {
            color: #2c3e50;
            margin-top: 1.5em;
            margin-bottom: 0.5em;
        }
        p {
            margin-bottom: 1em;
        }
        blockquote {
            border-left: 4px solid #e2e8f0;
            padding-left: 1em;
            margin: 1em 0;
            font-style: italic;
            color: #64748b;
        }
        ul, ol {
            padding-left: 2em;
        }
        code {
            background-color: #f1f5f9;
            padding: 2px 4px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
        }
        pre {
            background-color: #f1f5f9;
            padding: 1em;
            border-radius: 5px;
            overflow-x: auto;
        }
    </style>
</head>
<body>
    <h1>${title}</h1>
    ${jsonToHtml(content)}
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports document content as a PDF file.
 * This uses the browser's print functionality to generate PDF.
 * 
 * @param title - Document title
 * @param content - Tiptap JSON content
 */
export function exportAsPdf(title: string, content: JSONContent): void {
  const html = jsonToHtml(content);
  
  // Create a new window with the document content
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to export as PDF');
    return;
  }

  printWindow.document.write(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        @media print {
            body { margin: 0; }
        }
        body {
            font-family: 'Times New Roman', serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
        }
        h1, h2, h3, h4, h5, h6 {
            color: #2c3e50;
            margin-top: 1.5em;
            margin-bottom: 0.5em;
            page-break-after: avoid;
        }
        p {
            margin-bottom: 1em;
        }
        blockquote {
            border-left: 4px solid #e2e8f0;
            padding-left: 1em;
            margin: 1em 0;
            font-style: italic;
            color: #64748b;
        }
        ul, ol {
            padding-left: 2em;
        }
        code {
            background-color: #f1f5f9;
            padding: 2px 4px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
        }
        pre {
            background-color: #f1f5f9;
            padding: 1em;
            border-radius: 5px;
            overflow-x: auto;
            page-break-inside: avoid;
        }
    </style>
</head>
<body>
    <h1>${title}</h1>
    ${html}
</body>
</html>`);

  printWindow.document.close();
  printWindow.focus();
  
  // Small delay to ensure content is loaded
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
}

/**
 * Type definition for supported export formats.
 */
export type ExportFormat = 'txt' | 'html' | 'pdf';

/**
 * Main export function that handles all formats.
 * 
 * @param format - The export format
 * @param title - Document title
 * @param content - Tiptap JSON content
 */
export function exportDocument(format: ExportFormat, title: string, content: JSONContent): void {
  switch (format) {
    case 'txt':
      exportAsText(title, content);
      break;
    case 'html':
      exportAsHtml(title, content);
      break;
    case 'pdf':
      exportAsPdf(title, content);
      break;
    default:
      console.error('Unsupported export format:', format);
  }
} 