import React, { useState, useEffect } from 'react';
import {
  getEmailTemplates,
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
  duplicateEmailTemplate,
  testEmailTemplate,
  type EmailTemplate,
  type EmailTemplateFilters,
} from '../lib/api/email-templates';
import { EmailTemplateEditor } from './EmailTemplateEditor';
import { EmailTemplatePreview } from './EmailTemplatePreview';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Badge } from './ui/badge';
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Copy,
  Mail,
  FileText,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

interface EmailTemplateManagementProps {
  user: any;
  onBack?: () => void;
}

export function EmailTemplateManagement({
  user,
  onBack,
}: EmailTemplateManagementProps) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);

  // Template types
  const templateTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'onboarding', label: 'Onboarding' },
    { value: 'activation', label: 'Activation' },
    { value: 'password_reset', label: 'Password Reset' },
    { value: 'invitation', label: 'Invitation' },
    { value: 'welcome', label: 'Welcome' },
    { value: 'report', label: 'Report' },
    { value: 'custom', label: 'Custom' },
  ];

  // Fetch templates
  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const filters: EmailTemplateFilters = {};
      if (typeFilter !== 'all') filters.type = typeFilter;
      if (statusFilter !== 'all') filters.is_active = statusFilter === 'active';
      if (searchTerm) filters.search = searchTerm;

      const response = await getEmailTemplates(filters);
      if (response.error) {
        toast.error(response.error.error || 'Failed to load email templates');
      } else if (response.data) {
        setTemplates(response.data);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load email templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [typeFilter, statusFilter, searchTerm]);

  // Handle create
  const handleCreate = () => {
    setEditingTemplate(null);
    setShowEditor(true);
  };

  // Handle edit
  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setShowEditor(true);
  };

  // Handle delete
  const handleDelete = async (template: EmailTemplate) => {
    if (!confirm(`Are you sure you want to delete "${template.name}"?`)) {
      return;
    }

    try {
      const response = await deleteEmailTemplate(template.id);
      if (response.error) {
        toast.error(response.error.error || 'Failed to delete template');
      } else {
        toast.success('Template deleted successfully');
        fetchTemplates();
      }
    } catch (error) {
      toast.error('Failed to delete template');
    }
  };

  // Handle duplicate
  const handleDuplicate = async (template: EmailTemplate) => {
    try {
      const response = await duplicateEmailTemplate(template.id, {
        name: `${template.name} (Copy)`,
      });
      if (response.error) {
        toast.error(response.error.error || 'Failed to duplicate template');
      } else {
        toast.success('Template duplicated successfully');
        fetchTemplates();
      }
    } catch (error) {
      toast.error('Failed to duplicate template');
    }
  };

  // Handle test email
  const handleTest = async (template: EmailTemplate) => {
    const recipientEmail = prompt('Enter recipient email address:');
    if (!recipientEmail) return;

    try {
      const response = await testEmailTemplate(template.id, {
        recipientEmail,
        variables: {}, // Use empty variables for test
      });
      if (response.error) {
        toast.error(response.error.error || 'Failed to send test email');
      } else {
        toast.success(`Test email sent to ${recipientEmail}`);
      }
    } catch (error) {
      toast.error('Failed to send test email');
    }
  };

  // Handle save (from editor)
  const handleSave = async (templateData: any) => {
    try {
      if (editingTemplate) {
        // Update
        const response = await updateEmailTemplate(editingTemplate.id, templateData);
        if (response.error) {
          toast.error(response.error.error || 'Failed to update template');
          return false;
        } else {
          toast.success('Template updated successfully');
          setShowEditor(false);
          setEditingTemplate(null);
          fetchTemplates();
          return true;
        }
      } else {
        // Create
        const response = await createEmailTemplate(templateData);
        if (response.error) {
          toast.error(response.error.error || 'Failed to create template');
          return false;
        } else {
          toast.success('Template created successfully');
          setShowEditor(false);
          fetchTemplates();
          return true;
        }
      }
    } catch (error) {
      toast.error('Failed to save template');
      return false;
    }
  };

  // Filtered templates
  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.type.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  if (showEditor) {
    return (
      <EmailTemplateEditor
        template={editingTemplate}
        onSave={handleSave}
        onCancel={() => {
          setShowEditor(false);
          setEditingTemplate(null);
        }}
      />
    );
  }

  if (showPreview && selectedTemplate) {
    return (
      <EmailTemplatePreview
        template={selectedTemplate}
        onBack={() => {
          setShowPreview(false);
          setSelectedTemplate(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Email Templates</h1>
          <p className="text-gray-600 mt-1">
            Manage email templates for onboarding, activation, and more
          </p>
        </div>
        <Button onClick={handleCreate} className="bg-purple-600 hover:bg-purple-700">
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                {templateTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Templates Table */}
      <Card>
        <CardHeader>
          <CardTitle>Templates</CardTitle>
          <CardDescription>
            {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading templates...</div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No templates found. Create your first template to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTemplates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{template.type}</Badge>
                    </TableCell>
                    <TableCell className="max-w-md truncate">
                      {template.subject}
                    </TableCell>
                    <TableCell>
                      {template.is_active ? (
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell>v{template.version}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedTemplate(template);
                              setShowPreview(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(template)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleTest(template)}>
                            <Mail className="h-4 w-4 mr-2" />
                            Send Test
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(template)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          {!template.is_system && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handleDelete(template)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

