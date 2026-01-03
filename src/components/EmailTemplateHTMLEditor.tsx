import React from 'react';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-css';
import 'prismjs/themes/prism.css';

interface EmailTemplateHTMLEditorProps {
  value: string;
  onChange: (value: string) => void;
  onInsertVariable?: (varName: string) => void;
}

export function EmailTemplateHTMLEditor({
  value,
  onChange,
  onInsertVariable,
}: EmailTemplateHTMLEditorProps) {
  // Highlight variables in the code
  const highlightWithVariables = (code: string) => {
    // First highlight HTML
    let highlighted = highlight(code, languages.markup, 'html');

    // Then highlight variables {{variableName}}
    highlighted = highlighted.replace(
      /\{\{(\w+)\}\}/g,
      '<span class="token variable" style="color: #e83e8c;">{{$1}}</span>'
    );

    return highlighted;
  };

  return (
    <div className="border rounded-md overflow-hidden">
      <Editor
        value={value}
        onValueChange={onChange}
        highlight={highlightWithVariables}
        padding={16}
        style={{
          fontFamily: '"Fira Code", "Fira Mono", monospace',
          fontSize: 14,
          backgroundColor: '#f8f9fa',
          minHeight: '400px',
        }}
        textareaClassName="code-editor-textarea"
        preClassName="code-editor-pre"
        placeholder="Enter HTML content... Use {{variableName}} for variables"
      />
      <style>{`
        .code-editor-textarea {
          outline: none;
        }
        .code-editor-pre {
          margin: 0;
          background: transparent !important;
        }
        .token.variable {
          color: #e83e8c;
          font-weight: bold;
        }
      `}</style>
    </div>
  );
}

