import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Badge } from "../../../components/ui/badge";
import { Separator } from "../../../components/ui/separator";
import {
  Search,
  FileText,
  Download,
  Plus,
  Eye,
  Trash2,
  Upload,
  X,
  File,
  Image as ImageIcon,
  FileCode,
  MoreVertical,
  Filter,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  getDocuments,
  uploadDocument,
  deleteDocument,
  getDocumentStats,
  Document,
  DocumentFilters,
} from "../../../lib/api/documents";
import { format } from "date-fns";
import { downloadDocumentInFormat } from "../../../lib/api/documents";
import { getAuthToken } from "../../../lib/api-client";

interface ProjectDocumentsPageProps {
  projectId: string;
}

const DOCUMENT_CATEGORIES = [
  "Architecture Plans",
  "Order Documents",
  "Contracts & Agreements",
  "Permits & Licenses",
  "Financial Documents",
  "Custom",
];

const DOCUMENT_TYPES = [
  "plan",
  "order",
  "contract",
  "permit",
  "financial",
  "invoice",
  "receipt",
  "report",
  "other",
];

export const ProjectDocumentsPage: React.FC<ProjectDocumentsPageProps> = ({
  projectId,
}) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [uploadForm, setUploadForm] = useState({
    file: null as File | null,
    name: "",
    type: "other",
    category: "Custom",
    description: "",
  });

  useEffect(() => {
    fetchDocuments();
  }, [projectId, categoryFilter, typeFilter]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const filters: DocumentFilters = {
        projectId,
      };

      if (categoryFilter !== "all") {
        filters.category = categoryFilter;
      }

      if (typeFilter !== "all") {
        filters.type = typeFilter;
      }

      const response = await getDocuments(filters);
      if (response.error) {
        toast.error(response.error);
        setDocuments([]);
      } else {
        setDocuments(response.data || []);
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast.error("Failed to fetch documents");
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadForm({ ...uploadForm, file, name: file.name });
    }
  };

  const handleUpload = async () => {
    if (!uploadForm.file) {
      toast.error("Please select a file");
      return;
    }

    if (!uploadForm.name.trim()) {
      toast.error("Please enter a document name");
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", uploadForm.file);
      formData.append("name", uploadForm.name);
      formData.append("type", uploadForm.type);
      formData.append("category", uploadForm.category);
      formData.append("description", uploadForm.description || "");
      formData.append("projectId", projectId);

      const response = await uploadDocument(formData);
      if (response.error) {
        toast.error(response.error);
      } else {
        toast.success("Document uploaded successfully");
        setIsUploadDialogOpen(false);
        setUploadForm({
          file: null,
          name: "",
          type: "other",
          category: "Custom",
          description: "",
        });
        fetchDocuments();
      }
    } catch (error) {
      console.error("Error uploading document:", error);
      toast.error("Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) {
      return;
    }

    try {
      const response = await deleteDocument(documentId);
      if (response.error) {
        toast.error(response.error);
      } else {
        toast.success("Document deleted successfully");
        fetchDocuments();
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Failed to delete document");
    }
  };

  const handleView = (document: Document) => {
    setSelectedDocument(document);
    setIsViewDialogOpen(true);
  };

  const handleDownload = (document: Document, format: "pdf" | "docx" = "pdf") => {
    try {
      const url = downloadDocumentInFormat(document.id, format, {
        includeToken: true,
      });
      window.open(url, "_blank");
    } catch (error) {
      console.error("Error downloading document:", error);
      toast.error("Failed to download document");
    }
  };

  const getFileIcon = (document: Document) => {
    const format = document.format?.toLowerCase() || "";
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(format)) {
      return <ImageIcon className="h-5 w-5 text-blue-500" />;
    }
    if (format === "pdf") {
      return <FileText className="h-5 w-5 text-red-500" />;
    }
    if (["doc", "docx"].includes(format)) {
      return <FileText className="h-5 w-5 text-blue-600" />;
    }
    return <File className="h-5 w-5 text-gray-500" />;
  };

  const formatFileSize = (bytes: number | null | undefined) => {
    if (!bytes) return "Unknown";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.description &&
        doc.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage and view project documents
          </p>
        </div>
        <Button onClick={() => setIsUploadDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Upload Document
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {DOCUMENT_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {DOCUMENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">Loading documents...</p>
          </CardContent>
        </Card>
      ) : filteredDocuments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No documents found</p>
            <p className="text-sm text-gray-400">
              {searchTerm || categoryFilter !== "all" || typeFilter !== "all"
                ? "Try adjusting your filters"
                : "Upload your first document to get started"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((document) => (
            <Card key={document.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {getFileIcon(document)}
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm font-medium truncate">
                        {document.name}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {document.category}
                        </Badge>
                        {document.format && (
                          <Badge variant="secondary" className="text-xs">
                            {document.format.toUpperCase()}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleView(document)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDownload(document, "pdf")}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(document.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                {document.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {document.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{formatFileSize(document.fileSize)}</span>
                  <span>
                    {format(new Date(document.createdAt), "MMM d, yyyy")}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Upload a new document for this project
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="file">File</Label>
              <Input
                id="file"
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp,.xls,.xlsx,.txt,.csv"
              />
              {uploadForm.file && (
                <p className="text-sm text-gray-600 mt-2">
                  Selected: {uploadForm.file.name} (
                  {formatFileSize(uploadForm.file.size)})
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="name">Document Name</Label>
              <Input
                id="name"
                value={uploadForm.name}
                onChange={(e) =>
                  setUploadForm({ ...uploadForm, name: e.target.value })
                }
                placeholder="Enter document name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={uploadForm.category}
                  onValueChange={(value) =>
                    setUploadForm({ ...uploadForm, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <Select
                  value={uploadForm.type}
                  onValueChange={(value) =>
                    setUploadForm({ ...uploadForm, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={uploadForm.description}
                onChange={(e) =>
                  setUploadForm({ ...uploadForm, description: e.target.value })
                }
                placeholder="Enter document description"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsUploadDialogOpen(false)}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={uploading}>
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {selectedDocument?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedDocument?.description || "Document preview"}
            </DialogDescription>
          </DialogHeader>
          {selectedDocument && (
            <div className="space-y-4">
              {/* Document Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-lg border gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-gray-900">
                    Document Details
                  </p>
                  <div className="flex items-center flex-wrap gap-2 text-sm text-gray-600">
                    <Badge variant="outline" className="font-medium">
                      {selectedDocument.format?.toUpperCase() || "UNKNOWN"}
                    </Badge>
                    <span className="text-gray-400">•</span>
                    <span className="font-medium">
                      {formatFileSize(selectedDocument.fileSize)}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="font-medium">
                      {format(new Date(selectedDocument.createdAt), "MMM d, yyyy")}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="font-medium">{selectedDocument.category}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handleDownload(selectedDocument, "pdf")}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                  {selectedDocument.format?.toLowerCase() !== "pdf" && (
                    <Button
                      onClick={() => handleDownload(selectedDocument, "docx")}
                      variant="outline"
                      size="sm"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download DOCX
                    </Button>
                  )}
                </div>
              </div>

              {/* Document Preview */}
              <div className="border rounded-lg overflow-hidden bg-gray-100" style={{ height: "600px" }}>
                {(() => {
                  const docFormat = selectedDocument.format?.toLowerCase() || "";
                  const isImage = selectedDocument.fileUrl &&
                    selectedDocument.fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i);

                  if (isImage) {
                    // For images, construct download URL manually with correct format
                    const imageFormat =
                      docFormat ||
                      selectedDocument.fileUrl.split(".").pop()?.toLowerCase() ||
                      "png";
                    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
                    const token = getAuthToken();
                    const params = new URLSearchParams();
                    params.set("inline", "1");
                    if (token) params.set("token", token);
                    const imageUrl = `${API_URL}/api/documents/${selectedDocument.id}/download/${imageFormat}?${params.toString()}`;

                    return (
                      <div className="w-full h-full flex items-center justify-center bg-gray-50 p-4">
                        <img
                          src={imageUrl}
                          alt={selectedDocument.name}
                          className="max-w-full max-h-full object-contain rounded shadow-sm"
                          onError={(e) => {
                            console.error("[Document Preview] Image load error:", e);
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = `
                                <div class="w-full h-full flex items-center justify-center">
                                  <p class="text-gray-500">Unable to load image preview</p>
                                </div>
                              `;
                            }
                          }}
                        />
                      </div>
                    );
                  } else {
                    // For PDFs and other documents, use iframe with download endpoint
                    // This ensures authentication works and handles both uploaded files
                    return (
                      <iframe
                        src={downloadDocumentInFormat(selectedDocument.id, "pdf", {
                          inline: true,
                          includeToken: true,
                        })}
                        className="w-full h-full bg-white"
                        title={selectedDocument.name}
                        allow="fullscreen"
                        onError={(e) => {
                          console.error("[Document Preview] Iframe load error:", e);
                        }}
                      />
                    );
                  }
                })()}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

