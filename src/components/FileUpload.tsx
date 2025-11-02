import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { X, Upload, File, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { uploadMaintenanceFiles, UploadedFile } from '../lib/api/uploads';

interface FileUploadProps {
  onFilesUploaded: (files: UploadedFile[]) => void;
  maxFiles?: number;
  maxSize?: number; // in MB
  accept?: string;
  existingFiles?: UploadedFile[];
  onRemoveFile?: (file: UploadedFile) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFilesUploaded,
  maxFiles = 5,
  maxSize = 10,
  accept = 'image/*,application/pdf,video/*,.doc,.docx',
  existingFiles = [],
  onRemoveFile
}) => {
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Validate file count
    const totalFiles = existingFiles.length + selectedFiles.length + files.length;
    if (totalFiles > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Validate file sizes
    const oversizedFiles = files.filter(f => f.size > maxSize * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast.error(`Files must be smaller than ${maxSize}MB`);
      return;
    }

    setSelectedFiles(prev => [...prev, ...files]);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select files to upload');
      return;
    }

    setUploading(true);
    try {
      const result = await uploadMaintenanceFiles(selectedFiles);

      if (result.error) {
        toast.error(result.error.error || 'Failed to upload files');
      } else if (result.data) {
        toast.success(`${result.data.files.length} file(s) uploaded successfully`);
        onFilesUploaded(result.data.files);
        setSelectedFiles([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (error) {
      toast.error('Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
      return <ImageIcon className="h-4 w-4" />;
    }
    return <File className="h-4 w-4" />;
  };

  return (
    <div className="space-y-3">
      {/* Existing Files */}
      {existingFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Attached Files</p>
          <div className="space-y-1">
            {existingFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  {getFileIcon(file.originalName)}
                  <a
                    href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${file.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline truncate"
                  >
                    {file.originalName}
                  </a>
                  <span className="text-xs text-gray-500">
                    ({formatFileSize(file.size)})
                  </span>
                </div>
                {onRemoveFile && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveFile(file)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Files (not yet uploaded) */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Selected Files</p>
          <div className="space-y-1">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  {getFileIcon(file.name)}
                  <span className="text-sm truncate">{file.name}</span>
                  <span className="text-xs text-gray-500">
                    ({formatFileSize(file.size)})
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSelectedFile(index)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div className="border-2 border-dashed rounded-lg p-4">
        <div className="flex flex-col items-center space-y-2">
          <Upload className="h-8 w-8 text-gray-400" />
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Drop files here or click to browse
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Max {maxFiles} files, {maxSize}MB each
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={accept}
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
          />
          <div className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || (existingFiles.length + selectedFiles.length >= maxFiles)}
            >
              Choose Files
            </Button>
            {selectedFiles.length > 0 && (
              <Button
                type="button"
                size="sm"
                onClick={handleUpload}
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} file(s)`}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

