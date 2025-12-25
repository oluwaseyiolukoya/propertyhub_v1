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
import { Textarea } from "../ui/textarea";
import {
  Loader2,
  ShieldCheck,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Plus,
  RefreshCw,
  Send,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import {
  verifyTenantKYC,
  requestAdditionalDocument,
  approveTenantKyc,
  TenantVerificationDetails,
  DojahVerificationResult,
} from "../../lib/api/owner-verification";

interface DocumentVerificationResult {
  documentType: string;
  documentId: string;
  result: DojahVerificationResult | null;
  status: "pending" | "verifying" | "verified" | "failed";
  error?: string;
}

interface KYCVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant: TenantVerificationDetails | null;
  onVerified?: () => void;
}

export const KYCVerificationDialog: React.FC<KYCVerificationDialogProps> = ({
  open,
  onOpenChange,
  tenant,
  onVerified,
}) => {
  const [documentResults, setDocumentResults] = useState<
    Map<string, DocumentVerificationResult>
  >(new Map());
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const [requestDocumentTypes, setRequestDocumentTypes] = useState<string[]>(
    []
  );
  const [requesting, setRequesting] = useState(false);
  const [approving, setApproving] = useState(false);

  // Map DB status to component status
  const mapDbStatusToComponentStatus = (
    dbStatus: string
  ): "pending" | "verifying" | "verified" | "failed" => {
    switch (dbStatus?.toLowerCase()) {
      case "verified":
        return "verified";
      case "failed":
      case "rejected":
        return "failed";
      case "processing":
      case "verifying":
        return "verifying";
      default:
        return "pending";
    }
  };

  useEffect(() => {
    if (open && tenant) {
      // Initialize document results from tenant's documents WITH actual status
      const initialResults = new Map<string, DocumentVerificationResult>();
      (tenant.documents || []).forEach((doc) => {
        const docType = mapDocumentType(doc.documentType);
        const componentStatus = mapDbStatusToComponentStatus(doc.status);
        initialResults.set(doc.id, {
          documentType: docType,
          documentId: doc.id,
          result:
            componentStatus === "verified" && doc.confidence !== null
              ? {
                  success: true,
                  status: "verified",
                  confidence: doc.confidence,
                  referenceId: "",
                  data: {},
                  comparison: {
                    tenantData: {},
                    dojahData: {},
                    matches: { name: true, dob: null },
                  },
                }
              : null,
          status: componentStatus,
        });
      });
      setDocumentResults(initialResults);
      setShowRequestForm(false);
      setRequestMessage("");
      setRequestDocumentTypes([]);
    }
  }, [open, tenant]);

  // Map database document types to verification types
  const mapDocumentType = (
    dbType: string
  ): "nin" | "passport" | "dl" | "vin" | "bvn" => {
    const type = dbType?.toLowerCase() || "";
    if (type.includes("nin") || type === "national_id") return "nin";
    if (type.includes("passport")) return "passport";
    if (type.includes("driver") || type === "dl" || type === "drivers_license")
      return "dl";
    if (type.includes("voter") || type === "vin" || type === "voters_card")
      return "vin";
    if (type.includes("bvn")) return "bvn";
    return "nin"; // Default
  };

  const handleVerifyDocument = async (documentId: string) => {
    if (!tenant) return;

    const docResult = documentResults.get(documentId);
    if (!docResult) return;

    // Update status to verifying
    setDocumentResults((prev) => {
      const newMap = new Map(prev);
      newMap.set(documentId, { ...docResult, status: "verifying" });
      return newMap;
    });

    try {
      const response = await verifyTenantKYC(
        tenant.id,
        docResult.documentType,
        documentId
      );

      if (response.data) {
        setDocumentResults((prev) => {
          const newMap = new Map(prev);
          newMap.set(documentId, {
            ...docResult,
            result: response.data.result,
            status: response.data.result.success ? "verified" : "failed",
          });
          return newMap;
        });

        if (response.data.result.success) {
          toast.success(
            `${
              documentTypeLabels[docResult.documentType]
            } verified! Confidence: ${response.data.result.confidence.toFixed(
              1
            )}%`
          );
        } else {
          toast.warning(
            `${
              documentTypeLabels[docResult.documentType]
            } verification failed. Confidence: ${response.data.result.confidence.toFixed(
              1
            )}%`
          );
        }

        if (onVerified) {
          onVerified();
        }
      }
    } catch (error: any) {
      console.error("Verify KYC error:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Verification failed";

      setDocumentResults((prev) => {
        const newMap = new Map(prev);
        newMap.set(documentId, {
          ...docResult,
          status: "failed",
          error: errorMessage,
        });
        return newMap;
      });

      toast.error(errorMessage);
    }
  };

  const handleVerifyAll = async () => {
    if (!tenant) return;

    const pendingDocs = Array.from(documentResults.entries()).filter(
      ([_, doc]) => doc.status === "pending"
    );

    for (const [docId] of pendingDocs) {
      await handleVerifyDocument(docId);
    }
  };

  const handleRequestAdditionalDocument = async () => {
    if (!tenant || requestDocumentTypes.length === 0) {
      toast.error("Please select at least one document type to request");
      return;
    }

    try {
      setRequesting(true);
      await requestAdditionalDocument(tenant.id, {
        documentTypes: requestDocumentTypes,
        message: requestMessage,
      });

      toast.success("Document request sent to tenant");
      setShowRequestForm(false);
      setRequestMessage("");
      setRequestDocumentTypes([]);
      if (onVerified) {
        onVerified();
      }
    } catch (error: any) {
      console.error("Request document error:", error);
      toast.error(
        error.response?.data?.error || "Failed to send document request"
      );
    } finally {
      setRequesting(false);
    }
  };

  const handleApproveTenant = async () => {
    if (!tenant) return;

    try {
      setApproving(true);
      await approveTenantKyc(tenant.id);
      toast.success("Tenant KYC approved successfully!");
      if (onVerified) {
        onVerified();
      }
      onOpenChange(false);
    } catch (error: any) {
      console.error("Approve tenant error:", error);
      toast.error(error.response?.data?.error || "Failed to approve tenant");
    } finally {
      setApproving(false);
    }
  };

  const toggleRequestDocType = (type: string) => {
    setRequestDocumentTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  if (!tenant) return null;

  const availableDocuments = tenant.documents || [];
  const documentTypeLabels: Record<string, string> = {
    nin: "National ID (NIN)",
    passport: "International Passport",
    dl: "Driver's License",
    vin: "Voter's Card (VIN)",
    bvn: "Bank Verification Number (BVN)",
  };

  const allDocumentTypes = ["nin", "passport", "dl", "vin", "bvn"];

  // Calculate overall verification status
  const results = Array.from(documentResults.values());
  const verifiedCount = results.filter((r) => r.status === "verified").length;
  const failedCount = results.filter((r) => r.status === "failed").length;
  const pendingCount = results.filter((r) => r.status === "pending").length;
  const verifyingCount = results.filter((r) => r.status === "verifying").length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-purple-600" />
            KYC Verification - {tenant.name}
          </DialogTitle>
          <DialogDescription>
            Verify tenant identity documents using Dojah KYC service
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4 overflow-y-auto flex-1 min-h-0 pr-2">
          {/* Tenant Information */}
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
                <strong>Status:</strong>{" "}
                <Badge
                  variant={
                    tenant.kycStatus === "verified" ? "default" : "secondary"
                  }
                >
                  {tenant.kycStatus}
                </Badge>
              </div>
            </div>
          </div>

          {/* Verification Summary */}
          {results.length > 0 && (
            <div className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg">
              <div className="text-sm">
                <strong>Verification Status:</strong>
              </div>
              <div className="flex gap-2">
                {verifiedCount > 0 && (
                  <Badge className="bg-green-500">
                    {verifiedCount} Verified
                  </Badge>
                )}
                {failedCount > 0 && (
                  <Badge className="bg-red-500">{failedCount} Failed</Badge>
                )}
                {pendingCount > 0 && (
                  <Badge variant="secondary">{pendingCount} Pending</Badge>
                )}
                {verifyingCount > 0 && (
                  <Badge className="bg-yellow-500">
                    {verifyingCount} Verifying
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Uploaded Documents */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Uploaded Documents</h3>
              {pendingCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleVerifyAll}
                  disabled={verifyingCount > 0}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Verify All
                </Button>
              )}
            </div>

            {availableDocuments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No documents uploaded yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {availableDocuments.map((doc) => {
                  const docResult = documentResults.get(doc.id);
                  const docType = mapDocumentType(doc.documentType);

                  return (
                    <div
                      key={doc.id}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-gray-400" />
                          <div>
                            <div className="font-medium">
                              {documentTypeLabels[docType] || doc.documentType}
                            </div>
                            <div className="text-xs text-gray-500">
                              {doc.fileName}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Status Badge */}
                          {docResult?.status === "verified" && (
                            <Badge className="bg-green-500">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verified (
                              {docResult.result?.confidence.toFixed(0)}
                              %)
                            </Badge>
                          )}
                          {docResult?.status === "failed" && (
                            <Badge className="bg-red-500">
                              <XCircle className="h-3 w-3 mr-1" />
                              Failed
                            </Badge>
                          )}
                          {docResult?.status === "pending" && (
                            <Badge variant="secondary">Pending</Badge>
                          )}
                          {docResult?.status === "verifying" && (
                            <Badge className="bg-yellow-500">
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              Verifying
                            </Badge>
                          )}

                          {/* Verify Button */}
                          {docResult?.status !== "verifying" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleVerifyDocument(doc.id)}
                              disabled={docResult?.status === "verifying"}
                            >
                              {docResult?.status === "verified" ||
                              docResult?.status === "failed" ? (
                                <>
                                  <RefreshCw className="h-3 w-3 mr-1" />
                                  Re-verify
                                </>
                              ) : (
                                <>
                                  <ShieldCheck className="h-3 w-3 mr-1" />
                                  Verify
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Verification Details */}
                      {docResult?.result && (
                        <div className="mt-3 pt-3 border-t space-y-2">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="bg-gray-50 p-2 rounded">
                              <div className="text-xs text-gray-500 mb-1">
                                Tenant Data
                              </div>
                              <div>
                                {docResult.result.comparison.tenantData
                                  .firstName || ""}{" "}
                                {docResult.result.comparison.tenantData
                                  .lastName || ""}
                              </div>
                            </div>
                            <div className="bg-gray-50 p-2 rounded">
                              <div className="text-xs text-gray-500 mb-1">
                                Dojah Data
                              </div>
                              <div className="flex items-center gap-1">
                                {docResult.result.comparison.dojahData
                                  ?.firstname ||
                                  docResult.result.comparison.dojahData
                                    ?.first_name ||
                                  ""}{" "}
                                {docResult.result.comparison.dojahData
                                  ?.surname ||
                                  docResult.result.comparison.dojahData
                                    ?.last_name ||
                                  ""}
                                {docResult.result.comparison.matches.name ? (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-500" />
                                )}
                              </div>
                            </div>
                          </div>

                          {docResult.error && (
                            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                              <AlertCircle className="h-4 w-4 inline mr-1" />
                              {docResult.error}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Request Additional Document Section */}
          <div className="border-t pt-4">
            {!showRequestForm ? (
              <Button
                variant="outline"
                onClick={() => setShowRequestForm(true)}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Request Additional Document
              </Button>
            ) : (
              <div className="space-y-4 bg-orange-50 p-4 rounded-lg">
                <h3 className="font-semibold flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  Request Additional Document
                </h3>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Select Document Types to Request
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {allDocumentTypes.map((type) => (
                      <Button
                        key={type}
                        variant={
                          requestDocumentTypes.includes(type)
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() => toggleRequestDocType(type)}
                        className={
                          requestDocumentTypes.includes(type)
                            ? "bg-orange-500 hover:bg-orange-600"
                            : ""
                        }
                      >
                        {documentTypeLabels[type]}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Message to Tenant (Optional)
                  </label>
                  <Textarea
                    value={requestMessage}
                    onChange={(e) => setRequestMessage(e.target.value)}
                    placeholder="Please provide additional documentation for verification..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowRequestForm(false);
                      setRequestDocumentTypes([]);
                      setRequestMessage("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleRequestAdditionalDocument}
                    disabled={requesting || requestDocumentTypes.length === 0}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    {requesting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Request
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Overall Recommendation */}
          {verifiedCount > 0 || failedCount > 0 ? (
            <div className="flex items-start gap-2 bg-blue-50 p-3 rounded-lg">
              <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
              <div className="text-sm">
                <strong>Summary:</strong>{" "}
                {verifiedCount > 0 && failedCount === 0 ? (
                  <span className="text-green-700">
                    All documents verified successfully. You can approve this
                    tenant.
                  </span>
                ) : verifiedCount > 0 && failedCount > 0 ? (
                  <span className="text-yellow-700">
                    Some documents verified, but {failedCount} failed. Consider
                    requesting additional documents.
                  </span>
                ) : (
                  <span className="text-red-700">
                    Document verification failed. Request additional documents
                    or reject the application.
                  </span>
                )}
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter className="gap-2 flex-shrink-0 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {verifiedCount > 0 && (
            <Button
              onClick={handleApproveTenant}
              disabled={approving}
              className="bg-green-600 hover:bg-green-700"
            >
              {approving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <UserCheck className="h-4 w-4 mr-2" />
                  Approve Tenant
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
