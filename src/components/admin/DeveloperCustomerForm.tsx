import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, User, Briefcase, MapPin, FileText } from "lucide-react";

interface DeveloperFormData {
  // Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;

  // Company Information
  developmentCompany: string;
  companyRegistration: string;
  yearsInDevelopment: string;
  developmentType: string;

  // Portfolio Information
  projectsCompleted: string;
  projectsOngoing: string;
  totalProjectValue: string;
  averageProjectSize: string;

  // Licensing & Specialization
  developmentLicense: string;
  licenseNumber: string;
  specialization: string;

  // Market & Team
  primaryMarket: string;
  fundingSource: string;
  teamSize: string;
  hasArchitect: string;
  hasEngineer: string;

  // Location
  city: string;
  state: string;
  country: string;
  zipCode: string;

  // Additional
  hearAboutUs: string;
  subscribeToNewsletter: boolean;
}

interface DeveloperCustomerFormProps {
  formData: DeveloperFormData;
  onChange: (field: keyof DeveloperFormData, value: any) => void;
}

export function DeveloperCustomerForm({ formData, onChange }: DeveloperCustomerFormProps) {
  return (
    <div className="space-y-6">
      {/* Personal Information */}
      <Card className="border-2 hover:border-blue-200 transition-colors">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <User className="h-5 w-5 mr-2 text-blue-600" />
            Personal Information
          </CardTitle>
          <CardDescription>Primary contact details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                placeholder="John"
                value={formData.firstName}
                onChange={(e) => onChange('firstName', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                placeholder="Developer"
                value={formData.lastName}
                onChange={(e) => onChange('lastName', e.target.value)}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@development.com"
                value={formData.email}
                onChange={(e) => onChange('email', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+234 800 000 0000"
                value={formData.phone}
                onChange={(e) => onChange('phone', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Company Information */}
      <Card className="border-2 hover:border-blue-200 transition-colors">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <Building2 className="h-5 w-5 mr-2 text-blue-600" />
            Company Information
          </CardTitle>
          <CardDescription>Development company details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="developmentCompany">Development Company Name *</Label>
            <Input
              id="developmentCompany"
              placeholder="ABC Development Ltd"
              value={formData.developmentCompany}
              onChange={(e) => onChange('developmentCompany', e.target.value)}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyRegistration">Company Registration (RC Number)</Label>
              <Input
                id="companyRegistration"
                placeholder="RC123456"
                value={formData.companyRegistration}
                onChange={(e) => onChange('companyRegistration', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="yearsInDevelopment">Years in Development *</Label>
              <Select
                value={formData.yearsInDevelopment}
                onValueChange={(value) => onChange('yearsInDevelopment', value)}
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
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="developmentType">Primary Development Type *</Label>
              <Select
                value={formData.developmentType}
                onValueChange={(value) => onChange('developmentType', value)}
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
            <div className="space-y-2">
              <Label htmlFor="specialization">Specialization *</Label>
              <Select
                value={formData.specialization}
                onValueChange={(value) => onChange('specialization', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select specialization" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="luxury">Luxury Development</SelectItem>
                  <SelectItem value="affordable">Affordable Housing</SelectItem>
                  <SelectItem value="commercial">Commercial Spaces</SelectItem>
                  <SelectItem value="industrial">Industrial Parks</SelectItem>
                  <SelectItem value="mixed">Mixed Development</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Portfolio Information */}
      <Card className="border-2 hover:border-blue-200 transition-colors">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <Briefcase className="h-5 w-5 mr-2 text-blue-600" />
            Portfolio Information
          </CardTitle>
          <CardDescription>Project history and scale</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="projectsCompleted">Projects Completed</Label>
              <Select
                value={formData.projectsCompleted}
                onValueChange={(value) => onChange('projectsCompleted', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">None (First Project)</SelectItem>
                  <SelectItem value="1-3">1-3 projects</SelectItem>
                  <SelectItem value="4-10">4-10 projects</SelectItem>
                  <SelectItem value="11-25">11-25 projects</SelectItem>
                  <SelectItem value="26-50">26-50 projects</SelectItem>
                  <SelectItem value="50+">50+ projects</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="projectsOngoing">Projects Ongoing</Label>
              <Select
                value={formData.projectsOngoing}
                onValueChange={(value) => onChange('projectsOngoing', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">None</SelectItem>
                  <SelectItem value="1-2">1-2 projects</SelectItem>
                  <SelectItem value="3-5">3-5 projects</SelectItem>
                  <SelectItem value="6-10">6-10 projects</SelectItem>
                  <SelectItem value="10+">10+ projects</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="totalProjectValue">Total Project Value (Portfolio)</Label>
              <Select
                value={formData.totalProjectValue}
                onValueChange={(value) => onChange('totalProjectValue', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="<10M">Less than ₦10M</SelectItem>
                  <SelectItem value="10M-50M">₦10M - ₦50M</SelectItem>
                  <SelectItem value="50M-100M">₦50M - ₦100M</SelectItem>
                  <SelectItem value="100M-500M">₦100M - ₦500M</SelectItem>
                  <SelectItem value="500M-1B">₦500M - ₦1B</SelectItem>
                  <SelectItem value="1B+">Over ₦1B</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="averageProjectSize">Average Project Size</Label>
              <Select
                value={formData.averageProjectSize}
                onValueChange={(value) => onChange('averageProjectSize', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="<5M">Less than ₦5M</SelectItem>
                  <SelectItem value="5M-20M">₦5M - ₦20M</SelectItem>
                  <SelectItem value="20M-50M">₦20M - ₦50M</SelectItem>
                  <SelectItem value="50M-100M">₦50M - ₦100M</SelectItem>
                  <SelectItem value="100M+">Over ₦100M</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Licensing & Team */}
      <Card className="border-2 hover:border-blue-200 transition-colors">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <FileText className="h-5 w-5 mr-2 text-blue-600" />
            Licensing & Team
          </CardTitle>
          <CardDescription>Professional credentials and team structure</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="developmentLicense">Development License Status *</Label>
              <Select
                value={formData.developmentLicense}
                onValueChange={(value) => onChange('developmentLicense', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="licensed">Fully Licensed</SelectItem>
                  <SelectItem value="pending">License Pending</SelectItem>
                  <SelectItem value="not-required">Not Required</SelectItem>
                  <SelectItem value="none">No License</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="licenseNumber">License Number (if applicable)</Label>
              <Input
                id="licenseNumber"
                placeholder="DEV-123456"
                value={formData.licenseNumber}
                onChange={(e) => onChange('licenseNumber', e.target.value)}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="teamSize">Team Size</Label>
              <Select
                value={formData.teamSize}
                onValueChange={(value) => onChange('teamSize', value)}
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
                onValueChange={(value) => onChange('hasArchitect', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="contract">Contract Basis</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hasEngineer">In-house Engineer?</Label>
              <Select
                value={formData.hasEngineer}
                onValueChange={(value) => onChange('hasEngineer', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="contract">Contract Basis</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primaryMarket">Primary Market/Region *</Label>
              <Input
                id="primaryMarket"
                placeholder="Lagos, Abuja, etc."
                value={formData.primaryMarket}
                onChange={(e) => onChange('primaryMarket', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fundingSource">Primary Funding Source</Label>
              <Select
                value={formData.fundingSource}
                onValueChange={(value) => onChange('fundingSource', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="self-funded">Self-Funded</SelectItem>
                  <SelectItem value="bank-loans">Bank Loans</SelectItem>
                  <SelectItem value="investors">Private Investors</SelectItem>
                  <SelectItem value="mixed">Mixed Funding</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
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
            Office Location
          </CardTitle>
          <CardDescription>Company headquarters address</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                placeholder="Lagos"
                value={formData.city}
                onChange={(e) => onChange('city', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State *</Label>
              <Input
                id="state"
                placeholder="Lagos State"
                value={formData.state}
                onChange={(e) => onChange('state', e.target.value)}
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
                onChange={(e) => onChange('country', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zipCode">ZIP/Postal Code</Label>
              <Input
                id="zipCode"
                placeholder="100001"
                value={formData.zipCode}
                onChange={(e) => onChange('zipCode', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}









