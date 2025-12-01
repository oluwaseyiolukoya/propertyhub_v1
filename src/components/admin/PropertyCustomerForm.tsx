import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, User, Briefcase, MapPin, TrendingUp } from "lucide-react";

interface PropertyFormData {
  // Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;

  // Business Information
  companyName: string;
  businessType: string;
  numberOfProperties: string;
  totalUnits: string;

  // Portfolio Details
  portfolioValue: string;
  managementStyle: string;
  primaryGoal: string;
  currentSoftware: string;

  // Location
  city: string;
  state: string;
  country: string;
  zipCode: string;

  // Additional
  hearAboutUs: string;
  subscribeToNewsletter: boolean;
}

interface PropertyCustomerFormProps {
  formData: PropertyFormData;
  onChange: (field: keyof PropertyFormData, value: any) => void;
}

export function PropertyCustomerForm({ formData, onChange }: PropertyCustomerFormProps) {
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
                placeholder="Smith"
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
                placeholder="john@properties.com"
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

      {/* Business Information */}
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
              onChange={(e) => onChange('companyName', e.target.value)}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="businessType">Business Type</Label>
              <Select
                value={formData.businessType}
                onValueChange={(value) => onChange('businessType', value)}
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
                onValueChange={(value) => onChange('numberOfProperties', value)}
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
                onValueChange={(value) => onChange('totalUnits', value)}
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
                onValueChange={(value) => onChange('portfolioValue', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="<50M">Less than ₦50M</SelectItem>
                  <SelectItem value="50M-100M">₦50M - ₦100M</SelectItem>
                  <SelectItem value="100M-250M">₦100M - ₦250M</SelectItem>
                  <SelectItem value="250M-500M">₦250M - ₦500M</SelectItem>
                  <SelectItem value="500M-1B">₦500M - ₦1B</SelectItem>
                  <SelectItem value="1B+">Over ₦1B</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Management Details */}
      <Card className="border-2 hover:border-blue-200 transition-colors">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
            Management Details
          </CardTitle>
          <CardDescription>Your property management approach</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="managementStyle">Management Style</Label>
              <Select
                value={formData.managementStyle}
                onValueChange={(value) => onChange('managementStyle', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="self-managed">Self-Managed</SelectItem>
                  <SelectItem value="property-manager">Property Manager</SelectItem>
                  <SelectItem value="hybrid">Hybrid Approach</SelectItem>
                  <SelectItem value="full-service">Full-Service PM Company</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="primaryGoal">Primary Goal</Label>
              <Select
                value={formData.primaryGoal}
                onValueChange={(value) => onChange('primaryGoal', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select goal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="efficiency">Improve Efficiency</SelectItem>
                  <SelectItem value="tenant-satisfaction">Tenant Satisfaction</SelectItem>
                  <SelectItem value="financial-tracking">Financial Tracking</SelectItem>
                  <SelectItem value="portfolio-growth">Portfolio Growth</SelectItem>
                  <SelectItem value="compliance">Compliance & Reporting</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currentSoftware">Current Software/Tools (if any)</Label>
            <Input
              id="currentSoftware"
              placeholder="e.g., Excel, QuickBooks, Buildium"
              value={formData.currentSoftware}
              onChange={(e) => onChange('currentSoftware', e.target.value)}
            />
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












