import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  FileText,
  Download,
  Upload,
  Search,
  Filter,
  Plus,
  Eye,
  Share2,
  Trash2,
  FileCheck,
  FileClock,
  FileWarning,
  Send,
  User,
  Home,
  FileSignature,
  Receipt,
  AlertTriangle,
  ClipboardList,
  X,
  Calendar,
} from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';
import { Separator } from './ui/separator';
import { toast } from 'sonner';
import DocumentTemplateManager from './DocumentTemplateManager';

const PropertyManagerDocuments: React.FC = () => {
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [documentType, setDocumentType] = useState('lease');
  const [showFilterPopover, setShowFilterPopover] = useState(false);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  
  // Advanced filter states
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    property: 'all',
    tenant: 'all',
    dateFrom: '',
    dateTo: '',
  });
  
  // Form states for generating documents
  const [documentForm, setDocumentForm] = useState({
    type: 'lease',
    tenantId: '',
    propertyId: '',
    unitId: '',
    templateType: 'standard',
    // Lease specific
    startDate: '',
    endDate: '',
    monthlyRent: '',
    securityDeposit: '',
    // Notice specific
    noticeType: '',
    effectiveDate: '',
    reason: '',
    // Receipt specific
    paymentDate: '',
    amount: '',
    paymentMethod: '',
    // Report specific
    reportType: '',
    reportDate: '',
    description: '',
  });

  // Mock data
  const documents = [
    {
      id: 1,
      name: 'Lease Agreement - John Doe - Unit 201',
      category: 'Lease Agreements',
      type: 'Lease',
      status: 'active',
      tenant: 'John Doe',
      property: 'Sunset Apartments',
      unit: '201',
      createdDate: '2024-01-15',
      expiryDate: '2025-01-15',
      signedBy: 'John Doe',
      size: '345 KB',
    },
    {
      id: 2,
      name: 'Lease Agreement - Jane Smith - Unit 102',
      category: 'Lease Agreements',
      type: 'Lease',
      status: 'active',
      tenant: 'Jane Smith',
      property: 'Ocean View Complex',
      unit: '102',
      createdDate: '2024-03-01',
      expiryDate: '2025-03-01',
      signedBy: 'Jane Smith',
      size: '338 KB',
    },
    {
      id: 3,
      name: 'Rent Receipt - October 2024 - John Doe',
      category: 'Receipts',
      type: 'Receipt',
      status: 'completed',
      tenant: 'John Doe',
      property: 'Sunset Apartments',
      unit: '201',
      createdDate: '2024-10-01',
      expiryDate: null,
      signedBy: 'System Generated',
      size: '125 KB',
    },
    {
      id: 4,
      name: 'Move-In Inspection Report - Unit 301',
      category: 'Reports',
      type: 'Inspection',
      status: 'completed',
      tenant: 'Mike Johnson',
      property: 'Downtown Plaza',
      unit: '301',
      createdDate: '2024-09-15',
      expiryDate: null,
      signedBy: 'Mike Johnson',
      size: '890 KB',
    },
    {
      id: 5,
      name: 'Lease Renewal Notice - Jane Smith',
      category: 'Notices',
      type: 'Notice',
      status: 'sent',
      tenant: 'Jane Smith',
      property: 'Ocean View Complex',
      unit: '102',
      createdDate: '2024-10-10',
      expiryDate: '2024-12-01',
      signedBy: 'N/A',
      size: '145 KB',
    },
    {
      id: 6,
      name: 'Maintenance Completion Report - Unit 201',
      category: 'Reports',
      type: 'Maintenance',
      status: 'completed',
      tenant: 'John Doe',
      property: 'Sunset Apartments',
      unit: '201',
      createdDate: '2024-10-05',
      expiryDate: null,
      signedBy: 'Maintenance Team',
      size: '560 KB',
    },
    {
      id: 7,
      name: 'Lease Termination Notice - Unit 105',
      category: 'Notices',
      type: 'Notice',
      status: 'pending',
      tenant: 'Sarah Williams',
      property: 'Ocean View Complex',
      unit: '105',
      createdDate: '2024-10-12',
      expiryDate: '2024-11-30',
      signedBy: 'N/A',
      size: '158 KB',
    },
  ];

  const tenants = [
    { id: '1', name: 'John Doe', email: 'john.doe@example.com', unit: '201', property: 'Sunset Apartments' },
    { id: '2', name: 'Jane Smith', email: 'jane.smith@example.com', unit: '102', property: 'Ocean View Complex' },
    { id: '3', name: 'Mike Johnson', email: 'mike.j@example.com', unit: '301', property: 'Downtown Plaza' },
    { id: '4', name: 'Sarah Williams', email: 'sarah.w@example.com', unit: '105', property: 'Ocean View Complex' },
  ];

  const properties = [
    { id: '1', name: 'Sunset Apartments', units: ['201', '202', '203', '204'] },
    { id: '2', name: 'Ocean View Complex', units: ['101', '102', '103', '104', '105'] },
    { id: '3', name: 'Downtown Plaza', units: ['301', '302', '303'] },
  ];

  const documentTemplates = {
    lease: [
      { id: 'standard', name: 'Standard Lease Agreement', description: '12-month standard lease' },
      { id: 'shortTerm', name: 'Short-Term Lease', description: '3-6 month lease' },
      { id: 'monthToMonth', name: 'Month-to-Month Agreement', description: 'Flexible rental terms' },
    ],
    notice: [
      { id: 'renewal', name: 'Lease Renewal Notice', description: 'Notify tenant of renewal options' },
      { id: 'termination', name: 'Lease Termination Notice', description: 'Notice to end tenancy' },
      { id: 'violation', name: 'Lease Violation Notice', description: 'Warning for lease violations' },
      { id: 'inspection', name: 'Inspection Notice', description: 'Schedule property inspection' },
      { id: 'rent_increase', name: 'Rent Increase Notice', description: 'Notify of rent changes' },
    ],
    receipt: [
      { id: 'rent', name: 'Rent Receipt', description: 'Monthly rent payment receipt' },
      { id: 'deposit', name: 'Security Deposit Receipt', description: 'Initial deposit receipt' },
      { id: 'late_fee', name: 'Late Fee Receipt', description: 'Late payment fee receipt' },
    ],
    report: [
      { id: 'move_in', name: 'Move-In Inspection', description: 'Document unit condition at move-in' },
      { id: 'move_out', name: 'Move-Out Inspection', description: 'Document unit condition at move-out' },
      { id: 'maintenance', name: 'Maintenance Report', description: 'Completed maintenance work' },
      { id: 'incident', name: 'Incident Report', description: 'Document property incidents' },
    ],
  };

  const documentStats = {
    total: documents.length,
    active: documents.filter(d => d.status === 'active').length,
    pending: documents.filter(d => d.status === 'pending' || d.status === 'sent').length,
    completed: documents.filter(d => d.status === 'completed').length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <FileCheck className="h-4 w-4" />;
      case 'sent':
      case 'pending':
        return <FileClock className="h-4 w-4" />;
      case 'expired':
        return <FileWarning className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const handleGenerateDocument = () => {
    console.log('Generating document:', documentForm);
    setShowGenerateDialog(false);
    toast.success('Document generated successfully! It has been sent to the tenant for signature.');
    // Reset form
    setDocumentForm({
      type: 'lease',
      tenantId: '',
      propertyId: '',
      unitId: '',
      templateType: 'standard',
      startDate: '',
      endDate: '',
      monthlyRent: '',
      securityDeposit: '',
      noticeType: '',
      effectiveDate: '',
      reason: '',
      paymentDate: '',
      amount: '',
      paymentMethod: '',
      reportType: '',
      reportDate: '',
      description: '',
    });
  };

  const handleViewDocument = (doc: any) => {
    setSelectedDocument(doc);
    setShowViewDialog(true);
  };

  const handleDeleteDocument = (doc: any) => {
    setSelectedDocument(doc);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    console.log('Deleting document:', selectedDocument?.id);
    setShowDeleteDialog(false);
    toast.success('Document deleted successfully!');
  };

  const handleDownload = (doc?: any) => {
    toast.info(`Downloading ${doc?.name || selectedDocument?.name}...`);
  };

  const handleShare = (doc: any) => {
    toast.info(`Sharing ${doc.name}...`);
  };

  const handleUpload = () => {
    setShowUploadDialog(false);
    toast.success('Document uploaded successfully!');
  };

  const filteredDocuments = documents.filter(doc => {
    // Search filter
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          doc.tenant.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          doc.property.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Category filter (legacy - kept for backward compatibility)
    const matchesCategory = filterCategory === 'all' || doc.category === filterCategory;
    
    // Advanced filters
    const matchesStatus = filters.status === 'all' || doc.status === filters.status;
    const matchesType = filters.type === 'all' || doc.type === filters.type;
    const matchesProperty = filters.property === 'all' || doc.property === filters.property;
    const matchesTenant = filters.tenant === 'all' || doc.tenant === filters.tenant;
    
    // Date range filter
    let matchesDateRange = true;
    if (filters.dateFrom && doc.createdDate) {
      matchesDateRange = matchesDateRange && doc.createdDate >= filters.dateFrom;
    }
    if (filters.dateTo && doc.createdDate) {
      matchesDateRange = matchesDateRange && doc.createdDate <= filters.dateTo;
    }
    
    return matchesSearch && matchesCategory && matchesStatus && 
           matchesType && matchesProperty && matchesTenant && matchesDateRange;
  });
  
  // Count active filters
  const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'dateFrom' || key === 'dateTo') return value !== '';
    return value !== 'all';
  }).length;
  
  // Clear all filters
  const clearAllFilters = () => {
    setFilters({
      status: 'all',
      type: 'all',
      property: 'all',
      tenant: 'all',
      dateFrom: '',
      dateTo: '',
    });
    setFilterCategory('all');
  };

  const categories = ['all', ...Array.from(new Set(documents.map(d => d.category)))];

  const getTemplates = () => {
    return documentTemplates[documentForm.type as keyof typeof documentTemplates] || [];
  };

  const renderDocumentForm = () => {
    switch (documentForm.type) {
      case 'lease':
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Lease Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={documentForm.startDate}
                  onChange={(e) => setDocumentForm({ ...documentForm, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Lease End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={documentForm.endDate}
                  onChange={(e) => setDocumentForm({ ...documentForm, endDate: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="monthlyRent">Monthly Rent (₦)</Label>
                <Input
                  id="monthlyRent"
                  type="number"
                  placeholder="250000"
                  value={documentForm.monthlyRent}
                  onChange={(e) => setDocumentForm({ ...documentForm, monthlyRent: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="securityDeposit">Security Deposit (₦)</Label>
                <Input
                  id="securityDeposit"
                  type="number"
                  placeholder="250000"
                  value={documentForm.securityDeposit}
                  onChange={(e) => setDocumentForm({ ...documentForm, securityDeposit: e.target.value })}
                />
              </div>
            </div>
          </>
        );
      case 'notice':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="effectiveDate">Effective Date</Label>
              <Input
                id="effectiveDate"
                type="date"
                value={documentForm.effectiveDate}
                onChange={(e) => setDocumentForm({ ...documentForm, effectiveDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason / Details</Label>
              <Textarea
                id="reason"
                placeholder="Provide details for this notice..."
                value={documentForm.reason}
                onChange={(e) => setDocumentForm({ ...documentForm, reason: e.target.value })}
                rows={4}
              />
            </div>
          </>
        );
      case 'receipt':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="paymentDate">Payment Date</Label>
              <Input
                id="paymentDate"
                type="date"
                value={documentForm.paymentDate}
                onChange={(e) => setDocumentForm({ ...documentForm, paymentDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₦)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="250000"
                value={documentForm.amount}
                onChange={(e) => setDocumentForm({ ...documentForm, amount: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select
                value={documentForm.paymentMethod}
                onValueChange={(value) => setDocumentForm({ ...documentForm, paymentMethod: value })}
              >
                <SelectTrigger id="paymentMethod">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="debit_card">Debit Card</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );
      case 'report':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="reportDate">Report Date</Label>
              <Input
                id="reportDate"
                type="date"
                value={documentForm.reportDate}
                onChange={(e) => setDocumentForm({ ...documentForm, reportDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description / Findings</Label>
              <Textarea
                id="description"
                placeholder="Describe the inspection or incident..."
                value={documentForm.description}
                onChange={(e) => setDocumentForm({ ...documentForm, description: e.target.value })}
                rows={6}
              />
            </div>
          </>
        );
    }
  };

  // Show template manager if active
  if (showTemplateManager) {
    return <DocumentTemplateManager onClose={() => setShowTemplateManager(false)} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Documents</h1>
          <p className="text-muted-foreground">Generate and manage tenant documents</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowTemplateManager(true)}>
            <FileText className="h-4 w-4 mr-2" />
            Manage Templates
          </Button>
          <Button variant="outline" onClick={() => setShowUploadDialog(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
          <Button onClick={() => setShowGenerateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Generate Document
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documentStats.total}</div>
            <p className="text-xs text-muted-foreground">All document types</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Leases</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documentStats.active}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <FileClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documentStats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting signature</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documentStats.completed}</div>
            <p className="text-xs text-muted-foreground">Archived documents</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Generate common documents quickly</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center space-y-2"
              onClick={() => {
                setDocumentForm({ ...documentForm, type: 'lease' });
                setShowGenerateDialog(true);
              }}
            >
              <FileSignature className="h-6 w-6" />
              <span className="text-sm">New Lease</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center space-y-2"
              onClick={() => {
                setDocumentForm({ ...documentForm, type: 'receipt' });
                setShowGenerateDialog(true);
              }}
            >
              <Receipt className="h-6 w-6" />
              <span className="text-sm">Generate Receipt</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center space-y-2"
              onClick={() => {
                setDocumentForm({ ...documentForm, type: 'notice' });
                setShowGenerateDialog(true);
              }}
            >
              <AlertTriangle className="h-6 w-6" />
              <span className="text-sm">Send Notice</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center space-y-2"
              onClick={() => {
                setDocumentForm({ ...documentForm, type: 'report' });
                setShowGenerateDialog(true);
              }}
            >
              <ClipboardList className="h-6 w-6" />
              <span className="text-sm">Create Report</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents, tenants, or properties..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[200px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat === 'all' ? 'All Categories' : cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Advanced Filters Popover */}
              <Popover open={showFilterPopover} onOpenChange={setShowFilterPopover}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="relative">
                    <Filter className="h-4 w-4 mr-2" />
                    Advanced Filters
                    {activeFilterCount > 0 && (
                      <Badge 
                        variant="secondary" 
                        className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center"
                      >
                        {activeFilterCount}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Advanced Filters</h4>
                      {activeFilterCount > 0 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={clearAllFilters}
                          className="h-auto p-1 text-xs"
                        >
                          Clear All
                        </Button>
                      )}
                    </div>
                    
                    <Separator />
                    
                    {/* Status Filter */}
                    <div className="space-y-2">
                      <Label className="text-sm">Status</Label>
                      <Select
                        value={filters.status}
                        onValueChange={(value) => setFilters({ ...filters, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="sent">Sent</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="expired">Expired</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Document Type Filter */}
                    <div className="space-y-2">
                      <Label className="text-sm">Document Type</Label>
                      <Select
                        value={filters.type}
                        onValueChange={(value) => setFilters({ ...filters, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="Lease">Lease Agreement</SelectItem>
                          <SelectItem value="Notice">Notice</SelectItem>
                          <SelectItem value="Receipt">Receipt</SelectItem>
                          <SelectItem value="Inspection">Inspection Report</SelectItem>
                          <SelectItem value="Maintenance">Maintenance Report</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Property Filter */}
                    <div className="space-y-2">
                      <Label className="text-sm">Property</Label>
                      <Select
                        value={filters.property}
                        onValueChange={(value) => setFilters({ ...filters, property: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Properties</SelectItem>
                          {properties.map((property) => (
                            <SelectItem key={property.id} value={property.name}>
                              {property.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Tenant Filter */}
                    <div className="space-y-2">
                      <Label className="text-sm">Tenant</Label>
                      <Select
                        value={filters.tenant}
                        onValueChange={(value) => setFilters({ ...filters, tenant: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Tenants</SelectItem>
                          {tenants.map((tenant) => (
                            <SelectItem key={tenant.id} value={tenant.name}>
                              {tenant.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Date Range Filter */}
                    <div className="space-y-2">
                      <Label className="text-sm">Date Range</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">From</Label>
                          <Input
                            type="date"
                            value={filters.dateFrom}
                            onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">To</Label>
                          <Input
                            type="date"
                            value={filters.dateTo}
                            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-between">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowFilterPopover(false)}
                      >
                        Close
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => setShowFilterPopover(false)}
                      >
                        Apply Filters
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          {/* Active Filters Display */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {filters.status !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  Status: {filters.status}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setFilters({ ...filters, status: 'all' })}
                  />
                </Badge>
              )}
              {filters.type !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  Type: {filters.type}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setFilters({ ...filters, type: 'all' })}
                  />
                </Badge>
              )}
              {filters.property !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  Property: {filters.property}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setFilters({ ...filters, property: 'all' })}
                  />
                </Badge>
              )}
              {filters.tenant !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  Tenant: {filters.tenant}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setFilters({ ...filters, tenant: 'all' })}
                  />
                </Badge>
              )}
              {filters.dateFrom && (
                <Badge variant="secondary" className="gap-1">
                  From: {filters.dateFrom}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setFilters({ ...filters, dateFrom: '' })}
                  />
                </Badge>
              )}
              {filters.dateTo && (
                <Badge variant="secondary" className="gap-1">
                  To: {filters.dateTo}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setFilters({ ...filters, dateTo: '' })}
                  />
                </Badge>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearAllFilters}
                className="h-6 text-xs"
              >
                Clear All
              </Button>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Documents</CardTitle>
          <CardDescription>View and manage tenant documents</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Property / Unit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(doc.status)}
                      <span className="font-medium">{doc.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{doc.category}</TableCell>
                  <TableCell>{doc.tenant}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {doc.property} / {doc.unit}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusColor(doc.status)}>
                      {doc.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{doc.createdDate}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDocument(doc)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDownload(doc)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleShare(doc)}>
                        <Share2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteDocument(doc)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Generate Document Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generate Document</DialogTitle>
            <DialogDescription>
              Create a new document for your tenant
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Document Type</Label>
              <RadioGroup
                value={documentForm.type}
                onValueChange={(value) => setDocumentForm({ ...documentForm, type: value })}
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2 p-4 border rounded-lg">
                    <RadioGroupItem value="lease" id="type-lease" />
                    <Label htmlFor="type-lease" className="flex items-center space-x-2 cursor-pointer flex-1">
                      <FileSignature className="h-5 w-5" />
                      <div>
                        <div className="font-medium">Lease Agreement</div>
                        <div className="text-xs text-muted-foreground">Rental contracts</div>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-4 border rounded-lg">
                    <RadioGroupItem value="notice" id="type-notice" />
                    <Label htmlFor="type-notice" className="flex items-center space-x-2 cursor-pointer flex-1">
                      <AlertTriangle className="h-5 w-5" />
                      <div>
                        <div className="font-medium">Notice</div>
                        <div className="text-xs text-muted-foreground">Tenant notifications</div>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-4 border rounded-lg">
                    <RadioGroupItem value="receipt" id="type-receipt" />
                    <Label htmlFor="type-receipt" className="flex items-center space-x-2 cursor-pointer flex-1">
                      <Receipt className="h-5 w-5" />
                      <div>
                        <div className="font-medium">Receipt</div>
                        <div className="text-xs text-muted-foreground">Payment receipts</div>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-4 border rounded-lg">
                    <RadioGroupItem value="report" id="type-report" />
                    <Label htmlFor="type-report" className="flex items-center space-x-2 cursor-pointer flex-1">
                      <ClipboardList className="h-5 w-5" />
                      <div>
                        <div className="font-medium">Report</div>
                        <div className="text-xs text-muted-foreground">Inspections & incidents</div>
                      </div>
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tenant">Select Tenant</Label>
              <Select
                value={documentForm.tenantId}
                onValueChange={(value) => setDocumentForm({ ...documentForm, tenantId: value })}
              >
                <SelectTrigger id="tenant">
                  <SelectValue placeholder="Choose a tenant" />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      <div className="flex flex-col">
                        <span>{tenant.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {tenant.property} - Unit {tenant.unit}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="template">Template</Label>
              <Select
                value={documentForm.templateType}
                onValueChange={(value) => setDocumentForm({ ...documentForm, templateType: value })}
              >
                <SelectTrigger id="template">
                  <SelectValue placeholder="Choose a template" />
                </SelectTrigger>
                <SelectContent>
                  {getTemplates().map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      <div className="flex flex-col">
                        <span>{template.name}</span>
                        <span className="text-xs text-muted-foreground">{template.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {renderDocumentForm()}

            <Alert>
              <Send className="h-4 w-4" />
              <AlertDescription>
                The document will be sent to the tenant's email for review and signature.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerateDocument}>
              Generate & Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Document Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Upload a document to tenant records
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="docName">Document Name</Label>
              <Input id="docName" placeholder="Enter document name" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="uploadTenant">Tenant</Label>
              <Select>
                <SelectTrigger id="uploadTenant">
                  <SelectValue placeholder="Select tenant" />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.name} - {tenant.property} / {tenant.unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="uploadCategory">Category</Label>
              <Select>
                <SelectTrigger id="uploadCategory">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lease">Lease Agreements</SelectItem>
                  <SelectItem value="notices">Notices</SelectItem>
                  <SelectItem value="receipts">Receipts</SelectItem>
                  <SelectItem value="reports">Reports</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">File</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">
                  PDF, DOC, DOCX up to 10MB
                </p>
                <Input id="file" type="file" className="hidden" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpload}>
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Document Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Document Details</DialogTitle>
          </DialogHeader>
          {selectedDocument && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Document Name</Label>
                  <p className="font-medium">{selectedDocument.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Category</Label>
                  <p className="font-medium">{selectedDocument.category}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Type</Label>
                  <p className="font-medium">{selectedDocument.type}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge variant="outline" className={getStatusColor(selectedDocument.status)}>
                    {selectedDocument.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Tenant</Label>
                  <p className="font-medium">{selectedDocument.tenant}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Property</Label>
                  <p className="font-medium">{selectedDocument.property}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Unit</Label>
                  <p className="font-medium">{selectedDocument.unit}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Created Date</Label>
                  <p className="font-medium">{selectedDocument.createdDate}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Expiry Date</Label>
                  <p className="font-medium">{selectedDocument.expiryDate || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">File Size</Label>
                  <p className="font-medium">{selectedDocument.size}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-muted-foreground">Signed By</Label>
                  <p className="font-medium">{selectedDocument.signedBy}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>
              Close
            </Button>
            <Button onClick={() => handleDownload()}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{selectedDocument?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PropertyManagerDocuments;

