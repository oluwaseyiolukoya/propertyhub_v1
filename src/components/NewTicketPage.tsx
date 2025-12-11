import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
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
  Shield,
  FileText,
} from "lucide-react";

interface NewTicketPageProps {
  onBack?: () => void;
  onSuccess?: (ticketId: string) => void;
}

export function NewTicketPage({ onBack, onSuccess }: NewTicketPageProps) {
  const [ticketType, setTicketType] = useState<"customer" | "internal">(
    "customer"
  );
  const [formData, setFormData] = useState({
    customer: "",
    customerEmail: "",
    title: "",
    category: "",
    priority: "medium",
    description: "",
    assignedTo: "auto",
    tags: "",
    urgency: "normal",
  });

  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Mock data for dropdowns
  const customers = [
    {
      id: "urban-living",
      name: "Urban Living Properties",
      email: "sarah@urbanliving.com",
    },
    {
      id: "metro-props",
      name: "Metro Properties LLC",
      email: "michael@metroproperties.com",
    },
    {
      id: "sunset-apts",
      name: "Sunset Apartments",
      email: "jessica@sunsetapts.com",
    },
    {
      id: "riverside",
      name: "Riverside Management",
      email: "admin@riverside.com",
    },
    { id: "downtown", name: "Downtown Developments", email: "it@downtown.com" },
  ];

  const categories = [
    {
      value: "billing",
      label: "Billing & Payments",
      icon: CreditCard,
      color: "text-blue-600",
    },
    {
      value: "tenant-management",
      label: "Tenant Management",
      icon: Users,
      color: "text-green-600",
    },
    {
      value: "property-management",
      label: "Property Management",
      icon: Building2,
      color: "text-purple-600",
    },
    {
      value: "mobile-app",
      label: "Mobile App",
      icon: Smartphone,
      color: "text-pink-600",
    },
    {
      value: "integrations",
      label: "Integrations",
      icon: Network,
      color: "text-orange-600",
    },
    {
      value: "feature-request",
      label: "Feature Request",
      icon: Star,
      color: "text-yellow-600",
    },
    {
      value: "technical-issues",
      label: "Technical Issues",
      icon: Wrench,
      color: "text-red-600",
    },
    {
      value: "other",
      label: "Other",
      icon: HelpCircle,
      color: "text-gray-600",
    },
  ];

  const supportTeam = [
    {
      id: "alex",
      name: "Alex Thompson",
      role: "Senior Support Engineer",
      specialties: ["billing", "integrations"],
    },
    {
      id: "sarah",
      name: "Sarah Kim",
      role: "Support Specialist",
      specialties: ["tenant-management", "property-management"],
    },
    {
      id: "mike",
      name: "Mike Rodriguez",
      role: "Technical Support Lead",
      specialties: ["mobile-app", "technical-issues"],
    },
    {
      id: "emma",
      name: "Emma Wilson",
      role: "Customer Success Manager",
      specialties: ["feature-request", "customer-success"],
    },
  ];

  const priorities = [
    {
      value: "low",
      label: "Low Priority",
      color: "bg-green-500",
      description: "Non-urgent, can be addressed in 2-3 days",
    },
    {
      value: "medium",
      label: "Medium Priority",
      color: "bg-yellow-500",
      description: "Should be addressed within 24 hours",
    },
    {
      value: "high",
      label: "High Priority",
      color: "bg-orange-500",
      description: "Urgent, needs attention within 4 hours",
    },
    {
      value: "critical",
      label: "Critical",
      color: "bg-red-500",
      description: "Critical issue, immediate attention required",
    },
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    setFormData((prev) => ({
      ...prev,
      customer: customerId,
      customerEmail: customer?.email || "",
    }));
    if (errors.customer) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.customer;
        return newErrors;
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments((prev) => [...prev, ...newFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (ticketType === "customer" && !formData.customer) {
      newErrors.customer = "Please select a customer";
    }

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!formData.category) {
      newErrors.category = "Please select a category";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (formData.description.trim().length < 20) {
      newErrors.description = "Description must be at least 20 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      const ticketId = `TK-2024-${String(
        Math.floor(Math.random() * 1000)
      ).padStart(3, "0")}`;
      toast.success(`Ticket Created Successfully! Ticket ID: ${ticketId}`);
      setIsSubmitting(false);

      if (onSuccess) {
        onSuccess(ticketId);
      }
    }, 1500);
  };

  const handleSaveDraft = () => {
    toast.success("Draft saved successfully");
  };

  const getRecommendedAgent = () => {
    if (!formData.category) return null;
    return supportTeam.find((agent) =>
      agent.specialties.includes(formData.category)
    );
  };

  const recommendedAgent = getRecommendedAgent();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Enhanced Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-violet-600 to-purple-600 p-8 shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <div className="flex items-center space-x-3 mb-4">
              {onBack && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onBack}
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                <Send className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white">
                Create New Support Ticket
              </h1>
            </div>
            <p className="text-purple-100 text-lg">
              Create a ticket on behalf of a customer or for internal platform
              issues
            </p>
          </div>
        </div>

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Ticket Type Selection */}
          <Card className="border-0 shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-purple-50 via-violet-50 to-purple-50 border-b border-purple-200/50 px-6 py-4">
              <CardHeader className="p-0">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-500 rounded-lg">
                    <HelpCircle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Ticket Type</CardTitle>
                    <CardDescription className="mt-1">
                      Select whether this is a customer support request or an
                      internal platform issue
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </div>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div
                  className={`p-6 border-2 rounded-lg cursor-pointer transition-all hover:shadow-lg ${
                    ticketType === "customer"
                      ? "border-purple-500 bg-gradient-to-br from-purple-50 to-violet-50 shadow-md"
                      : "border-gray-200 hover:border-purple-300 bg-white"
                  }`}
                  onClick={() => setTicketType("customer")}
                >
                  <div className="flex items-start space-x-3">
                    <div
                      className={`p-3 rounded-lg ${
                        ticketType === "customer"
                          ? "bg-gradient-to-br from-purple-500 to-violet-500"
                          : "bg-gray-100"
                      }`}
                    >
                      <UserCircle
                        className={`h-6 w-6 ${
                          ticketType === "customer"
                            ? "text-white"
                            : "text-gray-400"
                        }`}
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        Customer Support Request
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Ticket created on behalf of a customer who contacted
                        support via phone, email, or chat
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  className={`p-6 border-2 rounded-lg cursor-pointer transition-all hover:shadow-lg ${
                    ticketType === "internal"
                      ? "border-purple-500 bg-gradient-to-br from-purple-50 to-violet-50 shadow-md"
                      : "border-gray-200 hover:border-purple-300 bg-white"
                  }`}
                  onClick={() => setTicketType("internal")}
                >
                  <div className="flex items-start space-x-3">
                    <div
                      className={`p-3 rounded-lg ${
                        ticketType === "internal"
                          ? "bg-gradient-to-br from-purple-500 to-violet-500"
                          : "bg-gray-100"
                      }`}
                    >
                      <Shield
                        className={`h-6 w-6 ${
                          ticketType === "internal"
                            ? "text-white"
                            : "text-gray-400"
                        }`}
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        Internal Platform Issue
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Track platform bugs, technical issues, or internal
                        improvement tasks
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Information (Only for Customer Type) */}
          {ticketType === "customer" && (
            <Card className="border-0 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border-b border-blue-200/50 px-6 py-4">
                <CardHeader className="p-0">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg">
                      <UserCircle className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        Customer Information
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Select the customer this ticket is for
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </div>
              <CardContent className="p-6 space-y-4">
                <div>
                  <Label
                    htmlFor="customer"
                    className="text-gray-700 font-medium"
                  >
                    Customer / Organization *
                  </Label>
                  <Select
                    value={formData.customer}
                    onValueChange={handleCustomerChange}
                  >
                    <SelectTrigger
                      id="customer"
                      className={`mt-2 ${
                        errors.customer
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                          : "focus:border-blue-500 focus:ring-blue-500"
                      }`}
                    >
                      <SelectValue placeholder="Select a customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          <div className="flex flex-col">
                            <span>{customer.name}</span>
                            <span className="text-xs text-gray-500">
                              {customer.email}
                            </span>
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
          <Card className="border-0 shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 border-b border-green-200/50 px-6 py-4">
              <CardHeader className="p-0">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Ticket Details</CardTitle>
                    <CardDescription className="mt-1">
                      Provide detailed information about the issue
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </div>
            <CardContent className="p-6 space-y-4">
              {/* Title */}
              <div>
                <Label htmlFor="title" className="text-gray-700 font-medium">
                  Issue Title *
                </Label>
                <Input
                  id="title"
                  placeholder="Brief, descriptive title of the issue"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  className={`mt-2 ${
                    errors.title
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : "focus:border-green-500 focus:ring-green-500"
                  }`}
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
                  <Label
                    htmlFor="category"
                    className="text-gray-700 font-medium"
                  >
                    Category *
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      handleInputChange("category", value)
                    }
                  >
                    <SelectTrigger
                      id="category"
                      className={`mt-2 ${
                        errors.category
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                          : "focus:border-green-500 focus:ring-green-500"
                      }`}
                    >
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => {
                        const Icon = category.icon;
                        return (
                          <SelectItem
                            key={category.value}
                            value={category.value}
                          >
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
                  <Label
                    htmlFor="priority"
                    className="text-gray-700 font-medium"
                  >
                    Priority Level *
                  </Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) =>
                      handleInputChange("priority", value)
                    }
                  >
                    <SelectTrigger
                      id="priority"
                      className="mt-2 focus:border-green-500 focus:ring-green-500"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorities.map((priority) => (
                        <SelectItem key={priority.value} value={priority.value}>
                          <div className="flex items-center space-x-2">
                            <div
                              className={`h-2 w-2 rounded-full ${priority.color}`}
                            ></div>
                            <div className="flex flex-col">
                              <span>{priority.label}</span>
                              <span className="text-xs text-gray-500">
                                {priority.description}
                              </span>
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
                <Label
                  htmlFor="description"
                  className="text-gray-700 font-medium"
                >
                  Detailed Description *
                </Label>
                <Textarea
                  id="description"
                  placeholder="Provide detailed information about the issue including:&#10;- What happened?&#10;- Steps to reproduce&#10;- Expected vs actual behavior&#10;- Error messages (if any)&#10;- Impact on operations"
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  rows={8}
                  className={`mt-2 ${
                    errors.description
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : "focus:border-green-500 focus:ring-green-500"
                  }`}
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
                <Label htmlFor="tags" className="text-gray-700 font-medium">
                  Tags (Optional)
                </Label>
                <Input
                  id="tags"
                  placeholder="e.g. payment-gateway, urgent, mobile-bug (comma separated)"
                  value={formData.tags}
                  onChange={(e) => handleInputChange("tags", e.target.value)}
                  className="mt-2 focus:border-green-500 focus:ring-green-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Add relevant tags to help categorize and search for this
                  ticket
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Assignment */}
          <Card className="border-0 shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 border-b border-orange-200/50 px-6 py-4">
              <CardHeader className="p-0">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Assignment</CardTitle>
                    <CardDescription className="mt-1">
                      Assign this ticket to a support team member or use
                      auto-assignment
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </div>
            <CardContent className="p-6 space-y-4">
              <div>
                <Label htmlFor="assignTo" className="text-gray-700 font-medium">
                  Assign To
                </Label>
                <Select
                  value={formData.assignedTo}
                  onValueChange={(value) =>
                    handleInputChange("assignedTo", value)
                  }
                >
                  <SelectTrigger
                    id="assignTo"
                    className="mt-2 focus:border-orange-500 focus:ring-orange-500"
                  >
                    <SelectValue placeholder="Auto-assign based on category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span>Auto-assign based on category</span>
                      </div>
                    </SelectItem>
                    {supportTeam.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        <div className="flex flex-col">
                          <span>{agent.name}</span>
                          <span className="text-xs text-gray-500">
                            {agent.role}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {recommendedAgent &&
                (formData.assignedTo === "auto" || !formData.assignedTo) && (
                  <Alert className="bg-blue-50 border-blue-200">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription>
                      <span className="font-semibold text-blue-900">
                        Recommended:{" "}
                      </span>
                      <span className="text-blue-800">
                        {recommendedAgent.name} ({recommendedAgent.role}) -
                        Specializes in {formData.category.replace("-", " ")}
                      </span>
                    </AlertDescription>
                  </Alert>
                )}
            </CardContent>
          </Card>

          {/* Attachments */}
          <Card className="border-0 shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-purple-50 via-violet-50 to-purple-50 border-b border-purple-200/50 px-6 py-4">
              <CardHeader className="p-0">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-500 rounded-lg">
                    <Paperclip className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Attachments</CardTitle>
                    <CardDescription className="mt-1">
                      Upload screenshots, logs, or other relevant files
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </div>
            <CardContent className="p-6 space-y-4">
              <div>
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 hover:bg-purple-50/50 transition-all duration-200">
                    <div className="p-3 bg-gradient-to-br from-purple-500 to-violet-500 rounded-lg w-fit mx-auto mb-3">
                      <Paperclip className="h-6 w-6 text-white" />
                    </div>
                    <p className="text-sm font-medium text-gray-700">
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
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
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
          <Card className="border-0 shadow-xl overflow-hidden">
            <CardContent className="p-6 bg-gradient-to-r from-gray-50 to-purple-50/30">
              <div className="flex justify-between items-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSaveDraft}
                  disabled={isSubmitting}
                  className="border-purple-200 text-purple-700 hover:bg-purple-50"
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
                      className="border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white shadow-lg"
                  >
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
