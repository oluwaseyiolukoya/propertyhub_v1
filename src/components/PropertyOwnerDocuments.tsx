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
  Plus,
  Eye,
  Share2,
  Trash2,
  FileCheck,
  FileClock,
  FileWarning,
  Send,
  FileSignature,
  Receipt,
  AlertTriangle,
  Shield,
  ClipboardList,
} from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { toast } from 'sonner';
import DocumentTemplateManager from './DocumentTemplateManager';

const PropertyOwnerDocuments: React.FC = () => {
  const [activeTab, setActiveTab] = useState('manager-contracts');
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogType, setDialogType] = useState('manager-contract');
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  
  // Form states for generating manager contract
  const [contractForm, setContractForm] = useState({
    managerId: '',
    templateType: 'standard',
    startDate: '',
    endDate: '',
    compensation: '',
    responsibilities: '',
    propertyIds: [] as string[],
  });

  // Mock data for Manager Contracts
  const managerContracts = [
    {
      id: 1,
      name: 'Property Manager Agreement - John Smith',
      type: 'Manager Contract',
      status: 'active',
      uploadDate: '2024-10-01',
      expiryDate: '2025-10-01',
      size: '245 KB',
      signedBy: 'John Smith',
      properties: ['Sunset Apartments', 'Ocean View Complex'],
    },
    {
      id: 2,
      name: 'Property Manager Agreement - Sarah Johnson',
      type: 'Manager Contract',
      status: 'active',
      uploadDate: '2024-09-15',
      expiryDate: '2025-09-15',
      size: '238 KB',
      signedBy: 'Sarah Johnson',
      properties: ['Downtown Plaza'],
    },
  ];

  // Mock data for Lease & Inspections
  const leasesInspections = [
    {
      id: 3,
      name: 'Master Lease Agreement - Sunset Apartments',
      type: 'Lease Agreement',
      status: 'active',
      uploadDate: '2023-05-12',
      expiryDate: '2025-05-12',
      size: '1.2 MB',
      signedBy: 'Multiple Parties',
      property: 'Sunset Apartments',
    },
    {
      id: 4,
      name: 'Annual Property Inspection - Ocean View Complex',
      type: 'Inspection Report',
      status: 'completed',
      uploadDate: '2024-08-20',
      expiryDate: null,
      size: '670 KB',
      signedBy: 'Inspector Mike Davis',
      property: 'Ocean View Complex',
    },
    {
      id: 5,
      name: 'Safety Compliance Inspection - Downtown Plaza',
      type: 'Inspection Report',
      status: 'completed',
      uploadDate: '2024-09-10',
      expiryDate: null,
      size: '540 KB',
      signedBy: 'City Inspector',
      property: 'Downtown Plaza',
    },
  ];

  // Mock data for Receipts
  const receipts = [
    {
      id: 6,
      name: 'Property Tax Receipt - Sunset Apartments',
      type: 'Tax Receipt',
      status: 'completed',
      uploadDate: '2024-03-15',
      expiryDate: null,
      size: '180 KB',
      signedBy: 'Tax Authority',
      property: 'Sunset Apartments',
      amount: '₦15,240',
    },
    {
      id: 7,
      name: 'Maintenance Vendor Payment - Ocean View',
      type: 'Payment Receipt',
      status: 'completed',
      uploadDate: '2024-10-05',
      expiryDate: null,
      size: '95 KB',
      signedBy: 'ABC Maintenance Co.',
      property: 'Ocean View Complex',
      amount: '₦3,200',
    },
    {
      id: 8,
      name: 'Insurance Premium Payment Receipt',
      type: 'Payment Receipt',
      status: 'completed',
      uploadDate: '2024-09-01',
      expiryDate: null,
      size: '110 KB',
      signedBy: 'Insurance Corp',
      property: 'All Properties',
      amount: '₦24,500',
    },
  ];

  // Mock data for Policies & Notices
  const policiesNotices = [
    {
      id: 9,
      name: 'Tenant Screening Policy - Updated 2024',
      type: 'Policy Document',
      status: 'active',
      uploadDate: '2024-01-01',
      expiryDate: null,
      size: '320 KB',
      signedBy: 'Owner',
      property: 'All Properties',
    },
    {
      id: 10,
      name: 'Rent Increase Notice Template',
      type: 'Notice Template',
      status: 'active',
      uploadDate: '2024-02-15',
      expiryDate: null,
      size: '145 KB',
      signedBy: 'Legal Team',
      property: 'All Properties',
    },
    {
      id: 11,
      name: 'Emergency Procedures Policy',
      type: 'Policy Document',
      status: 'active',
      uploadDate: '2024-03-20',
      expiryDate: null,
      size: '280 KB',
      signedBy: 'Owner',
      property: 'All Properties',
    },
  ];

  // Mock data for Insurance
  const insurance = [
    {
      id: 12,
      name: 'Property Insurance Policy - Sunset Apartments',
      type: 'Insurance Policy',
      status: 'active',
      uploadDate: '2023-11-01',
      expiryDate: '2024-11-01',
      size: '450 KB',
      signedBy: 'Insurance Corp',
      property: 'Sunset Apartments',
      policyNumber: 'PI-123456',
    },
    {
      id: 13,
      name: 'Liability Insurance - Ocean View Complex',
      type: 'Insurance Policy',
      status: 'expiring_soon',
      uploadDate: '2023-10-15',
      expiryDate: '2024-10-28',
      size: '390 KB',
      signedBy: 'General Insurance Co.',
      property: 'Ocean View Complex',
      policyNumber: 'LI-789012',
    },
    {
      id: 14,
      name: 'Umbrella Policy - All Properties',
      type: 'Insurance Policy',
      status: 'active',
      uploadDate: '2024-01-10',
      expiryDate: '2025-01-10',
      size: '520 KB',
      signedBy: 'Premium Insurance',
      property: 'All Properties',
      policyNumber: 'UP-345678',
    },
  ];

  const properties = [
    { id: '1', name: 'Sunset Apartments' },
    { id: '2', name: 'Ocean View Complex' },
    { id: '3', name: 'Downtown Plaza' },
    { id: '4', name: 'Garden Heights' },
  ];

  const managers = [
    { id: '1', name: 'John Smith', email: 'john.smith@example.com' },
    { id: '2', name: 'Sarah Johnson', email: 'sarah.j@example.com' },
    { id: '3', name: 'Mike Davis', email: 'mike.davis@example.com' },
  ];

  const contractTemplates = [
    { id: 'standard', name: 'Standard Manager Agreement', description: 'Standard contract for property managers' },
    { id: 'premium', name: 'Premium Manager Agreement', description: 'Enhanced agreement with additional benefits' },
    { id: 'temporary', name: 'Temporary Manager Agreement', description: 'Short-term or temporary management contract' },
  ];

  const getAllDocuments = () => {
    return [...managerContracts, ...leasesInspections, ...receipts, ...policiesNotices, ...insurance];
  };

  const getActiveTabDocuments = () => {
    switch (activeTab) {
      case 'manager-contracts':
        return managerContracts;
      case 'leases-inspections':
        return leasesInspections;
      case 'receipts':
        return receipts;
      case 'policies-notices':
        return policiesNotices;
      case 'insurance':
        return insurance;
      default:
        return [];
    }
  };

  const filteredDocuments = getActiveTabDocuments().filter(doc =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const documentStats = {
    total: getAllDocuments().length,
    active: getAllDocuments().filter(d => d.status === 'active').length,
    expiringSoon: getAllDocuments().filter(d => d.status === 'expiring_soon').length,
    completed: getAllDocuments().filter(d => d.status === 'completed').length,
    managerContracts: managerContracts.length,
    leases: leasesInspections.length,
    receipts: receipts.length,
    policies: policiesNotices.length,
    insurance: insurance.length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'expiring_soon':
        return 'bg-yellow-100 text-yellow-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <FileCheck className="h-4 w-4" />;
      case 'expiring_soon':
        return <FileClock className="h-4 w-4" />;
      case 'expired':
        return <FileWarning className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const handleGenerateContract = () => {
    console.log('Generating contract:', contractForm);
    setShowGenerateDialog(false);
    toast.success('Manager contract generated successfully! An email has been sent for e-signature.');
    setContractForm({
      managerId: '',
      templateType: 'standard',
      startDate: '',
      endDate: '',
      compensation: '',
      responsibilities: '',
      propertyIds: [],
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

  const openGenerateDialog = (type: string) => {
    setDialogType(type);
    setShowGenerateDialog(true);
  };

  const handleDownload = (doc: any) => {
    toast.info(`Downloading ${doc.name}...`);
  };

  const handleShare = (doc: any) => {
    toast.info(`Sharing ${doc.name}...`);
  };

  const handleUpload = () => {
    setShowUploadDialog(false);
    toast.success('Document uploaded successfully!');
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
          <p className="text-muted-foreground">Manage contracts, leases, receipts, policies, and insurance documents</p>
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
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documentStats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documentStats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring</CardTitle>
            <FileClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documentStats.expiringSoon}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contracts</CardTitle>
            <FileSignature className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documentStats.managerContracts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receipts</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documentStats.receipts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Insurance</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documentStats.insurance}</div>
          </CardContent>
        </Card>
      </div>

      {/* Expiring Soon Alert */}
      {documentStats.expiringSoon > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <FileWarning className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-900">
            You have {documentStats.expiringSoon} document(s) expiring soon. Please review and renew as needed.
          </AlertDescription>
        </Alert>
      )}

      {/* Document Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="manager-contracts">
            <FileSignature className="h-4 w-4 mr-2" />
            Manager Contracts
          </TabsTrigger>
          <TabsTrigger value="leases-inspections">
            <ClipboardList className="h-4 w-4 mr-2" />
            Lease & Inspections
          </TabsTrigger>
          <TabsTrigger value="receipts">
            <Receipt className="h-4 w-4 mr-2" />
            Receipts
          </TabsTrigger>
          <TabsTrigger value="policies-notices">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Policies & Notices
          </TabsTrigger>
          <TabsTrigger value="insurance">
            <Shield className="h-4 w-4 mr-2" />
            Insurance
          </TabsTrigger>
        </TabsList>

        {/* Manager Contracts Tab */}
        <TabsContent value="manager-contracts" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Manager Contracts</CardTitle>
                  <CardDescription>Generate and manage property manager agreements</CardDescription>
                </div>
                <Button onClick={() => openGenerateDialog('manager-contract')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Generate Contract
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search contracts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Upload Date</TableHead>
                    <TableHead>Expiry Date</TableHead>
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
                      <TableCell>
                        <Badge variant="outline" className={getStatusColor(doc.status)}>
                          {doc.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{doc.uploadDate}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {doc.expiryDate || 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleViewDocument(doc)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDownload(doc)}>
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleShare(doc)}>
                            <Share2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteDocument(doc)}>
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
        </TabsContent>

        {/* Lease & Inspections Tab */}
        <TabsContent value="leases-inspections" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Lease Agreements & Inspections</CardTitle>
                  <CardDescription>Master leases and property inspection reports</CardDescription>
                </div>
                <Button onClick={() => openGenerateDialog('lease-inspection')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Document
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search leases and inspections..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
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
                      <TableCell>{doc.type}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{doc.property}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusColor(doc.status)}>
                          {doc.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{doc.uploadDate}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleViewDocument(doc)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDownload(doc)}>
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleShare(doc)}>
                            <Share2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteDocument(doc)}>
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
        </TabsContent>

        {/* Receipts Tab */}
        <TabsContent value="receipts" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Receipts</CardTitle>
                  <CardDescription>Tax receipts, payment confirmations, and financial records</CardDescription>
                </div>
                <Button onClick={() => openGenerateDialog('receipt')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Receipt
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search receipts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.map((doc: any) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Receipt className="h-4 w-4" />
                          <span className="font-medium">{doc.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{doc.type}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{doc.property}</TableCell>
                      <TableCell className="font-medium">{doc.amount}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{doc.uploadDate}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleViewDocument(doc)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDownload(doc)}>
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleShare(doc)}>
                            <Share2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteDocument(doc)}>
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
        </TabsContent>

        {/* Policies & Notices Tab */}
        <TabsContent value="policies-notices" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Policies & Notices</CardTitle>
                  <CardDescription>Company policies, notice templates, and compliance documents</CardDescription>
                </div>
                <Button onClick={() => openGenerateDialog('policy-notice')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Policy/Notice
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search policies and notices..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="font-medium">{doc.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{doc.type}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{doc.property}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusColor(doc.status)}>
                          {doc.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{doc.uploadDate}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleViewDocument(doc)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDownload(doc)}>
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleShare(doc)}>
                            <Share2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteDocument(doc)}>
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
        </TabsContent>

        {/* Insurance Tab */}
        <TabsContent value="insurance" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Insurance Documents</CardTitle>
                  <CardDescription>Property insurance, liability coverage, and policy documents</CardDescription>
                </div>
                <Button onClick={() => openGenerateDialog('insurance')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Insurance Doc
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search insurance documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document Name</TableHead>
                    <TableHead>Policy Number</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.map((doc: any) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Shield className="h-4 w-4" />
                          <span className="font-medium">{doc.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{doc.policyNumber}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{doc.property}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusColor(doc.status)}>
                          {doc.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{doc.expiryDate}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleViewDocument(doc)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDownload(doc)}>
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleShare(doc)}>
                            <Share2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteDocument(doc)}>
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
        </TabsContent>
      </Tabs>

      {/* Generate Manager Contract Dialog */}
      <Dialog open={showGenerateDialog && dialogType === 'manager-contract'} onOpenChange={setShowGenerateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generate Manager Contract</DialogTitle>
            <DialogDescription>
              Create a new property manager agreement
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="manager">Select Manager</Label>
              <Select
                value={contractForm.managerId}
                onValueChange={(value) => setContractForm({ ...contractForm, managerId: value })}
              >
                <SelectTrigger id="manager">
                  <SelectValue placeholder="Choose a manager" />
                </SelectTrigger>
                <SelectContent>
                  {managers.map((manager) => (
                    <SelectItem key={manager.id} value={manager.id}>
                      <div className="flex flex-col">
                        <span>{manager.name}</span>
                        <span className="text-xs text-muted-foreground">{manager.email}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="template">Contract Template</Label>
              <Select
                value={contractForm.templateType}
                onValueChange={(value) => setContractForm({ ...contractForm, templateType: value })}
              >
                <SelectTrigger id="template">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {contractTemplates.map((template) => (
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={contractForm.startDate}
                  onChange={(e) => setContractForm({ ...contractForm, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={contractForm.endDate}
                  onChange={(e) => setContractForm({ ...contractForm, endDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="compensation">Monthly Compensation (₦)</Label>
              <Input
                id="compensation"
                type="number"
                placeholder="5000"
                value={contractForm.compensation}
                onChange={(e) => setContractForm({ ...contractForm, compensation: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Assigned Properties</Label>
              <div className="border rounded-lg p-4 space-y-2">
                {properties.map((property) => (
                  <div key={property.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`property-${property.id}`}
                      checked={contractForm.propertyIds.includes(property.id)}
                      onChange={(e) => {
                        const newIds = e.target.checked
                          ? [...contractForm.propertyIds, property.id]
                          : contractForm.propertyIds.filter(id => id !== property.id);
                        setContractForm({ ...contractForm, propertyIds: newIds });
                      }}
                      className="rounded"
                    />
                    <Label htmlFor={`property-${property.id}`} className="cursor-pointer">
                      {property.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsibilities">Key Responsibilities</Label>
              <Textarea
                id="responsibilities"
                placeholder="List the manager's key responsibilities..."
                value={contractForm.responsibilities}
                onChange={(e) => setContractForm({ ...contractForm, responsibilities: e.target.value })}
                rows={4}
              />
            </div>

            <Alert>
              <Send className="h-4 w-4" />
              <AlertDescription>
                The contract will be sent to the manager's email for electronic signature.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerateContract}>
              Generate & Send Contract
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
              Upload a new document to your library
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="docName">Document Name</Label>
              <Input id="docName" placeholder="Enter document name" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contracts">Manager Contracts</SelectItem>
                  <SelectItem value="leases">Lease & Inspections</SelectItem>
                  <SelectItem value="receipts">Receipts</SelectItem>
                  <SelectItem value="policies">Policies & Notices</SelectItem>
                  <SelectItem value="insurance">Insurance</SelectItem>
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
                  <Label className="text-muted-foreground">Upload Date</Label>
                  <p className="font-medium">{selectedDocument.uploadDate}</p>
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
            <Button onClick={() => selectedDocument && handleDownload(selectedDocument)}>
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

export default PropertyOwnerDocuments;

