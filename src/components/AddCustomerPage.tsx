import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { toast } from "sonner";
import { createCustomer, getBillingPlans } from '../lib/api';
import { useCurrency } from '../lib/CurrencyContext';
import { on as onSocketEvent, off as offSocketEvent } from '../lib/socket';
import { 
  ArrowLeft, 
  Building, 
  CreditCard, 
  Check,
  DollarSign,
  Mail,
  CheckCircle,
  Send,
  Copy,
  User,
  Eye,
  ArrowRight,
  Info,
  AlertCircle,
  Edit,
  X
} from 'lucide-react';

interface AddCustomerPageProps {
  onBack: () => void;
  onSave: (customerData: any) => void;
  onEditExisting: (customerId: string) => void;
  user: any;
}

export function AddCustomerPage({ onBack, onSave, onEditExisting, user }: AddCustomerPageProps) {
  const { formatCurrency } = useCurrency();
  const [currentTab, setCurrentTab] = useState<'information' | 'invitation' | 'confirmation'>('information');
  const [emailSent, setEmailSent] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [invitationLink, setInvitationLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [existingCustomerInfo, setExistingCustomerInfo] = useState<any>(null);
  const [subscriptionPlans, setSubscriptionPlans] = useState<any[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  
  const [newCustomer, setNewCustomer] = useState({
    company: '',
    owner: '',
    email: '',
    phone: '',
    website: '',
    taxId: '',
    industry: '',
    companySize: '',
    plan: '',
    billingCycle: 'monthly',
    properties: '',
    units: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Nigeria',
    propertyLimit: '5',
    userLimit: '3',
    storageLimit: '1000',
    notes: ''
  });

  // Fetch available plans from API
  const refreshPlans = async () => {
    try {
      setLoadingPlans(true);
      const response = await getBillingPlans();
      
      if (response.error) {
        toast.error('Failed to load subscription plans');
      } else if (response.data) {
        // Show all plans; inactive ones can still be selected if needed
        const transformedPlans = response.data
          .map((plan: any) => ({
            id: plan.id,
            name: plan.name,
            price: plan.monthlyPrice,
            annualPrice: plan.annualPrice,
            currency: plan.currency || 'USD',
            features: Array.isArray(plan.features) ? plan.features : [],
            popular: plan.isPopular || false,
            isActive: plan.isActive !== false,
            propertyLimit: plan.propertyLimit,
            userLimit: plan.userLimit,
            storageLimit: plan.storageLimit
          }));
        setSubscriptionPlans(transformedPlans);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast.error('Failed to load subscription plans');
    } finally {
      setLoadingPlans(false);
    }
  };

  useEffect(() => {
    refreshPlans();
  }, []);

  // Real-time update: refresh plans when plans change
  useEffect(() => {
    const handlePlanChange = () => refreshPlans();
    try {
      onSocketEvent('plan:created', handlePlanChange);
      onSocketEvent('plan:updated', handlePlanChange);
      onSocketEvent('plan:deleted', handlePlanChange);
    } catch {}

    return () => {
      try {
        offSocketEvent('plan:created', handlePlanChange);
        offSocketEvent('plan:updated', handlePlanChange);
        offSocketEvent('plan:deleted', handlePlanChange);
      } catch {}
    };
  }, []);

  const selectedPlan = subscriptionPlans.find(plan => plan.name === newCustomer.plan);

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const generateInvitationLink = (email: string) => {
    const token = 'inv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
    const baseUrl = window.location.origin;
    return `${baseUrl}/?invitation=${token}&email=${encodeURIComponent(email)}`;
  };

  const handleCreateCustomer = () => {
    // Generate credentials
    const password = generatePassword();
    const link = generateInvitationLink(newCustomer.email);
    
    setTemporaryPassword(password);
    setInvitationLink(link);
    
    // Move to invitation tab
    setCurrentTab('invitation');
  };

  const handleSendInvitation = async () => {
    try {
      setIsSubmitting(true);

      // Call the API to create the customer FIRST
      const response = await createCustomer({
        company: newCustomer.company,
        owner: newCustomer.owner,
        email: newCustomer.email,
        phone: newCustomer.phone,
        website: newCustomer.website,
        taxId: newCustomer.taxId,
        industry: newCustomer.industry,
        companySize: newCustomer.companySize,
        plan: newCustomer.plan, // Send plan name - backend will handle lookup
        billingCycle: newCustomer.billingCycle,
        status: 'trial',
        street: newCustomer.street,
        city: newCustomer.city,
        state: newCustomer.state,
        zipCode: newCustomer.zipCode,
        country: newCustomer.country,
        propertyLimit: parseInt(newCustomer.propertyLimit) || 5,
        userLimit: parseInt(newCustomer.userLimit) || 3,
        storageLimit: parseInt(newCustomer.storageLimit) || 1000,
        properties: parseInt(newCustomer.properties) || 0, // Add properties count
        units: parseInt(newCustomer.units) || 0, // Add units count
        notes: newCustomer.notes, // Add notes
        sendInvitation: false // Already handled in the form
      });

      if (response.error) {
        // Check if it's a duplicate email error
        if (response.error.error === 'Email already exists' && response.error.existingCustomer) {
          setExistingCustomerInfo(response.error.existingCustomer);
          setShowDuplicateDialog(true);
          setIsSubmitting(false);
          return;
        }
        
        toast.error(response.error.error || 'Failed to create customer');
        setIsSubmitting(false);
        return;
      }

      // Success! Show confirmation page
      toast.success('Customer created successfully!');
      setEmailSent(true);
      setCurrentTab('confirmation');
      setIsSubmitting(false);
    } catch (error) {
      console.error('Error creating customer:', error);
      toast.error('Failed to create customer');
      setIsSubmitting(false);
    }
  };

  const handleComplete = () => {
    // Just return to dashboard (customer already created in handleSendInvitation)
    onBack();
  };

  const copyToClipboard = (text: string, type: 'password' | 'link') => {
    navigator.clipboard.writeText(text);
    if (type === 'password') {
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 2000);
      toast.success('Password copied to clipboard');
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
      toast.success('Link copied to clipboard');
    }
  };

  const isFormValid = () => {
    return newCustomer.company && 
           newCustomer.owner && 
           newCustomer.email && 
           newCustomer.plan;
  };

  const emailTemplate = `
Subject: Welcome to PropertyHub - Your Account is Ready!

Dear ${newCustomer.owner},

Welcome to PropertyHub! Your account has been successfully created and is ready to use.

ACCOUNT DETAILS:
• Company: ${newCustomer.company}
• Plan: ${newCustomer.plan}
• Email: ${newCustomer.email}
• Temporary Password: ${temporaryPassword}

GETTING STARTED:
1. Click the link below to access your dashboard
2. Use the temporary password provided above
3. You'll be prompted to create a new password on first login

${invitationLink}

WHAT'S NEXT:
• Complete your property setup
• Invite your team members
• Start managing your properties and tenants

Need help? Our support team is available 24/7 at support@propertyhub.com

Best regards,
The PropertyHub Team

---
This is an automated message. Please do not reply to this email.
  `;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={onBack}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Dashboard</span>
              </Button>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-xl font-semibold text-gray-900">Add New Customer</h1>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Logged in as</span>
              <Badge variant="destructive">{user.name}</Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={currentTab} onValueChange={(value) => setCurrentTab(value as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="information" disabled={currentTab === 'confirmation'}>
              <Building className="h-4 w-4 mr-2" />
              Customer Information
            </TabsTrigger>
            <TabsTrigger value="invitation" disabled={!temporaryPassword}>
              <Mail className="h-4 w-4 mr-2" />
              Invitation
            </TabsTrigger>
            <TabsTrigger value="confirmation" disabled={!emailSent}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirmation
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Customer Information */}
          <TabsContent value="information" className="space-y-6 mt-6">
            <div className="mb-6">
              <p className="text-gray-600">
                Create a new customer account for the PropertyHub platform. The customer will receive an invitation email with login credentials.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Company Information */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Building className="h-5 w-5" />
                      <span>Company Information</span>
                    </CardTitle>
                    <CardDescription>
                      Basic information about the customer's company
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="company">Company Name *</Label>
                        <Input
                          id="company"
                          placeholder="e.g., Metro Properties LLC"
                          value={newCustomer.company}
                          onChange={(e) => setNewCustomer({...newCustomer, company: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="owner">Primary Contact *</Label>
                        <Input
                          id="owner"
                          placeholder="e.g., John Smith"
                          value={newCustomer.owner}
                          onChange={(e) => setNewCustomer({...newCustomer, owner: e.target.value})}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="john@metro-properties.com"
                          value={newCustomer.email}
                          onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Login credentials will be sent to this email
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="(555) 123-4567"
                          value={newCustomer.phone}
                          onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          type="url"
                          placeholder="https://example.com"
                          value={newCustomer.website}
                          onChange={(e) => setNewCustomer({...newCustomer, website: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="taxId">Tax ID</Label>
                        <Input
                          id="taxId"
                          placeholder="Tax identification number"
                          value={newCustomer.taxId}
                          onChange={(e) => setNewCustomer({...newCustomer, taxId: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="industry">Industry</Label>
                        <Input
                          id="industry"
                          placeholder="e.g., Real Estate"
                          value={newCustomer.industry}
                          onChange={(e) => setNewCustomer({...newCustomer, industry: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="companySize">Company Size</Label>
                        <Select
                          value={newCustomer.companySize}
                          onValueChange={(value) => setNewCustomer({...newCustomer, companySize: value})}
                        >
                          <SelectTrigger id="companySize">
                            <SelectValue placeholder="Select company size" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1-10">1-10 employees</SelectItem>
                            <SelectItem value="11-50">11-50 employees</SelectItem>
                            <SelectItem value="51-200">51-200 employees</SelectItem>
                            <SelectItem value="201-500">201-500 employees</SelectItem>
                            <SelectItem value="500+">500+ employees</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <h4 className="text-sm font-semibold mb-4">Business Address</h4>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="street">Street Address</Label>
                          <Input
                            id="street"
                            placeholder="123 Main Street"
                            value={newCustomer.street}
                            onChange={(e) => setNewCustomer({...newCustomer, street: e.target.value})}
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="city">City</Label>
                            <Input
                              id="city"
                              placeholder="Lagos"
                              value={newCustomer.city}
                              onChange={(e) => setNewCustomer({...newCustomer, city: e.target.value})}
                            />
                          </div>
                          <div>
                            <Label htmlFor="state">State</Label>
                            <Input
                              id="state"
                              placeholder="Lagos State"
                              value={newCustomer.state}
                              onChange={(e) => setNewCustomer({...newCustomer, state: e.target.value})}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                        <Label htmlFor="zipCode">Postal Code</Label>
                            <Input
                              id="zipCode"
                              placeholder="100001"
                              value={newCustomer.zipCode}
                              onChange={(e) => setNewCustomer({...newCustomer, zipCode: e.target.value})}
                            />
                          </div>
                          <div>
                            <Label htmlFor="country">Country</Label>
                            <Select
                              value={newCustomer.country}
                              onValueChange={(value) => setNewCustomer({ ...newCustomer, country: value })}
                            >
                              <SelectTrigger id="country">
                                <SelectValue placeholder="Select country" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Nigeria">Nigeria</SelectItem>
                                <SelectItem value="Ghana">Ghana</SelectItem>
                                <SelectItem value="Kenya">Kenya</SelectItem>
                                <SelectItem value="South Africa">South Africa</SelectItem>
                                <SelectItem value="United States">United States</SelectItem>
                                <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                                <SelectItem value="Canada">Canada</SelectItem>
                                <SelectItem value="Germany">Germany</SelectItem>
                                <SelectItem value="France">France</SelectItem>
                                <SelectItem value="India">India</SelectItem>
                                <SelectItem value="China">China</SelectItem>
                                <SelectItem value="Brazil">Brazil</SelectItem>
                                <SelectItem value="Mexico">Mexico</SelectItem>
                                <SelectItem value="United Arab Emirates">United Arab Emirates</SelectItem>
                                <SelectItem value="Saudi Arabia">Saudi Arabia</SelectItem>
                                <SelectItem value="Egypt">Egypt</SelectItem>
                                <SelectItem value="Turkey">Turkey</SelectItem>
                                <SelectItem value="Spain">Spain</SelectItem>
                                <SelectItem value="Italy">Italy</SelectItem>
                                <SelectItem value="Netherlands">Netherlands</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="properties">Number of Properties</Label>
                        <Input
                          id="properties"
                          type="number"
                          placeholder="Auto-filled from plan"
                          value={newCustomer.properties}
                          readOnly
                        />
                      </div>
                      <div>
                        <Label htmlFor="units">Total Units</Label>
                        <Input
                          id="units"
                          type="number"
                          placeholder="e.g., 120"
                          value={newCustomer.units}
                          onChange={(e) => setNewCustomer({...newCustomer, units: e.target.value})}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="notes">Additional Notes</Label>
                      <Textarea
                        id="notes"
                        rows={3}
                        placeholder="Any additional information about this customer..."
                        value={newCustomer.notes}
                        onChange={(e) => setNewCustomer({...newCustomer, notes: e.target.value})}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Subscription Plan Selection */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <CreditCard className="h-5 w-5" />
                      <span>Subscription Plan</span>
                    </CardTitle>
                    <CardDescription>
                      Choose the subscription plan for this customer
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="plan">Select Plan *</Label>
                      <Select
                        value={newCustomer.plan}
                        onValueChange={(value) => {
                          const plan = subscriptionPlans.find(p => p.name === value);
                          if (plan) {
                            setNewCustomer({
                              ...newCustomer, 
                              plan: value,
                              propertyLimit: plan.propertyLimit?.toString() || '5',
                              userLimit: plan.userLimit?.toString() || '3',
                              storageLimit: plan.storageLimit?.toString() || '1000',
                              properties: plan.propertyLimit?.toString() || ''
                            });
                          } else {
                            setNewCustomer({...newCustomer, plan: value});
                          }
                        }}
                        required
                        disabled={loadingPlans}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={loadingPlans ? "Loading plans..." : "Choose a subscription plan"} />
                        </SelectTrigger>
                        <SelectContent>
                          {subscriptionPlans.map((plan) => (
                            <SelectItem key={plan.id || plan.name} value={plan.name}>
                              <div className="flex items-center gap-2">
                                <span>{plan.name}</span>
                                <span className="text-sm text-gray-500">{formatCurrency(plan.price, plan.currency)}/mo</span>
                                {plan.popular && <Badge variant="secondary" className="text-xs">Popular</Badge>}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="billingCycle">Billing Cycle</Label>
                      <Select
                        value={newCustomer.billingCycle}
                        onValueChange={(value) => setNewCustomer({...newCustomer, billingCycle: value})}
                      >
                        <SelectTrigger id="billingCycle">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="annual">Annual (Save 15%)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="pt-4 border-t">
                      <h4 className="text-sm font-semibold mb-4">Account Limits</h4>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <Label htmlFor="propertyLimit">Property Limit</Label>
                            <Input
                              id="propertyLimit"
                              type="number"
                              min="1"
                              placeholder="Auto-filled from plan"
                              value={newCustomer.propertyLimit}
                              readOnly
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Maximum number of properties this customer can manage
                            </p>
                          </div>
                          <div>
                            <Label htmlFor="userLimit">User Limit</Label>
                            <Input
                              id="userLimit"
                              type="number"
                              min="1"
                              placeholder="Auto-filled from plan"
                              value={newCustomer.userLimit}
                              readOnly
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Maximum number of users in this account
                            </p>
                          </div>
                          <div>
                            <Label htmlFor="storageLimit">Storage Limit (MB)</Label>
                            <Input
                              id="storageLimit"
                              type="number"
                              min="100"
                              placeholder="Auto-filled from plan"
                              value={newCustomer.storageLimit}
                              readOnly
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Storage space for documents and files (in megabytes)
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Plan Preview */}
                    {selectedPlan && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-medium">{selectedPlan.name} Plan</h4>
                            <div className="flex items-center space-x-2">
                              <DollarSign className="h-4 w-4 text-gray-600" />
                              <span className="text-lg font-semibold">{formatCurrency(selectedPlan.price, selectedPlan.currency)}</span>
                              <span className="text-sm text-gray-600">/month</span>
                            </div>
                          </div>
                          {selectedPlan.popular && (
                            <Badge className="bg-blue-100 text-blue-800">Most Popular</Badge>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-700">Features included:</p>
                          <ul className="space-y-1">
                            {selectedPlan.features.map((feature, index) => (
                              <li key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                                <Check className="h-3 w-3 text-green-600 flex-shrink-0" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateCustomer}
                disabled={!isFormValid()}
                className="min-w-[200px]"
              >
                Continue to Invitation
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </TabsContent>

          {/* Tab 2: Invitation */}
          <TabsContent value="invitation" className="space-y-6 mt-6">
            <div className="mb-6">
              <p className="text-gray-600">
                Review and send the invitation email to the customer with their login credentials.
              </p>
            </div>

            <div className="space-y-6">
              {/* Customer Summary */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Customer Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Company</p>
                      <p className="font-medium">{newCustomer.company}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Contact</p>
                      <p className="font-medium">{newCustomer.owner}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium">{newCustomer.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Plan</p>
                      <Badge variant="secondary">{newCustomer.plan}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Login Credentials */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>Login Credentials</span>
                  </CardTitle>
                  <CardDescription>
                    Temporary credentials for first-time access
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Email Address</p>
                    <div className="p-3 bg-gray-50 rounded border font-mono text-sm">
                      {newCustomer.email}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Temporary Password</p>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 p-3 bg-gray-50 rounded border font-mono text-sm">
                        {temporaryPassword}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(temporaryPassword, 'password')}
                      >
                        {copiedPassword ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Customer will be required to change this password on first login
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Invitation Link</p>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 p-3 bg-gray-50 rounded border font-mono text-sm break-all">
                        {invitationLink}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(invitationLink, 'link')}
                      >
                        {copiedLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Email Preview */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Eye className="h-4 w-4" />
                    <span>Email Preview</span>
                  </CardTitle>
                  <CardDescription>
                    Preview of the invitation email that will be sent
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-gray-50 rounded border">
                    <pre className="text-sm whitespace-pre-wrap text-gray-800">
                      {emailTemplate.trim()}
                    </pre>
                  </div>
                </CardContent>
              </Card>

              {/* Send Email Action */}
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <div className="flex items-center justify-center space-x-2 text-blue-600">
                      <Info className="h-4 w-4" />
                      <span className="text-sm">Ready to send invitation email</span>
                    </div>
                    <Button 
                      onClick={handleSendInvitation} 
                      className="w-full max-w-md"
                      disabled={isSubmitting}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {isSubmitting ? 'Creating Customer...' : 'Send Invitation Email'}
                    </Button>
                    <p className="text-xs text-gray-500">
                      The customer will receive login credentials and setup instructions
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentTab('information')}
              >
                Back to Information
              </Button>
            </div>
          </TabsContent>

          {/* Tab 3: Confirmation */}
          <TabsContent value="confirmation" className="space-y-6 mt-6">
            <Card>
              <CardContent className="pt-8 pb-8">
                <div className="text-center space-y-6 max-w-2xl mx-auto">
                  {/* Success Icon */}
                  <div className="flex justify-center">
                    <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle className="h-12 w-12 text-green-600" />
                    </div>
                  </div>

                  {/* Success Message */}
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      Customer Created Successfully!
                    </h2>
                    <p className="text-gray-600">
                      The customer account has been created and invitation email has been sent.
                    </p>
                  </div>

                  {/* Customer Details */}
                  <Card className="bg-gray-50">
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-2 gap-4 text-left">
                        <div>
                          <p className="text-sm text-gray-600">Company</p>
                          <p className="font-medium">{newCustomer.company}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Contact</p>
                          <p className="font-medium">{newCustomer.owner}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Email</p>
                          <p className="font-medium">{newCustomer.email}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Plan</p>
                          <Badge variant="secondary">{newCustomer.plan}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Confirmation Checklist */}
                  <div className="text-left bg-green-50 border border-green-200 rounded-lg p-6">
                    <h3 className="font-medium text-green-900 mb-3">What happens next:</h3>
                    <div className="space-y-2">
                      <div className="flex items-start space-x-2 text-sm text-green-800">
                        <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>Welcome email delivered to {newCustomer.email}</span>
                      </div>
                      <div className="flex items-start space-x-2 text-sm text-green-800">
                        <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>Login credentials provided</span>
                      </div>
                      <div className="flex items-start space-x-2 text-sm text-green-800">
                        <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>Account activation link included</span>
                      </div>
                      <div className="flex items-start space-x-2 text-sm text-green-800">
                        <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>Customer will be prompted to set new password on first login</span>
                      </div>
                      <div className="flex items-start space-x-2 text-sm text-green-800">
                        <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>Trial period started for {newCustomer.plan} plan</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                    <Button onClick={handleComplete} className="min-w-[200px]">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Return to Dashboard
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Duplicate Email Dialog */}
      <Dialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-amber-600 mb-2">
              <AlertCircle className="h-5 w-5" />
              <DialogTitle>Email Already Exists</DialogTitle>
            </div>
            <DialogDescription>
              A customer with this email address already exists in the system.
            </DialogDescription>
          </DialogHeader>
          
          {existingCustomerInfo && (
            <div className="space-y-4 py-4">
              {/* Existing Customer Info */}
              <Card className="bg-gray-50 border-gray-200">
                <CardContent className="pt-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-600">Company</p>
                      <p className="font-medium">{existingCustomerInfo.company}</p>
                    </div>
                    <Badge variant={existingCustomerInfo.status === 'active' ? 'default' : 'secondary'}>
                      {existingCustomerInfo.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Owner</p>
                    <p className="font-medium">{existingCustomerInfo.owner}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{existingCustomerInfo.email}</p>
                  </div>
                  {existingCustomerInfo.plan && (
                    <div>
                      <p className="text-sm text-gray-600">Current Plan</p>
                      <Badge variant="outline">{existingCustomerInfo.plan}</Badge>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Options */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">What would you like to do?</p>
                <div className="text-xs text-gray-600 bg-blue-50 border border-blue-200 rounded p-3">
                  <Info className="h-4 w-4 inline mr-1" />
                  You can either edit the existing customer's details or change the email address to create a new customer.
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowDuplicateDialog(false);
                setCurrentTab('information'); // Go back to edit email
              }}
              className="w-full sm:w-auto"
            >
              <X className="h-4 w-4 mr-2" />
              Change Email
            </Button>
            <Button 
              onClick={() => {
                setShowDuplicateDialog(false);
                onEditExisting(existingCustomerInfo.id);
              }}
              className="w-full sm:w-auto"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Existing Customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
