/**
 * Upload API
 */

import { apiClient } from '../api-client';

export interface UploadedFile {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
}

/**
 * Upload maintenance files
 */
export const uploadMaintenanceFiles = async (files: File[]): Promise<{ error?: any; data?: { files: UploadedFile[] } }> => {
  try {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/uploads/maintenance`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      return { error };
    }

    const data = await response.json();
    return { data };
  } catch (error: any) {
    return { error: { error: error.message || 'Failed to upload files' } };
  }
};

/**
 * Delete maintenance file
 */
export const deleteMaintenanceFile = async (customerId: string, filename: string) => {
  return apiClient.delete(`/api/uploads/maintenance/${customerId}/${filename}`);
};

