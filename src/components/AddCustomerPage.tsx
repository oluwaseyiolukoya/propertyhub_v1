import React, { useState, useEffect, useRef } from 'react';
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
import { DeveloperCustomerForm } from './admin/DeveloperCustomerForm';
import { PropertyCustomerForm } from './admin/PropertyCustomerForm';
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
  const [sendingInvitation, setSendingInvitation] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [invitationLink, setInvitationLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [existingCustomerInfo, setExistingCustomerInfo] = useState<any>(null);
  const [subscriptionPlans, setSubscriptionPlans] = useState<any[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  // Use ref for synchronous duplicate prevention (state updates are async)
  const isSubmittingRef = useRef(false);

  // Major countries list
  const countries = [
    "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
    "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia",
    "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi",
    "Cambodia", "Cameroon", "Canada", "Cape Verde", "Central African Republic", "Chad", "Chile", "China", "Colombia",
    "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic",
    "Denmark", "Djibouti", "Dominica", "Dominican Republic",
    "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia",
    "Fiji", "Finland", "France",
    "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana",
    "Haiti", "Honduras", "Hungary",
    "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Ivory Coast",
    "Jamaica", "Japan", "Jordan",
    "Kazakhstan", "Kenya", "Kiribati", "Kosovo", "Kuwait", "Kyrgyzstan",
    "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg",
    "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius",
    "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar",
    "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway",
    "Oman",
    "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal",
    "Qatar",
    "Romania", "Russia", "Rwanda",
    "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe",
    "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands",
    "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria",
    "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey",
    "Turkmenistan", "Tuvalu",
    "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan",
    "Vanuatu", "Vatican City", "Venezuela", "Vietnam",
    "Yemen",
    "Zambia", "Zimbabwe"
  ];

  const [newCustomer, setNewCustomer] = useState({
    company: '',
    owner: '',
    email: '',
    phone: '',
    website: '',
    taxId: '',
    industry: '',
    companySize: '',
    customerType: '', // 'property' | 'developer'
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
    notes: '',
    // Developer-specific fields
    firstName: '',
    lastName: '',
    developmentCompany: '',
    companyRegistration: '',
    yearsInDevelopment: '',
    developmentType: '',
    projectsCompleted: '',
    projectsOngoing: '',
    totalProjectValue: '',
    averageProjectSize: '',
    developmentLicense: '',
    licenseNumber: '',
    specialization: '',
    primaryMarket: '',
    fundingSource: '',
    teamSize: '',
    hasArchitect: '',
    hasEngineer: '',
    // Property-specific fields
    businessType: '',
    numberOfProperties: '',
    totalUnits: '',
    portfolioValue: '',
    managementStyle: '',
    primaryGoal: '',
    currentSoftware: '',
    hearAboutUs: '',
    subscribeToNewsletter: false
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
            category: plan.category || null, // Keep null if not set, don't default
            price: plan.monthlyPrice,
            annualPrice: plan.annualPrice,
            currency: plan.currency || 'USD',
            features: Array.isArray(plan.features) ? plan.features : [],
            popular: plan.isPopular || false,
            isActive: plan.isActive !== false,
            propertyLimit: plan.propertyLimit,
            projectLimit: plan.projectLimit,
            userLimit: plan.userLimit,
            storageLimit: plan.storageLimit
          }));

        console.log('[AddCustomerPage] Loaded plans:', transformedPlans.length);
        console.log('[AddCustomerPage] Plans with categories:', transformedPlans.map(p => ({ name: p.name, category: p.category })));
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

  // Filter plans based on customer type
  const filteredPlans = subscriptionPlans.filter(plan => {
    if (!newCustomer.customerType) return true; // Show all if no type selected

    // If plan doesn't have a category, show it for all customer types (backward compatibility)
    if (!plan.category || plan.category === null) {
      console.log(`[AddCustomerPage] Plan "${plan.name}" has no category, showing for all types`);
      return true;
    }

    if (newCustomer.customerType === 'developer') {
      return plan.category === 'development';
    } else {
      // property_owner and property_manager see property_management plans
      return plan.category === 'property_management';
    }
  });

  console.log(`[AddCustomerPage] Customer type: ${newCustomer.customerType}, Filtered plans: ${filteredPlans.length}`);

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
    console.log('🎯 handleSendInvitation called, ref status:', isSubmittingRef.current);

    // Prevent duplicate submissions using ref (synchronous check)
    if (isSubmittingRef.current) {
      console.log('⚠️ Submission already in progress, ignoring duplicate call');
      return;
    }

    // Set ref immediately (synchronous) to block any subsequent calls
    isSubmittingRef.current = true;
    console.log('🔒 Ref locked, proceeding with submission');

    try {
      setIsSubmitting(true);
      setSendingInvitation(true);

      // Map customer type to backend format
      const mappedCustomerType = newCustomer.customerType === 'developer'
        ? 'property_developer'
        : 'property_owner';

      // Prepare customer data based on customer type
      const customerData: any = {
        // Common fields
        email: newCustomer.email,
        phone: newCustomer.phone,
        customerType: mappedCustomerType,
        plan: newCustomer.plan,
        billingCycle: newCustomer.billingCycle,
        status: 'trial',
        city: newCustomer.city,
        state: newCustomer.state,
        zipCode: newCustomer.zipCode,
        country: newCustomer.country,
        propertyLimit: parseInt(newCustomer.propertyLimit) || 5,
        userLimit: parseInt(newCustomer.userLimit) || 3,
        storageLimit: parseInt(newCustomer.storageLimit) || 1000,
        properties: parseInt(newCustomer.properties) || 0,
        sendInvitation: true,
        temporaryPassword: temporaryPassword
      };

      // Add customer type specific fields
      if (newCustomer.customerType === 'developer') {
        customerData.company = newCustomer.developmentCompany;
        customerData.owner = `${newCustomer.firstName} ${newCustomer.lastName}`;
        customerData.firstName = newCustomer.firstName;
        customerData.lastName = newCustomer.lastName;
        customerData.developmentCompany = newCustomer.developmentCompany;
        customerData.companyRegistration = newCustomer.companyRegistration;
        customerData.yearsInDevelopment = newCustomer.yearsInDevelopment;
        customerData.developmentType = newCustomer.developmentType;
        customerData.projectsCompleted = newCustomer.projectsCompleted;
        customerData.projectsOngoing = newCustomer.projectsOngoing;
        customerData.totalProjectValue = newCustomer.totalProjectValue;
        customerData.averageProjectSize = newCustomer.averageProjectSize;
        customerData.developmentLicense = newCustomer.developmentLicense;
        customerData.licenseNumber = newCustomer.licenseNumber;
        customerData.specialization = newCustomer.specialization;
        customerData.primaryMarket = newCustomer.primaryMarket;
        customerData.fundingSource = newCustomer.fundingSource;
        customerData.teamSize = newCustomer.teamSize;
        customerData.hasArchitect = newCustomer.hasArchitect;
        customerData.hasEngineer = newCustomer.hasEngineer;
      } else {
        customerData.company = newCustomer.company;
        customerData.owner = `${newCustomer.firstName} ${newCustomer.lastName}`;
        customerData.firstName = newCustomer.firstName;
        customerData.lastName = newCustomer.lastName;
        customerData.businessType = newCustomer.businessType;
        customerData.numberOfProperties = newCustomer.numberOfProperties;
        customerData.totalUnits = newCustomer.totalUnits;
        customerData.portfolioValue = newCustomer.portfolioValue;
        customerData.managementStyle = newCustomer.managementStyle;
        customerData.primaryGoal = newCustomer.primaryGoal;
        customerData.currentSoftware = newCustomer.currentSoftware;
      }

      // Validate required fields before API call
      if (!customerData.company || !customerData.owner || !customerData.email) {
        console.error('❌ Missing required fields:', {
          company: customerData.company,
          owner: customerData.owner,
          email: customerData.email,
          firstName: newCustomer.firstName,
          lastName: newCustomer.lastName,
          developmentCompany: newCustomer.developmentCompany,
          customerType: newCustomer.customerType
        });
        toast.error('Missing required fields: company, owner, or email');
        setIsSubmitting(false);
        setSendingInvitation(false);
        isSubmittingRef.current = false; // Reset ref
        return;
      }

      const requestId = `REQ-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      console.log(`🚀 [${requestId}] Starting customer creation request`);
      console.log(`✅ [${requestId}] Sending customer data:`, {
        company: customerData.company,
        owner: customerData.owner,
        email: customerData.email,
        customerType: customerData.customerType,
        plan: customerData.plan,
        billingCycle: customerData.billingCycle
      });

      console.log(`📦 [${requestId}] Full payload:`, JSON.stringify(customerData, null, 2));

      // Call the API to create the customer
      const response = await createCustomer(customerData);

      console.log(`📥 [${requestId}] Received response:`, response.error ? 'ERROR' : 'SUCCESS');

      if (response.error) {
        console.log(`❌ [${requestId}] Error response:`, response.error);

        // Check if it's a duplicate email error
        if (response.error.error === 'Email already exists' && response.error.existingCustomer) {
          console.log(`⚠️ [${requestId}] Duplicate email detected:`, {
            email: newCustomer.email,
            existingCustomer: response.error.existingCustomer
          });

          // Check if the existing customer was just created (within last 5 seconds)
          const existingCustomer = response.error.existingCustomer;
          if (existingCustomer && existingCustomer.id) {
            console.log(`✅ [${requestId}] Customer already exists, treating as success`);
            toast.success('Customer created successfully! Invitation email sent.');
            setIsSubmitting(false);
            setSendingInvitation(false);
            isSubmittingRef.current = false; // Reset ref

            // Redirect to customer management with the existing customer
            onSave(existingCustomer);
            return;
          }

          // Otherwise, show duplicate dialog
          setExistingCustomerInfo(response.error.existingCustomer);
          setShowDuplicateDialog(true);
          setIsSubmitting(false);
          setSendingInvitation(false);
          isSubmittingRef.current = false; // Reset ref
          return;
        }

        toast.error(response.error.error || 'Failed to create customer');
        setIsSubmitting(false);
        setSendingInvitation(false);
        isSubmittingRef.current = false; // Reset ref
        return;
      }

      // Success! Redirect to customer management
      toast.success('Customer created successfully! Invitation email sent.');
      setIsSubmitting(false);
      setSendingInvitation(false);
      isSubmittingRef.current = false; // Reset ref

      // Call onSave to trigger refresh and return to customer management
      if (response.data) {
        onSave(response.data);
      } else {
        // Fallback: just go back to customer management
        onBack();
      }
    } catch (error) {
      console.error('Error creating customer:', error);
      toast.error('Failed to create customer');
      setIsSubmitting(false);
      setSendingInvitation(false);
      isSubmittingRef.current = false; // Reset ref
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
    // Check common required fields
    const hasEmail = !!newCustomer.email;
    const hasPlan = !!newCustomer.plan;
    const hasName = !!newCustomer.firstName && !!newCustomer.lastName;

    // Check customer type specific fields
    if (newCustomer.customerType === 'developer') {
      const hasCompany = !!newCustomer.developmentCompany;
      return hasEmail && hasPlan && hasName && hasCompany;
    } else if (newCustomer.customerType === 'property') {
      const hasCompany = !!newCustomer.company;
      return hasEmail && hasPlan && hasName && hasCompany;
    }

    // Fallback for old form structure (if any)
    return newCustomer.company && newCustomer.owner && newCustomer.email && newCustomer.plan;
  };

  const emailTemplate = `
Subject: Welcome to Contrezz - Your Account is Ready!

Dear ${newCustomer.firstName} ${newCustomer.lastName},

Welcome to Contrezz! Your account has been successfully created and is ready to use.

ACCOUNT DETAILS:
• Company: ${newCustomer.company || newCustomer.developmentCompany}
• Plan: ${newCustomer.plan}
• Email: ${newCustomer.email}
• Temporary Password: ${temporaryPassword}

GETTING STARTED:
1. Click the link below to access your dashboard
2. Use the temporary password provided above
3. You'll be prompted to create a new password on first login

${invitationLink}

WHAT'S NEXT:
${newCustomer.customerType === 'developer'
  ? '• Set up your development projects\n• Invite your team members\n• Start managing your projects and timelines'
  : '• Complete your property setup\n• Invite your team members\n• Start managing your properties and tenants'}

Need help? Our support team is available 24/7 at support@contrezz.com

Best regards,
The Contrezz Team

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
                Create a new customer account for the Contrezz platform. The customer will receive an invitation email with login credentials.
              </p>
            </div>

            {/* Customer Type Selector */}
            <Card className="border-2 border-blue-200 bg-blue-50/50">
              <CardHeader>
                <CardTitle className="text-lg">Select Customer Type</CardTitle>
                <CardDescription>
                  Choose the type of customer to display the appropriate form fields
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    type="button"
                    variant={newCustomer.customerType === 'property' ? 'default' : 'outline'}
                    className="h-24 flex flex-col items-center justify-center space-y-2"
                    onClick={() => setNewCustomer({ ...newCustomer, customerType: 'property' })}
                  >
                    <Building className="h-8 w-8" />
                    <div className="text-center">
                      <div className="font-semibold">Property Owner/Manager</div>
                      <div className="text-xs opacity-80">Manage properties and tenants</div>
                    </div>
                  </Button>
                  <Button
                    type="button"
                    variant={newCustomer.customerType === 'developer' ? 'default' : 'outline'}
                    className="h-24 flex flex-col items-center justify-center space-y-2"
                    onClick={() => setNewCustomer({ ...newCustomer, customerType: 'developer' })}
                  >
                    <Building className="h-8 w-8" />
                    <div className="text-center">
                      <div className="font-semibold">Property Developer</div>
                      <div className="text-xs opacity-80">Manage development projects</div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Show form only after customer type is selected */}
            {!newCustomer.customerType && (
              <Card className="border-yellow-200 bg-yellow-50/50">
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2 text-yellow-800">
                    <AlertCircle className="h-5 w-5" />
                    <p>Please select a customer type above to continue</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {newCustomer.customerType && (
              <>
              {/* Render appropriate form based on customer type */}
              {newCustomer.customerType === 'developer' ? (
                <DeveloperCustomerForm
                  formData={{
                    firstName: newCustomer.firstName,
                    lastName: newCustomer.lastName,
                    email: newCustomer.email,
                    phone: newCustomer.phone,
                    developmentCompany: newCustomer.developmentCompany,
                    companyRegistration: newCustomer.companyRegistration,
                    yearsInDevelopment: newCustomer.yearsInDevelopment,
                    developmentType: newCustomer.developmentType,
                    projectsCompleted: newCustomer.projectsCompleted,
                    projectsOngoing: newCustomer.projectsOngoing,
                    totalProjectValue: newCustomer.totalProjectValue,
                    averageProjectSize: newCustomer.averageProjectSize,
                    developmentLicense: newCustomer.developmentLicense,
                    licenseNumber: newCustomer.licenseNumber,
                    specialization: newCustomer.specialization,
                    primaryMarket: newCustomer.primaryMarket,
                    fundingSource: newCustomer.fundingSource,
                    teamSize: newCustomer.teamSize,
                    hasArchitect: newCustomer.hasArchitect,
                    hasEngineer: newCustomer.hasEngineer,
                    city: newCustomer.city,
                    state: newCustomer.state,
                    country: newCustomer.country,
                    zipCode: newCustomer.zipCode,
                    hearAboutUs: newCustomer.hearAboutUs,
                    subscribeToNewsletter: newCustomer.subscribeToNewsletter
                  }}
                  onChange={(field, value) => setNewCustomer({...newCustomer, [field]: value})}
                />
              ) : (
                <PropertyCustomerForm
                  formData={{
                    firstName: newCustomer.firstName,
                    lastName: newCustomer.lastName,
                    email: newCustomer.email,
                    phone: newCustomer.phone,
                    companyName: newCustomer.company,
                    businessType: newCustomer.businessType,
                    numberOfProperties: newCustomer.numberOfProperties,
                    totalUnits: newCustomer.totalUnits,
                    portfolioValue: newCustomer.portfolioValue,
                    managementStyle: newCustomer.managementStyle,
                    primaryGoal: newCustomer.primaryGoal,
                    currentSoftware: newCustomer.currentSoftware,
                    city: newCustomer.city,
                    state: newCustomer.state,
                    country: newCustomer.country,
                    zipCode: newCustomer.zipCode,
                    hearAboutUs: newCustomer.hearAboutUs,
                    subscribeToNewsletter: newCustomer.subscribeToNewsletter
                  }}
                  onChange={(field, value) => {
                    // Map companyName to company for backend compatibility
                    if (field === 'companyName') {
                      setNewCustomer({...newCustomer, company: value});
                    } else {
                      setNewCustomer({...newCustomer, [field]: value});
                    }
                  }}
                />
              )}

              {/* Plan Selection Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
                <div className="lg:col-span-2">
                  {/* Subscription Plan Selection */}
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
                      {!newCustomer.customerType && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                          <p className="text-sm text-blue-800 flex items-center gap-2">
                            <Info className="h-4 w-4" />
                            Please select a customer type first to see available plans
                          </p>
                        </div>
                      )}

                      <div>
                        <Label htmlFor="plan">Select Plan *</Label>
                        <Select
                          value={newCustomer.plan}
                          onValueChange={(value) => {
                            const plan = subscriptionPlans.find(p => p.name === value);
                            if (plan) {
                              // Set appropriate limits based on plan category
                              const updates: any = {
                                plan: value,
                                userLimit: plan.userLimit?.toString() || '3',
                                storageLimit: plan.storageLimit?.toString() || '1000',
                              };

                              if (plan.category === 'property_management') {
                                updates.propertyLimit = plan.propertyLimit?.toString() || '5';
                                updates.properties = plan.propertyLimit?.toString() || '';
                              } else if (plan.category === 'development') {
                                // For developers, we use propertyLimit field to store projectLimit value
                                // This is because the form field is reused for both
                                updates.propertyLimit = plan.projectLimit?.toString() || '3';
                                updates.properties = plan.projectLimit?.toString() || '3';
                              }

                              setNewCustomer({
                                ...newCustomer,
                                ...updates
                              });
                            } else {
                              setNewCustomer({...newCustomer, plan: value});
                            }
                          }}
                          required
                          disabled={loadingPlans || !newCustomer.customerType}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={
                              loadingPlans ? "Loading plans..." :
                              !newCustomer.customerType ? "Select customer type first" :
                              "Choose a subscription plan"
                            } />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredPlans.length === 0 ? (
                              <div className="p-2 text-sm text-gray-500">No plans available</div>
                            ) : (
                              filteredPlans.map((plan) => (
                                <SelectItem key={plan.id || plan.name} value={plan.name}>
                                  <div className="flex items-center gap-2">
                                    <span>{plan.name}</span>
                                    <span className="text-sm text-gray-500">{formatCurrency(plan.price, plan.currency)}/mo</span>
                                    {plan.popular && <Badge variant="secondary" className="text-xs">Popular</Badge>}
                                  </div>
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        {newCustomer.customerType && (
                          <p className="text-xs text-gray-500 mt-1">
                            {newCustomer.customerType === 'developer'
                              ? 'Showing development plans (based on projects)'
                              : 'Showing property management plans (based on properties)'}
                          </p>
                        )}
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
                              <Label htmlFor="propertyLimit">
                                {newCustomer.customerType === 'developer'
                                  ? 'Project Limit'
                                  : 'Property Limit'}
                              </Label>
                              <Input
                                id="propertyLimit"
                                type="number"
                                placeholder="Auto-filled from plan"
                                value={newCustomer.propertyLimit}
                                readOnly
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                {newCustomer.customerType === 'developer'
                                  ? 'Automatically set based on selected development plan'
                                  : 'Automatically set based on selected property management plan'}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="userLimit">User Limit</Label>
                              <Input
                                id="userLimit"
                                type="number"
                                placeholder="Auto-filled from plan"
                                value={newCustomer.userLimit}
                                readOnly
                              />
                            </div>
                            <div>
                              <Label htmlFor="storageLimit">Storage Limit (MB)</Label>
                              <Input
                                id="storageLimit"
                                type="number"
                                placeholder="Auto-filled from plan"
                                value={newCustomer.storageLimit}
                                readOnly
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Sidebar */}
                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Plan Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {newCustomer.plan ? (
                        <>
                          <div>
                            <p className="text-sm text-gray-500">Selected Plan</p>
                            <p className="font-semibold">{newCustomer.plan}</p>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">{newCustomer.customerType === 'developer' ? 'Projects' : 'Properties'}:</span>
                              <span className="font-medium">{newCustomer.propertyLimit}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Users:</span>
                              <span className="font-medium">{newCustomer.userLimit}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Storage:</span>
                              <span className="font-medium">{newCustomer.storageLimit} MB</span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-gray-500">Select a plan to see details</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline" onClick={onBack}>Cancel</Button>
                <Button onClick={handleCreateCustomer} disabled={!isFormValid()} className="min-w-[200px]">
                  Continue to Invitation
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </>
          )}
      </TabsContent>

      {/* Step 2: Send Invitation */}
      <TabsContent value="invitation" className="space-y-6 mt-6">
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => setCurrentTab('information')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Form
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Send Invitation</CardTitle>
              <CardDescription>
                Customer account created successfully. Send login credentials to {newCustomer.email}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Customer Summary */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Company</p>
                  <p className="font-medium">{newCustomer.company || newCustomer.developmentCompany}</p>
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

              {/* Temporary Password */}
              <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-semibold text-blue-900">Temporary Password</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(temporaryPassword, 'password')}
                    className="h-8"
                  >
                    {copiedPassword ? (
                      <>
                        <Check className="h-3 w-3 mr-1" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <div className="p-3 bg-white rounded border border-blue-300 font-mono text-lg font-semibold text-blue-900">
                  {temporaryPassword}
                </div>
                <p className="text-xs text-blue-700 mt-2">
                  Customer will be required to change this password on first login
                </p>
              </div>

              {/* Email Preview */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Mail className="h-4 w-4 text-gray-600" />
                  <Label className="text-sm font-semibold">Email Preview</Label>
                </div>
                <div className="bg-gray-50 rounded border p-4 max-h-96 overflow-y-auto">
                  <pre className="text-sm whitespace-pre-wrap font-sans text-gray-800">
                    {emailTemplate}
                  </pre>
                </div>
              </div>

              {/* Send Invitation Button */}
              <Button
                type="button"
                onClick={handleSendInvitation}
                disabled={sendingInvitation || isSubmitting}
                className="w-full"
              >
                {sendingInvitation ? (
                  <>Sending Invitation...</>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Invitation Email
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AddCustomerPage;
