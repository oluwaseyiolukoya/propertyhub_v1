import { DojahProvider } from "../providers/dojah.provider";
import prisma from "../lib/db";
import { VerificationResult } from "../types/verification";
import { AxiosError } from "axios";
import { decrypt } from "../lib/encryption";

interface TenantData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
}

interface VerificationDocument {
  id: string;
  type: string;
  documentNumber?: string | null; // Document number stored in DB
  fileName: string;
  metadata?: any;
}

interface ComparisonResult {
  tenantData: any;
  dojahData: any;
  matches: {
    name: boolean;
    dob: boolean | null;
  };
  confidence: number;
}

export class DojahVerificationService {
  private dojahProvider: DojahProvider;

  constructor() {
    this.dojahProvider = new DojahProvider();
  }

  /**
   * Verify tenant documents using Dojah
   */
  async verifyTenantDocuments(
    tenantId: string,
    documentType: "nin" | "passport" | "dl" | "vin" | "bvn",
    documents: VerificationDocument[],
    tenantData: TenantData
  ): Promise<{
    success: boolean;
    result: VerificationResult;
    comparison: ComparisonResult;
  }> {
    try {
      // Find the document of the specified type with flexible matching
      const document = documents.find((doc) => {
        const docType = (doc.type || "").toLowerCase();
        const fileName = (doc.fileName || "").toLowerCase();

        // Direct match
        if (docType === documentType) return true;

        // Type-specific matching
        switch (documentType) {
          case "nin":
            return (
              docType.includes("nin") ||
              docType.includes("national") ||
              fileName.includes("nin")
            );
          case "passport":
            return (
              docType.includes("passport") || fileName.includes("passport")
            );
          case "dl":
            return (
              docType.includes("driver") ||
              docType.includes("license") ||
              docType === "dl" ||
              fileName.includes("driver") ||
              fileName.includes("license")
            );
          case "vin":
            return (
              docType.includes("voter") ||
              docType.includes("vin") ||
              fileName.includes("voter")
            );
          case "bvn":
            return docType.includes("bvn") || fileName.includes("bvn");
          default:
            return fileName.includes(documentType);
        }
      });

      if (!document) {
        throw new Error(
          `No ${documentType} document found. Available types: ${documents
            .map((d) => d.type)
            .join(", ")}`
        );
      }

      // Extract document number from metadata or parse from document
      const documentNumber = this.extractDocumentNumber(document, documentType);

      if (!documentNumber) {
        throw new Error(
          `Could not extract ${documentType} number from document`
        );
      }

      // Call appropriate Dojah verification method
      let verificationResult: VerificationResult;

      switch (documentType) {
        case "nin":
          verificationResult = await this.dojahProvider.verifyNIN(
            documentNumber,
            tenantData.firstName,
            tenantData.lastName,
            tenantData.dateOfBirth
          );
          break;

        case "passport":
          verificationResult = await this.dojahProvider.verifyPassport(
            documentNumber,
            tenantData.firstName,
            tenantData.lastName
          );
          break;

        case "dl":
          verificationResult = await this.dojahProvider.verifyDriversLicense(
            documentNumber,
            tenantData.firstName,
            tenantData.lastName,
            tenantData.dateOfBirth
          );
          break;

        case "vin":
          verificationResult = await this.dojahProvider.verifyVotersCard(
            documentNumber,
            tenantData.firstName,
            tenantData.lastName
          );
          break;

        case "bvn":
          verificationResult = await this.verifyBVN(
            documentNumber,
            tenantData.firstName,
            tenantData.lastName,
            tenantData.dateOfBirth
          );
          break;

        default:
          throw new Error(`Unsupported document type: ${documentType}`);
      }

      // Compare tenant data with Dojah response
      const comparison = this.compareData(tenantData, verificationResult.data);

      // Override provider's success based on service's recalculated confidence
      // This handles cases where provider uses simple name matching but service uses smarter matching
      const isVerified = comparison.confidence >= 80;
      if (isVerified && !verificationResult.success) {
        console.log(
          `[DojahVerification] Overriding provider result: confidence ${comparison.confidence}% >= 80%, marking as VERIFIED`
        );
        verificationResult.success = true;
        verificationResult.status = "verified";
        verificationResult.confidence = comparison.confidence;
      }

      // Log verification attempt
      await this.logVerification(
        tenantId,
        documentType,
        verificationResult,
        comparison
      );

      return {
        success: isVerified,
        result: verificationResult,
        comparison,
      };
    } catch (error: any) {
      console.error("[DojahVerificationService] Error:", error);
      throw error;
    }
  }

  /**
   * Extract document number from document object, metadata or filename
   * NOTE: documentNumber from DB is encrypted with AES-256-GCM
   */
  private extractDocumentNumber(
    document: VerificationDocument,
    documentType: string
  ): string | null {
    // 1. Try direct documentNumber field first (from DB - ENCRYPTED)
    if (document.documentNumber) {
      try {
        // Check if it's encrypted (format: iv:authTag:ciphertext)
        if (document.documentNumber.includes(":")) {
          const decryptedNumber = decrypt(document.documentNumber);
          console.log(
            `[DojahVerification] Decrypted documentNumber: ***${decryptedNumber.slice(
              -4
            )}`
          );
          return decryptedNumber;
        }
        // Not encrypted (plain text)
        console.log(
          `[DojahVerification] Found plain documentNumber: ***${document.documentNumber.slice(
            -4
          )}`
        );
        return document.documentNumber;
      } catch (error) {
        console.error(
          `[DojahVerification] Failed to decrypt documentNumber:`,
          error
        );
        // Continue to fallback methods
      }
    }

    // 2. Try metadata
    if (document.metadata?.number) {
      console.log(`[DojahVerification] Found number in metadata`);
      return document.metadata.number;
    }

    if (document.metadata?.documentNumber) {
      console.log(`[DojahVerification] Found documentNumber in metadata`);
      return document.metadata.documentNumber;
    }

    // 3. Try parsing from filename (e.g., "NIN_12345678901.pdf")
    const fileName = document.fileName || "";
    const match = fileName.match(/(\d{11,})/); // Match 11+ digit numbers
    if (match) {
      console.log(`[DojahVerification] Extracted number from filename`);
      return match[1];
    }

    console.log(`[DojahVerification] Could not extract document number from:`, {
      documentNumber: document.documentNumber ? "***encrypted***" : "null",
      metadata: document.metadata,
      fileName: document.fileName,
    });
    return null;
  }

  /**
   * Verify BVN (Bank Verification Number)
   * Dojah Endpoint: GET /api/v1/kyc/bvn
   */
  private async verifyBVN(
    bvn: string,
    firstName: string,
    lastName: string,
    dob?: string
  ): Promise<VerificationResult> {
    const startTime = Date.now();
    const endpoint = "/api/v1/kyc/bvn";

    try {
      console.log(`[Dojah] Verifying BVN: ${bvn.substring(0, 3)}***`);

      // Access the axios client from dojahProvider
      const dojahProvider = this.dojahProvider as any;
      const params: any = { bvn };
      if (firstName) params.first_name = firstName;
      if (lastName) params.last_name = lastName;
      if (dob) params.dob = dob; // Format: YYYY-MM-DD

      const response = await dojahProvider.client.get(endpoint, { params });

      const entity = response.data?.entity;

      if (!entity || !entity.bvn?.status) {
        return {
          success: false,
          status: "failed",
          confidence: 0,
          referenceId: "",
          error: "BVN not found or invalid",
        };
      }

      // Calculate confidence from BVN validation response
      const firstNameConfidence = entity.first_name?.confidence_value || 0;
      const lastNameConfidence = entity.last_name?.confidence_value || 0;
      const confidence = (firstNameConfidence + lastNameConfidence) / 2;

      const isVerified =
        confidence >= 80 &&
        entity.first_name?.status &&
        entity.last_name?.status;

      console.log(
        `[Dojah] BVN Verification Result: ${
          isVerified ? "VERIFIED" : "FAILED"
        } (Confidence: ${confidence.toFixed(2)}%)`
      );

      return {
        success: isVerified,
        status: isVerified ? "verified" : "failed",
        confidence,
        referenceId: `BVN-${Date.now()}`,
        data: {
          bvn: entity.bvn.value,
          firstName: entity.first_name?.value || "",
          lastName: entity.last_name?.value || "",
          firstNameMatch: entity.first_name?.status || false,
          lastNameMatch: entity.last_name?.status || false,
        },
      };
    } catch (error: any) {
      console.error(
        "[DojahVerificationService] BVN verification error:",
        error
      );
      return {
        success: false,
        status: "failed",
        confidence: 0,
        referenceId: "",
        error: error.message || "BVN verification failed",
      };
    }
  }

  /**
   * Compare tenant data with Dojah response
   * Note: dojahData comes from provider which uses camelCase (firstName, lastName)
   */
  private compareData(
    tenantData: TenantData,
    dojahData: any
  ): ComparisonResult {
    const matches: any = {};

    // Name comparison - handle both camelCase (from provider) and snake_case (raw API)
    const tenantFullName = `${tenantData.firstName} ${tenantData.lastName}`
      .toLowerCase()
      .trim();

    // Extract Dojah first name (check all possible key formats)
    const dojahFirstName = (
      dojahData?.firstName || // camelCase from provider
      dojahData?.firstname || // lowercase
      dojahData?.first_name || // snake_case from raw API
      ""
    )
      .toString()
      .toLowerCase()
      .trim();

    // Extract Dojah last name (check all possible key formats)
    const dojahLastName = (
      dojahData?.lastName || // camelCase from provider
      dojahData?.surname || // Dojah uses 'surname' for passport
      dojahData?.last_name || // snake_case
      ""
    )
      .toString()
      .toLowerCase()
      .trim();

    const dojahFullName = `${dojahFirstName} ${dojahLastName}`.trim();

    console.log(`[DojahVerification] Name comparison:`, {
      tenantFullName,
      dojahFullName,
      dojahDataKeys: dojahData ? Object.keys(dojahData) : [],
    });

    matches.name =
      this.calculateNameMatchConfidence(tenantFullName, dojahFullName) >= 80;

    // DOB comparison - handle multiple date field names
    const tenantDob = tenantData.dateOfBirth;
    const dojahDob =
      dojahData?.dateOfBirth ||
      dojahData?.date_of_birth ||
      dojahData?.birthdate;

    if (tenantDob && dojahDob) {
      matches.dob = tenantDob === dojahDob;
    } else {
      matches.dob = null;
    }

    // Calculate overall confidence
    const nameConfidence = this.calculateNameMatchConfidence(
      tenantFullName,
      dojahFullName
    );
    const dobConfidence = matches.dob === null ? 0 : matches.dob ? 100 : 0;
    const confidence =
      matches.dob !== null
        ? nameConfidence * 0.6 + dobConfidence * 0.4
        : nameConfidence;

    console.log(`[DojahVerification] Confidence calculated:`, {
      nameConfidence,
      dobConfidence,
      finalConfidence: confidence,
    });

    return {
      tenantData,
      dojahData,
      matches,
      confidence,
    };
  }

  /**
   * Calculate name match confidence using Levenshtein distance
   * Handles swapped names (e.g., "John Doe" vs "Doe John") by trying both orders
   */
  private calculateNameMatchConfidence(name1: string, name2: string): number {
    if (name1 === name2) return 100;

    const words1 = name1.split(" ").filter((w) => w.length > 0);
    const words2 = name2.split(" ").filter((w) => w.length > 0);

    // Handle different word counts - try to find best word matches
    if (words1.length === 0 || words2.length === 0) return 0;

    // Calculate match in normal order
    const normalMatch = this.calculateOrderedNameMatch(words1, words2);

    // Calculate match with swapped order (for sandbox data inconsistency)
    const words2Reversed = [...words2].reverse();
    const swappedMatch = this.calculateOrderedNameMatch(words1, words2Reversed);

    // Return the better match
    const bestMatch = Math.max(normalMatch, swappedMatch);

    console.log(
      `[DojahVerification] Name match: "${name1}" vs "${name2}" -> normal: ${normalMatch.toFixed(
        1
      )}%, swapped: ${swappedMatch.toFixed(1)}%, best: ${bestMatch.toFixed(1)}%`
    );

    return bestMatch;
  }

  /**
   * Calculate ordered name match between two word arrays
   */
  private calculateOrderedNameMatch(
    words1: string[],
    words2: string[]
  ): number {
    // If different lengths, match as many words as possible
    const minLen = Math.min(words1.length, words2.length);
    if (minLen === 0) return 0;

    let totalMatch = 0;
    for (let i = 0; i < minLen; i++) {
      if (words1[i] === words2[i]) {
        totalMatch += 100;
      } else {
        const similarity = this.calculateSimilarity(words1[i], words2[i]);
        totalMatch += similarity * 100;
      }
    }

    // Penalize for missing words but don't zero out
    const maxLen = Math.max(words1.length, words2.length);
    return (totalMatch / minLen) * (minLen / maxLen);
  }

  /**
   * Calculate similarity between two strings
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const maxLen = Math.max(str1.length, str2.length);
    if (maxLen === 0) return 1;

    const distance = this.levenshteinDistance(str1, str2);
    return 1 - distance / maxLen;
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

  /**
   * Log verification attempt to audit log
   */
  private async logVerification(
    tenantId: string,
    documentType: string,
    result: VerificationResult,
    comparison: ComparisonResult
  ): Promise<void> {
    try {
      const customerId =
        (
          await prisma.users.findUnique({
            where: { id: tenantId },
            select: { customerId: true },
          })
        )?.customerId || "";

      await prisma.activity_logs.create({
        data: {
          id: crypto.randomUUID(),
          customerId,
          userId: tenantId,
          action: "kyc_verification",
          entity: "tenant",
          entityId: tenantId,
          description: `KYC verification via Dojah (${documentType}): ${
            result.success ? "Verified" : "Failed"
          } (Confidence: ${comparison.confidence.toFixed(2)}%)`,
          metadata: {
            documentType,
            referenceId: result.referenceId,
            confidence: comparison.confidence,
            matches: comparison.matches,
          },
        },
      });
    } catch (error) {
      console.warn(
        "[DojahVerificationService] Failed to log verification:",
        error
      );
    }
  }
}

// Export singleton instance
export const dojahVerificationService = new DojahVerificationService();
