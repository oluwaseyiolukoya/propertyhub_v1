import React, { useState, useEffect } from 'react';
import { apiClient } from '../lib/api-client';

interface StorageQuota {
  used: number;
  limit: number;
  available: number;
  percentage: number;
  usedFormatted: string;
  limitFormatted: string;
  availableFormatted: string;
}

interface StorageStats {
  quota: StorageQuota;
  breakdown: Array<{
    fileType: string;
    category: string;
    fileCount: number;
    totalSize: number;
    percentage: number;
  }>;
  recentUploads: Array<{
    fileName: string;
    fileSize: number;
    uploadedAt: string;
    uploadedBy: string;
  }>;
}

export default function StorageTest() {
  const [quota, setQuota] = useState<StorageQuota | null>(null);
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch storage quota on mount
  useEffect(() => {
    fetchQuota();
    fetchStats();
  }, []);

  const fetchQuota = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<any>('/api/storage/quota');

      if (response.error) {
        setError(response.error.message || response.error.error);
        return;
      }

      const payload = response.data as any;
      if (payload?.success) {
        setQuota(payload.data);
      } else {
        setError(payload?.error || 'Failed to load storage quota');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiClient.get<any>('/api/storage/stats');
      if (response.error) {
        console.error('Error fetching stats:', response.error);
        return;
      }
      const payload = response.data as any;
      if (payload?.success) {
        setStats(payload.data);
      }
    } catch (err: any) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadResult(null);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('category', 'documents');
      formData.append('subcategory', 'test');

      const response = await apiClient.post<any>('/api/storage/upload', formData);

      if (response.error) {
        setError(response.error.message || response.error.error);
        return;
      }

      const payload = response.data as any;
      if (payload?.success) {
        setUploadResult(payload.data);
        setSelectedFile(null);
        // Refresh quota and stats
        await fetchQuota();
        await fetchStats();
      } else {
        setError(payload?.error || 'File upload failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (filePath: string) => {
    if (!confirm('Are you sure you want to delete this file?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.delete<any>('/api/storage/file', { filePath });

      if (response.error) {
        setError(response.error.message || response.error.error);
        return;
      }

      const payload = response.data as any;
      if (payload?.success) {
        alert('File deleted successfully!');
        setUploadResult(null);
        await fetchQuota();
        await fetchStats();
      } else {
        setError(payload?.error || 'Failed to delete file');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Storage System Test</h1>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          <p className="font-semibold">Error:</p>
          <p>{error}</p>
        </div>
      )}

      {/* Storage Quota Card */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <span>📊</span> Storage Quota
        </h2>
        {loading && !quota ? (
          <p className="text-gray-500">Loading...</p>
        ) : quota ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Used:</span>
              <span className="font-semibold">{quota.usedFormatted}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Limit:</span>
              <span className="font-semibold">{quota.limitFormatted}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Available:</span>
              <span className="font-semibold text-green-600">{quota.availableFormatted}</span>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Usage</span>
                <span className={quota.percentage > 80 ? 'text-orange-600 font-semibold' : ''}>
                  {quota.percentage.toFixed(2)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    quota.percentage > 90
                      ? 'bg-red-500'
                      : quota.percentage > 70
                      ? 'bg-orange-500'
                      : 'bg-blue-500'
                  }`}
                  style={{ width: `${Math.min(quota.percentage, 100)}%` }}
                />
              </div>
            </div>

            <button
              onClick={fetchQuota}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Refresh Quota
            </button>
          </div>
        ) : (
          <p className="text-red-500">Failed to load quota</p>
        )}
      </div>

      {/* File Upload Card */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <span>📤</span> Upload Test File
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select File
            </label>
            <input
              type="file"
              onChange={handleFileSelect}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {selectedFile && (
              <p className="mt-2 text-sm text-gray-600">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-semibold"
          >
            {uploading ? 'Uploading...' : 'Upload File'}
          </button>
        </div>

        {/* Upload Result */}
        {uploadResult && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="font-semibold text-green-800 mb-2">✅ Upload Successful!</p>
            <div className="space-y-1 text-sm text-gray-700">
              <p><strong>File ID:</strong> {uploadResult.fileId}</p>
              <p><strong>File Path:</strong> <code className="bg-gray-100 px-2 py-1 rounded text-xs">{uploadResult.filePath}</code></p>
              <p><strong>File Size:</strong> {(uploadResult.fileSize / 1024).toFixed(2)} KB</p>
              {uploadResult.cdnUrl && (
                <p><strong>CDN URL:</strong> <a href={uploadResult.cdnUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View File</a></p>
              )}
            </div>
            <button
              onClick={() => handleDelete(uploadResult.filePath)}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
            >
              Delete This File
            </button>
          </div>
        )}
      </div>

      {/* Storage Statistics Card */}
      {stats && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span>📈</span> Storage Statistics
          </h2>

          {/* Breakdown by Type */}
          {stats.breakdown.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-3">Storage Breakdown</h3>
              <div className="space-y-2">
                {stats.breakdown.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-medium capitalize">{item.fileType}</span>
                      <span className="text-gray-500 text-sm ml-2">({item.category})</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{item.fileCount} files</div>
                      <div className="text-sm text-gray-600">{(item.totalSize / 1024 / 1024).toFixed(2)} MB</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Uploads */}
          {stats.recentUploads.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Recent Uploads</h3>
              <div className="space-y-2">
                {stats.recentUploads.map((upload, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{upload.fileName}</div>
                      <div className="text-sm text-gray-500">by {upload.uploadedBy}</div>
                    </div>
                    <div className="text-right text-sm text-gray-600">
                      <div>{(upload.fileSize / 1024).toFixed(2)} KB</div>
                      <div>{new Date(upload.uploadedAt).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {stats.breakdown.length === 0 && stats.recentUploads.length === 0 && (
            <p className="text-gray-500 text-center py-8">No files uploaded yet. Upload a file to see statistics.</p>
          )}

          <button
            onClick={fetchStats}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Refresh Statistics
          </button>
        </div>
      )}

      {/* Test Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-2">🧪 Testing Instructions</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
          <li>Check your current storage quota above</li>
          <li>Select a test file (any file type)</li>
          <li>Click "Upload File" to test the upload</li>
          <li>Verify the quota updates after upload</li>
          <li>Check the storage statistics</li>
          <li>Delete the test file to verify deletion works</li>
          <li>Verify quota returns to original value</li>
        </ol>
      </div>
    </div>
  );
}

