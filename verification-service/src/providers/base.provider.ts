import { VerificationResult } from '../types';

/**
 * Abstract interface for identity verification providers
 * Allows easy switching between Dojah, Youverify, Smile Identity, etc.
 */
export interface VerificationProvider {
  name: string;

  /**
   * Verify National Identity Number (NIN)
   * @param nin - National Identity Number
   * @param firstName - First name to match
   * @param lastName - Last name to match
   * @param dob - Date of birth (YYYY-MM-DD)
   */
  verifyNIN(
    nin: string,
    firstName: string,
    lastName: string,
    dob: string
  ): Promise<VerificationResult>;

  /**
   * Verify International Passport
   * @param passportNumber - Passport number
   * @param firstName - First name to match
   * @param lastName - Last name to match
   */
  verifyPassport(
    passportNumber: string,
    firstName: string,
    lastName: string
  ): Promise<VerificationResult>;

  /**
   * Verify Driver's License
   * @param licenseNumber - License number
   * @param firstName - First name to match
   * @param lastName - Last name to match
   */
  verifyDriversLicense(
    licenseNumber: string,
    firstName: string,
    lastName: string
  ): Promise<VerificationResult>;

  /**
   * Verify Voter's Card
   * @param vin - Voter Identification Number
   * @param firstName - First name to match
   * @param lastName - Last name to match
   */
  verifyVotersCard(
    vin: string,
    firstName: string,
    lastName: string
  ): Promise<VerificationResult>;

  /**
   * Verify document upload (utility bill, proof of address, etc.)
   * @param documentType - Type of document
   * @param fileUrl - S3 URL of uploaded document
   * @param metadata - Additional metadata for verification
   */
  verifyDocument(
    documentType: string,
    fileUrl: string,
    metadata: any
  ): Promise<VerificationResult>;

  /**
   * Check verification status by reference ID
   * @param referenceId - Provider's transaction reference
   */
  checkStatus(referenceId: string): Promise<VerificationResult>;
}

/**
 * Base provider class with common functionality
 */
export abstract class BaseVerificationProvider implements VerificationProvider {
  abstract name: string;

  abstract verifyNIN(
    nin: string,
    firstName: string,
    lastName: string,
    dob: string
  ): Promise<VerificationResult>;

  abstract verifyPassport(
    passportNumber: string,
    firstName: string,
    lastName: string
  ): Promise<VerificationResult>;

  abstract verifyDriversLicense(
    licenseNumber: string,
    firstName: string,
    lastName: string
  ): Promise<VerificationResult>;

  abstract verifyVotersCard(
    vin: string,
    firstName: string,
    lastName: string
  ): Promise<VerificationResult>;

  abstract verifyDocument(
    documentType: string,
    fileUrl: string,
    metadata: any
  ): Promise<VerificationResult>;

  abstract checkStatus(referenceId: string): Promise<VerificationResult>;

  /**
   * Validate required fields
   */
  protected validateFields(fields: Record<string, any>): void {
    for (const [key, value] of Object.entries(fields)) {
      if (!value || value.trim() === '') {
        throw new Error(`${key} is required`);
      }
    }
  }

  /**
   * Normalize name for comparison
   */
  protected normalizeName(name: string): string {
    return name.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  /**
   * Calculate match confidence based on name similarity
   */
  protected calculateNameMatchConfidence(
    providedName: string,
    verifiedName: string
  ): number {
    const provided = this.normalizeName(providedName);
    const verified = this.normalizeName(verifiedName);

    if (provided === verified) return 100;

    // Simple Levenshtein distance for name matching
    const distance = this.levenshteinDistance(provided, verified);
    const maxLength = Math.max(provided.length, verified.length);
    const similarity = ((maxLength - distance) / maxLength) * 100;

    return Math.max(0, Math.min(100, similarity));
  }

  /**
   * Levenshtein distance algorithm
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }
}

