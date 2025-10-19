import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Alert, AlertDescription } from "./ui/alert";
import { toast } from "sonner";
import { 
  ArrowLeft,
  Send,
  Save,
  AlertCircle,
  CreditCard,
  Users,
  Building2,
  Smartphone,
  Network,
  Star,
  Wrench,
  HelpCircle,
  Paperclip,
  X,
  Info,
  CheckCircle2,
  UserCircle,
  Shield
} from 'lucide-react';

interface NewTicketPageProps {
  onBack?: () => void;
  onSuccess?: (ticketId: string) => void;
}

export function NewTicketPage({ onBack, onSuccess }: NewTicketPageProps) {
  const [ticketType, setTicketType] = useState<'customer' | 'internal'>('customer');
  const [formData, setFormData] = useState({
    customer: '',
    customerEmail: '',
    title: '',
    category: '',
    priority: 'medium',
    description: '',
    assignedTo: 'auto',
    tags: '',
    urgency: 'normal'
  });

  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Mock data for dropdowns
  const customers = [
    { id: 'urban-living', name: 'Urban Living Properties', email: 'sarah@urbanliving.com' },
    { id: 'metro-props', name: 'Metro Properties LLC', email: 'michael@metroproperties.com' },
    { id: 'sunset-apts', name: 'Sunset Apartments', email: 'jessica@sunsetapts.com' },
    { id: 'riverside', name: 'Riverside Management', email: 'admin@riverside.com' },
    { id: 'downtown', name: 'Downtown Developments', email: 'it@downtown.com' }
  ];

  const categories = [
    { value: 'billing', label: 'Billing & Payments', icon: CreditCard, color: 'text-blue-600' },
    { value: 'tenant-management', label: 'Tenant Management', icon: Users, color: 'text-green-600' },
    { value: 'property-management', label: 'Property Management', icon: Building2, color: 'text-purple-600' },
    { value: 'mobile-app', label: 'Mobile App', icon: Smartphone, color: 'text-pink-600' },
    { value: 'integrations', label: 'Integrations', icon: Network, color: 'text-orange-600' },
    { value: 'feature-request', label: 'Feature Request', icon: Star, color: 'text-yellow-600' },
    { value: 'technical-issues', label: 'Technical Issues', icon: Wrench, color: 'text-red-600' },
    { value: 'other', label: 'Other', icon: HelpCircle, color: 'text-gray-600' }
  ];

  const supportTeam = [
    { id: 'alex', name: 'Alex Thompson', role: 'Senior Support Engineer', specialties: ['billing', 'integrations'] },
    { id: 'sarah', name: 'Sarah Kim', role: 'Support Specialist', specialties: ['tenant-management', 'property-management'] },
    { id: 'mike', name: 'Mike Rodriguez', role: 'Technical Support Lead', specialties: ['mobile-app', 'technical-issues'] },
    { id: 'emma', name: 'Emma Wilson', role: 'Customer Success Manager', specialties: ['feature-request', 'customer-success'] }
  ];

  const priorities = [
    { value: 'low', label: 'Low Priority', color: 'bg-green-500', description: 'Non-urgent, can be addressed in 2-3 days' },
    { value: 'medium', label: 'Medium Priority', color: 'bg-yellow-500', description: 'Should be addressed within 24 hours' },
    { value: 'high', label: 'High Priority', color: 'bg-orange-500', description: 'Urgent, needs attention within 4 hours' },
    { value: 'critical', label: 'Critical', color: 'bg-red-500', description: 'Critical issue, immediate attention required' }
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    setFormData(prev => ({
      ...prev,
      customer: customerId,
      customerEmail: customer?.email || ''
    }));
    if (errors.customer) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.customer;
        return newErrors;
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments(prev => [...prev, ...newFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (ticketType === 'customer' && !formData.customer) {
      newErrors.customer = 'Please select a customer';
    }

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length < 20) {
      newErrors.description = 'Description must be at least 20 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      const ticketId = `TK-2024-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
      toast.success(
        `Ticket Created Successfully! Ticket ID: ${ticketId}`
      );
      setIsSubmitting(false);
      
      if (onSuccess) {
        onSuccess(ticketId);
      }
    }, 1500);
  };

  const handleSaveDraft = () => {
    toast.success('Draft saved successfully');
  };

  const getRecommendedAgent = () => {
    if (!formData.category) return null;
    return supportTeam.find(agent => 
      agent.specialties.includes(formData.category)
    );
  };

  const recommendedAgent = getRecommendedAgent();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3">
              {onBack && (
                <Button variant="ghost" size="sm" onClick={onBack}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <h1 className="text-3xl font-bold text-gray-900">Create New Support Ticket</h1>
            </div>
            <p className="text-gray-600 mt-2">
              Create a ticket on behalf of a customer or for internal platform issues
            </p>
          </div>
        </div>

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Ticket Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Ticket Type</CardTitle>
              <CardDescription>
                Select whether this is a customer support request or an internal platform issue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    ticketType === 'customer'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setTicketType('customer')}
                >
                  <div className="flex items-start space-x-3">
                    <UserCircle className={`h-6 w-6 mt-1 ${ticketType === 'customer' ? 'text-blue-600' : 'text-gray-400'}`} />
                    <div className="flex-1">
                      <h3 className="font-semibold">Customer Support Request</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Ticket created on behalf of a customer who contacted support via phone, email, or chat
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    ticketType === 'internal'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setTicketType('internal')}
                >
                  <div className="flex items-start space-x-3">
                    <Shield className={`h-6 w-6 mt-1 ${ticketType === 'internal' ? 'text-blue-600' : 'text-gray-400'}`} />
                    <div className="flex-1">
                      <h3 className="font-semibold">Internal Platform Issue</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Track platform bugs, technical issues, or internal improvement tasks
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Information (Only for Customer Type) */}
          {ticketType === 'customer' && (
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
                <CardDescription>
                  Select the customer this ticket is for
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="customer">Customer / Organization *</Label>
                  <Select value={formData.customer} onValueChange={handleCustomerChange}>
                    <SelectTrigger id="customer" className={errors.customer ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select a customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map(customer => (
                        <SelectItem key={customer.id} value={customer.id}>
                          <div className="flex flex-col">
                            <span>{customer.name}</span>
                            <span className="text-xs text-gray-500">{customer.email}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.customer && (
                    <p className="text-sm text-red-600 mt-1 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.customer}
                    </p>
                  )}
                </div>

                {formData.customer && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <span className="font-semibold">Contact Email: </span>
                      {formData.customerEmail}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Ticket Details */}
          <Card>
            <CardHeader>
              <CardTitle>Ticket Details</CardTitle>
              <CardDescription>
                Provide detailed information about the issue
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Title */}
              <div>
                <Label htmlFor="title">Issue Title *</Label>
                <Input
                  id="title"
                  placeholder="Brief, descriptive title of the issue"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className={errors.title ? 'border-red-500' : ''}
                />
                {errors.title && (
                  <p className="text-sm text-red-600 mt-1 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.title}
                  </p>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Category */}
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                    <SelectTrigger id="category" className={errors.category ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => {
                        const Icon = category.icon;
                        return (
                          <SelectItem key={category.value} value={category.value}>
                            <div className="flex items-center space-x-2">
                              <Icon className={`h-4 w-4 ${category.color}`} />
                              <span>{category.label}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {errors.category && (
                    <p className="text-sm text-red-600 mt-1 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.category}
                    </p>
                  )}
                </div>

                {/* Priority */}
                <div>
                  <Label htmlFor="priority">Priority Level *</Label>
                  <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                    <SelectTrigger id="priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorities.map(priority => (
                        <SelectItem key={priority.value} value={priority.value}>
                          <div className="flex items-center space-x-2">
                            <div className={`h-2 w-2 rounded-full ${priority.color}`}></div>
                            <div className="flex flex-col">
                              <span>{priority.label}</span>
                              <span className="text-xs text-gray-500">{priority.description}</span>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Detailed Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Provide detailed information about the issue including:&#10;- What happened?&#10;- Steps to reproduce&#10;- Expected vs actual behavior&#10;- Error messages (if any)&#10;- Impact on operations"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={8}
                  className={errors.description ? 'border-red-500' : ''}
                />
                <div className="flex justify-between items-center mt-1">
                  {errors.description ? (
                    <p className="text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.description}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500">
                      {formData.description.length} characters (minimum 20)
                    </p>
                  )}
                </div>
              </div>

              {/* Tags */}
              <div>
                <Label htmlFor="tags">Tags (Optional)</Label>
                <Input
                  id="tags"
                  placeholder="e.g. payment-gateway, urgent, mobile-bug (comma separated)"
                  value={formData.tags}
                  onChange={(e) => handleInputChange('tags', e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Add relevant tags to help categorize and search for this ticket
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Assignment */}
          <Card>
            <CardHeader>
              <CardTitle>Assignment</CardTitle>
              <CardDescription>
                Assign this ticket to a support team member or use auto-assignment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="assignTo">Assign To</Label>
                <Select value={formData.assignedTo} onValueChange={(value) => handleInputChange('assignedTo', value)}>
                  <SelectTrigger id="assignTo">
                    <SelectValue placeholder="Auto-assign based on category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span>Auto-assign based on category</span>
                      </div>
                    </SelectItem>
                    {supportTeam.map(agent => (
                      <SelectItem key={agent.id} value={agent.id}>
                        <div className="flex flex-col">
                          <span>{agent.name}</span>
                          <span className="text-xs text-gray-500">{agent.role}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {recommendedAgent && (formData.assignedTo === 'auto' || !formData.assignedTo) && (
                <Alert className="bg-blue-50 border-blue-200">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription>
                    <span className="font-semibold text-blue-900">Recommended: </span>
                    <span className="text-blue-800">
                      {recommendedAgent.name} ({recommendedAgent.role}) - Specializes in {formData.category.replace('-', ' ')}
                    </span>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Attachments */}
          <Card>
            <CardHeader>
              <CardTitle>Attachments</CardTitle>
              <CardDescription>
                Upload screenshots, logs, or other relevant files
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <Paperclip className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">
                      Click to upload or drag and drop files here
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PNG, JPG, PDF, or TXT (max 10MB per file)
                    </p>
                  </div>
                  <Input
                    id="file-upload"
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileUpload}
                    accept=".png,.jpg,.jpeg,.pdf,.txt,.log"
                  />
                </Label>
              </div>

              {attachments.length > 0 && (
                <div className="space-y-2">
                  <Label>Uploaded Files ({attachments.length})</Label>
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Paperclip className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium">{file.name}</p>
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAttachment(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSaveDraft}
                  disabled={isSubmitting}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save as Draft
                </Button>

                <div className="flex space-x-3">
                  {onBack && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onBack}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Creating Ticket...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Create Ticket
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}


