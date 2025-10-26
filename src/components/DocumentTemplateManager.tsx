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
  Plus,
  Edit,
  Trash2,
  Eye,
  Copy,
  Search,
  FileSignature,
  Receipt,
  AlertTriangle,
  ClipboardList,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { Switch } from './ui/switch';
import { toast } from 'sonner';

interface Template {
  id: string;
  name: string;
  type: 'lease' | 'notice' | 'receipt' | 'report';
  description: string;
  content: string;
  variables: string[];
  isActive: boolean;
  createdDate: string;
  lastModified: string;
  usageCount: number;
}

interface DocumentTemplateManagerProps {
  onClose: () => void;
  onSelectTemplate?: (template: any) => void;
}

const DocumentTemplateManager: React.FC<DocumentTemplateManagerProps> = ({ onClose, onSelectTemplate }) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const [templateForm, setTemplateForm] = useState({
    name: '',
    type: 'lease' as 'lease' | 'notice' | 'receipt' | 'report',
    description: '',
    content: '',
    isActive: true,
  });

  // Mock templates data
  const [templates, setTemplates] = useState<Template[]>([
    {
      id: '1',
      name: 'Standard 12-Month Lease Agreement',
      type: 'lease',
      description: 'Standard residential lease agreement for 12-month term',
      content: `RESIDENTIAL LEASE AGREEMENT

This Lease Agreement ("Agreement") is entered into on {{START_DATE}} between:

LANDLORD: {{LANDLORD_NAME}}
TENANT: {{TENANT_NAME}}

PROPERTY ADDRESS: {{PROPERTY_ADDRESS}}, Unit {{UNIT_NUMBER}}

LEASE TERM: {{LEASE_DURATION}} months, from {{START_DATE}} to {{END_DATE}}

MONTHLY RENT: {{CURRENCY}}{{MONTHLY_RENT}}
SECURITY DEPOSIT: {{CURRENCY}}{{SECURITY_DEPOSIT}}

TERMS AND CONDITIONS:
1. Rent is due on the {{DUE_DATE}} of each month
2. Late payments will incur a fee of {{CURRENCY}}{{LATE_FEE}}
3. Tenant is responsible for utilities: {{UTILITIES}}
4. No pets allowed without written permission
5. No subletting without landlord's written consent

SIGNATURES:
Landlord: _________________________ Date: _____________
Tenant: _________________________ Date: _____________`,
      variables: ['LANDLORD_NAME', 'TENANT_NAME', 'PROPERTY_ADDRESS', 'UNIT_NUMBER', 'START_DATE', 'END_DATE', 'LEASE_DURATION', 'MONTHLY_RENT', 'SECURITY_DEPOSIT', 'CURRENCY', 'DUE_DATE', 'LATE_FEE', 'UTILITIES'],
      isActive: true,
      createdDate: '2024-01-15',
      lastModified: '2024-09-20',
      usageCount: 45,
    },
    {
      id: '2',
      name: 'Lease Renewal Notice',
      type: 'notice',
      description: 'Notice to tenant regarding lease renewal options',
      content: `LEASE RENEWAL NOTICE

Date: {{NOTICE_DATE}}

To: {{TENANT_NAME}}
Property: {{PROPERTY_ADDRESS}}, Unit {{UNIT_NUMBER}}

Dear {{TENANT_NAME}},

This letter serves as notice that your current lease agreement for the above property will expire on {{LEASE_END_DATE}}.

We are pleased to offer you the opportunity to renew your lease under the following terms:

New Lease Term: {{NEW_TERM}} months
New Monthly Rent: {{CURRENCY}}{{NEW_RENT}}
Effective Date: {{RENEWAL_START_DATE}}

Please respond by {{RESPONSE_DEADLINE}} to indicate your intention to renew. If we do not hear from you by this date, we will assume you do not wish to renew and will begin marketing the property.

To accept this renewal offer, please sign below and return this document.

Sincerely,
{{LANDLORD_NAME}}

TENANT ACCEPTANCE:
Signature: _________________________ Date: _____________`,
      variables: ['NOTICE_DATE', 'TENANT_NAME', 'PROPERTY_ADDRESS', 'UNIT_NUMBER', 'LEASE_END_DATE', 'NEW_TERM', 'NEW_RENT', 'CURRENCY', 'RENEWAL_START_DATE', 'RESPONSE_DEADLINE', 'LANDLORD_NAME'],
      isActive: true,
      createdDate: '2024-02-10',
      lastModified: '2024-10-05',
      usageCount: 23,
    },
    {
      id: '3',
      name: 'Monthly Rent Receipt',
      type: 'receipt',
      description: 'Receipt for monthly rent payment',
      content: `RENT PAYMENT RECEIPT

Receipt Number: {{RECEIPT_NUMBER}}
Date: {{PAYMENT_DATE}}

RECEIVED FROM: {{TENANT_NAME}}
PROPERTY: {{PROPERTY_ADDRESS}}, Unit {{UNIT_NUMBER}}

PAYMENT DETAILS:
Rent Period: {{RENT_PERIOD}}
Amount Paid: {{CURRENCY}}{{AMOUNT_PAID}}
Payment Method: {{PAYMENT_METHOD}}

BREAKDOWN:
Monthly Rent: {{CURRENCY}}{{MONTHLY_RENT}}
Late Fee: {{CURRENCY}}{{LATE_FEE}}
Other Charges: {{CURRENCY}}{{OTHER_CHARGES}}
Total: {{CURRENCY}}{{AMOUNT_PAID}}

Current Balance: {{CURRENCY}}{{REMAINING_BALANCE}}

Thank you for your payment.

Issued by: {{LANDLORD_NAME}}
Date: {{ISSUE_DATE}}

This is an official receipt for your records.`,
      variables: ['RECEIPT_NUMBER', 'PAYMENT_DATE', 'TENANT_NAME', 'PROPERTY_ADDRESS', 'UNIT_NUMBER', 'RENT_PERIOD', 'AMOUNT_PAID', 'CURRENCY', 'PAYMENT_METHOD', 'MONTHLY_RENT', 'LATE_FEE', 'OTHER_CHARGES', 'REMAINING_BALANCE', 'LANDLORD_NAME', 'ISSUE_DATE'],
      isActive: true,
      createdDate: '2024-01-20',
      lastModified: '2024-08-15',
      usageCount: 234,
    },
    {
      id: '4',
      name: 'Move-In Inspection Report',
      type: 'report',
      description: 'Property condition inspection report for move-in',
      content: `MOVE-IN INSPECTION REPORT

Date: {{INSPECTION_DATE}}
Property: {{PROPERTY_ADDRESS}}, Unit {{UNIT_NUMBER}}
Tenant: {{TENANT_NAME}}
Inspector: {{INSPECTOR_NAME}}

GENERAL CONDITION:
Overall Property Condition: {{OVERALL_CONDITION}}

ROOM-BY-ROOM INSPECTION:

Living Room:
- Walls: {{LIVING_WALLS}}
- Floors: {{LIVING_FLOORS}}
- Windows: {{LIVING_WINDOWS}}
- Notes: {{LIVING_NOTES}}

Kitchen:
- Appliances: {{KITCHEN_APPLIANCES}}
- Cabinets: {{KITCHEN_CABINETS}}
- Countertops: {{KITCHEN_COUNTERS}}
- Plumbing: {{KITCHEN_PLUMBING}}
- Notes: {{KITCHEN_NOTES}}

Bedroom(s):
- Walls: {{BEDROOM_WALLS}}
- Floors: {{BEDROOM_FLOORS}}
- Closets: {{BEDROOM_CLOSETS}}
- Notes: {{BEDROOM_NOTES}}

Bathroom(s):
- Fixtures: {{BATHROOM_FIXTURES}}
- Plumbing: {{BATHROOM_PLUMBING}}
- Ventilation: {{BATHROOM_VENTILATION}}
- Notes: {{BATHROOM_NOTES}}

ADDITIONAL NOTES:
{{ADDITIONAL_NOTES}}

SIGNATURES:
Tenant: _________________________ Date: _____________
Inspector: _________________________ Date: _____________`,
      variables: ['INSPECTION_DATE', 'PROPERTY_ADDRESS', 'UNIT_NUMBER', 'TENANT_NAME', 'INSPECTOR_NAME', 'OVERALL_CONDITION', 'LIVING_WALLS', 'LIVING_FLOORS', 'LIVING_WINDOWS', 'LIVING_NOTES', 'KITCHEN_APPLIANCES', 'KITCHEN_CABINETS', 'KITCHEN_COUNTERS', 'KITCHEN_PLUMBING', 'KITCHEN_NOTES', 'BEDROOM_WALLS', 'BEDROOM_FLOORS', 'BEDROOM_CLOSETS', 'BEDROOM_NOTES', 'BATHROOM_FIXTURES', 'BATHROOM_PLUMBING', 'BATHROOM_VENTILATION', 'BATHROOM_NOTES', 'ADDITIONAL_NOTES'],
      isActive: true,
      createdDate: '2024-03-01',
      lastModified: '2024-09-10',
      usageCount: 67,
    },
    {
      id: '5',
      name: 'Lease Violation Warning',
      type: 'notice',
      description: 'Warning notice for lease violations',
      content: `LEASE VIOLATION NOTICE

Date: {{NOTICE_DATE}}

To: {{TENANT_NAME}}
Property: {{PROPERTY_ADDRESS}}, Unit {{UNIT_NUMBER}}

Dear {{TENANT_NAME}},

This letter serves as formal notice that you are in violation of your lease agreement.

VIOLATION DETAILS:
Type: {{VIOLATION_TYPE}}
Date of Violation: {{VIOLATION_DATE}}
Description: {{VIOLATION_DESCRIPTION}}

REQUIRED ACTION:
You are required to: {{REQUIRED_ACTION}}

DEADLINE:
You must remedy this violation by: {{REMEDY_DEADLINE}}

CONSEQUENCES:
Failure to comply may result in: {{CONSEQUENCES}}

If you have any questions or wish to discuss this matter, please contact us immediately.

Sincerely,
{{LANDLORD_NAME}}
{{CONTACT_PHONE}}
{{CONTACT_EMAIL}}`,
      variables: ['NOTICE_DATE', 'TENANT_NAME', 'PROPERTY_ADDRESS', 'UNIT_NUMBER', 'VIOLATION_TYPE', 'VIOLATION_DATE', 'VIOLATION_DESCRIPTION', 'REQUIRED_ACTION', 'REMEDY_DEADLINE', 'CONSEQUENCES', 'LANDLORD_NAME', 'CONTACT_PHONE', 'CONTACT_EMAIL'],
      isActive: true,
      createdDate: '2024-02-20',
      lastModified: '2024-09-25',
      usageCount: 12,
    },
  ]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'lease':
        return <FileSignature className="h-4 w-4" />;
      case 'notice':
        return <AlertTriangle className="h-4 w-4" />;
      case 'receipt':
        return <Receipt className="h-4 w-4" />;
      case 'report':
        return <ClipboardList className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'lease':
        return 'bg-blue-100 text-blue-800';
      case 'notice':
        return 'bg-yellow-100 text-yellow-800';
      case 'receipt':
        return 'bg-green-100 text-green-800';
      case 'report':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCreateTemplate = () => {
    const newTemplate: Template = {
      id: Date.now().toString(),
      name: templateForm.name,
      type: templateForm.type,
      description: templateForm.description,
      content: templateForm.content,
      variables: extractVariables(templateForm.content),
      isActive: templateForm.isActive,
      createdDate: new Date().toISOString().split('T')[0],
      lastModified: new Date().toISOString().split('T')[0],
      usageCount: 0,
    };

    setTemplates([...templates, newTemplate]);
    setShowCreateDialog(false);
    resetForm();
    toast.success('Template created successfully!');
  };

  const handleEditTemplate = () => {
    if (!selectedTemplate) return;

    const updatedTemplates = templates.map(t => 
      t.id === selectedTemplate.id 
        ? {
            ...t,
            name: templateForm.name,
            type: templateForm.type,
            description: templateForm.description,
            content: templateForm.content,
            variables: extractVariables(templateForm.content),
            isActive: templateForm.isActive,
            lastModified: new Date().toISOString().split('T')[0],
          }
        : t
    );

    setTemplates(updatedTemplates);
    setShowEditDialog(false);
    setSelectedTemplate(null);
    resetForm();
    toast.success('Template updated successfully!');
  };

  const handleDeleteTemplate = () => {
    if (!selectedTemplate) return;
    
    setTemplates(templates.filter(t => t.id !== selectedTemplate.id));
    setShowDeleteDialog(false);
    setSelectedTemplate(null);
    toast.success('Template deleted successfully!');
  };

  const handleDuplicateTemplate = (template: Template) => {
    const duplicatedTemplate: Template = {
      ...template,
      id: Date.now().toString(),
      name: `${template.name} (Copy)`,
      createdDate: new Date().toISOString().split('T')[0],
      lastModified: new Date().toISOString().split('T')[0],
      usageCount: 0,
    };

    setTemplates([...templates, duplicatedTemplate]);
    toast.success('Template duplicated successfully!');
  };

  const handleToggleActive = (template: Template) => {
    const updatedTemplates = templates.map(t =>
      t.id === template.id ? { ...t, isActive: !t.isActive } : t
    );
    setTemplates(updatedTemplates);
    toast.success(`Template ${!template.isActive ? 'activated' : 'deactivated'} successfully!`);
  };

  const extractVariables = (content: string): string[] => {
    const regex = /\{\{([A-Z_]+)\}\}/g;
    const matches = content.match(regex);
    if (!matches) return [];
    return Array.from(new Set(matches.map(m => m.replace(/\{\{|\}\}/g, ''))));
  };

  const openEditDialog = (template: Template) => {
    setSelectedTemplate(template);
    setTemplateForm({
      name: template.name,
      type: template.type,
      description: template.description,
      content: template.content,
      isActive: template.isActive,
    });
    setShowEditDialog(true);
  };

  const openPreviewDialog = (template: Template) => {
    setSelectedTemplate(template);
    setShowPreviewDialog(true);
  };

  const openDeleteDialog = (template: Template) => {
    setSelectedTemplate(template);
    setShowDeleteDialog(true);
  };

  const resetForm = () => {
    setTemplateForm({
      name: '',
      type: 'lease',
      description: '',
      content: '',
      isActive: true,
    });
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || template.type === activeTab;
    return matchesSearch && matchesTab;
  });

  const templateStats = {
    total: templates.length,
    active: templates.filter(t => t.isActive).length,
    byType: {
      lease: templates.filter(t => t.type === 'lease').length,
      notice: templates.filter(t => t.type === 'notice').length,
      receipt: templates.filter(t => t.type === 'receipt').length,
      report: templates.filter(t => t.type === 'report').length,
    },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Document Templates</h2>
          <p className="text-muted-foreground">Create and manage document templates</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Templates</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templateStats.total}</div>
            <p className="text-xs text-muted-foreground">{templateStats.active} active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lease Templates</CardTitle>
            <FileSignature className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templateStats.byType.lease}</div>
            <p className="text-xs text-muted-foreground">Rental agreements</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notice Templates</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templateStats.byType.notice}</div>
            <p className="text-xs text-muted-foreground">Tenant notifications</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Other Templates</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {templateStats.byType.receipt + templateStats.byType.report}
            </div>
            <p className="text-xs text-muted-foreground">Receipts & reports</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Templates List */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Templates</TabsTrigger>
          <TabsTrigger value="lease">Lease</TabsTrigger>
          <TabsTrigger value="notice">Notice</TabsTrigger>
          <TabsTrigger value="receipt">Receipt</TabsTrigger>
          <TabsTrigger value="report">Report</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Template Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Modified</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTemplates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getTypeIcon(template.type)}
                          <span className="font-medium">{template.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getTypeColor(template.type)}>
                          {template.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{template.description}</TableCell>
                      <TableCell>{template.usageCount} times</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={template.isActive}
                            onCheckedChange={() => handleToggleActive(template)}
                          />
                          <span className="text-sm">
                            {template.isActive ? (
                              <Badge variant="outline" className="bg-green-100 text-green-800">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-gray-100 text-gray-800">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Inactive
                              </Badge>
                            )}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {template.lastModified}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {onSelectTemplate && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => onSelectTemplate(template)}
                              title="Use this template"
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Use
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openPreviewDialog(template)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(template)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDuplicateTemplate(template)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(template)}
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
        </TabsContent>
      </Tabs>

      {/* Create Template Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Template</DialogTitle>
            <DialogDescription>
              Create a reusable document template with variables
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="templateName">Template Name *</Label>
                <Input
                  id="templateName"
                  placeholder="e.g., Standard Lease Agreement"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="templateType">Template Type *</Label>
                <Select
                  value={templateForm.type}
                  onValueChange={(value: any) => setTemplateForm({ ...templateForm, type: value })}
                >
                  <SelectTrigger id="templateType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lease">Lease Agreement</SelectItem>
                    <SelectItem value="notice">Notice</SelectItem>
                    <SelectItem value="receipt">Receipt</SelectItem>
                    <SelectItem value="report">Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="templateDescription">Description *</Label>
              <Input
                id="templateDescription"
                placeholder="Brief description of this template"
                value={templateForm.description}
                onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="templateContent">Template Content *</Label>
              <Textarea
                id="templateContent"
                placeholder="Enter your template content here. Use {{VARIABLE_NAME}} for dynamic fields."
                value={templateForm.content}
                onChange={(e) => setTemplateForm({ ...templateForm, content: e.target.value })}
                rows={15}
                className="font-mono text-sm"
              />
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Tip:</strong> Use double curly braces for variables, e.g., {`{{TENANT_NAME}}`}, {`{{PROPERTY_ADDRESS}}`}, {`{{MONTHLY_RENT}}`}, {`{{CURRENCY}}`}
                <br />
                <strong>Detected Variables:</strong> {extractVariables(templateForm.content).length > 0 
                  ? extractVariables(templateForm.content).join(', ') 
                  : 'None'}
              </AlertDescription>
            </Alert>

            <div className="flex items-center space-x-2">
              <Switch
                id="templateActive"
                checked={templateForm.isActive}
                onCheckedChange={(checked) => setTemplateForm({ ...templateForm, isActive: checked })}
              />
              <Label htmlFor="templateActive">Set as active template</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreateDialog(false); resetForm(); }}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateTemplate}
              disabled={!templateForm.name || !templateForm.description || !templateForm.content}
            >
              Create Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Template Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
            <DialogDescription>
              Update your document template
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editTemplateName">Template Name *</Label>
                <Input
                  id="editTemplateName"
                  placeholder="e.g., Standard Lease Agreement"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editTemplateType">Template Type *</Label>
                <Select
                  value={templateForm.type}
                  onValueChange={(value: any) => setTemplateForm({ ...templateForm, type: value })}
                >
                  <SelectTrigger id="editTemplateType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lease">Lease Agreement</SelectItem>
                    <SelectItem value="notice">Notice</SelectItem>
                    <SelectItem value="receipt">Receipt</SelectItem>
                    <SelectItem value="report">Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="editTemplateDescription">Description *</Label>
              <Input
                id="editTemplateDescription"
                placeholder="Brief description of this template"
                value={templateForm.description}
                onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editTemplateContent">Template Content *</Label>
              <Textarea
                id="editTemplateContent"
                placeholder="Enter your template content here. Use {{VARIABLE_NAME}} for dynamic fields."
                value={templateForm.content}
                onChange={(e) => setTemplateForm({ ...templateForm, content: e.target.value })}
                rows={15}
                className="font-mono text-sm"
              />
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Detected Variables:</strong> {extractVariables(templateForm.content).length > 0 
                  ? extractVariables(templateForm.content).join(', ') 
                  : 'None'}
              </AlertDescription>
            </Alert>

            <div className="flex items-center space-x-2">
              <Switch
                id="editTemplateActive"
                checked={templateForm.isActive}
                onCheckedChange={(checked) => setTemplateForm({ ...templateForm, isActive: checked })}
              />
              <Label htmlFor="editTemplateActive">Set as active template</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowEditDialog(false); setSelectedTemplate(null); resetForm(); }}>
              Cancel
            </Button>
            <Button 
              onClick={handleEditTemplate}
              disabled={!templateForm.name || !templateForm.description || !templateForm.content}
            >
              Update Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Template Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
            <DialogDescription>
              {selectedTemplate?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedTemplate && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Type</Label>
                  <p className="font-medium mt-1">{selectedTemplate.type}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <p className="font-medium mt-1">{selectedTemplate.isActive ? 'Active' : 'Inactive'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Created</Label>
                  <p className="font-medium mt-1">{selectedTemplate.createdDate}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Last Modified</Label>
                  <p className="font-medium mt-1">{selectedTemplate.lastModified}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-muted-foreground">Description</Label>
                  <p className="font-medium mt-1">{selectedTemplate.description}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-muted-foreground">Variables ({selectedTemplate.variables.length})</Label>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedTemplate.variables.map((variable) => (
                      <Badge key={variable} variant="secondary">
                        {variable}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Template Content</Label>
                <div className="border rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto">
                  <pre className="text-sm whitespace-pre-wrap font-mono">
                    {selectedTemplate.content}
                  </pre>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowPreviewDialog(false); setSelectedTemplate(null); }}>
              Close
            </Button>
            <Button onClick={() => {
              if (selectedTemplate) {
                handleDuplicateTemplate(selectedTemplate);
                setShowPreviewDialog(false);
              }
            }}>
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedTemplate?.name}"? This action cannot be undone.
              {selectedTemplate && selectedTemplate.usageCount > 0 && (
                <Alert className="mt-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    This template has been used {selectedTemplate.usageCount} times. Deleting it will not affect existing documents created from this template.
                  </AlertDescription>
                </Alert>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setShowDeleteDialog(false); setSelectedTemplate(null); }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTemplate} className="bg-red-600 hover:bg-red-700">
              Delete Template
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DocumentTemplateManager;


