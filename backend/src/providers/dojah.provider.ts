import axios, { AxiosInstance, AxiosError } from 'axios';
import { BaseVerificationProvider } from './base.provider';
import { VerificationResult } from '../../types/verification';
import { config } from '../../lib/env';
import prisma from '../../lib/db';
import { sanitizePayload } from '../lib/encryption';

/**
 * Dojah Identity Verification Provider
 * Documentation: https://docs.dojah.io/
 */
export class DojahProvider extends BaseVerificationProvider {
  name = 'dojah';
  private client: AxiosInstance;
  private apiKey: string;
  private appId: string;

  constructor() {
    super();
    this.apiKey = config.dojah.apiKey;
    this.appId = config.dojah.appId;

    // Create axios instance with default config
    this.client = axios.create({
      baseURL: config.dojah.baseUrl,
      timeout: 30000, // 30 seconds
      headers: {
        'Authorization': this.apiKey,
        'AppId': this.appId,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Verify National Identity Number (NIN)
   * Dojah Endpoint: GET /api/v1/kyc/nin
   * Documentation: https://docs.dojah.io/
   */
  async verifyNIN(
    nin: string,
    firstName: string,
    lastName: string,
    dob?: string
  ): Promise<VerificationResult> {
    this.validateFields({ nin, firstName, lastName });

    const startTime = Date.now();
    const endpoint = '/api/v1/kyc/nin';

    try {
      console.log(`[Dojah] Verifying NIN: ${nin.substring(0, 3)}***`);

      // Dojah NIN lookup uses GET with query parameters
      const response = await this.client.get(endpoint, {
        params: { nin }
      });

      const duration = Date.now() - startTime;
      await this.logProviderCall(endpoint, { nin: '***' }, response.data, response.status, duration, true);

      // Parse Dojah response
      const entity = response.data?.entity;

      if (!entity || !response.data) {
        return {
          success: false,
          status: 'failed',
          confidence: 0,
          referenceId: response.data?.reference_id || '',
          error: 'No data returned from provider',
        };
      }

      // Calculate confidence based on name matching
      const firstNameMatch = this.calculateNameMatchConfidence(
        firstName.toLowerCase(),
        (entity.firstname || entity.first_name || '').toLowerCase()
      );
      const lastNameMatch = this.calculateNameMatchConfidence(
        lastName.toLowerCase(),
        (entity.surname || entity.last_name || '').toLowerCase()
      );

      // If DOB provided, verify it matches
      let dobMatch = 100;
      if (dob && entity.birthdate) {
        dobMatch = dob === entity.birthdate ? 100 : 0;
      }

      // Calculate overall confidence (weighted average)
      const confidence = dob
        ? (firstNameMatch * 0.4 + lastNameMatch * 0.4 + dobMatch * 0.2)
        : (firstNameMatch + lastNameMatch) / 2;

      const isVerified = confidence >= 80; // 80% threshold

      console.log(`[Dojah] NIN Verification Result: ${isVerified ? 'VERIFIED' : 'FAILED'} (Confidence: ${confidence.toFixed(2)}%)`);

      return {
        success: isVerified,
        status: isVerified ? 'verified' : 'failed',
        confidence,
        referenceId: response.data.reference_id || `NIN-${Date.now()}`,
        data: {
          nin: entity.nin,
          firstName: entity.firstname || entity.first_name,
          lastName: entity.surname || entity.last_name,
          middleName: entity.middlename || entity.middle_name,
          dateOfBirth: entity.birthdate || entity.date_of_birth,
          gender: entity.gender,
          phone: entity.phone || entity.telephoneno,
          address: entity.residence_address || entity.address,
          photo: entity.photo,
        },
      };
    } catch (error) {
      return this.handleError(error as AxiosError, endpoint, { nin: '***' }, startTime);
    }
  }

  /**
   * Verify International Passport
   * Dojah Endpoint: GET /api/v1/kyc/passport
   * Documentation: https://docs.dojah.io/
   */
  async verifyPassport(
    passportNumber: string,
    firstName: string,
    lastName: string
  ): Promise<VerificationResult> {
    this.validateFields({ passportNumber, firstName, lastName });

    const startTime = Date.now();
    const endpoint = '/api/v1/kyc/passport';

    try {
      console.log(`[Dojah] Verifying Passport: ${passportNumber.substring(0, 3)}***`);

      // Dojah passport lookup uses GET with query parameters
      const response = await this.client.get(endpoint, {
        params: { passport_number: passportNumber }
      });

      const duration = Date.now() - startTime;
      await this.logProviderCall(endpoint, { passport_number: '***' }, response.data, response.status, duration, true);

      const entity = response.data?.entity;

      if (!entity || !response.data) {
        return {
          success: false,
          status: 'failed',
          confidence: 0,
          referenceId: response.data?.reference_id || '',
          error: 'No data returned from provider',
        };
      }

      const firstNameMatch = this.calculateNameMatchConfidence(
        firstName.toLowerCase(),
        (entity.first_name || entity.firstname || '').toLowerCase()
      );
      const lastNameMatch = this.calculateNameMatchConfidence(
        lastName.toLowerCase(),
        (entity.last_name || entity.surname || '').toLowerCase()
      );
      const confidence = (firstNameMatch + lastNameMatch) / 2;

      const isVerified = confidence >= 80;

      console.log(`[Dojah] Passport Verification Result: ${isVerified ? 'VERIFIED' : 'FAILED'} (Confidence: ${confidence.toFixed(2)}%)`);

      return {
        success: isVerified,
        status: isVerified ? 'verified' : 'failed',
        confidence,
        referenceId: response.data.reference_id || `PASSPORT-${Date.now()}`,
        data: {
          passportNumber: entity.passport_number,
          firstName: entity.first_name || entity.firstname,
          lastName: entity.last_name || entity.surname,
          middleName: entity.middle_name || entity.middlename,
          dateOfBirth: entity.date_of_birth || entity.birthdate,
          gender: entity.gender,
          nationality: entity.nationality,
          issueDate: entity.issue_date || entity.issuance_date,
          expiryDate: entity.expiry_date || entity.expiration_date,
        },
      };
    } catch (error) {
      return this.handleError(error as AxiosError, endpoint, { passport_number: '***' }, startTime);
    }
  }

  /**
   * Verify Driver's License
   * Dojah Endpoint: GET /api/v1/kyc/drivers_license
   * Documentation: https://docs.dojah.io/
   * Note: Requires license_number and dob (date of birth)
   */
  async verifyDriversLicense(
    licenseNumber: string,
    firstName: string,
    lastName: string,
    dob?: string
  ): Promise<VerificationResult> {
    this.validateFields({ licenseNumber, firstName, lastName });

    const startTime = Date.now();
    const endpoint = '/api/v1/kyc/drivers_license';

    try {
      console.log(`[Dojah] Verifying Driver's License: ${licenseNumber.substring(0, 3)}***`);

      // Dojah driver's license lookup uses GET with query parameters
      // Note: DOB is required by Dojah for driver's license verification
      const params: any = { license_number: licenseNumber };
      if (dob) {
        params.dob = dob; // Format: YYYY-MM-DD
      }

      const response = await this.client.get(endpoint, { params });

      const duration = Date.now() - startTime;
      await this.logProviderCall(endpoint, { license_number: '***' }, response.data, response.status, duration, true);

      const entity = response.data?.entity;

      if (!entity || !response.data) {
        return {
          success: false,
          status: 'failed',
          confidence: 0,
          referenceId: response.data?.reference_id || '',
          error: 'No data returned from provider',
        };
      }

      const firstNameMatch = this.calculateNameMatchConfidence(
        firstName.toLowerCase(),
        (entity.first_name || entity.firstname || '').toLowerCase()
      );
      const lastNameMatch = this.calculateNameMatchConfidence(
        lastName.toLowerCase(),
        (entity.last_name || entity.surname || '').toLowerCase()
      );

      // If DOB provided, verify it matches
      let dobMatch = 100;
      if (dob && entity.date_of_birth) {
        dobMatch = dob === entity.date_of_birth ? 100 : 0;
      }

      const confidence = dob
        ? (firstNameMatch * 0.4 + lastNameMatch * 0.4 + dobMatch * 0.2)
        : (firstNameMatch + lastNameMatch) / 2;

      const isVerified = confidence >= 80;

      console.log(`[Dojah] Driver's License Verification Result: ${isVerified ? 'VERIFIED' : 'FAILED'} (Confidence: ${confidence.toFixed(2)}%)`);

      return {
        success: isVerified,
        status: isVerified ? 'verified' : 'failed',
        confidence,
        referenceId: response.data.reference_id || `DL-${Date.now()}`,
        data: {
          licenseNumber: entity.license_number,
          firstName: entity.first_name || entity.firstname,
          lastName: entity.last_name || entity.surname,
          dateOfBirth: entity.date_of_birth || entity.birthdate,
          issueDate: entity.issue_date || entity.issued_date,
          expiryDate: entity.expiry_date || entity.expiration_date,
          photo: entity.photo,
          stateOfIssue: entity.state_of_issue,
        },
      };
    } catch (error) {
      return this.handleError(error as AxiosError, endpoint, { license_number: '***' }, startTime);
    }
  }

  /**
   * Verify Voter's Card
   * Dojah Endpoint: GET /api/v1/kyc/vin (Voter Identification Number)
   * Documentation: https://docs.dojah.io/
   */
  async verifyVotersCard(
    vin: string,
    firstName: string,
    lastName: string
  ): Promise<VerificationResult> {
    this.validateFields({ vin, firstName, lastName });

    const startTime = Date.now();
    const endpoint = '/api/v1/kyc/vin';

    try {
      console.log(`[Dojah] Verifying Voter's Card: ${vin.substring(0, 3)}***`);

      // Dojah VIN lookup uses GET with query parameters
      const response = await this.client.get(endpoint, {
        params: { vin }
      });

      const duration = Date.now() - startTime;
      await this.logProviderCall(endpoint, { vin: '***' }, response.data, response.status, duration, true);

      const entity = response.data?.entity;

      if (!entity || !response.data) {
        return {
          success: false,
          status: 'failed',
          confidence: 0,
          referenceId: response.data?.reference_id || '',
          error: 'No data returned from provider',
        };
      }

      const firstNameMatch = this.calculateNameMatchConfidence(
        firstName.toLowerCase(),
        (entity.first_name || entity.firstname || '').toLowerCase()
      );
      const lastNameMatch = this.calculateNameMatchConfidence(
        lastName.toLowerCase(),
        (entity.last_name || entity.surname || '').toLowerCase()
      );
      const confidence = (firstNameMatch + lastNameMatch) / 2;

      const isVerified = confidence >= 80;

      console.log(`[Dojah] Voter's Card Verification Result: ${isVerified ? 'VERIFIED' : 'FAILED'} (Confidence: ${confidence.toFixed(2)}%)`);

      return {
        success: isVerified,
        status: isVerified ? 'verified' : 'failed',
        confidence,
        referenceId: response.data.reference_id || `VIN-${Date.now()}`,
        data: {
          vin: entity.vin,
          firstName: entity.first_name || entity.firstname,
          lastName: entity.last_name || entity.surname,
          gender: entity.gender,
          state: entity.state,
          lga: entity.lga,
          pollingUnit: entity.polling_unit || entity.pu,
          occupation: entity.occupation,
        },
      };
    } catch (error) {
      return this.handleError(error as AxiosError, endpoint, { vin: '***' }, startTime);
    }
  }

  /**
   * Verify document upload using Dojah Document Analysis API
   * Dojah Endpoint: POST /api/v1/document/analysis
   * Documentation: https://docs.dojah.io/
   *
   * Supports: NIN slip, Passport, Driver's License, Utility Bills, etc.
   */
  async verifyDocument(
    documentType: string,
    fileUrl: string,
    metadata: any
  ): Promise<VerificationResult> {
    const startTime = Date.now();
    const endpoint = '/api/v1/document/analysis';

    try {
      console.log(`[Dojah] Analyzing document: ${documentType}`);

      // Download the document from the file URL
      const fileResponse = await axios.get(fileUrl, { responseType: 'arraybuffer' });
      const base64Image = Buffer.from(fileResponse.data).toString('base64');

      // Map document types to Dojah's expected format
      const dojahDocType = this.mapDocumentType(documentType);

      // Call Dojah Document Analysis API
      const response = await this.client.post(endpoint, {
        document_image: base64Image,
        document_type: dojahDocType,
      });

      const duration = Date.now() - startTime;
      await this.logProviderCall(endpoint, { document_type: dojahDocType }, response.data, response.status, duration, true);

      const entity = response.data?.entity;

      if (!entity || !response.data) {
        // If Dojah can't analyze, mark for manual review
        console.log(`[Dojah] Document analysis failed, marking for manual review`);
        return {
          success: false,
          status: 'pending',
          confidence: 0,
          referenceId: `DOC-${Date.now()}`,
          data: {
            documentType,
            fileUrl,
            requiresManualReview: true,
          },
        };
      }

      // Extract confidence from Dojah response
      const confidence = entity.confidence_score || entity.authenticity_score || 0;
      const isVerified = confidence >= 70; // Lower threshold for documents

      console.log(`[Dojah] Document Analysis Result: ${isVerified ? 'VERIFIED' : 'FAILED'} (Confidence: ${confidence}%)`);

      return {
        success: isVerified,
        status: isVerified ? 'verified' : 'pending',
        confidence,
        referenceId: response.data.reference_id || `DOC-${Date.now()}`,
        data: {
          documentType,
          extractedData: entity,
          authenticityScore: entity.authenticity_score,
          documentNumber: entity.document_number,
          fullName: entity.full_name || `${entity.first_name || ''} ${entity.last_name || ''}`.trim(),
          dateOfBirth: entity.date_of_birth,
          address: entity.address,
          issueDate: entity.issue_date,
          expiryDate: entity.expiry_date,
          requiresManualReview: !isVerified,
        },
      };
    } catch (error) {
      console.error(`[Dojah] Document analysis error:`, error);
      // On error, mark for manual review instead of failing
      return {
        success: false,
        status: 'pending',
        confidence: 0,
        referenceId: `DOC-${Date.now()}`,
        data: {
          documentType,
          fileUrl,
          requiresManualReview: true,
          error: (error as Error).message,
        },
      };
    }
  }

  /**
   * Map internal document types to Dojah's expected format
   */
  private mapDocumentType(documentType: string): string {
    const mapping: { [key: string]: string } = {
      'nin': 'nin_slip',
      'passport': 'passport',
      'drivers_license': 'drivers_license',
      'voters_card': 'voters_card',
      'utility_bill': 'utility_bill',
      'proof_of_address': 'utility_bill',
    };

    return mapping[documentType] || documentType;
  }

  /**
   * Check verification status
   */
  async checkStatus(referenceId: string): Promise<VerificationResult> {
    const startTime = Date.now();
    const endpoint = `/api/v1/kyc/status/${referenceId}`;

    try {
      console.log(`[Dojah] Checking status for reference: ${referenceId}`);

      const response = await this.client.get(endpoint);

      const duration = Date.now() - startTime;
      await this.logProviderCall(endpoint, { referenceId }, response.data, response.status, duration, true);

      return {
        success: response.data.status === 'success',
        status: response.data.status === 'success' ? 'verified' : 'failed',
        confidence: response.data.confidence || 0,
        referenceId,
        data: response.data.entity,
      };
    } catch (error) {
      return this.handleError(error as AxiosError, endpoint, { referenceId }, startTime);
    }
  }

  /**
   * Log provider API call to database
   */
  private async logProviderCall(
    endpoint: string,
    requestPayload: any,
    responsePayload: any,
    statusCode: number,
    duration: number,
    success: boolean,
    errorMessage?: string
  ): Promise<void> {
    try {
      await prisma.provider_logs.create({
        data: {
          provider: this.name,
          endpoint,
          requestPayload: sanitizePayload(requestPayload),
          responsePayload: sanitizePayload(responsePayload),
          statusCode,
          duration,
          success,
          errorMessage,
        },
      });
    } catch (error) {
      console.error('[Dojah] Failed to log provider call:', error);
    }
  }

  /**
   * Handle API errors
   */
  private async handleError(
    error: AxiosError,
    endpoint: string,
    requestPayload: any,
    startTime: number
  ): Promise<VerificationResult> {
    const duration = Date.now() - startTime;
    const statusCode = error.response?.status || 500;
    const errorMessage = error.response?.data?.message || error.message;

    console.error(`[Dojah] API Error:`, {
      endpoint,
      statusCode,
      message: errorMessage,
    });

    await this.logProviderCall(
      endpoint,
      requestPayload,
      error.response?.data || {},
      statusCode,
      duration,
      false,
      errorMessage
    );

    return {
      success: false,
      status: 'failed',
      confidence: 0,
      referenceId: '',
      error: errorMessage,
    };
  }
}

