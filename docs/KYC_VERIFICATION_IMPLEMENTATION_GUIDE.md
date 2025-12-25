# KYC Verification Module - Implementation Guide

## Quick Start

This guide provides step-by-step implementation instructions for adding the "Verify KYC" feature to the Property Owner Dashboard.

**📚 Important:** Before implementing, review the [Dojah API Reference](./KYC_VERIFICATION_DOJAH_API_REFERENCE.md) for correct endpoints, parameters, and response formats.

---

## Step 1: Create Backend Service

### File: `backend/src/services/dojah-verification.service.ts`

```typescript
import { DojahProvider } from "../providers/dojah.provider";
import prisma from "../lib/db";
import { VerificationResult } from "../types/verification";

interface TenantData {
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  email: string;
  phone?: string;
}

interface VerificationDocument {
  id: string;
  type: string;
  fileName: string;
  fileUrl: string;
  metadata?: any;
}

interface ComparisonResult {
  matches: {
    name: boolean;
    dob: boolean;
    [key: string]: boolean;
  };
  confidence: number;
  tenantData: any;
  dojahData: any;
}

export class DojahVerificationService {
  private dojahProvider: DojahProvider;

  constructor() {
    this.dojahProvider = new DojahProvider();
  }

  /**
   * Main entry point - verify tenant documents using Dojah
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
      // Find the document of the specified type
      const document = documents.find(
        (doc) =>
          doc.type.toLowerCase() === documentType ||
          doc.fileName.toLowerCase().includes(documentType)
      );

      if (!document) {
        throw new Error(`Document of type ${documentType} not found`);
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
            tenantData.lastName,
            tenantData.dateOfBirth
          );
          break;

        case "dl":
          // ⚠️ Note: Dojah docs specify /api/v1/kyc/dl but existing code uses /api/v1/kyc/drivers_license
          // Verify which endpoint works in production before deploying
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
          // BVN validation endpoint: GET /api/v1/kyc/bvn
          // Returns confidence values for name matching
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

      // Log verification attempt
      await this.logVerification(
        tenantId,
        documentType,
        verificationResult,
        comparison
      );

      return {
        success: verificationResult.success,
        result: verificationResult,
        comparison,
      };
    } catch (error: any) {
      console.error("[DojahVerificationService] Error:", error);
      throw error;
    }
  }

  /**
   * Extract document number from document metadata or file
   */
  private extractDocumentNumber(
    document: VerificationDocument,
    documentType: string
  ): string | null {
    // Try metadata first
    if (document.metadata?.number) {
      return document.metadata.number;
    }

    if (document.metadata?.documentNumber) {
      return document.metadata.documentNumber;
    }

    // Try parsing from filename (e.g., "NIN_12345678901.pdf")
    const fileName = document.fileName || "";
    const match = fileName.match(/(\d{11,})/); // Match 11+ digit numbers
    if (match) {
      return match[1];
    }

    // For production, you might need OCR to extract from document image
    // For now, return null and let the API handle the error
    return null;
  }

  /**
   * Verify BVN (Bank Verification Number)
   * Dojah Endpoint: GET /api/v1/kyc/bvn
   * Documentation: https://docs.dojah.io/docs/nigeria/validate-bvn
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

      const params: any = { bvn };
      if (firstName) params.first_name = firstName;
      if (lastName) params.last_name = lastName;
      if (dob) params.dob = dob; // Format: YYYY-MM-DD

      // Access the axios client from dojahProvider
      const response = await (this.dojahProvider as any).client.get(endpoint, {
        params,
      });

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
   */
  private compareData(
    tenantData: TenantData,
    dojahData: any
  ): ComparisonResult {
    const matches: any = {};

    // Name comparison
    const tenantFullName =
      `${tenantData.firstName} ${tenantData.lastName}`.toLowerCase();
    const dojahFullName = `${
      dojahData?.firstname || dojahData?.first_name || ""
    } ${dojahData?.surname || dojahData?.last_name || ""}`.toLowerCase();
    matches.name =
      this.calculateNameMatchConfidence(tenantFullName, dojahFullName) >= 80;

    // DOB comparison
    if (tenantData.dateOfBirth && dojahData?.birthdate) {
      matches.dob = tenantData.dateOfBirth === dojahData.birthdate;
    } else {
      matches.dob = null; // Not available for comparison
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

    return {
      matches,
      confidence,
      tenantData,
      dojahData,
    };
  }

  /**
   * Calculate name match confidence using Levenshtein distance
   */
  private calculateNameMatchConfidence(name1: string, name2: string): number {
    // Simple implementation - can be enhanced
    if (name1 === name2) return 100;

    const words1 = name1.split(" ").filter((w) => w.length > 0);
    const words2 = name2.split(" ").filter((w) => w.length > 0);

    if (words1.length !== words2.length) return 0;

    let totalMatch = 0;
    for (let i = 0; i < words1.length; i++) {
      if (words1[i] === words2[i]) {
        totalMatch += 100;
      } else {
        // Calculate similarity
        const similarity = this.levenshteinSimilarity(words1[i], words2[i]);
        totalMatch += similarity * 100;
      }
    }

    return totalMatch / words1.length;
  }

  /**
   * Calculate Levenshtein similarity (0-1)
   */
  private levenshteinSimilarity(str1: string, str2: string): number {
    const maxLen = Math.max(str1.length, str2.length);
    if (maxLen === 0) return 1;

    const distance = this.levenshteinDistance(str1, str2);
    return 1 - distance / maxLen;
  }

  /**
   * Calculate Levenshtein distance
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
   * Log verification attempt to database
   */
  private async logVerification(
    tenantId: string,
    documentType: string,
    result: VerificationResult,
    comparison: ComparisonResult
  ): Promise<void> {
    try {
      // Log to activity_logs or create verification_history table
      await prisma.activity_logs.create({
        data: {
          id: crypto.randomUUID(),
          customerId:
            (
              await prisma.users.findUnique({
                where: { id: tenantId },
                select: { customerId: true },
              })
            )?.customerId || "",
          userId: tenantId,
          action: "kyc_verification",
          entity: "tenant",
          entityId: tenantId,
          description: `KYC verification via Dojah (${documentType}): ${
            result.success ? "Verified" : "Failed"
          } (Confidence: ${comparison.confidence.toFixed(2)}%)`,
          metadata: {
            documentType,
            confidence: comparison.confidence,
            referenceId: result.referenceId,
            status: result.status,
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

export const dojahVerificationService = new DojahVerificationService();
```

---

## Step 2: Add Backend API Endpoint

### File: `backend/src/routes/owner-verification.ts`

Add this endpoint after the existing approve/reject endpoints:

```typescript
/**
 * Verify tenant KYC using Dojah (Owner action)
 * POST /api/owner/tenants/verifications/:tenantId/verify-kyc
 */
router.post(
  "/tenants/verifications/:tenantId/verify-kyc",
  authMiddleware,
  ownerOrManagerOnly,
  async (req: AuthRequest, res: Response) => {
    try {
      const customerId = req.user?.customerId;
      const ownerId = req.user?.id;
      const { tenantId } = req.params;
      const { documentType, documentId } = req.body;

      if (!customerId || !ownerId) {
        return res.status(400).json({ error: "User information not found" });
      }

      if (
        !documentType ||
        !["nin", "passport", "dl", "vin", "bvn"].includes(documentType)
      ) {
        return res.status(400).json({
          error:
            "Invalid document type. Must be: nin, passport, dl, vin, or bvn",
        });
      }

      // Verify tenant belongs to this owner's customer
      const tenant = await prisma.users.findFirst({
        where: {
          id: tenantId,
          customerId,
          role: "tenant",
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          kycVerificationId: true,
          kycStatus: true,
        },
      });

      if (!tenant) {
        return res.status(404).json({ error: "Tenant not found" });
      }

      if (!tenant.kycVerificationId) {
        return res.status(400).json({
          error:
            "Tenant has no verification request. Please request KYC submission first.",
        });
      }

      // Fetch tenant documents from verification service
      let documents: any[] = [];
      try {
        const verificationDetails = await adminService.getRequestDetails(
          tenant.kycVerificationId
        );
        documents = verificationDetails?.documents || [];
      } catch (error) {
        console.error("[OwnerVerification] Failed to fetch documents:", error);
        return res
          .status(500)
          .json({ error: "Failed to fetch tenant documents" });
      }

      if (documents.length === 0) {
        return res
          .status(400)
          .json({ error: "No documents found for this tenant" });
      }

      // Extract tenant data for comparison
      const tenantData = {
        firstName: tenant.name.split(" ")[0] || tenant.name,
        lastName: tenant.name.split(" ").slice(1).join(" ") || tenant.name,
        email: tenant.email,
        phone: tenant.phone || undefined,
        // You might need to fetch DOB from tenant profile or documents
        dateOfBirth: undefined, // Add logic to extract from documents or tenant profile
      };

      // Perform Dojah verification
      const { dojahVerificationService } = await import(
        "../services/dojah-verification.service"
      );
      const verificationResult =
        await dojahVerificationService.verifyTenantDocuments(
          tenantId,
          documentType as "nin" | "passport" | "dl" | "vin",
          documents,
          tenantData
        );

      // Update tenant KYC status based on result
      let newKycStatus = tenant.kycStatus;
      if (
        verificationResult.result.success &&
        verificationResult.comparison.confidence >= 80
      ) {
        newKycStatus = "verified";
      } else if (verificationResult.comparison.confidence >= 60) {
        newKycStatus = "pending_review"; // Needs manual review
      } else {
        newKycStatus = "rejected";
      }

      // Update tenant record (don't auto-approve, let owner decide)
      await prisma.users.update({
        where: { id: tenantId },
        data: {
          kycStatus: newKycStatus,
          kycLastAttemptAt: new Date(),
          // Don't update kycOwnerApprovalStatus - owner will decide after reviewing results
        },
      });

      return res.json({
        success: true,
        result: {
          status: verificationResult.result.status,
          confidence: verificationResult.comparison.confidence,
          referenceId: verificationResult.result.referenceId,
          data: verificationResult.result.data,
          comparison: {
            tenantData: verificationResult.comparison.tenantData,
            dojahData: verificationResult.comparison.dojahData,
            matches: verificationResult.comparison.matches,
          },
        },
        message: `Verification ${
          verificationResult.result.success ? "completed" : "failed"
        }. Confidence: ${verificationResult.comparison.confidence.toFixed(2)}%`,
      });
    } catch (error: any) {
      console.error("[OwnerVerification] Verify KYC error:", error);
      return res.status(500).json({
        error: "Failed to verify KYC",
        message: error.message || "An error occurred during verification",
      });
    }
  }
);
```

---

## Step 3: Add Frontend API Function

### File: `src/lib/api/owner-verification.ts`

Add this function:

```typescript
/**
 * Verify tenant KYC using Dojah
 */
export async function verifyTenantKYC(
  tenantId: string,
  documentType: "nin" | "passport" | "dl" | "vin" | "bvn",
  documentId?: string
): Promise<
  ApiResponse<{
    success: boolean;
    result: {
      status: string;
      confidence: number;
      referenceId: string;
      data: any;
      comparison: {
        tenantData: any;
        dojahData: any;
        matches: any;
      };
    };
    message: string;
  }>
> {
  return apiClient.post(
    `/api/owner/tenants/verifications/${tenantId}/verify-kyc`,
    { documentType, documentId }
  );
}
```

---

## Step 4: Create KYC Verification Dialog Component

### File: `src/components/owner/KYCVerificationDialog.tsx`

```typescript
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Loader2,
  ShieldCheck,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  verifyTenantKYC,
  TenantVerificationDetails,
} from "../../lib/api/owner-verification";

interface KYCVerificationDialogProps {
  open: boolean;
  onClose: () => void;
  tenant: TenantVerificationDetails | null;
  onVerified: () => void;
}

export const KYCVerificationDialog: React.FC<KYCVerificationDialogProps> = ({
  open,
  onClose,
  tenant,
  onVerified,
}) => {
  const [documentType, setDocumentType] = useState<
    "nin" | "passport" | "dl" | "vin" | "bvn" | ""
  >("");
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);

  useEffect(() => {
    if (open) {
      // Reset state when dialog opens
      setDocumentType("");
      setVerificationResult(null);
    }
  }, [open]);

  const handleVerify = async () => {
    if (!tenant || !documentType) {
      toast.error("Please select a document type");
      return;
    }

    try {
      setVerifying(true);
      const response = await verifyTenantKYC(tenant.id, documentType as any);

      if (response.error) {
        toast.error(response.error);
        return;
      }

      if (response.data) {
        setVerificationResult(response.data.result);
        toast.success(
          `Verification completed! Confidence: ${response.data.result.confidence.toFixed(
            2
          )}%`
        );
      }
    } catch (error: any) {
      console.error("Verify KYC error:", error);
      toast.error("Failed to verify KYC. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  if (!tenant) return null;

  const availableDocuments = tenant.documents || [];
  const documentTypes = ["nin", "passport", "dl", "vin", "bvn"].filter((type) =>
    availableDocuments.some(
      (doc) =>
        doc.type?.toLowerCase().includes(type) ||
        doc.fileName?.toLowerCase().includes(type)
    )
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Verify KYC - {tenant.name}</DialogTitle>
          <DialogDescription>
            Verify tenant identity using Dojah KYC verification service
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Tenant Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Tenant Information</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <strong>Name:</strong> {tenant.name}
              </div>
              <div>
                <strong>Email:</strong> {tenant.email}
              </div>
              <div>
                <strong>Phone:</strong> {tenant.phone || "N/A"}
              </div>
              <div>
                <strong>Status:</strong> <Badge>{tenant.kycStatus}</Badge>
              </div>
            </div>
          </div>

          {/* Document Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Select Document Type to Verify
            </label>
            <Select
              value={documentType}
              onValueChange={(value) => setDocumentType(value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose document type" />
              </SelectTrigger>
              <SelectContent>
                {documentTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Verification Button */}
          <Button
            onClick={handleVerify}
            disabled={!documentType || verifying}
            className="w-full"
          >
            {verifying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying with Dojah...
              </>
            ) : (
              <>
                <ShieldCheck className="mr-2 h-4 w-4" />
                Start Verification
              </>
            )}
          </Button>

          {/* Verification Results */}
          {verificationResult && (
            <div className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Verification Results</h3>
                <Badge
                  variant={
                    verificationResult.confidence >= 80
                      ? "default"
                      : "destructive"
                  }
                  className={
                    verificationResult.confidence >= 80
                      ? "bg-green-500"
                      : verificationResult.confidence >= 60
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }
                >
                  {verificationResult.confidence.toFixed(2)}% Confidence
                </Badge>
              </div>

              {/* Comparison Table */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Tenant Data</h4>
                  <div className="text-sm space-y-1 bg-gray-50 p-3 rounded">
                    <div>
                      <strong>Name:</strong>{" "}
                      {verificationResult.comparison.tenantData.firstName}{" "}
                      {verificationResult.comparison.tenantData.lastName}
                    </div>
                    {verificationResult.comparison.tenantData.dateOfBirth && (
                      <div>
                        <strong>DOB:</strong>{" "}
                        {verificationResult.comparison.tenantData.dateOfBirth}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Dojah Data</h4>
                  <div className="text-sm space-y-1 bg-gray-50 p-3 rounded">
                    <div>
                      <strong>Name:</strong>{" "}
                      {verificationResult.comparison.dojahData?.firstname ||
                        verificationResult.comparison.dojahData
                          ?.first_name}{" "}
                      {verificationResult.comparison.dojahData?.surname ||
                        verificationResult.comparison.dojahData?.last_name}
                      {verificationResult.comparison.matches.name ? <CheckCircle className="inline ml-2 h-4 w-4 text-green-500" /> : <XCircle className="inline ml-2 h-4 w-4 text-red-500" />}
                    </div>
                    {verificationResult.comparison.dojahData?.birthdate && (
                      <div>
                        <strong>DOB:</strong>{" "}
                        {verificationResult.comparison.dojahData.birthdate}
                        {verificationResult.comparison.matches.dob === true ? (
                          <CheckCircle className="inline ml-2 h-4 w-4 text-green-500" />
                        ) : verificationResult.comparison.matches.dob ===
                          false ? (
                          <XCircle className="inline ml-2 h-4 w-4 text-red-500" />
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Recommendation */}
              <div className="bg-blue-50 p-3 rounded">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                  <div className="text-sm">
                    <strong>Recommendation:</strong>{" "}
                    {verificationResult.confidence >= 80
                      ? "Data matches. You can approve this tenant."
                      : verificationResult.confidence >= 60
                      ? "Partial match. Please review carefully before approving."
                      : "Data does not match. Consider rejecting or requesting more information."}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {verificationResult && (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  // Navigate to approve modal
                  onVerified();
                  onClose();
                }}
              >
                Review & Approve
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
```

---

## Step 5: Integrate into TenantVerificationManagement

### File: `src/components/owner/TenantVerificationManagement.tsx`

**Add import:**

```typescript
import { KYCVerificationDialog } from "./KYCVerificationDialog";
```

**Add state:**

```typescript
const [showVerifyKYCModal, setShowVerifyKYCModal] = useState(false);
const [tenantToVerify, setTenantToVerify] =
  useState<TenantVerificationDetails | null>(null);
```

**Add handler:**

```typescript
const handleVerifyKYC = async (tenantId: string) => {
  try {
    const response = await getTenantVerificationDetails(tenantId);
    if (response.data?.tenant) {
      setTenantToVerify(response.data.tenant);
      setShowVerifyKYCModal(true);
    }
  } catch (error: any) {
    toast.error("Failed to load tenant details");
  }
};
```

**Add to dropdown menu (around line 560):**

```typescript
{
  tenant.kycStatus === "in_progress" && tenant.kycVerificationId && (
    <DropdownMenuItem
      onClick={() => handleVerifyKYC(tenant.id)}
      className="cursor-pointer"
    >
      <ShieldCheck className="h-4 w-4 mr-2" />
      Verify KYC
    </DropdownMenuItem>
  );
}
```

**Add dialog component at the end (before closing component):**

```typescript
<KYCVerificationDialog
  open={showVerifyKYCModal}
  onClose={() => {
    setShowVerifyKYCModal(false);
    setTenantToVerify(null);
  }}
  tenant={tenantToVerify}
  onVerified={() => {
    // Refresh tenant list
    loadTenants();
    loadAnalytics();
  }}
/>
```

---

## Step 6: Environment Variables

Add to `.env` (if not already present):

```bash
DOJAH_APP_ID=your_app_id
DOJAH_API_KEY=your_api_key
DOJAH_BASE_URL=https://api.dojah.io
```

---

## Testing Checklist

- [ ] Backend service compiles without errors
- [ ] API endpoint returns correct response
- [ ] Frontend dialog opens correctly
- [ ] Document type selection works
- [ ] Verification button triggers API call
- [ ] Results display correctly
- [ ] Confidence score shows accurate percentage
- [ ] Comparison table shows tenant vs Dojah data
- [ ] Approve/Reject actions work
- [ ] Error handling works for all scenarios
- [ ] Loading states display correctly

---

## Next Steps

1. Implement backend service
2. Add API endpoint
3. Create frontend dialog
4. Integrate into existing component
5. Test with sandbox Dojah credentials
6. Deploy to staging
7. Test with real data
8. Deploy to production

---

**Last Updated:** December 22, 2025


