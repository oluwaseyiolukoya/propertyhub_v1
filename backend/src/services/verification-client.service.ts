import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';

/**
 * Verification Client Service
 * Communicates with the verification microservice
 */
export class VerificationClientService {
  private client: AxiosInstance;
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.VERIFICATION_SERVICE_URL || 'http://localhost:5001';
    this.apiKey = process.env.VERIFICATION_API_KEY || '';

    if (!this.apiKey) {
      console.warn('[VerificationClient] ⚠️  VERIFICATION_API_KEY not set');
    }

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000, // 30 seconds
      headers: {
        'X-API-Key': this.apiKey,
      },
    });
  }

  /**
   * Submit verification request
   * @param customerId - Customer ID from main database
   * @param customerType - Type of customer
   * @param customerEmail - Customer email (optional, for search)
   * @param ipAddress - IP address (optional)
   * @param userAgent - User agent (optional)
   */
  async submitVerification(
    customerId: string,
    customerType: string,
    customerEmail?: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    try {
      console.log(`[VerificationClient] Submitting verification for customer ${customerId}`);

      const response = await this.client.post('/api/verification/submit', {
        customerId,
        customerType,
        customerEmail,
        ipAddress,
        userAgent,
      });

      console.log(`[VerificationClient] ✅ Verification submitted: ${response.data.requestId}`);
      return response.data;
    } catch (error: any) {
      console.error('[VerificationClient] Failed to submit verification:', error.message);
      if (error.response) {
        console.error('[VerificationClient] Response status:', error.response.status);
        console.error('[VerificationClient] Response data:', error.response.data);
      } else if (error.request) {
        console.error('[VerificationClient] No response received:', error.request);
      }
      console.error('[VerificationClient] Request payload:', {
        customerId,
        customerType,
        customerEmail,
      });
      throw new Error(error.response?.data?.error || error.message || 'Failed to submit verification');
    }
  }

  /**
   * Upload document
   * @param requestId - Verification request ID
   * @param file - File buffer
   * @param fileName - Original file name
   * @param mimeType - File MIME type
   * @param documentType - Type of document
   * @param documentNumber - Document number (optional)
   * @param metadata - Additional metadata
   */
  async uploadDocument(
    requestId: string,
    file: Buffer,
    fileName: string,
    mimeType: string,
    documentType: string,
    documentNumber?: string,
    metadata?: any
  ) {
    try {
      console.log(`[VerificationClient] Uploading ${documentType} for request ${requestId}`);

      const formData = new FormData();
      formData.append('file', file, {
        filename: fileName,
        contentType: mimeType,
      });
      formData.append('documentType', documentType);

      if (documentNumber) {
        formData.append('documentNumber', documentNumber);
      }

      if (metadata) {
        formData.append('metadata', JSON.stringify(metadata));
      }

      const response = await this.client.post(
        `/api/verification/upload/${requestId}`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            'X-API-Key': this.apiKey,
          },
        }
      );

      console.log(`[VerificationClient] ✅ Document uploaded: ${response.data.documentId}`);
      return response.data;
    } catch (error: any) {
      console.error('[VerificationClient] Failed to upload document:', error.message);
      throw new Error(error.response?.data?.error || 'Failed to upload document');
    }
  }

  /**
   * Get verification status by request ID
   * @param requestId - Verification request ID
   */
  async getStatus(requestId: string) {
    try {
      const response = await this.client.get(`/api/verification/status/${requestId}`);
      return response.data;
    } catch (error: any) {
      console.error('[VerificationClient] Failed to get status:', error.message);
      throw new Error(error.response?.data?.error || 'Failed to get verification status');
    }
  }

  /**
   * Get customer verification status
   * @param customerId - Customer ID
   */
  async getCustomerVerification(customerId: string) {
    try {
      const response = await this.client.get(`/api/verification/customer/${customerId}`);
      return response.data;
    } catch (error: any) {
      console.error('[VerificationClient] Failed to get customer verification:', error.message);
      throw new Error(error.response?.data?.error || 'Failed to get customer verification');
    }
  }

  /**
   * Get verification history
   * @param requestId - Verification request ID
   */
  async getHistory(requestId: string) {
    try {
      const response = await this.client.get(`/api/verification/history/${requestId}`);
      return response.data;
    } catch (error: any) {
      console.error('[VerificationClient] Failed to get history:', error.message);
      throw new Error(error.response?.data?.error || 'Failed to get verification history');
    }
  }

  /**
   * List verification requests (admin)
   * @param status - Filter by status
   * @param page - Page number
   * @param limit - Items per page
   * @param email - Filter by customer email
   */
  async listRequests(status?: string, page: number = 1, limit: number = 20, email?: string) {
    try {
      const params: any = { status, page, limit };

      if (email && email.trim()) {
        params.email = email.trim();
      }

      const response = await this.client.get('/api/admin/requests', {
        params,
      });
      return response.data;
    } catch (error: any) {
      console.error('[VerificationClient] Failed to list requests:', error.message);
      throw new Error(error.response?.data?.error || 'Failed to list verification requests');
    }
  }

  /**
   * Get request details (admin)
   * @param requestId - Verification request ID
   */
  async getRequestDetails(requestId: string) {
    try {
      const response = await this.client.get(`/api/admin/requests/${requestId}`);
      return response.data;
    } catch (error: any) {
      console.error('[VerificationClient] Failed to get request details:', error.message);
      throw new Error(error.response?.data?.error || 'Failed to get request details');
    }
  }

  /**
   * Approve verification request (admin)
   * @param requestId - Verification request ID
   * @param adminUserId - Admin user ID
   */
  async approveRequest(requestId: string, adminUserId: string) {
    try {
      console.log(`[VerificationClient] Approving request ${requestId} by admin ${adminUserId}`);

      const response = await this.client.post(`/api/admin/requests/${requestId}/approve`, {
        adminUserId,
      });

      console.log(`[VerificationClient] ✅ Request approved`);
      return response.data;
    } catch (error: any) {
      console.error('[VerificationClient] Failed to approve request:', error.message);
      throw new Error(error.response?.data?.error || 'Failed to approve verification');
    }
  }

  /**
   * Reject verification request (admin)
   * @param requestId - Verification request ID
   * @param adminUserId - Admin user ID
   * @param reason - Rejection reason
   */
  async rejectRequest(requestId: string, adminUserId: string, reason: string) {
    try {
      console.log(`[VerificationClient] Rejecting request ${requestId} by admin ${adminUserId}`);

      const response = await this.client.post(`/api/admin/requests/${requestId}/reject`, {
        adminUserId,
        reason,
      });

      console.log(`[VerificationClient] ✅ Request rejected`);
      return response.data;
    } catch (error: any) {
      console.error('[VerificationClient] Failed to reject request:', error.message);
      throw new Error(error.response?.data?.error || 'Failed to reject verification');
    }
  }

  /**
   * Delete verification request (admin)
   * @param requestId - Verification request ID
   */
  async deleteRequest(requestId: string) {
    try {
      console.log(`[VerificationClient] Deleting request ${requestId}`);

      const response = await this.client.delete(`/api/admin/requests/${requestId}`);

      console.log(`[VerificationClient] ✅ Request deleted`);
      return response.data;
    } catch (error: any) {
      console.error('[VerificationClient] Failed to delete request:', error.message);
      throw new Error(error.response?.data?.error || 'Failed to delete verification request');
    }
  }

  /**
   * Get analytics (admin)
   */
  async getAnalytics() {
    try {
      const response = await this.client.get('/api/admin/analytics');
      return response.data;
    } catch (error: any) {
      console.error('[VerificationClient] Failed to get analytics:', error.message);
      throw new Error(error.response?.data?.error || 'Failed to get analytics');
    }
  }

  /**
   * Get provider logs (admin)
   * @param provider - Provider name
   * @param limit - Number of logs
   */
  async getProviderLogs(provider?: string, limit: number = 50) {
    try {
      const response = await this.client.get('/api/admin/provider-logs', {
        params: { provider, limit },
      });
      return response.data;
    } catch (error: any) {
      console.error('[VerificationClient] Failed to get provider logs:', error.message);
      throw new Error(error.response?.data?.error || 'Failed to get provider logs');
    }
  }

  /**
   * Get document download URL (pre-signed)
   * @param documentId - Document ID
   * @param expiresIn - URL expiration time in seconds
   */
  async getDocumentDownloadUrl(documentId: string, expiresIn: number = 3600) {
    try {
      const response = await this.client.get(`/api/admin/documents/${documentId}/download`, {
        params: { expiresIn },
      });
      return response.data;
    } catch (error: any) {
      console.error('[VerificationClient] Failed to get document download URL:', error.message);
      throw new Error(error.response?.data?.error || 'Failed to get document download URL');
    }
  }
}

// Export singleton instance
export const verificationClient = new VerificationClientService();

