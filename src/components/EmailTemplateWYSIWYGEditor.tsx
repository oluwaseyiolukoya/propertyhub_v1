import React, { useRef, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface EmailTemplateWYSIWYGEditorProps {
  value: string;
  onChange: (value: string) => void;
  onInsertVariable?: (varName: string) => void;
}

export function EmailTemplateWYSIWYGEditor({
  value,
  onChange,
  onInsertVariable,
}: EmailTemplateWYSIWYGEditorProps) {
  const quillRef = useRef<ReactQuill>(null);

  // Custom toolbar with variable insertion
  const modules = {
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ color: [] }, { background: [] }],
        ['link'],
        ['clean'],
        ['variable'], // Custom button for variables
      ],
      handlers: {
        variable: function () {
          // This will be handled by the parent component
          // For now, just insert a placeholder
          const quill = quillRef.current?.getEditor();
          if (quill) {
            const range = quill.getSelection();
            if (range) {
              quill.insertText(range.index, '{{variableName}}', 'user');
            }
          }
        },
      },
    },
  };

  const formats = [
    'header',
    'bold',
    'italic',
    'underline',
    'strike',
    'list',
    'bullet',
    'color',
    'background',
    'link',
  ];

  return (
    <div className="border rounded-md">
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder="Start typing your email content..."
        style={{ minHeight: '400px' }}
      />
      <style>{`
        .ql-editor {
          min-height: 400px;
        }
        .ql-toolbar .ql-variable::before {
          content: '{{}}';
          font-weight: bold;
        }
      `}</style>
    </div>
  );
}

