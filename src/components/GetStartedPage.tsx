import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { Badge } from "./ui/badge";
import { toast } from 'sonner';
import { submitOnboardingApplication, OnboardingApplicationData } from '../lib/api/onboarding';
import {
  Building,
  ArrowLeft,
  ArrowRight,
  Building2,
  UserCog,
  Home,
  CheckCircle2,
  Mail,
  User,
  Phone,
  MapPin,
  Briefcase,
  TrendingUp,
  Zap,
  Shield,
  Lock,
  Users
} from 'lucide-react';

interface GetStartedPageProps {
  onBackToHome: () => void;
  onNavigateToLogin: () => void;
  onSignupComplete: (role: UserRole, email: string, name: string) => void;
}

type UserRole = 'property-owner' | 'property-manager' | 'tenant' | '';

interface FormData {
  role: UserRole;

  // Personal information (all roles)
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;

  // Property Owner specific
  companyName: string;
  businessType: string;
  numberOfProperties: string;
  totalUnits: string;
  portfolioValue: string;
  managementStyle: string;
  primaryGoal: string;
  currentSoftware: string;

  // Property Manager specific
  employerCompany: string;
  jobTitle: string;
  yearsOfExperience: string;
  propertiesManaged: string;
  certifications: string;
  teamSize: string;

  // Property Developer specific
  developmentCompany: string;
  companyRegistration: string;
  yearsInDevelopment: string;
  developmentType: string; // residential, commercial, mixed-use, infrastructure
  projectsCompleted: string;
  projectsOngoing: string;
  totalProjectValue: string;
  averageProjectSize: string;
  developmentLicense: string;
  licenseNumber: string;
  primaryMarket: string; // city/region focus
  fundingSource: string; // self-funded, bank loans, investors, mixed
  teamSize_dev: string;
  hasArchitect: string;
  hasEngineer: string;
  specialization: string; // luxury, affordable, commercial, industrial

  // Tenant specific
  currentlyRenting: string;
  moveInDate: string;
  propertyType: string;
  rentalBudget: string;

  // Common
  city: string;
  state: string;
  country: string;
  zipCode: string;
  hearAboutUs: string;
  agreeToTerms: boolean;
  subscribeToNewsletter: boolean;
}

export function GetStartedPage({ onBackToHome, onNavigateToLogin, onSignupComplete }: GetStartedPageProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>('');
  const [currentStep, setCurrentStep] = useState<'role-selection' | 'signup-form'>('role-selection');

  // Scroll to top when component mounts or step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  const [formData, setFormData] = useState<FormData>({
    role: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    businessType: '',
    numberOfProperties: '',
    totalUnits: '',
    portfolioValue: '',
    managementStyle: '',
    primaryGoal: '',
    currentSoftware: '',
    employerCompany: '',
    jobTitle: '',
    yearsOfExperience: '',
    propertiesManaged: '',
    certifications: '',
    teamSize: '',
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
    primaryMarket: '',
    fundingSource: '',
    teamSize_dev: '',
    hasArchitect: '',
    hasEngineer: '',
    specialization: '',
    currentlyRenting: '',
    moveInDate: '',
    propertyType: '',
    rentalBudget: '',
    city: '',
    state: '',
    country: '',
    zipCode: '',
    hearAboutUs: '',
    agreeToTerms: false,
    subscribeToNewsletter: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const roleOptions = [
    {
      value: 'property-owner',
      icon: Building2,
      title: 'Property Owner',
      description: 'I own one or more properties and want to streamline management',
      features: ['Portfolio management', 'Financial analytics', 'Team collaboration'],
      badge: 'Most Popular',
      action: 'signup'
    },
    {
      value: 'property-manager',
      icon: UserCog,
      title: 'Property Manager',
      description: 'I manage properties professionally for owners',
      features: ['Multi-property oversight', 'Tenant relations', 'Maintenance coordination'],
      action: 'signup'
    },
    {
      value: 'developer',
      icon: Building2,
      title: 'Property Developer',
      description: 'I develop and construct properties',
      features: ['Project management', 'Budget tracking', 'Cost analytics'],
      badge: 'New',
      action: 'signup'
    }
  ];

  const handleRoleSelect = (role: UserRole, action: string) => {
    if (action === 'login') {
      onNavigateToLogin();
    } else {
      setSelectedRole(role);
      setFormData({ ...formData, role });
      setCurrentStep('signup-form');
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleBackToRoleSelection = () => {
    setCurrentStep('role-selection');
    setSelectedRole('');
  };

  const validateForm = () => {
    // Basic validation for all roles
    if (!formData.firstName.trim() || !formData.lastName.trim() ||
        !formData.email.trim() || !formData.phone.trim()) {
      toast.error('Please fill in all required fields');
      return false;
    }

    // Account Security removed: no password validation

    if (!formData.agreeToTerms) {
      toast.error('Please agree to the Terms of Service');
      return false;
    }

    if (formData.role === 'property-owner') {
      if (!formData.companyName.trim() || !formData.numberOfProperties || !formData.primaryGoal) {
        toast.error('Please complete all property owner fields');
        return false;
      }
    }

    if (formData.role === 'property-manager') {
      if (!formData.employerCompany.trim() || !formData.yearsOfExperience || !formData.jobTitle.trim()) {
        toast.error('Please complete all property manager fields');
        return false;
      }
    }

    if (formData.role === 'tenant') {
      if (!formData.currentlyRenting) {
        toast.error('Please complete all tenant fields');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const fullName = `${formData.firstName} ${formData.lastName}`;

      // Prepare application data based on role
      const applicationData: OnboardingApplicationData = {
        applicationType: formData.role as 'property-owner' | 'property-manager' | 'tenant',
        name: fullName,
        email: formData.email,
        phone: formData.phone || undefined,
        city: formData.city || undefined,
        state: formData.state || undefined,
        country: formData.country || 'Nigeria',
        postalCode: formData.zipCode || undefined,
        referralSource: formData.hearAboutUs || undefined,
        // Capture non-schema UI fields in metadata so admins can view them
        metadata: {
          portfolioValue: formData.portfolioValue || undefined,
          managementStyle: formData.managementStyle || undefined,
          primaryGoal: formData.primaryGoal || undefined,
          currentSoftware: formData.currentSoftware || undefined,
          jobTitle: formData.jobTitle || undefined,
          teamSize: formData.teamSize || undefined,
          propertyType: formData.propertyType || undefined,
          rentalBudget: formData.rentalBudget || undefined,
          subscribeToNewsletter: formData.subscribeToNewsletter || undefined,
        },
      };

      // Add role-specific fields
      if (formData.role === 'property-owner') {
        applicationData.companyName = formData.companyName;
        // Map UI values to backend-accepted enum
        const bt = (formData.businessType || '').toLowerCase();
        const mappedBusinessType =
          bt === 'individual' ? 'individual'
          : bt === 'partnership' ? 'partnership'
          : bt ? 'company'
          : undefined;
        if (mappedBusinessType) {
          applicationData.businessType = mappedBusinessType as 'individual' | 'company' | 'partnership';
        }
        applicationData.numberOfProperties = formData.numberOfProperties ? parseInt(formData.numberOfProperties) : undefined;
        applicationData.totalUnits = formData.totalUnits ? parseInt(formData.totalUnits) : undefined;
      } else if (formData.role === 'property-manager') {
        applicationData.managementCompany = formData.employerCompany;
        applicationData.yearsOfExperience = formData.yearsOfExperience ? parseInt(formData.yearsOfExperience) : undefined;
        applicationData.propertiesManaged = formData.propertiesManaged ? parseInt(formData.propertiesManaged) : undefined;
      } else if (formData.role === 'developer' || formData.role === 'property-developer') {
        // Property Developer specific fields
        applicationData.companyName = formData.developmentCompany;
        // Business type is optional for developers, default to 'company' if company name is provided
        if (formData.developmentCompany) {
          applicationData.businessType = 'company';
        }
        // Store developer-specific data in metadata
        applicationData.metadata = {
          ...applicationData.metadata,
          companyRegistration: formData.companyRegistration,
          yearsInDevelopment: formData.yearsInDevelopment,
          developmentType: formData.developmentType,
          specialization: formData.specialization,
          primaryMarket: formData.primaryMarket,
          activeProjects: formData.activeProjects ? parseInt(formData.activeProjects) : undefined,
          completedProjects: formData.completedProjects ? parseInt(formData.completedProjects) : undefined,
          projectsInPlanning: formData.projectsInPlanning ? parseInt(formData.projectsInPlanning) : undefined,
          totalProjectValue: formData.totalProjectValue,
          developmentLicense: formData.developmentLicense,
          licenseNumber: formData.licenseNumber,
          teamSize: formData.teamSize,
          inHouseArchitect: formData.inHouseArchitect,
          inHouseEngineer: formData.inHouseEngineer,
          fundingSources: formData.fundingSources,
          primaryFundingMethod: formData.primaryFundingMethod,
          softwareUsed: formData.softwareUsed,
          painPoints: formData.painPoints,
        };
      } else if (formData.role === 'tenant') {
        // Map UI values to backend-accepted enum
        const cr = formData.currentlyRenting;
        const mappedCr: 'yes' | 'no' | 'looking' =
          cr === 'yes-contrezz' || cr === 'yes-other' ? 'yes'
          : cr === 'moving-soon' || cr === 'looking' ? 'looking'
          : 'no';
        applicationData.currentlyRenting = mappedCr;
        // Convert date (YYYY-MM-DD) to ISO datetime if provided
        applicationData.moveInDate = formData.moveInDate ? new Date(formData.moveInDate).toISOString() : undefined;
      }

      console.log('[GetStartedPage] Submitting application:', applicationData);

      // Submit application to backend
      const response = await submitOnboardingApplication(applicationData);

      console.log('[GetStartedPage] Application submitted successfully:', response);

      // Show success message
      toast.success('Application submitted successfully! We will review your application within 24-48 hours.', {
        duration: 5000,
      });

      // Navigate to account under review page
      setIsSubmitting(false);
      onSignupComplete(formData.role as UserRole, formData.email, fullName);
    } catch (error: any) {
      console.error('[GetStartedPage] Submission error:', error);

      setIsSubmitting(false);

      // Show error message
      toast.error(error.message || 'Failed to submit application. Please try again.', {
        duration: 5000,
      });
    }
  };

  const renderRoleSelection = () => (
    <div className="space-y-8 py-8">
      <div className="text-center max-w-2xl mx-auto">
        <Badge className="mb-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 animate-bounce">
          <Zap className="h-3 w-3 mr-1" /> Get Started in Minutes
        </Badge>
        <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">Welcome to Contrezz</h1>
        <p className="text-xl text-gray-600">
          Let's get you set up with the right tools for your needs
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {roleOptions.map((option) => {
          const Icon = option.icon;

          return (
            <Card
              key={option.value}
              className="group cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-105 border-2 hover:border-blue-500 relative overflow-visible"
              onClick={() => handleRoleSelect(option.value as UserRole, option.action)}
            >
              {option.badge && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                  <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 shadow-lg px-3 py-1">
                    {option.badge}
                  </Badge>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
              <CardHeader className="text-center pb-4 relative">
                <div className="flex justify-center mb-4">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-100 to-purple-100 group-hover:from-blue-200 group-hover:to-purple-200 transition-all duration-300 group-hover:scale-110">
                    <Icon className="h-10 w-10 text-blue-600" />
                  </div>
                </div>
                <CardTitle className="mb-2 text-xl">{option.title}</CardTitle>
                <CardDescription className="text-base leading-relaxed">{option.description}</CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <div className="space-y-3 mb-6">
                  {option.features.map((feature, index) => (
                    <div key={index} className="flex items-center text-sm text-gray-600">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      {feature}
                    </div>
                  ))}
                </div>
                <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transform group-hover:scale-105 transition-all duration-200">
                  {option.action === 'login' ? (
                    <>
                      Sign In <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Get Started <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="text-center text-sm text-gray-500 max-w-2xl mx-auto pt-8 space-y-2">
        <p>
          Already have an account?{' '}
          <button onClick={onNavigateToLogin} className="text-blue-600 hover:underline font-semibold">
            Sign in here
          </button>
        </p>
        <p className="text-xs">
          <strong>Note for Tenants:</strong> Your account is created by your property manager. Please use the Sign In option above.
        </p>
      </div>
    </div>
  );

  const renderPropertyOwnerForm = () => (
    <div className="space-y-6">
      {/* Personal Information Section */}
      <Card className="border-2 hover:border-blue-200 transition-colors">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <User className="h-5 w-5 mr-2 text-blue-600" />
            Personal Information
          </CardTitle>
          <CardDescription>Let's start with the basics about you</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                placeholder="John"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                placeholder="Smith"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  className="pl-10"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  className="pl-10"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Information Section */}
      <Card className="border-2 hover:border-blue-200 transition-colors">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <Briefcase className="h-5 w-5 mr-2 text-blue-600" />
            Business Information
          </CardTitle>
          <CardDescription>Tell us about your property portfolio</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company/Business Name *</Label>
            <Input
              id="companyName"
              placeholder="Smith Properties LLC"
              value={formData.companyName}
              onChange={(e) => handleInputChange('companyName', e.target.value)}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="businessType">Business Type</Label>
              <Select
                value={formData.businessType}
                onValueChange={(value) => handleInputChange('businessType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual Investor</SelectItem>
                  <SelectItem value="llc">LLC</SelectItem>
                  <SelectItem value="corporation">Corporation</SelectItem>
                  <SelectItem value="partnership">Partnership</SelectItem>
                  <SelectItem value="trust">Trust/Estate</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="numberOfProperties">Number of Properties *</Label>
              <Select
                value={formData.numberOfProperties}
                onValueChange={(value) => handleInputChange('numberOfProperties', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 property</SelectItem>
                  <SelectItem value="2-5">2-5 properties</SelectItem>
                  <SelectItem value="6-10">6-10 properties</SelectItem>
                  <SelectItem value="11-25">11-25 properties</SelectItem>
                  <SelectItem value="26-50">26-50 properties</SelectItem>
                  <SelectItem value="51-100">51-100 properties</SelectItem>
                  <SelectItem value="100+">100+ properties</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="totalUnits">Total Units Across Portfolio</Label>
              <Select
                value={formData.totalUnits}
                onValueChange={(value) => handleInputChange('totalUnits', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-10">1-10 units</SelectItem>
                  <SelectItem value="11-25">11-25 units</SelectItem>
                  <SelectItem value="26-50">26-50 units</SelectItem>
                  <SelectItem value="51-100">51-100 units</SelectItem>
                  <SelectItem value="101-250">101-250 units</SelectItem>
                  <SelectItem value="251-500">251-500 units</SelectItem>
                  <SelectItem value="500+">500+ units</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="portfolioValue">Estimated Portfolio Value</Label>
              <Select
                value={formData.portfolioValue}
                onValueChange={(value) => handleInputChange('portfolioValue', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="under-500k">Under $500K</SelectItem>
                  <SelectItem value="500k-1m">$500K - $1M</SelectItem>
                  <SelectItem value="1m-5m">$1M - $5M</SelectItem>
                  <SelectItem value="5m-10m">$5M - $10M</SelectItem>
                  <SelectItem value="10m-25m">$10M - $25M</SelectItem>
                  <SelectItem value="25m+">$25M+</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="managementStyle">Current Management Approach</Label>
            <Select
              value={formData.managementStyle}
              onValueChange={(value) => handleInputChange('managementStyle', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="How do you manage today?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="self-managed">Self-managed</SelectItem>
                <SelectItem value="property-manager">Use property managers</SelectItem>
                <SelectItem value="hybrid">Hybrid (self + managers)</SelectItem>
                <SelectItem value="starting">Just getting started</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Goals & Preferences */}
      <Card className="border-2 hover:border-blue-200 transition-colors">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
            Goals & Preferences
          </CardTitle>
          <CardDescription>Help us customize your experience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="primaryGoal">Primary Goal with Contrezz *</Label>
            <Select
              value={formData.primaryGoal}
              onValueChange={(value) => handleInputChange('primaryGoal', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="What's your main objective?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="streamline">Streamline operations</SelectItem>
                <SelectItem value="financial">Better financial tracking</SelectItem>
                <SelectItem value="tenant">Improve tenant experience</SelectItem>
                <SelectItem value="scale">Scale my portfolio</SelectItem>
                <SelectItem value="automation">Automate tasks</SelectItem>
                <SelectItem value="all">All of the above</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currentSoftware">Current Software (if any)</Label>
            <Input
              id="currentSoftware"
              placeholder="e.g., Buildium, AppFolio, Yardi, or None"
              value={formData.currentSoftware}
              onChange={(e) => handleInputChange('currentSoftware', e.target.value)}
            />
            <p className="text-xs text-gray-500">This helps us with data migration if needed</p>
          </div>
        </CardContent>
      </Card>

      {/* Location */}
      <Card className="border-2 hover:border-blue-200 transition-colors">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <MapPin className="h-5 w-5 mr-2 text-blue-600" />
            Location
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="San Francisco"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State/Province</Label>
                <Input
                  id="state"
                  placeholder="CA"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  placeholder="United States"
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP/Postal Code</Label>
                <Input
                  id="zipCode"
                  placeholder="94102"
                  value={formData.zipCode}
                  onChange={(e) => handleInputChange('zipCode', e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Security removed */}
    </div>
  );

  const renderPropertyManagerForm = () => (
    <div className="space-y-6">
      {/* Personal Information Section */}
      <Card className="border-2 hover:border-blue-200 transition-colors">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <User className="h-5 w-5 mr-2 text-blue-600" />
            Personal Information
          </CardTitle>
          <CardDescription>Let's start with the basics about you</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                placeholder="Sarah"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                placeholder="Johnson"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="sarah@example.com"
                  className="pl-10"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  className="pl-10"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Professional Information */}
      <Card className="border-2 hover:border-blue-200 transition-colors">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <Briefcase className="h-5 w-5 mr-2 text-blue-600" />
            Professional Background
          </CardTitle>
          <CardDescription>Tell us about your property management experience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="employerCompany">Company/Employer Name *</Label>
            <Input
              id="employerCompany"
              placeholder="ABC Property Management"
              value={formData.employerCompany}
              onChange={(e) => handleInputChange('employerCompany', e.target.value)}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="jobTitle">Job Title *</Label>
              <Input
                id="jobTitle"
                placeholder="Property Manager"
                value={formData.jobTitle}
                onChange={(e) => handleInputChange('jobTitle', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="yearsOfExperience">Years of Experience *</Label>
              <Select
                value={formData.yearsOfExperience}
                onValueChange={(value) => handleInputChange('yearsOfExperience', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select experience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0-1">Less than 1 year</SelectItem>
                  <SelectItem value="1-2">1-2 years</SelectItem>
                  <SelectItem value="3-5">3-5 years</SelectItem>
                  <SelectItem value="5-10">5-10 years</SelectItem>
                  <SelectItem value="10+">10+ years</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="propertiesManaged">Properties Currently Managed</Label>
              <Select
                value={formData.propertiesManaged}
                onValueChange={(value) => handleInputChange('propertiesManaged', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-5">1-5 properties</SelectItem>
                  <SelectItem value="6-10">6-10 properties</SelectItem>
                  <SelectItem value="11-25">11-25 properties</SelectItem>
                  <SelectItem value="26-50">26-50 properties</SelectItem>
                  <SelectItem value="51+">51+ properties</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="teamSize">Team Size</Label>
              <Select
                value={formData.teamSize}
                onValueChange={(value) => handleInputChange('teamSize', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solo">Just me</SelectItem>
                  <SelectItem value="2-5">2-5 people</SelectItem>
                  <SelectItem value="6-10">6-10 people</SelectItem>
                  <SelectItem value="11-25">11-25 people</SelectItem>
                  <SelectItem value="26+">26+ people</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Location */}
      <Card className="border-2 hover:border-blue-200 transition-colors">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <MapPin className="h-5 w-5 mr-2 text-blue-600" />
            Location
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="Los Angeles"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State/Province</Label>
                <Input
                  id="state"
                  placeholder="CA"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  placeholder="United States"
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP/Postal Code</Label>
                <Input
                  id="zipCode"
                  placeholder="90001"
                  value={formData.zipCode}
                  onChange={(e) => handleInputChange('zipCode', e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderPropertyDeveloperForm = () => (
    <div className="space-y-6">
      {/* Personal Information Section */}
      <Card className="border-2 hover:border-blue-200 transition-colors">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <User className="h-5 w-5 mr-2 text-orange-600" />
            Personal Information
          </CardTitle>
          <CardDescription>Let's start with the basics about you</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                placeholder="John"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                placeholder="Builder"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="john@constructionco.com"
                  className="pl-10"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+234 xxx xxx xxxx"
                  className="pl-10"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Company Information */}
      <Card className="border-2 hover:border-blue-200 transition-colors">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <Building2 className="h-5 w-5 mr-2 text-orange-600" />
            Development Company Information
          </CardTitle>
          <CardDescription>Tell us about your development company</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="developmentCompany">Company Name *</Label>
              <Input
                id="developmentCompany"
                placeholder="ABC Construction & Development Ltd"
                value={formData.developmentCompany}
                onChange={(e) => handleInputChange('developmentCompany', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyRegistration">Company Registration Number</Label>
              <Input
                id="companyRegistration"
                placeholder="RC123456"
                value={formData.companyRegistration}
                onChange={(e) => handleInputChange('companyRegistration', e.target.value)}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="yearsInDevelopment">Years in Development *</Label>
              <Select
                value={formData.yearsInDevelopment}
                onValueChange={(value) => handleInputChange('yearsInDevelopment', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select experience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0-2">0-2 years (New Developer)</SelectItem>
                  <SelectItem value="3-5">3-5 years</SelectItem>
                  <SelectItem value="6-10">6-10 years</SelectItem>
                  <SelectItem value="11-20">11-20 years</SelectItem>
                  <SelectItem value="20+">20+ years (Veteran)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="developmentType">Primary Development Type *</Label>
              <Select
                value={formData.developmentType}
                onValueChange={(value) => handleInputChange('developmentType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="residential">Residential</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="mixed-use">Mixed-Use</SelectItem>
                  <SelectItem value="infrastructure">Infrastructure</SelectItem>
                  <SelectItem value="industrial">Industrial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="specialization">Specialization</Label>
              <Select
                value={formData.specialization}
                onValueChange={(value) => handleInputChange('specialization', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select specialization" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="luxury">Luxury/High-End</SelectItem>
                  <SelectItem value="affordable">Affordable Housing</SelectItem>
                  <SelectItem value="commercial">Commercial Buildings</SelectItem>
                  <SelectItem value="industrial">Industrial Facilities</SelectItem>
                  <SelectItem value="mixed">Mixed Portfolio</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="primaryMarket">Primary Market/City *</Label>
              <Input
                id="primaryMarket"
                placeholder="Lagos, Abuja, Port Harcourt"
                value={formData.primaryMarket}
                onChange={(e) => handleInputChange('primaryMarket', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Project Portfolio */}
      <Card className="border-2 hover:border-blue-200 transition-colors">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <TrendingUp className="h-5 w-5 mr-2 text-orange-600" />
            Project Portfolio
          </CardTitle>
          <CardDescription>Share your development track record</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="projectsCompleted">Projects Completed</Label>
              <Input
                id="projectsCompleted"
                type="number"
                placeholder="5"
                value={formData.projectsCompleted}
                onChange={(e) => handleInputChange('projectsCompleted', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="projectsOngoing">Ongoing Projects</Label>
              <Input
                id="projectsOngoing"
                type="number"
                placeholder="2"
                value={formData.projectsOngoing}
                onChange={(e) => handleInputChange('projectsOngoing', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="averageProjectSize">Avg Project Size (units)</Label>
              <Input
                id="averageProjectSize"
                type="number"
                placeholder="20"
                value={formData.averageProjectSize}
                onChange={(e) => handleInputChange('averageProjectSize', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="totalProjectValue">Total Project Value (₦)</Label>
            <Select
              value={formData.totalProjectValue}
              onValueChange={(value) => handleInputChange('totalProjectValue', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0-100M">Under ₦100 Million</SelectItem>
                <SelectItem value="100M-500M">₦100M - ₦500M</SelectItem>
                <SelectItem value="500M-1B">₦500M - ₦1 Billion</SelectItem>
                <SelectItem value="1B-5B">₦1B - ₦5 Billion</SelectItem>
                <SelectItem value="5B+">Over ₦5 Billion</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Licensing & Compliance */}
      <Card className="border-2 hover:border-blue-200 transition-colors">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <Shield className="h-5 w-5 mr-2 text-orange-600" />
            Licensing & Compliance
          </CardTitle>
          <CardDescription>Professional credentials and certifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="developmentLicense">Development License Status</Label>
              <Select
                value={formData.developmentLicense}
                onValueChange={(value) => handleInputChange('developmentLicense', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="licensed">Fully Licensed</SelectItem>
                  <SelectItem value="pending">License Pending</SelectItem>
                  <SelectItem value="renewal">Renewal in Progress</SelectItem>
                  <SelectItem value="not-required">Not Required</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="licenseNumber">License Number (if applicable)</Label>
              <Input
                id="licenseNumber"
                placeholder="DEV-2024-XXXX"
                value={formData.licenseNumber}
                onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team & Resources */}
      <Card className="border-2 hover:border-blue-200 transition-colors">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <Users className="h-5 w-5 mr-2 text-orange-600" />
            Team & Resources
          </CardTitle>
          <CardDescription>Your development team structure</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="teamSize_dev">Team Size</Label>
              <Select
                value={formData.teamSize_dev}
                onValueChange={(value) => handleInputChange('teamSize_dev', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-5">1-5 people</SelectItem>
                  <SelectItem value="6-10">6-10 people</SelectItem>
                  <SelectItem value="11-25">11-25 people</SelectItem>
                  <SelectItem value="26-50">26-50 people</SelectItem>
                  <SelectItem value="50+">50+ people</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hasArchitect">In-house Architect?</Label>
              <Select
                value={formData.hasArchitect}
                onValueChange={(value) => handleInputChange('hasArchitect', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No (Outsourced)</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hasEngineer">In-house Engineer?</Label>
              <Select
                value={formData.hasEngineer}
                onValueChange={(value) => handleInputChange('hasEngineer', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No (Outsourced)</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fundingSource">Primary Funding Source</Label>
            <Select
              value={formData.fundingSource}
              onValueChange={(value) => handleInputChange('fundingSource', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select funding source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="self-funded">Self-Funded</SelectItem>
                <SelectItem value="bank-loans">Bank Loans</SelectItem>
                <SelectItem value="investors">Private Investors</SelectItem>
                <SelectItem value="mixed">Mixed Sources</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Location */}
      <Card className="border-2 hover:border-blue-200 transition-colors">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <MapPin className="h-5 w-5 mr-2 text-orange-600" />
            Business Location
          </CardTitle>
          <CardDescription>Where is your company based?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                placeholder="Lagos"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State *</Label>
              <Input
                id="state"
                placeholder="Lagos State"
                value={formData.state}
                onChange={(e) => handleInputChange('state', e.target.value)}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="country">Country *</Label>
              <Input
                id="country"
                placeholder="Nigeria"
                value={formData.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zipCode">Postal/Zip Code</Label>
              <Input
                id="zipCode"
                placeholder="100001"
                value={formData.zipCode}
                onChange={(e) => handleInputChange('zipCode', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderTenantForm = () => (
    <div className="space-y-6">
      {/* Personal Information Section */}
      <Card className="border-2 hover:border-blue-200 transition-colors">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <User className="h-5 w-5 mr-2 text-blue-600" />
            Personal Information
          </CardTitle>
          <CardDescription>Let's start with the basics about you</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                placeholder="Alex"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                placeholder="Martinez"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="alex@example.com"
                  className="pl-10"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  className="pl-10"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rental Information */}
      <Card className="border-2 hover:border-blue-200 transition-colors">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <Home className="h-5 w-5 mr-2 text-blue-600" />
            Rental Information
          </CardTitle>
          <CardDescription>Tell us about your rental situation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentlyRenting">Current Rental Status *</Label>
            <Select
              value={formData.currentlyRenting}
              onValueChange={(value) => handleInputChange('currentlyRenting', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes-contrezz">I rent from a Contrezz property</SelectItem>
                <SelectItem value="yes-other">I rent, but not through Contrezz yet</SelectItem>
                <SelectItem value="moving-soon">Moving soon (next 3 months)</SelectItem>
                <SelectItem value="looking">Actively looking for a rental</SelectItem>
                <SelectItem value="future">Interested for the future</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(formData.currentlyRenting === 'yes-contrezz' || formData.currentlyRenting === 'yes-other') && (
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="propertyType">Property Type</Label>
                <Select
                  value={formData.propertyType}
                  onValueChange={(value) => handleInputChange('propertyType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="condo">Condo</SelectItem>
                    <SelectItem value="house">House</SelectItem>
                    <SelectItem value="townhouse">Townhouse</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="moveInDate">Move-in Date</Label>
                <Input
                  id="moveInDate"
                  type="date"
                  value={formData.moveInDate}
                  onChange={(e) => handleInputChange('moveInDate', e.target.value)}
                />
              </div>
            </div>
          )}

          {(formData.currentlyRenting === 'moving-soon' || formData.currentlyRenting === 'looking') && (
            <div className="space-y-2">
              <Label htmlFor="rentalBudget">Monthly Rental Budget</Label>
              <Select
                value={formData.rentalBudget}
                onValueChange={(value) => handleInputChange('rentalBudget', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select budget range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="under-1000">Under $1,000</SelectItem>
                  <SelectItem value="1000-1500">$1,000 - $1,500</SelectItem>
                  <SelectItem value="1500-2000">$1,500 - $2,000</SelectItem>
                  <SelectItem value="2000-2500">$2,000 - $2,500</SelectItem>
                  <SelectItem value="2500-3000">$2,500 - $3,000</SelectItem>
                  <SelectItem value="3000+">$3,000+</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Location */}
      <Card className="border-2 hover:border-blue-200 transition-colors">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <MapPin className="h-5 w-5 mr-2 text-blue-600" />
            Location
          </CardTitle>
          <CardDescription>Where are you located or looking to rent?</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="New York"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State/Province</Label>
                <Input
                  id="state"
                  placeholder="NY"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  placeholder="United States"
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP/Postal Code</Label>
                <Input
                  id="zipCode"
                  placeholder="10001"
                  value={formData.zipCode}
                  onChange={(e) => handleInputChange('zipCode', e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Security removed */}
    </div>
  );

  const renderSignupForm = () => {
    const roleInfo = roleOptions.find(r => r.value === selectedRole) || roleOptions[0];
    const RoleIcon = roleInfo.icon;

    return (
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-4 pb-6">
            <div className="flex justify-center">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-100 to-purple-100 shadow-lg">
                <RoleIcon className="h-10 w-10 text-blue-600" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                Create Your {roleInfo.title} Account
              </h1>
              <p className="text-gray-600 text-lg">{roleInfo.description}</p>
            </div>
          </div>

          {/* Role-specific form */}
          {selectedRole === 'property-owner' && renderPropertyOwnerForm()}
          {selectedRole === 'property-manager' && renderPropertyManagerForm()}
          {selectedRole === 'developer' && renderPropertyDeveloperForm()}
          {selectedRole === 'tenant' && renderTenantForm()}

          {/* Terms and Preferences */}
          <Card className="border-2 border-blue-200 bg-blue-50/50">
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="terms"
                    checked={formData.agreeToTerms}
                    onCheckedChange={(checked) => handleInputChange('agreeToTerms', checked as boolean)}
                  />
                  <label
                    htmlFor="terms"
                    className="text-sm leading-relaxed cursor-pointer"
                  >
                    I agree to the{' '}
                    <a href="#" className="text-blue-600 hover:underline font-semibold">Terms of Service</a>
                    {' '}and{' '}
                    <a href="#" className="text-blue-600 hover:underline font-semibold">Privacy Policy</a>
                    {' '}*
                  </label>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="newsletter"
                    checked={formData.subscribeToNewsletter}
                    onCheckedChange={(checked) => handleInputChange('subscribeToNewsletter', checked as boolean)}
                  />
                  <label
                    htmlFor="newsletter"
                    className="text-sm leading-relaxed cursor-pointer"
                  >
                    Send me property management tips, feature updates, and industry insights
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hearAboutUs">How did you hear about us?</Label>
                <Select
                  value={formData.hearAboutUs}
                  onValueChange={(value) => handleInputChange('hearAboutUs', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="search">Search Engine (Google, Bing)</SelectItem>
                    <SelectItem value="social">Social Media</SelectItem>
                    <SelectItem value="referral">Referral from friend/colleague</SelectItem>
                    <SelectItem value="review">Review site</SelectItem>
                    <SelectItem value="advertisement">Online Advertisement</SelectItem>
                    <SelectItem value="event">Industry Event/Conference</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex items-center justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleBackToRoleSelection}
              className="border-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="min-w-[200px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              {isSubmitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Creating Account...
                </>
              ) : (
                <>
                  Create Account
                  <CheckCircle2 className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>

          {/* Sign in link */}
          <div className="text-center text-sm text-gray-500 pt-4">
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={onNavigateToLogin}
                className="text-blue-600 hover:underline font-semibold"
              >
                Sign in here
              </button>
            </p>
          </div>
        </form>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={onBackToHome}
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            >
              <Building className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">Contrezz</h1>
              <Badge variant="secondary" className="ml-2">SaaS</Badge>
            </button>

            <Button
              variant="ghost"
              onClick={currentStep === 'role-selection' ? onBackToHome : handleBackToRoleSelection}
              className="hover:bg-blue-50"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {currentStep === 'role-selection' ? 'Back to Home' : 'Change Role'}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {currentStep === 'role-selection' ? renderRoleSelection() : renderSignupForm()}
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/50 backdrop-blur-sm mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>© 2025 Contrezz. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
