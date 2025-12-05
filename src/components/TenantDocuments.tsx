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
  Shield,
  FolderOpen,
  Sparkles,
  FileBox,
  AlertCircle
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
    <Card className="border-0 shadow-md hover:shadow-lg hover:border-[#7C3AED]/30 transition-all duration-200">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-purple-50 rounded-lg border border-purple-100">
            {getDocumentIcon(doc.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 truncate">{doc.name}</h4>
                <p className="text-sm text-gray-600">{doc.description}</p>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center space-x-4 text-sm text-gray-600 font-medium">
                <span>{getDisplayFormat(doc)} • {getDisplaySizeText(doc)}</span>
                <span>•</span>
                <span>{doc.createdAt ? formatDate(doc.createdAt) : 'N/A'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleView(doc)}
                  className="text-[#7C3AED] hover:bg-[#7C3AED]/10"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownload(doc)}
                  className="text-[#7C3AED] hover:bg-[#7C3AED]/10"
                >
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
    <div className="space-y-5 md:space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#7C3AED] via-[#6D28D9] to-[#5B21B6] p-6 md:p-8 shadow-xl">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,rgba(255,255,255,0.6))]"></div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-900/20 rounded-full blur-3xl"></div>
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg hidden md:flex">
              <FolderOpen className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Documents</h1>
              <p className="text-white/80 font-medium mt-1">Access your lease, receipts, and important documents</p>
            </div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/30">
            <p className="text-white/70 text-xs font-medium">Total Documents</p>
            <p className="text-white font-bold text-xl">{documents.length}</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-indigo-500/5 group-hover:from-purple-500/10 group-hover:to-indigo-500/10 transition-all duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-xs md:text-sm font-semibold text-gray-700">All Documents</CardTitle>
            <div className="rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 p-2 md:p-2.5 shadow-lg shadow-purple-500/25 group-hover:scale-110 transition-transform duration-300">
              <FileText className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-xl md:text-3xl font-bold text-gray-900">{documents.length}</div>
            <p className="text-xs text-gray-500 font-medium mt-1">Total files</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 group-hover:from-blue-500/10 group-hover:to-cyan-500/10 transition-all duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-xs md:text-sm font-semibold text-gray-700">Lease Docs</CardTitle>
            <div className="rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 p-2 md:p-2.5 shadow-lg shadow-blue-500/25 group-hover:scale-110 transition-transform duration-300">
              <FileCheck className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-xl md:text-3xl font-bold text-gray-900">{leaseDocuments.length}</div>
            <p className="text-xs text-gray-500 font-medium mt-1">Active lease</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 group-hover:from-green-500/10 group-hover:to-emerald-500/10 transition-all duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-xs md:text-sm font-semibold text-gray-700">Receipts</CardTitle>
            <div className="rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 p-2 md:p-2.5 shadow-lg shadow-green-500/25 group-hover:scale-110 transition-transform duration-300">
              <Receipt className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-xl md:text-3xl font-bold text-gray-900">{receipts.length}</div>
            <p className="text-xs text-gray-500 font-medium mt-1">Payment records</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-amber-500/5 group-hover:from-orange-500/10 group-hover:to-amber-500/10 transition-all duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-xs md:text-sm font-semibold text-gray-700">Recent</CardTitle>
            <div className="rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 p-2 md:p-2.5 shadow-lg shadow-orange-500/25 group-hover:scale-110 transition-transform duration-300">
              <Calendar className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-xl md:text-3xl font-bold text-gray-900">{stats?.recent ?? 0}</div>
            <p className="text-xs text-gray-500 font-medium mt-1">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search documents by name, type, or category..."
              className="pl-12 pr-4 py-3 h-12 border-gray-200 focus:border-[#7C3AED] focus:ring-[#7C3AED]/20 rounded-xl text-base"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="lease" className="space-y-4">
        <TabsList className="bg-white/80 backdrop-blur-sm p-1.5 border border-gray-200 shadow-lg rounded-xl h-auto flex-wrap">
          <TabsTrigger
            value="all"
            className="rounded-lg px-4 py-2.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#7C3AED] data-[state=active]:to-[#5B21B6] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/25 font-semibold transition-all duration-200"
          >
            <FileBox className="h-4 w-4 mr-2" />
            All
          </TabsTrigger>
          <TabsTrigger
            value="lease"
            className="rounded-lg px-4 py-2.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#7C3AED] data-[state=active]:to-[#5B21B6] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/25 font-semibold transition-all duration-200"
          >
            <FileCheck className="h-4 w-4 mr-2" />
            Lease
          </TabsTrigger>
          <TabsTrigger
            value="receipts"
            className="rounded-lg px-4 py-2.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#7C3AED] data-[state=active]:to-[#5B21B6] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/25 font-semibold transition-all duration-200"
          >
            <Receipt className="h-4 w-4 mr-2" />
            Receipts
          </TabsTrigger>
          <TabsTrigger
            value="policies"
            className="rounded-lg px-4 py-2.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#7C3AED] data-[state=active]:to-[#5B21B6] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/25 font-semibold transition-all duration-200"
          >
            <Shield className="h-4 w-4 mr-2" />
            Policies
          </TabsTrigger>
          <TabsTrigger
            value="insurance"
            className="rounded-lg px-4 py-2.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#7C3AED] data-[state=active]:to-[#5B21B6] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/25 font-semibold transition-all duration-200"
          >
            <Shield className="h-4 w-4 mr-2" />
            Insurance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card className="border-0 shadow-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border-b border-purple-100">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#5B21B6] p-2.5 shadow-lg shadow-purple-500/25">
                  <FileBox className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-gray-900 font-bold text-lg">All Documents</CardTitle>
                  <CardDescription className="text-gray-600 font-medium">Browse all your documents</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-purple-200 border-t-purple-600 mx-auto"></div>
                    <p className="mt-4 text-sm text-gray-500 font-medium">Loading documents...</p>
                  </div>
                </div>
              ) : filteredDocuments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4">
                  <div className="rounded-full bg-gradient-to-br from-gray-100 to-slate-100 p-6 mb-4">
                    <FolderOpen className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No Documents Found</h3>
                  <p className="text-gray-500 text-center max-w-sm">
                    {searchQuery ? `No documents match "${searchQuery}"` : 'Your documents will appear here once they are uploaded.'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredDocuments.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-5 hover:bg-purple-50/50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-xl">
                          {getDocumentIcon(doc.type)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{doc.name}</p>
                          <p className="text-sm text-gray-600">{doc.description}</p>
                          <p className="text-xs text-gray-500 font-medium mt-1">
                            {getDisplayFormat(doc)} • {getDisplaySizeText(doc)} • {doc.createdAt ? formatDate(doc.createdAt) : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleView(doc)}
                          className="border-purple-200 text-purple-700 hover:bg-purple-50 font-semibold"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(doc)}
                          className="border-purple-200 text-purple-700 hover:bg-purple-50 font-semibold"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lease" className="space-y-4">
          <Card className="border-0 shadow-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-cyan-50 border-b border-blue-100">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 p-2.5 shadow-lg shadow-blue-500/25">
                  <FileCheck className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-gray-900 font-bold text-lg">Lease & Inspection Documents</CardTitle>
                  <CardDescription className="text-gray-600 font-medium">Your lease agreement and property inspection reports</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {leaseDocuments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4">
                  <div className="rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 p-6 mb-4">
                    <FileCheck className="h-12 w-12 text-blue-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No Lease Documents</h3>
                  <p className="text-gray-500 text-center max-w-sm">Your lease documents will appear here once they are generated or uploaded.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {leaseDocuments.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-5 hover:bg-blue-50/50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl">
                          {getDocumentIcon(doc.type)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{doc.name}</p>
                          <p className="text-sm text-gray-600">{doc.description}</p>
                          <p className="text-xs text-gray-500 font-medium mt-1">
                            {getDisplayFormat(doc)} • {getDisplaySizeText(doc)} • {doc.createdAt ? formatDate(doc.createdAt) : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleView(doc)}
                          className="border-blue-200 text-blue-700 hover:bg-blue-50 font-semibold"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(doc)}
                          className="border-blue-200 text-blue-700 hover:bg-blue-50 font-semibold"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="receipts" className="space-y-4">
          <Card className="border-0 shadow-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 border-b border-green-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 p-2.5 shadow-lg shadow-green-500/25">
                    <Receipt className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-gray-900 font-bold text-lg">Payment Receipts</CardTitle>
                    <CardDescription className="text-gray-600 font-medium">All your payment confirmations and receipts</CardDescription>
                  </div>
                </div>
                {receipts.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-green-200 text-green-700 hover:bg-green-50 font-semibold"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download All
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {receipts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4">
                  <div className="rounded-full bg-gradient-to-br from-green-100 to-emerald-100 p-6 mb-4">
                    <Receipt className="h-12 w-12 text-green-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No Receipts Yet</h3>
                  <p className="text-gray-500 text-center max-w-sm">Your payment receipts will appear here after you make payments.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {receipts.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-5 hover:bg-green-50/50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl">
                          {getDocumentIcon(doc.type)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{doc.name}</p>
                          <p className="text-sm text-gray-600">{doc.description}</p>
                          <p className="text-xs text-gray-500 font-medium mt-1">
                            {getDisplayFormat(doc)} • {getDisplaySizeText(doc)} • {doc.createdAt ? formatDate(doc.createdAt) : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleView(doc)}
                          className="border-green-200 text-green-700 hover:bg-green-50 font-semibold"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(doc)}
                          className="border-green-200 text-green-700 hover:bg-green-50 font-semibold"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policies" className="space-y-4">
          <Card className="border-0 shadow-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border-b border-purple-100">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 p-2.5 shadow-lg shadow-purple-500/25">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-gray-900 font-bold text-lg">Property Policies & Notices</CardTitle>
                  <CardDescription className="text-gray-600 font-medium">Rules, regulations, and property notices</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {policies.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4">
                  <div className="rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 p-6 mb-4">
                    <Shield className="h-12 w-12 text-purple-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No Policies Available</h3>
                  <p className="text-gray-500 text-center max-w-sm">Property policies and notices will appear here once they are uploaded.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {policies.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-5 hover:bg-purple-50/50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-xl">
                          {getDocumentIcon(doc.type)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{doc.name}</p>
                          <p className="text-sm text-gray-600">{doc.description}</p>
                          <p className="text-xs text-gray-500 font-medium mt-1">
                            {getDisplayFormat(doc)} • {getDisplaySizeText(doc)} • {doc.createdAt ? formatDate(doc.createdAt) : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleView(doc)}
                          className="border-purple-200 text-purple-700 hover:bg-purple-50 font-semibold"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(doc)}
                          className="border-purple-200 text-purple-700 hover:bg-purple-50 font-semibold"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insurance" className="space-y-4">
          <Card className="border-0 shadow-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-orange-50 via-amber-50 to-yellow-50 border-b border-orange-100">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 p-2.5 shadow-lg shadow-orange-500/25">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-gray-900 font-bold text-lg">Insurance Documents</CardTitle>
                  <CardDescription className="text-gray-600 font-medium">Your renters insurance policies</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {insuranceDocs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4">
                  <div className="rounded-full bg-gradient-to-br from-orange-100 to-amber-100 p-6 mb-4">
                    <Shield className="h-12 w-12 text-orange-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No Insurance Documents</h3>
                  <p className="text-gray-500 text-center max-w-sm">Upload your renters insurance policy to keep it on file.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {insuranceDocs.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-5 hover:bg-orange-50/50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-gradient-to-br from-orange-100 to-amber-100 rounded-xl">
                          {getDocumentIcon(doc.type)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{doc.name}</p>
                          <p className="text-sm text-gray-600">{doc.description}</p>
                          <p className="text-xs text-gray-500 font-medium mt-1">
                            {getDisplayFormat(doc)} • {getDisplaySizeText(doc)} • {doc.createdAt ? formatDate(doc.createdAt) : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleView(doc)}
                          className="border-orange-200 text-orange-700 hover:bg-orange-50 font-semibold"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(doc)}
                          className="border-orange-200 text-orange-700 hover:bg-orange-50 font-semibold"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Document Viewer Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] border-0 shadow-2xl">
          <DialogHeader className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] -m-6 mb-0 p-6 rounded-t-lg">
            <DialogTitle className="text-xl font-bold text-white">{viewingDocument?.name}</DialogTitle>
            <DialogDescription className="text-white/80 font-medium">
              {viewingDocument?.description || 'Document preview'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-6">
            {/* Document Info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-100 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-bold text-gray-900">Document Details</p>
                <div className="flex items-center flex-wrap gap-2 text-sm text-gray-600">
                  <Badge className="bg-purple-100 text-purple-700 border-purple-200 font-semibold">
                    {viewingDocument ? getDisplayFormat(viewingDocument) : 'PDF'}
                  </Badge>
                  <span className="text-gray-400">•</span>
                  <span className="font-medium">{viewingDocument ? getDisplaySizeText(viewingDocument) : '—'}</span>
                  <span className="text-gray-400">•</span>
                  <span className="font-medium">{viewingDocument?.createdAt ? formatDate(viewingDocument.createdAt) : 'N/A'}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => viewingDocument && handleDownload(viewingDocument, 'pdf')}
                  className="border-purple-200 text-purple-700 hover:bg-purple-50 font-semibold"
                >
                  <Download className="h-4 w-4 mr-2" />
                  PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => viewingDocument && handleDownload(viewingDocument, 'docx')}
                  className="border-purple-200 text-purple-700 hover:bg-purple-50 font-semibold"
                >
                  <Download className="h-4 w-4 mr-2" />
                  DOCX
                </Button>
              </div>
            </div>

            {/* Document Preview */}
            <div className="border-2 border-gray-200 rounded-xl overflow-hidden shadow-inner" style={{ height: '500px' }}>
              {viewingDocument?.fileUrl ? (
                // For uploaded files, show iframe or image
                viewingDocument.fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                  <img
                    src={getDocumentDownloadUrl(viewingDocument.fileUrl)}
                    alt={viewingDocument.name}
                    className="w-full h-full object-contain bg-gray-50"
                  />
                ) : (
                  <iframe
                    src={getDocumentDownloadUrl(viewingDocument.fileUrl)}
                    className="w-full h-full bg-white"
                    title={viewingDocument.name}
                  />
                )
              ) : (
                // For generated contracts, show PDF preview
                <iframe
                  src={viewingDocument ? downloadDocumentInFormat(viewingDocument.id, 'pdf', { inline: true, includeToken: true }) : ''}
                  className="w-full h-full bg-white"
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


