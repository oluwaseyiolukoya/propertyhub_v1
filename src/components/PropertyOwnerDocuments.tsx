import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
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
  Loader2,
  MoreHorizontal,
} from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { toast } from 'sonner';
import DocumentTemplateManager from './DocumentTemplateManager';
import RichTextEditor from './RichTextEditor';
import {
  getDocuments,
  createDocument,
  uploadDocument,
  updateDocument,
  deleteDocument,
  getDocumentStats,
  getDocumentDownloadUrl,
  Document,
  DocumentStats,
} from '../lib/api';
import { getProperties } from '../lib/api';

const PropertyOwnerDocuments: React.FC = () => {
  const [activeTab, setActiveTab] = useState('manager-contracts');
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [shareForm, setShareForm] = useState({
    sharedWith: [] as string[],
    message: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogType, setDialogType] = useState('manager-contract');
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [editableContent, setEditableContent] = useState('');
  
  // Data state
  const [documents, setDocuments] = useState<Document[]>([]);
  const [stats, setStats] = useState<DocumentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [properties, setProperties] = useState<any[]>([]);
  
  // Form states
  const [uploadForm, setUploadForm] = useState({
    file: null as File | null,
    name: '',
    type: 'lease',
    category: 'Legal Documents',
    description: '',
    propertyId: '',
    unitId: '',
    tenantId: '',
    managerId: '',
    isShared: false,
  });
  
  // Form states for generating contracts
  const [contractForm, setContractForm] = useState({
    managerId: '',
    tenantId: '',
    propertyId: '', // Single property for manager contract
    templateType: 'standard',
    startDate: '',
    endDate: '',
    compensation: '',
    compensationType: 'fixed', // 'fixed' or 'percentage'
    responsibilities: '',
    propertyIds: [] as string[], // Kept for compatibility
    unitId: '',
  });

  // Load documents and stats on mount
  useEffect(() => {
    loadDocuments();
    loadStats();
    loadProperties();
    loadManagers();
    loadTenants();
  }, []);

  const loadManagers = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      // Load all managers with their property assignments
      const managersResponse = await fetch(`${API_URL}/api/property-managers`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (managersResponse.ok) {
        const managersData = await managersResponse.json();
        setManagers(Array.isArray(managersData) ? managersData : []);
      }
    } catch (error) {
      console.error('Failed to load managers:', error);
      setManagers([]); // Set empty array on error
    }
  };

  const loadUnitsForProperty = async (propertyId: string) => {
    if (!propertyId) {
      setPropertyUnits([]);
      setPropertyManagerAssignments([]);
      return;
    }

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      // Load units for the property
      const unitsResponse = await fetch(`${API_URL}/api/units?propertyId=${propertyId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (unitsResponse.ok) {
        const unitsData = await unitsResponse.json();
        setPropertyUnits(Array.isArray(unitsData) ? unitsData : []);
      }

      // Load managers assigned to the property
      const managersResponse = await fetch(`${API_URL}/api/property-managers`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (managersResponse.ok) {
        const managersData = await managersResponse.json();
        // Filter managers assigned to this specific property
        const assignedManagers = Array.isArray(managersData) 
          ? managersData.filter((m: any) => 
              m.property_managers?.some((pm: any) => pm.propertyId === propertyId && pm.isActive)
            )
          : [];
        setPropertyManagerAssignments(assignedManagers);
      }
    } catch (error) {
      console.error('Failed to load units/managers:', error);
      setPropertyUnits([]);
      setPropertyManagerAssignments([]);
    }
  };

  const getTenantForUnit = (unitId: string) => {
    if (!unitId || !Array.isArray(propertyUnits)) return null;
    
    const unit = propertyUnits.find(u => u.id === unitId);
    if (!unit) return null;

    // Find tenant from leases through the unit
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    fetch(`${API_URL}/api/tenant/all`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    })
      .then(res => res.json())
      .then(result => {
        const leases = result.data || [];
        const lease = leases.find((l: any) => l.unitId === unitId && l.status === 'active');
        if (lease && lease.users) {
          // Auto-populate tenant ID
          setContractForm(prev => ({ 
            ...prev, 
            tenantId: lease.users.id 
          }));
        }
      })
      .catch(err => console.error('Failed to get tenant for unit:', err));

    return unit;
  };

  const loadTenants = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/tenant/all`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (response.ok) {
        const result = await response.json();
        // Extract tenants from leases data
        const leases = result.data || [];
        const uniqueTenants = leases
          .map((lease: any) => lease.users)
          .filter((tenant: any) => tenant !== null)
          .reduce((acc: any[], tenant: any) => {
            if (!acc.find(t => t.id === tenant.id)) {
              acc.push(tenant);
            }
            return acc;
          }, []);
        setTenants(uniqueTenants);
      }
    } catch (error) {
      console.error('Failed to load tenants:', error);
      setTenants([]); // Set empty array on error
    }
  };

  const loadDocuments = async () => {
    try {
      setLoading(true);
      // Fetch all documents without status filter to include drafts
      const { data, error } = await getDocuments({ status: '' });
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

  const loadProperties = async () => {
    try {
      const { data, error } = await getProperties();
      if (error) {
        console.error('Failed to load properties:', error);
        setProperties([]);
      } else if (data) {
        setProperties(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Load properties error:', error);
      setProperties([]);
    }
  };

  // Get managers assigned to a specific property
  const getManagersForProperty = (propertyId: string) => {
    if (!propertyId || !Array.isArray(managers)) return [];
    
    // Filter managers who have an active assignment to this property
    // Each manager has a property_managers array with their property assignments
    return managers.filter((manager: any) => {
      return manager.property_managers?.some(
        (assignment: any) => assignment.propertyId === propertyId && assignment.isActive
      );
    });
  };

  // Get currency symbol for a property
  const getPropertyCurrency = (propertyId: string) => {
    if (!Array.isArray(properties)) return '₦';
    const property = properties.find(p => p.id === propertyId);
    const currencyMap: { [key: string]: string } = {
      'USD': '$',
      'NGN': '₦',
      'EUR': '€',
      'GBP': '£',
    };
    return property?.currency ? currencyMap[property.currency] || property.currency : '₦';
  };

  // Filter documents based on active tab and search
  const getFilteredDocuments = () => {
    let filtered = documents;

    // Filter by tab
    if (activeTab !== 'all') {
      if (activeTab === 'manager-contracts') {
        filtered = filtered.filter(doc => 
          (doc.type === 'contract' || 
          doc.type === 'manager-contract' || 
          doc.type === 'tenant-contract' || 
          doc.category === 'Contracts') &&
          doc.type !== 'receipt' &&
          doc.category !== 'Receipts' &&
          doc.category !== 'Financial Records'
        );
      } else if (activeTab === 'leases-inspections') {
        filtered = filtered.filter(doc => 
          doc.type === 'lease' || 
          doc.type === 'inspection' || 
          doc.category === 'Leases & Inspections' ||
          doc.category === 'Leases' ||
          doc.category === 'Inspections' ||
          doc.category === 'Property Documents'
        );
      } else if (activeTab === 'receipts') {
        filtered = filtered.filter(doc => 
          doc.type === 'receipt' || 
          doc.category === 'Receipts' ||
          doc.category === 'Financial Records'
        );
      } else if (activeTab === 'policies-notices') {
        filtered = filtered.filter(doc => 
          doc.type === 'policy' || 
          doc.type === 'notice' || 
          doc.category === 'Policies & Notices' ||
          doc.category === 'Policies' ||
          doc.category === 'Notices'
        );
      } else if (activeTab === 'insurance') {
        filtered = filtered.filter(doc => 
          doc.type === 'insurance' || 
          doc.category === 'Insurance'
        );
      }
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(doc =>
        doc.name.toLowerCase().includes(query) ||
        doc.type.toLowerCase().includes(query) ||
        doc.category.toLowerCase().includes(query) ||
        doc.description?.toLowerCase().includes(query) ||
        doc.properties?.name.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  // Handler functions
  const handleUpload = async () => {
    if (!uploadForm.file || !uploadForm.name) {
      toast.error('Please select a file and enter a document name');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', uploadForm.file);
      formData.append('name', uploadForm.name);
      formData.append('type', uploadForm.type);
      formData.append('category', uploadForm.category);
      formData.append('description', uploadForm.description);
      if (uploadForm.propertyId) formData.append('propertyId', uploadForm.propertyId);
      if (uploadForm.unitId) formData.append('unitId', uploadForm.unitId);
      if (uploadForm.tenantId) formData.append('tenantId', uploadForm.tenantId);
      if (uploadForm.managerId) formData.append('managerId', uploadForm.managerId);
      formData.append('isShared', String(uploadForm.isShared));

      const { data, error } = await uploadDocument(formData);
      if (error) {
        toast.error(error);
      } else {
        toast.success('Document uploaded successfully');
        setShowUploadDialog(false);
        setUploadForm({
          file: null,
          name: '',
          type: 'lease',
          category: 'Legal Documents',
          description: '',
          propertyId: '',
          unitId: '',
          tenantId: '',
          managerId: '',
          isShared: false,
        });
        loadDocuments();
        loadStats();
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedDocument) return;

    try {
      const { data, error } = await deleteDocument(selectedDocument.id);
      if (error) {
        toast.error(error);
      } else {
        toast.success('Document deleted successfully');
        setShowDeleteDialog(false);
        setSelectedDocument(null);
        loadDocuments();
        loadStats();
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete document');
    }
  };

  const handleView = (doc: Document) => {
    setSelectedDocument(doc);
    setShowViewDialog(true);
  };

  const handleDownload = async (doc: Document) => {
    try {
      setSelectedDocument(doc);
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('auth_token');

      // If this is an uploaded file, stream the original directly
      if (doc.fileUrl) {
        const ext = (doc.format || doc.fileUrl.split('.').pop() || '').toLowerCase();
        const response = await fetch(`${API_URL}${doc.fileUrl}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
        });
        if (!response.ok) throw new Error('Download failed');
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${doc.name}.${ext || 'file'}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Document downloaded');
        setShowDownloadDialog(false);
        return;
      }

      // If generated (no file), default to PDF via backend conversion
      const defaultFormat: 'pdf' | 'docx' = 'pdf';
      const response = await fetch(
        `${API_URL}/api/documents/${doc.id}/download/${defaultFormat}`,
        { headers: token ? { 'Authorization': `Bearer ${token}` } : undefined }
      );
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${doc.name}.${defaultFormat}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Document downloaded');
      setShowDownloadDialog(false);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download document');
    }
  };

  const handleDownloadInFormat = async (format: 'pdf' | 'docx') => {
    if (!selectedDocument) return;

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(
        `${API_URL}/api/documents/${selectedDocument.id}/download/${format}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Download failed');
      }

      // Create a blob from the response
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedDocument.name}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Document downloaded as ${format.toUpperCase()}`);
      setShowDownloadDialog(false);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download document');
    }
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

  const filteredDocuments = getFilteredDocuments();

  // Helper function to get status badge color
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  // Helper function to get type icon
  const getTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'contract':
        return <FileSignature className="h-4 w-4" />;
      case 'lease':
        return <FileText className="h-4 w-4" />;
      case 'inspection':
        return <ClipboardList className="h-4 w-4" />;
      case 'receipt':
        return <Receipt className="h-4 w-4" />;
      case 'report':
        return <FileText className="h-4 w-4" />;
      case 'insurance':
        return <Shield className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  // Mock data kept for unused sections - will be removed in complete refactor
  const insurance: any[] = [
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

  // Mock data for dropdowns (will be replaced with real data from properties state)
  const mockPropertyList = (properties || []).map(p => ({ id: p.id, name: p.name }));

  const [managers, setManagers] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [propertyManagerAssignments, setPropertyManagerAssignments] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [propertyUnits, setPropertyUnits] = useState<any[]>([]);

  const contractTemplates = {
    manager: [
    { id: 'standard', name: 'Standard Manager Agreement', description: 'Standard contract for property managers' },
    { id: 'premium', name: 'Premium Manager Agreement', description: 'Enhanced agreement with additional benefits' },
    { id: 'temporary', name: 'Temporary Manager Agreement', description: 'Short-term or temporary management contract' },
    ],
    tenant: [
      { id: 'standard', name: 'Standard Lease Agreement', description: 'Standard residential lease contract' },
      { id: 'short-term', name: 'Short-term Lease', description: 'Short-term or temporary lease agreement' },
      { id: 'commercial', name: 'Commercial Lease', description: 'Commercial property lease agreement' },
    ]
  };

  const responsibilityTemplates = [
    {
      id: 'full-service',
      name: 'Full-Service Management',
      responsibilities: `• Oversee all day-to-day property operations
• Screen and approve tenant applications
• Collect rent payments and manage delinquencies
• Coordinate property maintenance and repairs
• Conduct regular property inspections
• Handle tenant complaints and resolve disputes
• Maintain accurate records and financial reports
• Ensure compliance with all local housing regulations
• Manage vendor relationships and contracts
• Provide monthly financial and operational reports`
    },
    {
      id: 'maintenance-focused',
      name: 'Maintenance & Operations',
      responsibilities: `• Schedule and oversee all property maintenance
• Coordinate emergency repair services
• Conduct quarterly property inspections
• Manage relationships with contractors and vendors
• Ensure property meets all safety standards
• Maintain common areas and facilities
• Handle tenant maintenance requests promptly
• Monitor and report on property condition
• Manage inventory of maintenance supplies
• Provide monthly maintenance reports`
    },
    {
      id: 'tenant-relations',
      name: 'Tenant Relations & Leasing',
      responsibilities: `• Market available units and show properties
• Screen potential tenants and process applications
• Prepare and execute lease agreements
• Conduct move-in and move-out inspections
• Handle tenant inquiries and complaints
• Enforce lease terms and property rules
• Coordinate lease renewals
• Manage tenant communications
• Resolve tenant disputes professionally
• Maintain tenant satisfaction and retention`
    },
    {
      id: 'financial-admin',
      name: 'Financial & Administrative',
      responsibilities: `• Collect monthly rent and other fees
• Track and deposit all rental income
• Manage property operating budget
• Pay property expenses and vendor invoices
• Maintain detailed financial records
• Prepare monthly financial statements
• Handle delinquent rent collection
• Coordinate with accountants on tax matters
• Process security deposit accounting
• Provide quarterly financial analysis reports`
    },
    {
      id: 'basic',
      name: 'Basic Management',
      responsibilities: `• Collect monthly rent payments
• Coordinate basic property maintenance
• Respond to tenant inquiries
• Conduct periodic property inspections
• Maintain records of property activities
• Report on property status monthly`
    }
  ];

  const termsTemplates = [
    {
      id: 'standard-residential',
      name: 'Standard Residential Terms',
      terms: `• Tenant shall use the premises for residential purposes only
• No subletting or assignment of lease without written landlord approval
• Tenant is responsible for keeping the premises clean and sanitary
• Tenant shall not make any alterations without written consent
• Pets are not permitted without prior written approval
• Tenant must maintain renters insurance throughout the lease term
• Noise levels must be kept reasonable, especially between 10 PM - 7 AM
• Common areas must be kept clear and accessible at all times`
    },
    {
      id: 'with-utilities',
      name: 'Terms Including Utilities',
      terms: `• Rent includes water, electricity, and waste disposal services
• Tenant is responsible for excessive utility usage beyond normal levels
• Internet and cable services are tenant's responsibility
• Landlord reserves right to adjust rent if utility costs increase significantly
• Tenant must report any utility issues or outages immediately
• No tampering with utility meters or connections
• Energy conservation practices are encouraged`
    },
    {
      id: 'furnished-unit',
      name: 'Furnished Unit Terms',
      terms: `• Property is rented as fully furnished - inventory list attached
• Tenant is responsible for any damage to furnishings beyond normal wear
• All furniture and fixtures must remain in the unit
• Tenant may not remove or replace any provided furnishings
• Deep cleaning of all furnishings required at move-out
• Any missing or damaged items will be charged to security deposit
• Tenant must report any furniture damage within 48 hours`
    },
    {
      id: 'pet-friendly',
      name: 'Pet-Friendly Terms',
      terms: `• Maximum of 2 pets allowed with additional pet deposit
• Pet deposit is non-refundable and covers potential damages
• Dogs must be kept on leash in common areas
• Tenant must clean up after pets immediately
• Excessive noise or disturbance from pets may result in lease termination
• Tenant is liable for any injuries or damage caused by pets
• Proper pet waste disposal is mandatory
• Service animals are exempt from pet fees per applicable laws`
    },
    {
      id: 'short-term',
      name: 'Short-Term Lease Terms',
      terms: `• Minimum lease term of 3 months applies
• 60-day notice required for non-renewal or early termination
• Early termination fee equals 2 months rent if lease broken early
• No rent concessions or discounts for short-term leases
• Monthly inspections may be conducted with 24-hour notice
• Tenant must maintain property in move-in ready condition at all times
• Security deposit is due in full at lease signing`
    },
    {
      id: 'maintenance-included',
      name: 'Maintenance Package Included',
      terms: `• Routine maintenance and repairs are covered by landlord
• Tenant must report all maintenance issues within 24 hours
• Emergency maintenance contact information provided separately
• Scheduled maintenance visits require 24-hour notice
• Tenant damage or negligence is tenant's financial responsibility
• Air conditioning filters must be changed monthly by tenant
• Landlord provides quarterly pest control services
• Annual HVAC servicing included in rent`
    }
  ];

  // duplicate getStatusColor removed (using the earlier definition)

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

  const handleGenerateContract = async () => {
    try {
      setUploading(true);
      const contractType = dialogType === 'manager-contract' ? 'Manager' : 'Tenant';
      
      // Get manager or tenant details
      let recipientName = '';
      let recipientId = '';
      let propertyName = '';
      
      if (dialogType === 'manager-contract') {
        const manager = managers.find(m => m.id === contractForm.managerId);
        recipientName = manager?.name || 'Manager';
        recipientId = contractForm.managerId;
      } else {
        const tenant = tenants.find(t => t.id === contractForm.tenantId);
        recipientName = tenant?.name || 'Tenant';
        recipientId = contractForm.tenantId;
      }
      
      const property = properties.find(p => p.id === contractForm.propertyId);
      propertyName = property?.name || 'Property';
      
      // Generate contract document content
      const contractContent = generateContractContent();
      
      // Create document data
      const documentData = {
        name: `${contractType} Contract - ${recipientName} - ${propertyName}`,
        type: 'contract',
        category: 'Contracts',
        description: `${contractForm.templateType.charAt(0).toUpperCase() + contractForm.templateType.slice(1)} ${contractType} Contract`,
        propertyId: contractForm.propertyId,
        managerId: dialogType === 'manager-contract' ? recipientId : null,
        tenantId: dialogType === 'tenant-contract' ? recipientId : null,
        unitId: contractForm.unitId || null,
        status: 'draft',
        expiresAt: contractForm.endDate || null,
        metadata: {
          contractType: dialogType,
          templateType: contractForm.templateType,
          startDate: contractForm.startDate,
          endDate: contractForm.endDate,
          compensation: contractForm.compensation,
          compensationType: contractForm.compensationType,
          responsibilities: contractForm.responsibilities,
          content: contractContent,
        },
        isShared: false,
      };

      // Save document to database
      const { data, error } = await createDocument(documentData as any);
      
      if (error) {
        console.error('Failed to save contract:', error);
        toast.error('Failed to generate contract');
        return;
      }

      console.log(`Generated ${contractType} contract:`, data);
    setShowGenerateDialog(false);
      toast.success(`${contractType} contract generated successfully! You can now preview, edit, and send it when ready.`);
      
      // Reset form
    setContractForm({
      managerId: '',
        tenantId: '',
        propertyId: '',
      templateType: 'standard',
      startDate: '',
      endDate: '',
      compensation: '',
        compensationType: 'fixed',
      responsibilities: '',
      propertyIds: [],
        unitId: '',
      });
      
      // Reload documents to show the new contract
      await loadDocuments();
      
    } catch (error) {
      console.error('Generate contract error:', error);
      toast.error('Failed to generate contract');
    } finally {
      setUploading(false);
    }
  };

  const generateContractContent = () => {
    const contractType = dialogType === 'manager-contract' ? 'Property Management' : 'Lease';
    const property = properties.find(p => p.id === contractForm.propertyId);
    const currencySymbol = getPropertyCurrency(contractForm.propertyId);
    
    let recipient = '';
    if (dialogType === 'manager-contract') {
      const manager = managers.find(m => m.id === contractForm.managerId);
      recipient = manager?.name || 'Manager';
    } else {
      const tenant = tenants.find(t => t.id === contractForm.tenantId);
      recipient = tenant?.name || 'Tenant';
    }
    
    const compensationText = dialogType === 'manager-contract' 
      ? contractForm.compensationType === 'fixed'
        ? `${currencySymbol}${contractForm.compensation} per month`
        : `${contractForm.compensation}% of monthly property revenue`
      : `${currencySymbol}${contractForm.compensation} per month`;

    // Parse responsibilities to create proper list items
    const responsibilitiesLines = (contractForm.responsibilities || 'To be specified')
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        // Remove existing bullet points or numbers
        const cleanedLine = line.replace(/^[•\-\*]\s*/, '').replace(/^\d+\.\s*/, '').trim();
        return `<li>${cleanedLine}</li>`;
      })
      .join('');

    // Generate HTML content with proper formatting
    return `
<h1>${contractType.toUpperCase()} AGREEMENT</h1>

<p>This ${contractType} Agreement ("<strong>Agreement</strong>") is entered into on <strong>${new Date().toLocaleDateString()}</strong> by and between:</p>

<h2>PROPERTY OWNER (Landlord/Principal)</h2>
<p>[Owner Name]<br>[Owner Address]</p>

<p style="text-align: center;"><strong>AND</strong></p>

<h2>${dialogType === 'manager-contract' ? 'PROPERTY MANAGER' : 'TENANT'} (${dialogType === 'manager-contract' ? 'Agent' : 'Lessee'})</h2>
<p>${recipient}</p>

<h2>PROPERTY DETAILS</h2>
<p><strong>Property:</strong> ${property?.name || 'N/A'}<br>
<strong>Address:</strong> ${property?.address || 'N/A'}, ${property?.city || 'N/A'}, ${property?.state || 'N/A'}</p>

<h2>TERM OF AGREEMENT</h2>
<p><strong>Start Date:</strong> ${contractForm.startDate || 'TBD'}<br>
<strong>End Date:</strong> ${contractForm.endDate || 'TBD'}</p>

<h2>${dialogType === 'manager-contract' ? 'MANAGEMENT' : 'RENT'} COMPENSATION</h2>
<p><strong>Amount:</strong> ${compensationText}</p>
${dialogType === 'manager-contract' && contractForm.compensationType === 'percentage' 
  ? '<p><em>Calculated as a percentage of the gross rental income collected from the property.</em></p>' 
  : ''}

<h2>${dialogType === 'manager-contract' ? 'KEY RESPONSIBILITIES' : 'TENANT OBLIGATIONS'}</h2>
<ul>
${responsibilitiesLines}
</ul>

<h2>TERMS AND CONDITIONS</h2>
${dialogType === 'manager-contract' ? `
<ol>
<li>The Property Manager agrees to manage the property in accordance with applicable laws and regulations.</li>
<li>The Property Manager shall maintain accurate records of all transactions related to the property.</li>
<li>The Property Manager shall provide monthly reports to the Property Owner.</li>
<li>Either party may terminate this agreement with 30 days written notice.</li>
</ol>
` : `
<ol>
<li>The Tenant agrees to pay rent on time and maintain the property in good condition.</li>
<li>The Tenant shall not sublet the property without written consent from the Landlord.</li>
<li>The Tenant is responsible for utilities and routine maintenance.</li>
<li>The Landlord reserves the right to inspect the property with reasonable notice.</li>
</ol>
`}

<h2>SIGNATURES</h2>
<p>This agreement shall be binding upon signature by both parties.</p>

<p><strong>Property Owner:</strong> _____________________ <strong>Date:</strong> _________</p>

<p><strong>${dialogType === 'manager-contract' ? 'Property Manager' : 'Tenant'}:</strong> _____________________ <strong>Date:</strong> _________</p>

<hr>
<p style="text-align: center;"><em>Generated: ${new Date().toLocaleString()}</em><br>
<em>Status: Draft - Not yet sent for signature</em></p>
`;
  };

  const handleViewDocument = (doc: any) => {
    setSelectedDocument(doc);
    setShowViewDialog(true);
  };

  const handleEditContract = (doc: Document) => {
    setSelectedDocument(doc);
    setEditableContent(doc.metadata?.content || '');
    setShowEditDialog(true);
  };

  const handleSaveEditedContract = async () => {
    if (!selectedDocument) return;
    
    try {
      setUploading(true);
      
      const updatedMetadata = {
        ...selectedDocument.metadata,
        content: editableContent,
        lastEdited: new Date().toISOString(),
      };
      
      const { error } = await updateDocument(selectedDocument.id, {
        metadata: updatedMetadata,
      });
      
      if (error) {
        toast.error('Failed to save changes');
        return;
      }
      
      toast.success('Contract updated successfully!');
      setShowEditDialog(false);
      await loadDocuments();
      
    } catch (error) {
      console.error('Save contract error:', error);
      toast.error('Failed to save contract');
    } finally {
      setUploading(false);
    }
  };

  const handleSendContract = async (doc: Document) => {
    try {
      setUploading(true);
      
      // Update document status to 'pending' (sent for signature)
      const { error } = await updateDocument(doc.id, {
        status: 'pending',
        metadata: {
          ...doc.metadata,
          sentAt: new Date().toISOString(),
          sentBy: localStorage.getItem('user_name') || 'Owner',
        },
      });
      
      if (error) {
        toast.error('Failed to send contract');
        return;
      }
      
      const recipientType = doc.metadata?.contractType === 'manager-contract' ? 'manager' : 'tenant';
      toast.success(`Contract sent to ${recipientType} for e-signature!`);
      
      await loadDocuments();
      
    } catch (error) {
      console.error('Send contract error:', error);
      toast.error('Failed to send contract');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = (doc: any) => {
    setSelectedDocument(doc);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!selectedDocument) return;
    
    try {
      setUploading(true);
      const { error } = await deleteDocument(selectedDocument.id);
      
      if (error) {
        toast.error('Failed to delete document');
        return;
      }
      
    toast.success('Document deleted successfully!');
      setShowDeleteDialog(false);
      setSelectedDocument(null);
      
      // Reload documents to update the list
      await loadDocuments();
    } catch (error) {
      console.error('Delete document error:', error);
      toast.error('Failed to delete document');
    } finally {
      setUploading(false);
    }
  };


  const openGenerateDialog = (type: string) => {
    setDialogType(type);
    setShowGenerateDialog(true);
  };

  const openUploadDialog = (type: string, category: string) => {
    setUploadForm({
      ...uploadForm,
      type,
      category
    });
    setShowUploadDialog(true);
  };

  // duplicate handleDownload removed (using the earlier implementation)

  const handleShare = (doc: any) => {
    setSelectedDocument(doc);
    setShareForm({
      sharedWith: doc.sharedWith || [],
      message: ''
    });
    setShowShareDialog(true);
  };

  const handleShareDocument = async () => {
    if (!selectedDocument) return;

    try {
      const { error } = await updateDocument(selectedDocument.id, {
        isShared: shareForm.sharedWith.length > 0,
        sharedWith: shareForm.sharedWith
      });

      if (error) {
        toast.error(error);
      } else {
        toast.success('Document shared successfully');
        setShowShareDialog(false);
        setShareForm({ sharedWith: [], message: '' });
        await loadDocuments();
      }
    } catch (error) {
      console.error('Share error:', error);
      toast.error('Failed to share document');
    }
  };

  // duplicate handleUpload removed (using the async implementation above)

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
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <p className="ml-3 text-sm text-gray-500">Loading documents...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
                <div className="text-2xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
                <div className="text-2xl font-bold">{stats?.recent || 0}</div>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Contracts</CardTitle>
                <FileSignature className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
                <div className="text-2xl font-bold">
                  {(() => {
                    const contractTypes = ['contract', 'manager-contract', 'tenant-contract'];
                    return stats?.byType?.reduce((sum: number, t: any) => {
                      return contractTypes.includes(t.type) ? sum + t._count : sum;
                    }, 0) || 0;
                  })()}
                </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Leases</CardTitle>
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.byType?.find((t: any) => t.type === 'lease')?._count || 0}
                </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receipts</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.byType?.find((t: any) => t.type === 'receipt')?._count || 0}
                </div>
          </CardContent>
        </Card>
      </div>
        </>
      )}

      {/* Document Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="manager-contracts">
            <FileSignature className="h-4 w-4 mr-2" />
            Contracts
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

        {/* Contracts Tab */}
        <TabsContent value="manager-contracts" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Contracts</CardTitle>
                  <CardDescription>Generate and manage property manager and tenant agreements</CardDescription>
                </div>
                <div className="flex gap-2">
                <Button onClick={() => openGenerateDialog('manager-contract')}>
                  <Plus className="h-4 w-4 mr-2" />
                    Manager Contract
                  </Button>
                  <Button onClick={() => openGenerateDialog('tenant-contract')} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Tenant Contract
                </Button>
                </div>
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
                      <TableCell className="text-sm text-muted-foreground">{formatDate(doc.createdAt)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {doc.expiresAt ? formatDate(doc.expiresAt) : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" title="Actions">
                                <MoreHorizontal className="h-4 w-4" />
                          </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleViewDocument(doc)}>
                                <Eye className="h-4 w-4 mr-2" /> View Details
                              </DropdownMenuItem>
                              {doc.status === 'draft' && doc.type === 'contract' ? (
                                <DropdownMenuItem onClick={() => handleEditContract(doc)}>
                                  <FileSignature className="h-4 w-4 mr-2" /> Edit Contract
                                </DropdownMenuItem>
                              ) : null}
                              <DropdownMenuItem onClick={() => handleDownload(doc)}>
                                <Download className="h-4 w-4 mr-2" /> Download
                              </DropdownMenuItem>
                              {doc.status !== 'draft' && (
                                <DropdownMenuItem onClick={() => handleShare(doc)}>
                                  <Share2 className="h-4 w-4 mr-2" /> Share
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={async () => {
                                const newStatus = doc.status === 'active' ? 'inactive' : 'active';
                                const { error } = await updateDocument(doc.id, { status: newStatus });
                                if (error) {
                                  toast.error('Failed to update status');
                                } else {
                                  toast.success(`Document marked as ${newStatus}`);
                                  await loadDocuments();
                                }
                              }}>
                                <Shield className="h-4 w-4 mr-2" />
                                {doc.status === 'active' ? 'Make Inactive' : 'Make Active'}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteDocument(doc)}>
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
                <Button onClick={() => openUploadDialog('lease', 'Leases & Inspections')}>
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
                      <TableCell>{doc.type}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{doc.property}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusColor(doc.status)}>
                          {doc.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(doc.createdAt)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{doc.expiresAt ? formatDate(doc.expiresAt) : 'N/A'}</TableCell>
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
                <Button onClick={() => openUploadDialog('receipt', 'Receipts')}>
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
                    <TableHead>Upload Date</TableHead>
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
                      <TableCell className="text-sm text-muted-foreground">{formatDate(doc.createdAt)}</TableCell>
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
                <Button onClick={() => openUploadDialog('policy', 'Policies & Notices')}>
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
                <Button onClick={() => openUploadDialog('insurance', 'Insurance')}>
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
              <Label htmlFor="contract-property">Select Property</Label>
              <Select
                value={contractForm.propertyId}
                onValueChange={(value) => setContractForm({ ...contractForm, propertyId: value, managerId: '' })}
              >
                <SelectTrigger id="contract-property">
                  <SelectValue placeholder="Choose a property first" />
                </SelectTrigger>
                <SelectContent>
                  {(properties || []).map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      <div className="flex flex-col">
                        <span>{property.name}</span>
                        <span className="text-xs text-muted-foreground">{property.address}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="manager">Select Manager</Label>
              <Select
                value={contractForm.managerId}
                onValueChange={(value) => setContractForm({ ...contractForm, managerId: value })}
                disabled={!contractForm.propertyId}
              >
                <SelectTrigger id="manager">
                  <SelectValue placeholder={contractForm.propertyId ? "Choose a manager" : "Select a property first"} />
                </SelectTrigger>
                <SelectContent>
                  {getManagersForProperty(contractForm.propertyId).map((manager) => (
                    <SelectItem key={manager.id} value={manager.id}>
                      <div className="flex flex-col">
                        <span>{manager.name}</span>
                        <span className="text-xs text-muted-foreground">{manager.email}</span>
                      </div>
                    </SelectItem>
                  ))}
                  {contractForm.propertyId && getManagersForProperty(contractForm.propertyId).length === 0 && (
                    <div className="px-2 py-1 text-sm text-muted-foreground">
                      No managers assigned to this property
                    </div>
                  )}
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
                  {contractTemplates.manager.map((template) => (
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
              <Label htmlFor="compensationType">Compensation Type</Label>
              <Select
                value={contractForm.compensationType}
                onValueChange={(value) => setContractForm({ ...contractForm, compensationType: value, compensation: '' })}
              >
                <SelectTrigger id="compensationType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">
                    <div className="flex flex-col">
                      <span>Fixed Monthly Amount</span>
                      <span className="text-xs text-muted-foreground">Set amount paid each month</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="percentage">
                    <div className="flex flex-col">
                      <span>Percentage of Revenue</span>
                      <span className="text-xs text-muted-foreground">Percentage of monthly property revenue</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="compensation">
                {contractForm.compensationType === 'fixed' 
                  ? `Monthly Compensation ${contractForm.propertyId ? `(${getPropertyCurrency(contractForm.propertyId)})` : ''}`
                  : 'Compensation Percentage (%)'}
              </Label>
              <div className="relative">
              <Input
                id="compensation"
                type="number"
                  placeholder={contractForm.compensationType === 'fixed' ? '5000' : '10'}
                value={contractForm.compensation}
                onChange={(e) => setContractForm({ ...contractForm, compensation: e.target.value })}
                  min={contractForm.compensationType === 'percentage' ? '0' : undefined}
                  max={contractForm.compensationType === 'percentage' ? '100' : undefined}
                  step={contractForm.compensationType === 'percentage' ? '0.1' : '1'}
              />
                {contractForm.compensationType === 'percentage' && contractForm.compensation && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    %
            </div>
                )}
                  </div>
              {contractForm.compensationType === 'percentage' && (
                <p className="text-xs text-muted-foreground">
                  Manager will receive {contractForm.compensation || '0'}% of the property's monthly revenue
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
              <Label htmlFor="responsibilities">Key Responsibilities</Label>
                <Select
                  value=""
                  onValueChange={(value) => {
                    const template = responsibilityTemplates.find(t => t.id === value);
                    if (template) {
                      setContractForm({ ...contractForm, responsibilities: template.responsibilities });
                    }
                  }}
                >
                  <SelectTrigger className="w-[200px] h-8">
                    <SelectValue placeholder="Quick Fill" />
                  </SelectTrigger>
                  <SelectContent>
                    {responsibilityTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Textarea
                id="responsibilities"
                placeholder="List the manager's key responsibilities..."
                value={contractForm.responsibilities}
                onChange={(e) => setContractForm({ ...contractForm, responsibilities: e.target.value })}
                rows={8}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Use Quick Fill to populate common responsibilities, then customize as needed
              </p>
            </div>

            <Alert>
              <FileCheck className="h-4 w-4" />
              <AlertDescription>
                The contract will be saved as a draft. You can preview, edit, and send it when ready.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerateContract} disabled={uploading}>
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Contract'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate Tenant Contract Dialog */}
      <Dialog open={showGenerateDialog && dialogType === 'tenant-contract'} onOpenChange={setShowGenerateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generate Tenant Contract</DialogTitle>
            <DialogDescription>
              Create a new tenant lease agreement
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tenantProperty">Property</Label>
              <Select
                value={contractForm.propertyIds[0] || ''}
                onValueChange={(value) => {
                  setContractForm({ ...contractForm, propertyIds: [value], propertyId: value, unitId: '', tenantId: '' });
                  loadUnitsForProperty(value);
                }}
              >
                <SelectTrigger id="tenantProperty">
                  <SelectValue placeholder="Choose a property first" />
                </SelectTrigger>
                <SelectContent>
                  {(properties || []).map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      <div className="flex flex-col">
                        <span>{property.name}</span>
                        <span className="text-xs text-muted-foreground">{property.address}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tenantUnit">Unit/Apartment</Label>
              <Select
                value={contractForm.unitId}
                onValueChange={(value) => {
                  setContractForm({ ...contractForm, unitId: value });
                  getTenantForUnit(value);
                }}
                disabled={!contractForm.propertyIds[0]}
              >
                <SelectTrigger id="tenantUnit">
                  <SelectValue placeholder={!contractForm.propertyIds[0] ? "Select property first" : "Select unit"} />
                </SelectTrigger>
                <SelectContent>
                  {propertyUnits.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      <div className="flex flex-col">
                        <span>{unit.unitNumber}</span>
                        <span className="text-xs text-muted-foreground">{unit.type} • {unit.bedrooms} bed</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tenantName">Tenant Name</Label>
              <Input
                id="tenantName"
                value={tenants.find(t => t.id === contractForm.tenantId)?.name || ''}
                placeholder="Will auto-populate when unit is selected"
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Tenant information will automatically populate based on the selected unit
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tenantTemplate">Contract Template</Label>
              <Select
                value={contractForm.templateType}
                onValueChange={(value) => setContractForm({ ...contractForm, templateType: value })}
              >
                <SelectTrigger id="tenantTemplate">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {contractTemplates.tenant.map((template) => (
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
                <Label htmlFor="tenantStartDate">Start Date</Label>
                <Input
                  id="tenantStartDate"
                  type="date"
                  value={contractForm.startDate}
                  onChange={(e) => setContractForm({ ...contractForm, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tenantEndDate">End Date</Label>
                <Input
                  id="tenantEndDate"
                  type="date"
                  value={contractForm.endDate}
                  onChange={(e) => setContractForm({ ...contractForm, endDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rentAmount">Monthly Rent (₦)</Label>
              <Input
                id="rentAmount"
                type="number"
                placeholder="50000"
                value={contractForm.compensation}
                onChange={(e) => setContractForm({ ...contractForm, compensation: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tenantTermsTemplate">Special Terms & Conditions Template</Label>
              <Select
                onValueChange={(value) => {
                  const template = termsTemplates.find(t => t.id === value);
                  if (template) {
                    setContractForm({ ...contractForm, responsibilities: template.terms });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Quick Fill - Select a template (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {termsTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tenantNotes">Special Terms & Conditions</Label>
              <Textarea
                id="tenantNotes"
                placeholder="Enter any special terms or conditions for this lease..."
                rows={8}
                className="font-mono text-sm"
                value={contractForm.responsibilities}
                onChange={(e) => setContractForm({ ...contractForm, responsibilities: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                You can use the template above to quick-fill, then customize as needed
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerateContract} disabled={uploading}>
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Contract'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Document Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Upload a pre-existing document (contract, lease, receipt, etc.)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="uploadFile">Select File *</Label>
              <Input 
                id="uploadFile" 
                type="file" 
                accept=".pdf,.doc,.docx"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setUploadForm({ 
                    ...uploadForm, 
                    file,
                    name: file?.name.replace(/\.[^/.]+$/, '') || ''
                  });
                }}
              />
              <p className="text-xs text-muted-foreground">
                Supported formats: PDF, DOC, DOCX (Max 10MB)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="uploadDocName">Document Name *</Label>
              <Input 
                id="uploadDocName" 
                placeholder="Enter document name"
                value={uploadForm.name}
                onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="uploadType">Document Type *</Label>
                <Select 
                  value={uploadForm.type}
                  onValueChange={(value) => setUploadForm({ ...uploadForm, type: value })}
                >
                  <SelectTrigger id="uploadType">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manager-contract">Manager Contract</SelectItem>
                    <SelectItem value="tenant-contract">Tenant Contract</SelectItem>
                    <SelectItem value="lease">Lease Agreement</SelectItem>
                    <SelectItem value="inspection">Inspection Report</SelectItem>
                    <SelectItem value="receipt">Receipt</SelectItem>
                    <SelectItem value="policy">Policy/Notice</SelectItem>
                    <SelectItem value="insurance">Insurance Document</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="uploadCategory">Category</Label>
                <Select
                  value={uploadForm.category}
                  onValueChange={(value) => setUploadForm({ ...uploadForm, category: value })}
                >
                  <SelectTrigger id="uploadCategory">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="Legal Documents">Legal Documents</SelectItem>
                    <SelectItem value="Financial Records">Financial Records</SelectItem>
                    <SelectItem value="Property Documents">Property Documents</SelectItem>
                    <SelectItem value="Tenant Documents">Tenant Documents</SelectItem>
                    <SelectItem value="Insurance">Insurance</SelectItem>
                </SelectContent>
              </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="uploadProperty">Property</Label>
              <Select
                value={uploadForm.propertyId}
                onValueChange={(value) => {
                  setUploadForm({ ...uploadForm, propertyId: value, unitId: '', tenantId: '' });
                  if (value) loadUnitsForProperty(value);
                }}
              >
                <SelectTrigger id="uploadProperty">
                  <SelectValue placeholder="Select property (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(properties) && properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              </div>

            {(uploadForm.type === 'tenant-contract' || uploadForm.type === 'manager-contract') && uploadForm.propertyId && (
              <>
                {uploadForm.type === 'tenant-contract' && (
                  <div className="space-y-2">
                    <Label htmlFor="uploadUnit">Unit/Apartment</Label>
                    <Select
                      value={uploadForm.unitId}
                      onValueChange={(value) => {
                        setUploadForm({ ...uploadForm, unitId: value });
                        getTenantForUnit(value);
                      }}
                      disabled={!uploadForm.propertyId}
                    >
                      <SelectTrigger id="uploadUnit">
                        <SelectValue placeholder="Select unit (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.isArray(propertyUnits) && propertyUnits.map((unit) => (
                          <SelectItem key={unit.id} value={unit.id}>
                            {unit.unitNumber} - {unit.type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="uploadPerson">{uploadForm.type === 'manager-contract' ? 'Manager' : 'Tenant'}</Label>
                  <Select
                    value={uploadForm.type === 'manager-contract' ? uploadForm.managerId : uploadForm.tenantId}
                    onValueChange={(value) => {
                      if (uploadForm.type === 'manager-contract') {
                        setUploadForm({ ...uploadForm, managerId: value });
                      } else {
                        setUploadForm({ ...uploadForm, tenantId: value });
                      }
                    }}
                  >
                    <SelectTrigger id="uploadPerson">
                      <SelectValue placeholder={`Select ${uploadForm.type === 'manager-contract' ? 'manager' : 'tenant'} (optional)`} />
                    </SelectTrigger>
                    <SelectContent>
                      {uploadForm.type === 'manager-contract' 
                        ? Array.isArray(propertyManagerAssignments) && propertyManagerAssignments.map((manager) => (
                            <SelectItem key={manager.id} value={manager.id}>
                              {manager.name}
                            </SelectItem>
                          ))
                        : Array.isArray(tenants) && tenants.map((tenant) => (
                            <SelectItem key={tenant.id} value={tenant.id}>
                              {tenant.name}
                            </SelectItem>
                          ))
                      }
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="uploadDescription">Description/Notes</Label>
              <Textarea
                id="uploadDescription"
                placeholder="Add any notes or description about this document..."
                rows={3}
                value={uploadForm.description}
                onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowUploadDialog(false);
                setUploadForm({
                  file: null,
                  name: '',
                  type: 'lease',
                  category: 'Legal Documents',
                  description: '',
                  propertyId: '',
                  unitId: '',
                  tenantId: '',
                  managerId: '',
                  isShared: false,
                });
              }}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={!uploadForm.file || !uploadForm.name || uploading}>
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </>
              )}
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
                  <p className="font-medium">{formatDate(selectedDocument.createdAt)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Expiry Date</Label>
                  <p className="font-medium">{selectedDocument.expiresAt ? formatDate(selectedDocument.expiresAt) : 'N/A'}</p>
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
              
              {/* Show contract content preview for contracts */}
              {selectedDocument.type === 'contract' && selectedDocument.metadata?.content && (
                <div className="mt-4">
                  <Label className="text-muted-foreground">Contract Preview</Label>
                  <div className="mt-2 p-4 border rounded-lg bg-gray-50 max-h-96 overflow-y-auto">
                    <pre className="text-sm whitespace-pre-wrap font-mono">
                      {selectedDocument.metadata.content}
                    </pre>
                  </div>
                </div>
              )}
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

      {/* Edit Contract Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit Contract</DialogTitle>
            <DialogDescription>
              Make changes to the contract before sending it for signature
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto py-4">
            <div className="space-y-4">
              {selectedDocument && (
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileSignature className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-sm">{selectedDocument.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {selectedDocument.metadata?.contractType === 'manager-contract' ? 'Manager Contract' : 'Tenant Contract'}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-white">Draft</Badge>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="contract-content">Contract Content</Label>
                
                {/* Rich Text Editor with Real-time Formatting */}
                <RichTextEditor
                  content={editableContent}
                  onChange={(content) => setEditableContent(content)}
                />
                <p className="text-xs text-muted-foreground">
                  Use the formatting toolbar to apply bold, italic, headings, lists and more. Changes are applied in real-time.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)} disabled={uploading}>
              Cancel
            </Button>
            <Button onClick={handleSaveEditedContract} disabled={uploading}>
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <FileCheck className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Download Format Selection Dialog */}
      <Dialog open={showDownloadDialog} onOpenChange={setShowDownloadDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Download Document
            </DialogTitle>
            <DialogDescription>
              Choose the format you want to download this document in
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Document: <span className="font-medium text-foreground">{selectedDocument?.name}</span>
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-24 flex-col gap-2 hover:bg-red-50 hover:border-red-300"
                onClick={() => handleDownloadInFormat('pdf')}
              >
                <FileText className="h-8 w-8 text-red-600" />
                <div className="text-center">
                  <div className="font-semibold">PDF</div>
                  <div className="text-xs text-muted-foreground">Portable Document</div>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-24 flex-col gap-2 hover:bg-blue-50 hover:border-blue-300"
                onClick={() => handleDownloadInFormat('docx')}
              >
                <FileText className="h-8 w-8 text-blue-600" />
                <div className="text-center">
                  <div className="font-semibold">Word</div>
                  <div className="text-xs text-muted-foreground">Editable Document</div>
                </div>
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDownloadDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Document Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Share Document</DialogTitle>
            <DialogDescription>
              Share "{selectedDocument?.name}" with managers and tenants
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Share with Managers</Label>
              <Select
                value=""
                onValueChange={(value) => {
                  if (value && !shareForm.sharedWith.includes(value)) {
                    setShareForm({
                      ...shareForm,
                      sharedWith: [...shareForm.sharedWith, value]
                    });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select manager to share with" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(managers) && managers
                    .filter(m => !shareForm.sharedWith.includes(m.id))
                    .map((manager) => (
                      <SelectItem key={manager.id} value={manager.id}>
                        {manager.name} - {manager.email}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Share with Tenants</Label>
              <Select
                value=""
                onValueChange={(value) => {
                  if (value && !shareForm.sharedWith.includes(value)) {
                    setShareForm({
                      ...shareForm,
                      sharedWith: [...shareForm.sharedWith, value]
                    });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select tenant to share with" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(tenants) && tenants
                    .filter(t => !shareForm.sharedWith.includes(t.id))
                    .map((tenant) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.name} - {tenant.email}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Display selected users */}
            {shareForm.sharedWith.length > 0 && (
              <div className="space-y-2">
                <Label>Shared with:</Label>
                <div className="flex flex-wrap gap-2">
                  {shareForm.sharedWith.map((userId) => {
                    const manager = managers.find(m => m.id === userId);
                    const tenant = tenants.find(t => t.id === userId);
                    const user = manager || tenant;
                    
                    return user ? (
                      <Badge key={userId} variant="secondary" className="flex items-center gap-2">
                        {user.name}
                        <button
                          onClick={() => {
                            setShareForm({
                              ...shareForm,
                              sharedWith: shareForm.sharedWith.filter(id => id !== userId)
                            });
                          }}
                          className="ml-1 hover:text-red-600"
                        >
                          ×
                        </button>
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="shareMessage">Message (Optional)</Label>
              <Textarea
                id="shareMessage"
                placeholder="Add a message about this document..."
                rows={3}
                value={shareForm.message}
                onChange={(e) => setShareForm({ ...shareForm, message: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowShareDialog(false);
                setShareForm({ sharedWith: [], message: '' });
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleShareDocument}
              disabled={shareForm.sharedWith.length === 0}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share Document
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

