import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  FileText,
  Download,
  Eye,
  Search,
  File,
  FileCheck,
  Calendar,
  Loader2,
  Receipt,
  ClipboardList,
  Shield
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import {
  getDocuments,
  getDocumentStats,
  getDocumentDownloadUrl,
  downloadDocumentInFormat,
  Document,
  DocumentStats,
} from '../lib/api/documents';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';

const TenantDocuments: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [stats, setStats] = useState<DocumentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);

  // Load documents on mount
  useEffect(() => {
    loadDocuments();
    loadStats();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const { data, error } = await getDocuments();
      if (error) {
        console.error('Failed to load documents:', error);
        toast.error('Failed to load documents');
      } else if (data) {
        setDocuments(data);
      }
    } catch (error) {
      console.error('Load documents error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data, error } = await getDocumentStats();
      if (error) {
        console.error('Failed to load stats:', error);
      } else if (data) {
        setStats(data);
      }
    } catch (error) {
      console.error('Load stats error:', error);
    }
  };

  // Filter documents based on active tab and search
  const getFilteredDocuments = () => {
    let filtered = documents;

    // Filter by tab
    if (activeTab !== 'all') {
      if (activeTab === 'leases') {
        filtered = filtered.filter(doc => doc.type === 'lease' || doc.category?.includes('Lease'));
      } else if (activeTab === 'receipts') {
        filtered = filtered.filter(doc => doc.type === 'receipt' || doc.category?.includes('Receipt'));
      } else if (activeTab === 'policies') {
        filtered = filtered.filter(doc => doc.type === 'policy' || doc.category?.includes('Polic'));
      } else if (activeTab === 'notices') {
        filtered = filtered.filter(doc => doc.type === 'notice' || doc.category?.includes('Notice'));
      }
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(doc =>
        doc.name.toLowerCase().includes(query) ||
        doc.type.toLowerCase().includes(query) ||
        doc.category.toLowerCase().includes(query) ||
        doc.description?.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  const handleDownload = (doc: Document, format: 'pdf' | 'docx' = 'pdf') => {
    // For generated contracts (no fileUrl), use the download API
    if (!doc.fileUrl || doc.fileUrl === '') {
      const downloadUrl = downloadDocumentInFormat(doc.id, format, { includeToken: true });
      window.open(downloadUrl, '_blank');
      toast.success(`Downloading ${doc.name} as ${format.toUpperCase()}`);
    } else {
      // For uploaded files, use direct file URL
      const downloadUrl = getDocumentDownloadUrl(doc.fileUrl);
      window.open(downloadUrl, '_blank');
      toast.success(`Downloading ${doc.name}`);
    }
  };

  const handleView = (doc: Document) => {
    setViewingDocument(doc);
    setShowViewDialog(true);
  };

  const formatFileSize = (bytes: number | null | undefined): string => {
    if (!bytes) return 'Unknown';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(0)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDisplayFormat = (doc: Document): string => {
    if (!doc.fileUrl) return 'PDF';
    if (doc.format) return doc.format.toUpperCase();
    const parts = doc.fileUrl.toLowerCase().split('.');
    const ext = parts.length > 1 ? parts.pop() as string : '';
    return (ext || 'PDF').toUpperCase();
  };

  const getDisplaySizeText = (doc: Document): string => {
    if (doc.fileSize) return formatFileSize(doc.fileSize);
    if (!doc.fileUrl) return 'Generated';
    return 'Unknown';
  };

  const getTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'lease':
        return <FileText className="h-4 w-4" />;
      case 'receipt':
        return <Receipt className="h-4 w-4" />;
      case 'inspection':
        return <ClipboardList className="h-4 w-4" />;
      case 'policy':
        return <Shield className="h-4 w-4" />;
      case 'notice':
        return <FileCheck className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  const filteredDocuments = getFilteredDocuments();

  // Mock data for backward compatibility (keeping structure intact)
  const mockDocuments = [
    {
      id: 1,
      name: "Lease Agreement 2024",
      type: "lease",
      category: "Lease Documents",
      dateAdded: "Jan 1, 2024",
      size: "2.4 MB",
      format: "PDF",
      description: "Annual lease agreement for Unit 204",
      uploadedBy: "Property Manager"
    },
    {
      id: 2,
      name: "Move-In Inspection Report",
      type: "inspection",
      category: "Inspections",
      dateAdded: "Jan 1, 2024",
      size: "1.8 MB",
      format: "PDF",
      description: "Initial condition report with photos",
      uploadedBy: "Property Manager"
    },
    {
      id: 3,
      name: "October 2024 Rent Receipt",
      type: "receipt",
      category: "Receipts",
      dateAdded: "Oct 1, 2024",
      size: "156 KB",
      format: "PDF",
      description: "Payment confirmation for October rent",
      uploadedBy: "System"
    },
    {
      id: 4,
      name: "September 2024 Rent Receipt",
      type: "receipt",
      category: "Receipts",
      dateAdded: "Sep 1, 2024",
      size: "158 KB",
      format: "PDF",
      description: "Payment confirmation for September rent",
      uploadedBy: "System"
    },
    {
      id: 5,
      name: "August 2024 Rent Receipt",
      type: "receipt",
      category: "Receipts",
      dateAdded: "Aug 1, 2024",
      size: "157 KB",
      format: "PDF",
      description: "Payment confirmation for August rent",
      uploadedBy: "System"
    },
    {
      id: 6,
      name: "Property Rules & Regulations",
      type: "policy",
      category: "Property Policies",
      dateAdded: "Jan 1, 2024",
      size: "890 KB",
      format: "PDF",
      description: "Community rules and tenant guidelines",
      uploadedBy: "Property Manager"
    },
    {
      id: 7,
      name: "Parking Policy",
      type: "policy",
      category: "Property Policies",
      dateAdded: "Jan 1, 2024",
      size: "345 KB",
      format: "PDF",
      description: "Parking rules and assigned spaces",
      uploadedBy: "Property Manager"
    },
    {
      id: 8,
      name: "Security Deposit Receipt",
      type: "receipt",
      category: "Receipts",
      dateAdded: "Jan 1, 2024",
      size: "234 KB",
      format: "PDF",
      description: "Security deposit payment confirmation",
      uploadedBy: "Property Manager"
    },
    {
      id: 9,
      name: "Renters Insurance Policy",
      type: "insurance",
      category: "Insurance",
      dateAdded: "Jan 5, 2024",
      size: "1.2 MB",
      format: "PDF",
      description: "Active renters insurance policy",
      uploadedBy: "Sarah Johnson"
    },
    {
      id: 10,
      name: "Pool Maintenance Notice",
      type: "notice",
      category: "Notices",
      dateAdded: "Oct 15, 2024",
      size: "189 KB",
      format: "PDF",
      description: "Scheduled maintenance notification",
      uploadedBy: "Property Manager"
    }
  ];

  const getDocumentIcon = (type: string) => {
    switch(type) {
      case 'lease': return <FileCheck className="h-5 w-5 text-blue-600" />;
      case 'receipt': return <FileText className="h-5 w-5 text-green-600" />;
      case 'policy': return <File className="h-5 w-5 text-purple-600" />;
      case 'insurance': return <FileCheck className="h-5 w-5 text-orange-600" />;
      case 'notice': return <FileText className="h-5 w-5 text-yellow-600" />;
      case 'inspection': return <FileCheck className="h-5 w-5 text-indigo-600" />;
      default: return <File className="h-5 w-5 text-gray-600" />;
    }
  };

  // Use the filtered documents from getFilteredDocuments() above
  const leaseDocuments = filteredDocuments.filter(doc => doc.type === 'lease' || doc.type === 'inspection');
  const receipts = filteredDocuments.filter(doc => doc.type === 'receipt');
  const policies = filteredDocuments.filter(doc => doc.type === 'policy' || doc.type === 'notice');
  const insuranceDocs = filteredDocuments.filter(doc => doc.type === 'insurance');

  const DocumentCard = ({ doc }: { doc: Document }) => (
    <Card className="hover:border-blue-300 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-gray-100 rounded-lg">
            {getDocumentIcon(doc.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h4 className="font-medium truncate">{doc.name}</h4>
                <p className="text-sm text-muted-foreground">{doc.description}</p>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <span>{getDisplayFormat(doc)} • {getDisplaySizeText(doc)}</span>
                <span>•</span>
                <span>{doc.createdAt ? formatDate(doc.createdAt) : 'N/A'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" onClick={() => handleView(doc)}>
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDownload(doc)}>
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1>Documents</h1>
        <p className="text-muted-foreground">Access your lease, receipts, and important documents</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documents.length}</div>
            <p className="text-xs text-muted-foreground">
              All files
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lease Documents</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leaseDocuments.length}</div>
            <p className="text-xs text-muted-foreground">
              Active lease
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receipts</CardTitle>
            <File className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{receipts.length}</div>
            <p className="text-xs text-muted-foreground">
              Payment records
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.recent ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="lease" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Documents</TabsTrigger>
          <TabsTrigger value="lease">Lease & Inspections</TabsTrigger>
          <TabsTrigger value="receipts">Receipts</TabsTrigger>
          <TabsTrigger value="policies">Policies & Notices</TabsTrigger>
          <TabsTrigger value="insurance">Insurance</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {filteredDocuments.map((doc) => (
              <DocumentCard key={doc.id} doc={doc} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="lease" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lease & Inspection Documents</CardTitle>
              <CardDescription>Your lease agreement and property inspection reports</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {leaseDocuments.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      {getDocumentIcon(doc.type)}
                    </div>
                    <div>
                      <p className="font-medium">{doc.name}</p>
                      <p className="text-sm text-muted-foreground">{doc.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">{doc.format} • {doc.size} • {doc.dateAdded}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleView(doc)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDownload(doc)}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="receipts" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Payment Receipts</CardTitle>
                  <CardDescription>All your payment confirmations and receipts</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {receipts.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      {getDocumentIcon(doc.type)}
                    </div>
                    <div>
                      <p className="font-medium">{doc.name}</p>
                      <p className="text-sm text-muted-foreground">{doc.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">{doc.format} • {doc.size} • {doc.dateAdded}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleView(doc)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDownload(doc)}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Property Policies & Notices</CardTitle>
              <CardDescription>Rules, regulations, and property notices</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {policies.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      {getDocumentIcon(doc.type)}
                    </div>
                    <div>
                      <p className="font-medium">{doc.name}</p>
                      <p className="text-sm text-muted-foreground">{doc.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">{doc.format} • {doc.size} • {doc.dateAdded}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleView(doc)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDownload(doc)}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insurance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Insurance Documents</CardTitle>
              <CardDescription>Your renters insurance policies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {insuranceDocs.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      {getDocumentIcon(doc.type)}
                    </div>
                    <div>
                      <p className="font-medium">{doc.name}</p>
                      <p className="text-sm text-muted-foreground">{doc.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">{doc.format} • {doc.size} • {doc.dateAdded}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleView(doc)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDownload(doc)}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Document Viewer Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{viewingDocument?.name}</DialogTitle>
            <DialogDescription>
              {viewingDocument?.description || 'Document preview'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Document Info */}
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="space-y-1">
                <p className="text-sm font-medium">Document Details</p>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <span>{viewingDocument ? getDisplayFormat(viewingDocument) : 'PDF'}</span>
                  <span>•</span>
                  <span>{viewingDocument ? getDisplaySizeText(viewingDocument) : '—'}</span>
                  <span>•</span>
                  <span>{viewingDocument?.createdAt ? formatDate(viewingDocument.createdAt) : 'N/A'}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => viewingDocument && handleDownload(viewingDocument, 'pdf')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => viewingDocument && handleDownload(viewingDocument, 'docx')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  DOCX
                </Button>
              </div>
            </div>

            {/* Document Preview */}
            <div className="border rounded-lg overflow-hidden" style={{ height: '500px' }}>
              {viewingDocument?.fileUrl ? (
                // For uploaded files, show iframe or image
                viewingDocument.fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                  <img
                    src={getDocumentDownloadUrl(viewingDocument.fileUrl)}
                    alt={viewingDocument.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <iframe
                    src={getDocumentDownloadUrl(viewingDocument.fileUrl)}
                    className="w-full h-full"
                    title={viewingDocument.name}
                  />
                )
              ) : (
                // For generated contracts, show PDF preview
                <iframe
                  src={viewingDocument ? downloadDocumentInFormat(viewingDocument.id, 'pdf', { inline: true, includeToken: true }) : ''}
                  className="w-full h-full"
                  title={viewingDocument?.name || 'Document'}
                />
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TenantDocuments;


