import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent } from './ui/card';
import { Upload, Link, X, Camera } from 'lucide-react';
import { toast } from 'sonner';

interface ImageUploadProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  description?: string;
  maxWidth?: number;
  maxHeight?: number;
  accept?: string;
}

export function ImageUpload({ 
  value, 
  onChange, 
  label = "Image",
  description = "Upload an image or provide an image URL",
  maxWidth = 300,
  maxHeight = 200,
  accept = "image/*"
}: ImageUploadProps) {
  const [uploadMethod, setUploadMethod] = useState<'upload' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState(value || '');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      onChange(result);
      toast.success('Image uploaded successfully');
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleUrlSubmit = () => {
    if (!urlInput.trim()) {
      toast.error('Please enter a valid URL');
      return;
    }

    // Basic URL validation
    try {
      new URL(urlInput);
      onChange(urlInput);
      toast.success('Image URL added successfully');
    } catch {
      toast.error('Please enter a valid URL');
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrlInput(e.target.value);
  };

  const handleUrlKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleUrlSubmit();
    }
  };

  const clearImage = () => {
    onChange('');
    setUrlInput('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isDataUrl = value?.startsWith('data:');
  const hasImage = !!value;

  return (
    <div className="space-y-4">
      <div>
        <Label>{label}</Label>
        {description && (
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        )}
      </div>

      <Tabs value={uploadMethod} onValueChange={(value) => setUploadMethod(value as 'upload' | 'url')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload File
          </TabsTrigger>
          <TabsTrigger value="url" className="flex items-center gap-2">
            <Link className="h-4 w-4" />
            Image URL
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <Card 
            className={`border-2 border-dashed transition-colors cursor-pointer ${
              dragOver 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <CardContent className="flex flex-col items-center justify-center p-6">
              <div className="flex flex-col items-center text-center">
                <Upload className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-sm font-medium text-gray-900 mb-1">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-500">
                  PNG, JPG, GIF up to 5MB
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept={accept}
                onChange={handleFileInputChange}
                className="hidden"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="url" className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={urlInput}
              onChange={handleUrlChange}
              onKeyPress={handleUrlKeyPress}
              placeholder="https://example.com/image.jpg"
              className="flex-1"
            />
            <Button onClick={handleUrlSubmit} variant="outline">
              Add URL
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Image Preview */}
      {hasImage && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm text-gray-600">Preview:</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={clearImage}
              className="h-8 px-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div 
            className="border rounded-lg overflow-hidden bg-gray-50 relative"
            style={{ maxWidth: `${maxWidth}px`, height: `${maxHeight}px` }}
          >
            <img 
              src={value} 
              alt="Preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                if (target.parentNode) {
                  const errorDiv = document.createElement('div');
                  errorDiv.className = 'flex items-center justify-center h-full text-gray-400 text-sm absolute inset-0 bg-gray-50';
                  errorDiv.innerHTML = '<div class="text-center"><div class="mb-2"><div style="font-size: 2rem;">📷</div></div><div>Invalid image</div></div>';
                  target.parentNode.appendChild(errorDiv);
                }
              }}
            />
          </div>
          <div className="text-xs text-gray-500">
            {isDataUrl ? 'Uploaded file' : 'External URL'}
          </div>
        </div>
      )}
    </div>
  );
}


