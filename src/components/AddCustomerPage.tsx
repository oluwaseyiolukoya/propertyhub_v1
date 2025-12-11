import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { toast } from "sonner";
import { createCustomer, getBillingPlans } from "../lib/api";
import { useCurrency } from "../lib/CurrencyContext";
import { on as onSocketEvent, off as offSocketEvent } from "../lib/socket";
import { DeveloperCustomerForm } from "./admin/DeveloperCustomerForm";
import { PropertyCustomerForm } from "./admin/PropertyCustomerForm";
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
  X,
} from "lucide-react";
import { TRIAL_PLAN_LIMITS } from "../lib/constants/subscriptions";

interface AddCustomerPageProps {
  onBack: () => void;
  onSave: (customerData: any) => void;
  onEditExisting: (customerId: string) => void;
  user: any;
}

export function AddCustomerPage({
  onBack,
  onSave,
  onEditExisting,
  user,
}: AddCustomerPageProps) {
  const { formatCurrency } = useCurrency();
  const [currentTab, setCurrentTab] = useState<
    "information" | "invitation" | "confirmation"
  >("information");
  const [emailSent, setEmailSent] = useState(false);
  const [sendingInvitation, setSendingInvitation] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [invitationLink, setInvitationLink] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [existingCustomerInfo, setExistingCustomerInfo] = useState<any>(null);
  const [subscriptionPlans, setSubscriptionPlans] = useState<any[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  // Use ref for synchronous duplicate prevention (state updates are async)
  const isSubmittingRef = useRef(false);

  // Major countries list
  const countries = [
    "Afghanistan",
    "Albania",
    "Algeria",
    "Andorra",
    "Angola",
    "Argentina",
    "Armenia",
    "Australia",
    "Austria",
    "Azerbaijan",
    "Bahamas",
    "Bahrain",
    "Bangladesh",
    "Barbados",
    "Belarus",
    "Belgium",
    "Belize",
    "Benin",
    "Bhutan",
    "Bolivia",
    "Bosnia and Herzegovina",
    "Botswana",
    "Brazil",
    "Brunei",
    "Bulgaria",
    "Burkina Faso",
    "Burundi",
    "Cambodia",
    "Cameroon",
    "Canada",
    "Cape Verde",
    "Central African Republic",
    "Chad",
    "Chile",
    "China",
    "Colombia",
    "Comoros",
    "Congo",
    "Costa Rica",
    "Croatia",
    "Cuba",
    "Cyprus",
    "Czech Republic",
    "Denmark",
    "Djibouti",
    "Dominica",
    "Dominican Republic",
    "Ecuador",
    "Egypt",
    "El Salvador",
    "Equatorial Guinea",
    "Eritrea",
    "Estonia",
    "Eswatini",
    "Ethiopia",
    "Fiji",
    "Finland",
    "France",
    "Gabon",
    "Gambia",
    "Georgia",
    "Germany",
    "Ghana",
    "Greece",
    "Grenada",
    "Guatemala",
    "Guinea",
    "Guinea-Bissau",
    "Guyana",
    "Haiti",
    "Honduras",
    "Hungary",
    "Iceland",
    "India",
    "Indonesia",
    "Iran",
    "Iraq",
    "Ireland",
    "Israel",
    "Italy",
    "Ivory Coast",
    "Jamaica",
    "Japan",
    "Jordan",
    "Kazakhstan",
    "Kenya",
    "Kiribati",
    "Kosovo",
    "Kuwait",
    "Kyrgyzstan",
    "Laos",
    "Latvia",
    "Lebanon",
    "Lesotho",
    "Liberia",
    "Libya",
    "Liechtenstein",
    "Lithuania",
    "Luxembourg",
    "Madagascar",
    "Malawi",
    "Malaysia",
    "Maldives",
    "Mali",
    "Malta",
    "Marshall Islands",
    "Mauritania",
    "Mauritius",
    "Mexico",
    "Micronesia",
    "Moldova",
    "Monaco",
    "Mongolia",
    "Montenegro",
    "Morocco",
    "Mozambique",
    "Myanmar",
    "Namibia",
    "Nauru",
    "Nepal",
    "Netherlands",
    "New Zealand",
    "Nicaragua",
    "Niger",
    "Nigeria",
    "North Korea",
    "North Macedonia",
    "Norway",
    "Oman",
    "Pakistan",
    "Palau",
    "Palestine",
    "Panama",
    "Papua New Guinea",
    "Paraguay",
    "Peru",
    "Philippines",
    "Poland",
    "Portugal",
    "Qatar",
    "Romania",
    "Russia",
    "Rwanda",
    "Saint Kitts and Nevis",
    "Saint Lucia",
    "Saint Vincent and the Grenadines",
    "Samoa",
    "San Marino",
    "Sao Tome and Principe",
    "Saudi Arabia",
    "Senegal",
    "Serbia",
    "Seychelles",
    "Sierra Leone",
    "Singapore",
    "Slovakia",
    "Slovenia",
    "Solomon Islands",
    "Somalia",
    "South Africa",
    "South Korea",
    "South Sudan",
    "Spain",
    "Sri Lanka",
    "Sudan",
    "Suriname",
    "Sweden",
    "Switzerland",
    "Syria",
    "Taiwan",
    "Tajikistan",
    "Tanzania",
    "Thailand",
    "Timor-Leste",
    "Togo",
    "Tonga",
    "Trinidad and Tobago",
    "Tunisia",
    "Turkey",
    "Turkmenistan",
    "Tuvalu",
    "Uganda",
    "Ukraine",
    "United Arab Emirates",
    "United Kingdom",
    "United States",
    "Uruguay",
    "Uzbekistan",
    "Vanuatu",
    "Vatican City",
    "Venezuela",
    "Vietnam",
    "Yemen",
    "Zambia",
    "Zimbabwe",
  ];

  const [newCustomer, setNewCustomer] = useState({
    company: "",
    owner: "",
    email: "",
    phone: "",
    website: "",
    taxId: "",
    industry: "",
    companySize: "",
    customerType: "", // 'property' | 'developer'
    plan: "",
    billingCycle: "monthly",
    properties: "",
    units: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "Nigeria",
    propertyLimit: String(TRIAL_PLAN_LIMITS.properties),
    userLimit: String(TRIAL_PLAN_LIMITS.users),
    storageLimit: String(TRIAL_PLAN_LIMITS.storageMb),
    notes: "",
    // Developer-specific fields
    firstName: "",
    lastName: "",
    developmentCompany: "",
    companyRegistration: "",
    yearsInDevelopment: "",
    developmentType: "",
    projectsCompleted: "",
    projectsOngoing: "",
    totalProjectValue: "",
    averageProjectSize: "",
    developmentLicense: "",
    licenseNumber: "",
    specialization: "",
    primaryMarket: "",
    fundingSource: "",
    teamSize: "",
    hasArchitect: "",
    hasEngineer: "",
    // Property-specific fields
    businessType: "",
    numberOfProperties: "",
    totalUnits: "",
    portfolioValue: "",
    managementStyle: "",
    primaryGoal: "",
    currentSoftware: "",
    hearAboutUs: "",
    subscribeToNewsletter: false,
  });

  // Fetch available plans from API
  const refreshPlans = async () => {
    try {
      setLoadingPlans(true);
      const response = await getBillingPlans();

      if (response.error) {
        toast.error("Failed to load subscription plans");
      } else if (response.data) {
        // Show all plans; inactive ones can still be selected if needed
        const transformedPlans = response.data.map((plan: any) => ({
          id: plan.id,
          name: plan.name,
          category: plan.category || null, // Keep null if not set, don't default
          price: plan.monthlyPrice,
          annualPrice: plan.annualPrice,
          currency: plan.currency || "USD",
          features: Array.isArray(plan.features) ? plan.features : [],
          popular: plan.isPopular || false,
          isActive: plan.isActive !== false,
          propertyLimit: plan.propertyLimit,
          projectLimit: plan.projectLimit,
          userLimit: plan.userLimit,
          storageLimit: plan.storageLimit,
        }));

        console.log("[AddCustomerPage] Loaded plans:", transformedPlans.length);
        console.log(
          "[AddCustomerPage] Plans with categories:",
          transformedPlans.map((p) => ({ name: p.name, category: p.category }))
        );
        setSubscriptionPlans(transformedPlans);
      }
    } catch (error) {
      console.error("Error fetching plans:", error);
      toast.error("Failed to load subscription plans");
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
      onSocketEvent("plan:created", handlePlanChange);
      onSocketEvent("plan:updated", handlePlanChange);
      onSocketEvent("plan:deleted", handlePlanChange);
    } catch {}

    return () => {
      try {
        offSocketEvent("plan:created", handlePlanChange);
        offSocketEvent("plan:updated", handlePlanChange);
        offSocketEvent("plan:deleted", handlePlanChange);
      } catch {}
    };
  }, []);

  // Filter plans based on customer type
  const filteredPlans = subscriptionPlans.filter((plan) => {
    if (!newCustomer.customerType) return true; // Show all if no type selected

    // If plan doesn't have a category, show it for all customer types (backward compatibility)
    if (!plan.category || plan.category === null) {
      console.log(
        `[AddCustomerPage] Plan "${plan.name}" has no category, showing for all types`
      );
      return true;
    }

    if (newCustomer.customerType === "developer") {
      return plan.category === "development";
    } else {
      // property_owner and property_manager see property_management plans
      return plan.category === "property_management";
    }
  });

  console.log(
    `[AddCustomerPage] Customer type: ${newCustomer.customerType}, Filtered plans: ${filteredPlans.length}`
  );

  const selectedPlan = subscriptionPlans.find(
    (plan) => plan.name === newCustomer.plan
  );

  const generatePassword = () => {
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const generateInvitationLink = (email: string) => {
    const token =
      "inv_" + Date.now() + "_" + Math.random().toString(36).substring(2, 15);
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
    setCurrentTab("invitation");
  };

  const handleSendInvitation = async () => {
    console.log(
      "🎯 handleSendInvitation called, ref status:",
      isSubmittingRef.current
    );

    // Prevent duplicate submissions using ref (synchronous check)
    if (isSubmittingRef.current) {
      console.log("⚠️ Submission already in progress, ignoring duplicate call");
      return;
    }

    // Set ref immediately (synchronous) to block any subsequent calls
    isSubmittingRef.current = true;
    console.log("🔒 Ref locked, proceeding with submission");

    try {
      setIsSubmitting(true);
      setSendingInvitation(true);

      // Map customer type to backend format
      const mappedCustomerType =
        newCustomer.customerType === "developer"
          ? "property_developer"
          : "property_owner";

      // Prepare customer data based on customer type
      const customerData: any = {
        // Common fields
        email: newCustomer.email,
        phone: newCustomer.phone,
        customerType: mappedCustomerType,
        plan: newCustomer.plan,
        billingCycle: newCustomer.billingCycle,
        status: "trial",
        city: newCustomer.city,
        state: newCustomer.state,
        zipCode: newCustomer.zipCode,
        country: newCustomer.country,
        propertyLimit: parseInt(newCustomer.propertyLimit) || 5,
        userLimit: parseInt(newCustomer.userLimit) || 3,
        storageLimit: parseInt(newCustomer.storageLimit) || 1000,
        properties: parseInt(newCustomer.properties) || 0,
        sendInvitation: true,
        temporaryPassword: temporaryPassword,
      };

      // Add customer type specific fields
      if (newCustomer.customerType === "developer") {
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
        console.error("❌ Missing required fields:", {
          company: customerData.company,
          owner: customerData.owner,
          email: customerData.email,
          firstName: newCustomer.firstName,
          lastName: newCustomer.lastName,
          developmentCompany: newCustomer.developmentCompany,
          customerType: newCustomer.customerType,
        });
        toast.error("Missing required fields: company, owner, or email");
        setIsSubmitting(false);
        setSendingInvitation(false);
        isSubmittingRef.current = false; // Reset ref
        return;
      }

      const requestId = `REQ-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;

      console.log(`🚀 [${requestId}] Starting customer creation request`);
      console.log(`✅ [${requestId}] Sending customer data:`, {
        company: customerData.company,
        owner: customerData.owner,
        email: customerData.email,
        customerType: customerData.customerType,
        plan: customerData.plan,
        billingCycle: customerData.billingCycle,
      });

      console.log(
        `📦 [${requestId}] Full payload:`,
        JSON.stringify(customerData, null, 2)
      );

      // Call the API to create the customer
      const response = await createCustomer(customerData);

      console.log(
        `📥 [${requestId}] Received response:`,
        response.error ? "ERROR" : "SUCCESS"
      );

      if (response.error) {
        console.log(`❌ [${requestId}] Error response:`, response.error);

        // Check if it's a duplicate email error
        if (
          response.error.error === "Email already exists" &&
          response.error.existingCustomer
        ) {
          console.log(`⚠️ [${requestId}] Duplicate email detected:`, {
            email: newCustomer.email,
            existingCustomer: response.error.existingCustomer,
          });

          // Check if the existing customer was just created (within last 5 seconds)
          const existingCustomer = response.error.existingCustomer;
          if (existingCustomer && existingCustomer.id) {
            console.log(
              `✅ [${requestId}] Customer already exists, treating as success`
            );
            toast.success(
              "Customer created successfully! Invitation email sent."
            );
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

        toast.error(response.error.error || "Failed to create customer");
        setIsSubmitting(false);
        setSendingInvitation(false);
        isSubmittingRef.current = false; // Reset ref
        return;
      }

      // Update password display with actual password from backend
      // This ensures UI shows the password that was actually stored in database
      if (response.data.tempPassword) {
        setTemporaryPassword(response.data.tempPassword);
        console.log("✅ Updated displayed password from backend response");
      }

      // Success! Redirect to customer management
      toast.success("Customer created successfully! Invitation email sent.");
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
      console.error("Error creating customer:", error);
      toast.error("Failed to create customer");
      setIsSubmitting(false);
      setSendingInvitation(false);
      isSubmittingRef.current = false; // Reset ref
    }
  };

  const handleComplete = () => {
    // Just return to dashboard (customer already created in handleSendInvitation)
    onBack();
  };

  const copyToClipboard = (text: string, type: "password" | "link") => {
    navigator.clipboard.writeText(text);
    if (type === "password") {
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 2000);
      toast.success("Password copied to clipboard");
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
      toast.success("Link copied to clipboard");
    }
  };

  const isFormValid = () => {
    // Check common required fields
    const hasEmail = !!newCustomer.email;
    const hasPlan = !!newCustomer.plan;
    const hasName = !!newCustomer.firstName && !!newCustomer.lastName;

    // Check customer type specific fields
    if (newCustomer.customerType === "developer") {
      const hasCompany = !!newCustomer.developmentCompany;
      return hasEmail && hasPlan && hasName && hasCompany;
    } else if (newCustomer.customerType === "property") {
      const hasCompany = !!newCustomer.company;
      return hasEmail && hasPlan && hasName && hasCompany;
    }

    // Fallback for old form structure (if any)
    return (
      newCustomer.company &&
      newCustomer.owner &&
      newCustomer.email &&
      newCustomer.plan
    );
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
${
  newCustomer.customerType === "developer"
    ? "• Set up your development projects\n• Invite your team members\n• Start managing your projects and timelines"
    : "• Complete your property setup\n• Invite your team members\n• Start managing your properties and tenants"
}

Need help? Our support team is available 24/7 at support@contrezz.com

Best regards,
The Contrezz Team

---
This is an automated message. Please do not reply to this email.
  `;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-violet-50/30">
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
              <h1 className="text-xl font-semibold text-gray-900">
                Add New Customer
              </h1>
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
        <Tabs
          value={currentTab}
          onValueChange={(value) => setCurrentTab(value as any)}
        >
          {/* Enhanced Tabs List */}
          <div className="bg-gradient-to-r from-purple-50 via-violet-50 to-purple-50 border-b border-purple-200/50 rounded-t-xl">
            <TabsList className="grid w-full grid-cols-3 h-auto bg-transparent p-2 gap-2">
              <TabsTrigger
                value="information"
                disabled={currentTab === "confirmation"}
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg py-3 px-4 disabled:opacity-50"
              >
                <Building className="h-4 w-4" />
                <span className="font-medium">Customer Information</span>
              </TabsTrigger>
              <TabsTrigger
                value="invitation"
                disabled={!temporaryPassword}
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg py-3 px-4 disabled:opacity-50"
              >
                <Mail className="h-4 w-4" />
                <span className="font-medium">Invitation</span>
              </TabsTrigger>
              <TabsTrigger
                value="confirmation"
                disabled={!emailSent}
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg py-3 px-4 disabled:opacity-50"
              >
                <CheckCircle className="h-4 w-4" />
                <span className="font-medium">Confirmation</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab 1: Customer Information */}
          <TabsContent value="information" className="space-y-6 mt-0 p-6">
            {/* Enhanced Customer Type Selector */}
            <Card className="border-0 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 via-violet-600 to-purple-600 text-white p-6">
                <div className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  <CardTitle className="text-xl">
                    Select Customer Type
                  </CardTitle>
                </div>
                <CardDescription className="text-purple-100 mt-2">
                  Choose the type of customer to display the appropriate form
                  fields
                </CardDescription>
              </div>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    className={`h-32 flex flex-col items-center justify-center space-y-3 border-2 transition-all duration-200 ${
                      newCustomer.customerType === "property"
                        ? "border-purple-500 bg-gradient-to-br from-purple-50 to-violet-50 shadow-lg scale-105"
                        : "border-gray-200 hover:border-purple-300 hover:shadow-md"
                    }`}
                    onClick={() =>
                      setNewCustomer({
                        ...newCustomer,
                        customerType: "property",
                      })
                    }
                  >
                    <div
                      className={`p-3 rounded-xl ${
                        newCustomer.customerType === "property"
                          ? "bg-gradient-to-br from-purple-500 to-violet-500"
                          : "bg-gray-100"
                      }`}
                    >
                      <Building
                        className={`h-8 w-8 ${
                          newCustomer.customerType === "property"
                            ? "text-white"
                            : "text-gray-600"
                        }`}
                      />
                    </div>
                    <div className="text-center">
                      <div
                        className={`font-semibold text-lg ${
                          newCustomer.customerType === "property"
                            ? "text-purple-700"
                            : "text-gray-900"
                        }`}
                      >
                        Property Owner/Manager
                      </div>
                      <div
                        className={`text-xs mt-1 ${
                          newCustomer.customerType === "property"
                            ? "text-purple-600"
                            : "text-gray-500"
                        }`}
                      >
                        Manage properties and tenants
                      </div>
                    </div>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className={`h-32 flex flex-col items-center justify-center space-y-3 border-2 transition-all duration-200 ${
                      newCustomer.customerType === "developer"
                        ? "border-purple-500 bg-gradient-to-br from-purple-50 to-violet-50 shadow-lg scale-105"
                        : "border-gray-200 hover:border-purple-300 hover:shadow-md"
                    }`}
                    onClick={() =>
                      setNewCustomer({
                        ...newCustomer,
                        customerType: "developer",
                      })
                    }
                  >
                    <div
                      className={`p-3 rounded-xl ${
                        newCustomer.customerType === "developer"
                          ? "bg-gradient-to-br from-purple-500 to-violet-500"
                          : "bg-gray-100"
                      }`}
                    >
                      <Building
                        className={`h-8 w-8 ${
                          newCustomer.customerType === "developer"
                            ? "text-white"
                            : "text-gray-600"
                        }`}
                      />
                    </div>
                    <div className="text-center">
                      <div
                        className={`font-semibold text-lg ${
                          newCustomer.customerType === "developer"
                            ? "text-purple-700"
                            : "text-gray-900"
                        }`}
                      >
                        Property Developer
                      </div>
                      <div
                        className={`text-xs mt-1 ${
                          newCustomer.customerType === "developer"
                            ? "text-purple-600"
                            : "text-gray-500"
                        }`}
                      >
                        Manage development projects
                      </div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Show form only after customer type is selected */}
            {!newCustomer.customerType && (
              <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-orange-50/30">
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-3 p-4 rounded-xl bg-yellow-100/50 border border-yellow-200">
                    <div className="p-2 rounded-lg bg-yellow-500/20">
                      <AlertCircle className="h-5 w-5 text-yellow-700" />
                    </div>
                    <p className="text-yellow-800 font-medium">
                      Please select a customer type above to continue
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {newCustomer.customerType && (
              <>
                {/* Render appropriate form based on customer type */}
                {newCustomer.customerType === "developer" ? (
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
                      subscribeToNewsletter: newCustomer.subscribeToNewsletter,
                    }}
                    onChange={(field, value) =>
                      setNewCustomer({ ...newCustomer, [field]: value })
                    }
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
                      subscribeToNewsletter: newCustomer.subscribeToNewsletter,
                    }}
                    onChange={(field, value) => {
                      // Map companyName to company for backend compatibility
                      if (field === "companyName") {
                        setNewCustomer({ ...newCustomer, company: value });
                      } else {
                        setNewCustomer({ ...newCustomer, [field]: value });
                      }
                    }}
                  />
                )}

                {/* Plan Selection Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
                  <div className="lg:col-span-2">
                    {/* Enhanced Subscription Plan Selection */}
                    <Card className="border-0 shadow-xl overflow-hidden">
                      <div className="bg-gradient-to-r from-purple-600 via-violet-600 to-purple-600 text-white p-6">
                        <CardTitle className="flex items-center space-x-2 text-xl">
                          <CreditCard className="h-5 w-5" />
                          <span>Subscription Plan</span>
                        </CardTitle>
                        <CardDescription className="text-purple-100 mt-2">
                          Choose the subscription plan for this customer
                        </CardDescription>
                      </div>
                      <CardContent className="space-y-4">
                        {!newCustomer.customerType && (
                          <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl">
                            <p className="text-sm text-blue-800 flex items-center gap-2 font-medium">
                              <div className="p-1.5 rounded-lg bg-blue-500/20">
                                <Info className="h-4 w-4" />
                              </div>
                              Please select a customer type first to see
                              available plans
                            </p>
                          </div>
                        )}

                        <div>
                          <Label htmlFor="plan">Select Plan *</Label>
                          <Select
                            value={newCustomer.plan}
                            onValueChange={(value) => {
                              const plan = subscriptionPlans.find(
                                (p) => p.name === value
                              );
                              if (plan) {
                                // Set appropriate limits based on plan category
                                const updates: any = {
                                  plan: value,
                                  userLimit: plan.userLimit?.toString() || "3",
                                  storageLimit:
                                    plan.storageLimit?.toString() || "1000",
                                };

                                if (plan.category === "property_management") {
                                  updates.propertyLimit =
                                    plan.propertyLimit?.toString() || "5";
                                  updates.properties =
                                    plan.propertyLimit?.toString() || "";
                                } else if (plan.category === "development") {
                                  // For developers, we use propertyLimit field to store projectLimit value
                                  // This is because the form field is reused for both
                                  updates.propertyLimit =
                                    plan.projectLimit?.toString() || "3";
                                  updates.properties =
                                    plan.projectLimit?.toString() || "3";
                                }

                                setNewCustomer({
                                  ...newCustomer,
                                  ...updates,
                                });
                              } else {
                                setNewCustomer({ ...newCustomer, plan: value });
                              }
                            }}
                            required
                            disabled={loadingPlans || !newCustomer.customerType}
                          >
                            <SelectTrigger className="border-gray-200 focus:border-purple-300 focus:ring-purple-200">
                              <SelectValue
                                placeholder={
                                  loadingPlans
                                    ? "Loading plans..."
                                    : !newCustomer.customerType
                                    ? "Select customer type first"
                                    : "Choose a subscription plan"
                                }
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {filteredPlans.length === 0 ? (
                                <div className="p-2 text-sm text-gray-500">
                                  No plans available
                                </div>
                              ) : (
                                filteredPlans.map((plan) => (
                                  <SelectItem
                                    key={plan.id || plan.name}
                                    value={plan.name}
                                  >
                                    <div className="flex items-center gap-2">
                                      <span>{plan.name}</span>
                                      <span className="text-sm text-gray-500">
                                        {formatCurrency(
                                          plan.price,
                                          plan.currency
                                        )}
                                        /mo
                                      </span>
                                      {plan.popular && (
                                        <Badge
                                          variant="secondary"
                                          className="text-xs"
                                        >
                                          Popular
                                        </Badge>
                                      )}
                                    </div>
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                          {newCustomer.customerType && (
                            <p className="text-xs text-gray-500 mt-1">
                              {newCustomer.customerType === "developer"
                                ? "Showing development plans (based on projects)"
                                : "Showing property management plans (based on properties)"}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="billingCycle">Billing Cycle</Label>
                          <Select
                            value={newCustomer.billingCycle}
                            onValueChange={(value) =>
                              setNewCustomer({
                                ...newCustomer,
                                billingCycle: value,
                              })
                            }
                          >
                            <SelectTrigger
                              id="billingCycle"
                              className="border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="annual">
                                Annual (Save 15%)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="pt-4 border-t">
                          <h4 className="text-sm font-semibold mb-4">
                            Account Limits
                          </h4>
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 gap-4">
                              <div>
                                <Label htmlFor="propertyLimit">
                                  {newCustomer.customerType === "developer"
                                    ? "Project Limit"
                                    : "Property Limit"}
                                </Label>
                                <Input
                                  id="propertyLimit"
                                  type="number"
                                  placeholder="Auto-filled from plan"
                                  value={newCustomer.propertyLimit}
                                  readOnly
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  {newCustomer.customerType === "developer"
                                    ? "Automatically set based on selected development plan"
                                    : "Automatically set based on selected property management plan"}
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
                                <Label htmlFor="storageLimit">
                                  Storage Limit (MB)
                                </Label>
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

                  {/* Enhanced Sidebar */}
                  <div>
                    <Card className="border-0 shadow-xl overflow-hidden sticky top-6">
                      <div className="bg-gradient-to-r from-purple-600 via-violet-600 to-purple-600 text-white p-6">
                        <CardTitle className="text-xl">Plan Summary</CardTitle>
                      </div>
                      <CardContent className="p-6 space-y-4">
                        {newCustomer.plan ? (
                          <>
                            <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200">
                              <p className="text-sm text-gray-600 mb-1">
                                Selected Plan
                              </p>
                              <p className="font-bold text-lg text-purple-700">
                                {newCustomer.plan}
                              </p>
                            </div>
                            <div className="space-y-3 pt-2">
                              <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50">
                                <span className="text-sm text-gray-600 flex items-center gap-2">
                                  <Building className="h-4 w-4 text-purple-600" />
                                  {newCustomer.customerType === "developer"
                                    ? "Projects"
                                    : "Properties"}
                                  :
                                </span>
                                <span className="font-semibold text-gray-900">
                                  {newCustomer.propertyLimit}
                                </span>
                              </div>
                              <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50">
                                <span className="text-sm text-gray-600 flex items-center gap-2">
                                  <User className="h-4 w-4 text-purple-600" />
                                  Users:
                                </span>
                                <span className="font-semibold text-gray-900">
                                  {newCustomer.userLimit}
                                </span>
                              </div>
                              <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50">
                                <span className="text-sm text-gray-600 flex items-center gap-2">
                                  <DollarSign className="h-4 w-4 text-purple-600" />
                                  Storage:
                                </span>
                                <span className="font-semibold text-gray-900">
                                  {newCustomer.storageLimit} MB
                                </span>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="text-center py-8">
                            <div className="p-4 rounded-full bg-gray-100 inline-block mb-3">
                              <CreditCard className="h-8 w-8 text-gray-400" />
                            </div>
                            <p className="text-sm text-gray-500">
                              Select a plan to see details
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Enhanced Action Buttons */}
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onBack}
                    className="border-gray-200 text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateCustomer}
                    disabled={!isFormValid()}
                    className="min-w-[200px] bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white shadow-lg"
                  >
                    Continue to Invitation
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </>
            )}
          </TabsContent>

          {/* Step 2: Send Invitation */}
          <TabsContent value="invitation" className="space-y-6 mt-0 p-6">
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentTab("information")}
                  className="border-purple-200 text-purple-700 hover:bg-purple-50"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Form
                </Button>
              </div>

              {/* Enhanced Invitation Card */}
              <Card className="border-0 shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600 via-violet-600 to-purple-600 text-white p-6">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Send Invitation
                  </CardTitle>
                  <CardDescription className="text-purple-100 mt-2">
                    Customer account created successfully. Send login
                    credentials to {newCustomer.email}
                  </CardDescription>
                </div>
                <CardContent className="space-y-6">
                  {/* Enhanced Customer Summary */}
                  <div className="grid grid-cols-2 gap-4 p-6 bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl border border-purple-200">
                    <div className="p-4 rounded-lg bg-white">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Company
                      </p>
                      <p className="font-bold text-gray-900">
                        {newCustomer.company || newCustomer.developmentCompany}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-white">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Email
                      </p>
                      <p className="font-bold text-gray-900">
                        {newCustomer.email}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-white">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Plan
                      </p>
                      <Badge className="bg-purple-100 text-purple-700 border-purple-300">
                        {newCustomer.plan}
                      </Badge>
                    </div>
                  </div>

                  {/* Enhanced Temporary Password */}
                  <div className="border-2 rounded-xl p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm font-semibold text-blue-900">
                        Temporary Password
                      </Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(temporaryPassword, "password")
                        }
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
                      Customer will be required to change this password on first
                      login
                    </p>
                  </div>

                  {/* Enhanced Email Preview */}
                  <div className="border-2 rounded-xl p-6 bg-white border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-2 rounded-lg bg-purple-100">
                        <Mail className="h-5 w-5 text-purple-600" />
                      </div>
                      <Label className="text-sm font-semibold text-gray-900">
                        Email Preview
                      </Label>
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 p-4 max-h-96 overflow-y-auto">
                      <pre className="text-sm whitespace-pre-wrap font-sans text-gray-800">
                        {emailTemplate}
                      </pre>
                    </div>
                  </div>

                  {/* Enhanced Send Invitation Button */}
                  <Button
                    type="button"
                    onClick={handleSendInvitation}
                    disabled={sendingInvitation || isSubmitting}
                    className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white shadow-lg py-6 text-lg"
                  >
                    {sendingInvitation ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Sending Invitation...
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5 mr-2" />
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
}

export default AddCustomerPage;
