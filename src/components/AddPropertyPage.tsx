import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import { Separator } from "./ui/separator";
import { Progress } from "./ui/progress";
import { ImageUpload } from "./ImageUpload";
import { toast } from "sonner";
import { 
  Building2,
  MapPin,
  Home,
  Calendar,
  DollarSign,
  Users,
  Camera,
  Upload,
  X,
  Plus,
  Check,
  ArrowLeft,
  ArrowRight,
  Save,
  FileText,
  Key,
  Shield,
  Wifi,
  Car,
  Zap,
  Droplets,
  Thermometer,
  TreePine,
  Dumbbell,
  Waves,
  Utensils,
  Bed,
  Bath,
  Maximize,
  Info,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface AddPropertyPageProps {
  user: any;
  onBack: () => void;
  onSave: (propertyData: any) => void;
}

export function AddPropertyPage({ user, onBack, onSave }: AddPropertyPageProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Basic Information
    name: '',
    propertyType: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Nigeria',
    
    // Property Details
    yearBuilt: '',
    totalUnits: '',
    floors: '',
    totalArea: '',
    lotSize: '',
    parking: '',
    
    // Financial Information
    currency: 'NGN',
    purchasePrice: '',
    currentMarketValue: '',
    avgRent: '',
    securityDeposit: '',
    petDeposit: '',
    applicationFee: '',
    
    // Management
    manager: '',
    managerPhone: '',
    managerEmail: '',
    
    // Features & Amenities
    features: [] as string[],
    unitFeatures: [] as string[],
    
    // Insurance & Legal
    insuranceProvider: '',
    insurancePolicyNumber: '',
    insurancePremium: '',
    insuranceExpiration: '',
    propertyTaxes: '',
    
    // Additional Information
    description: '',
    notes: '',
    
    // Images
    coverImage: '',
    images: [] as string[]
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const steps = [
    { number: 1, title: 'Basic Information', description: 'Property name and location' },
    { number: 2, title: 'Property Details', description: 'Physical characteristics' },
    { number: 3, title: 'Financial Information', description: 'Pricing and costs' },
    { number: 4, title: 'Management', description: 'Property manager details' },
    { number: 5, title: 'Features & Amenities', description: 'Property features' },
    { number: 6, title: 'Legal & Insurance', description: 'Insurance and legal info' },
    { number: 7, title: 'Review & Submit', description: 'Final review' }
  ];

  const propertyTypes = [
    'Apartment Complex',
    'Single Family Home',
    'Duplex',
    'Triplex',
    'Fourplex',
    'Townhouse',
    'Condominium',
    'Mixed Use',
    'Commercial',
    'Office Building',
    'Retail Space',
    'Warehouse',
    'Mobile Home Park',
    'Student Housing'
  ];

  const availableFeatures = [
    { id: 'pool', label: 'Swimming Pool', icon: Waves },
    { id: 'gym', label: 'Fitness Center', icon: Dumbbell },
    { id: 'parking', label: 'Parking', icon: Car },
    { id: 'laundry', label: 'Laundry Facility', icon: Home },
    { id: 'security', label: 'Security System', icon: Shield },
    { id: 'elevator', label: 'Elevator', icon: ArrowRight },
    { id: 'balcony', label: 'Balcony/Patio', icon: TreePine },
    { id: 'ac', label: 'Air Conditioning', icon: Thermometer },
    { id: 'heating', label: 'Heating', icon: Thermometer },
    { id: 'wifi', label: 'WiFi Included', icon: Wifi },
    { id: 'utilities', label: 'Utilities Included', icon: Zap },
    { id: 'garden', label: 'Garden/Yard', icon: TreePine },
    { id: 'clubhouse', label: 'Clubhouse', icon: Home },
    { id: 'playground', label: 'Playground', icon: Home },
    { id: 'concierge', label: 'Concierge', icon: Users },
    { id: 'rooftop', label: 'Rooftop Access', icon: Home }
  ];

  const unitFeatures = [
    { id: 'dishwasher', label: 'Dishwasher', icon: Utensils },
    { id: 'microwave', label: 'Microwave', icon: Utensils },
    { id: 'disposal', label: 'Garbage Disposal', icon: Home },
    { id: 'walkincloset', label: 'Walk-in Closet', icon: Home },
    { id: 'hardwood', label: 'Hardwood Floors', icon: Home },
    { id: 'carpet', label: 'Carpet', icon: Home },
    { id: 'tile', label: 'Tile Floors', icon: Home },
    { id: 'fireplace', label: 'Fireplace', icon: Home },
    { id: 'washerdryer', label: 'Washer/Dryer', icon: Home },
    { id: 'petsallowed', label: 'Pets Allowed', icon: Home }
  ];

  const states = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];

  const countries = [
    'Nigeria',
    'United States',
    'United Kingdom',
    'Canada',
    'Australia',
    'South Africa',
    'Kenya',
    'Ghana',
    'Germany',
    'France',
    'Spain',
    'Italy',
    'Netherlands',
    'Belgium',
    'Switzerland',
    'Sweden',
    'Norway',
    'Denmark',
    'Finland',
    'Ireland',
    'Portugal',
    'Austria',
    'Greece',
    'Poland',
    'Czech Republic',
    'Hungary',
    'Romania',
    'India',
    'China',
    'Japan',
    'South Korea',
    'Singapore',
    'Malaysia',
    'Thailand',
    'Indonesia',
    'Philippines',
    'Vietnam',
    'United Arab Emirates',
    'Saudi Arabia',
    'Egypt',
    'Morocco',
    'Tunisia',
    'Brazil',
    'Argentina',
    'Chile',
    'Colombia',
    'Mexico',
    'Peru',
    'New Zealand'
  ];

  const currencies = [
    { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
    { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
    { code: 'GHS', symbol: '₵', name: 'Ghanaian Cedi' }
  ];

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.name.trim()) newErrors.name = 'Property name is required';
        if (!formData.propertyType) newErrors.propertyType = 'Property type is required';
        if (!formData.address.trim()) newErrors.address = 'Address is required';
        if (!formData.city.trim()) newErrors.city = 'City is required';
        if (!formData.state) newErrors.state = 'State is required';
        if (!formData.zipCode.trim()) newErrors.zipCode = 'ZIP code is required';
        break;
      case 2:
        if (!formData.totalUnits.trim()) newErrors.totalUnits = 'Total units is required';
        if (parseInt(formData.totalUnits) <= 0) newErrors.totalUnits = 'Total units must be greater than 0';
        break;
      case 3:
        if (!formData.avgRent.trim()) newErrors.avgRent = 'Average rent is required';
        break;
      case 4:
        if (!formData.manager.trim()) newErrors.manager = 'Property manager name is required';
        if (!formData.managerEmail.trim()) newErrors.managerEmail = 'Manager email is required';
        if (!formData.managerPhone.trim()) newErrors.managerPhone = 'Manager phone is required';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFeatureToggle = (featureId: string, isUnitFeature = false) => {
    const field = isUnitFeature ? 'unitFeatures' : 'features';
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(featureId)
        ? prev[field].filter((id: string) => id !== featureId)
        : [...prev[field], featureId]
    }));
  };

  const handleSubmit = () => {
    if (validateStep(currentStep)) {
      const propertyData = {
        ...formData,
        id: Date.now(),
        status: 'active',
        occupiedUnits: 0,
        vacantUnits: parseInt(formData.totalUnits),
        monthlyRevenue: 0,
        occupancyRate: 0,
        maintenanceRequests: 0,
        expiredLeases: 0,
        lastInspection: null,
        nextInspection: null,
        currency: formData.currency,
        // Add cover image to images array if provided
        images: formData.coverImage ? [formData.coverImage] : [],
        financials: {
          grossRent: 0,
          expenses: 0,
          netIncome: 0,
          capRate: 0,
          cashFlow: 0,
          currency: formData.currency
        },
        insurance: {
          provider: formData.insuranceProvider,
          policyNumber: formData.insurancePolicyNumber,
          premium: parseFloat(formData.insurancePremium) || 0,
          expiration: formData.insuranceExpiration
        }
      };

      onSave(propertyData);
      toast.success('Property added successfully!');
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Property Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter property name"
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
                </div>

                <div>
                  <Label htmlFor="propertyType">Property Type *</Label>
                  <Select value={formData.propertyType} onValueChange={(value) => handleInputChange('propertyType', value)}>
                    <SelectTrigger className={errors.propertyType ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select property type" />
                    </SelectTrigger>
                    <SelectContent>
                      {propertyTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.propertyType && <p className="text-sm text-red-600">{errors.propertyType}</p>}
                </div>

                <div>
                  <Label htmlFor="address">Street Address *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Enter street address"
                    className={errors.address ? 'border-red-500' : ''}
                  />
                  {errors.address && <p className="text-sm text-red-600">{errors.address}</p>}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="Enter city"
                    className={errors.city ? 'border-red-500' : ''}
                  />
                  {errors.city && <p className="text-sm text-red-600">{errors.city}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="state">State *</Label>
                    <Select value={formData.state} onValueChange={(value) => handleInputChange('state', value)}>
                      <SelectTrigger className={errors.state ? 'border-red-500' : ''}>
                        <SelectValue placeholder="State" />
                      </SelectTrigger>
                      <SelectContent>
                        {states.map((state) => (
                          <SelectItem key={state} value={state}>{state}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.state && <p className="text-sm text-red-600">{errors.state}</p>}
                  </div>

                  <div>
                    <Label htmlFor="zipCode">ZIP Code *</Label>
                    <Input
                      id="zipCode"
                      value={formData.zipCode}
                      onChange={(e) => handleInputChange('zipCode', e.target.value)}
                      placeholder="ZIP code"
                      className={errors.zipCode ? 'border-red-500' : ''}
                    />
                    {errors.zipCode && <p className="text-sm text-red-600">{errors.zipCode}</p>}
                  </div>
                </div>

                <div>
                  <Label htmlFor="country">Country *</Label>
                  <Select value={formData.country} onValueChange={(value) => handleInputChange('country', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country} value={country}>{country}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Cover Image Section */}
            <Separator />
            <ImageUpload
              value={formData.coverImage}
              onChange={(value) => handleInputChange('coverImage', value)}
              label="Cover Image"
              description="This will be the main image displayed for your property. You can upload a file or use an image URL."
              maxWidth={300}
              maxHeight={200}
            />
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="totalUnits">Total Units *</Label>
                  <Input
                    id="totalUnits"
                    type="number"
                    value={formData.totalUnits}
                    onChange={(e) => handleInputChange('totalUnits', e.target.value)}
                    placeholder="Number of units"
                    className={errors.totalUnits ? 'border-red-500' : ''}
                  />
                  {errors.totalUnits && <p className="text-sm text-red-600">{errors.totalUnits}</p>}
                </div>

                <div>
                  <Label htmlFor="floors">Number of Floors</Label>
                  <Input
                    id="floors"
                    type="number"
                    value={formData.floors}
                    onChange={(e) => handleInputChange('floors', e.target.value)}
                    placeholder="Number of floors"
                  />
                </div>

                <div>
                  <Label htmlFor="yearBuilt">Year Built</Label>
                  <Input
                    id="yearBuilt"
                    type="number"
                    value={formData.yearBuilt}
                    onChange={(e) => handleInputChange('yearBuilt', e.target.value)}
                    placeholder="Year built"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="totalArea">Total Area (sq ft)</Label>
                  <Input
                    id="totalArea"
                    type="number"
                    value={formData.totalArea}
                    onChange={(e) => handleInputChange('totalArea', e.target.value)}
                    placeholder="Total square footage"
                  />
                </div>

                <div>
                  <Label htmlFor="lotSize">Lot Size (sq ft)</Label>
                  <Input
                    id="lotSize"
                    type="number"
                    value={formData.lotSize}
                    onChange={(e) => handleInputChange('lotSize', e.target.value)}
                    placeholder="Lot square footage"
                  />
                </div>

                <div>
                  <Label htmlFor="parking">Parking Spaces</Label>
                  <Input
                    id="parking"
                    type="number"
                    value={formData.parking}
                    onChange={(e) => handleInputChange('parking', e.target.value)}
                    placeholder="Number of parking spaces"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            {/* Currency Selection */}
            <div>
              <Label htmlFor="currency">Currency *</Label>
              <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.symbol} {currency.name} ({currency.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">All financial values will be in this currency</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="avgRent">Average Rent per Unit *</Label>
                  <Input
                    id="avgRent"
                    type="number"
                    value={formData.avgRent}
                    onChange={(e) => handleInputChange('avgRent', e.target.value)}
                    placeholder="Average monthly rent"
                    className={errors.avgRent ? 'border-red-500' : ''}
                  />
                  {errors.avgRent && <p className="text-sm text-red-600">{errors.avgRent}</p>}
                </div>

                <div>
                  <Label htmlFor="securityDeposit">Security Deposit</Label>
                  <Input
                    id="securityDeposit"
                    type="number"
                    value={formData.securityDeposit}
                    onChange={(e) => handleInputChange('securityDeposit', e.target.value)}
                    placeholder="Security deposit amount"
                  />
                </div>

                <div>
                  <Label htmlFor="petDeposit">Pet Deposit</Label>
                  <Input
                    id="petDeposit"
                    type="number"
                    value={formData.petDeposit}
                    onChange={(e) => handleInputChange('petDeposit', e.target.value)}
                    placeholder="Pet deposit amount"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="applicationFee">Application Fee</Label>
                  <Input
                    id="applicationFee"
                    type="number"
                    value={formData.applicationFee}
                    onChange={(e) => handleInputChange('applicationFee', e.target.value)}
                    placeholder="Application fee"
                  />
                </div>

                <div>
                  <Label htmlFor="purchasePrice">Purchase Price</Label>
                  <Input
                    id="purchasePrice"
                    type="number"
                    value={formData.purchasePrice}
                    onChange={(e) => handleInputChange('purchasePrice', e.target.value)}
                    placeholder="Original purchase price"
                  />
                </div>

                <div>
                  <Label htmlFor="currentMarketValue">Current Market Value</Label>
                  <Input
                    id="currentMarketValue"
                    type="number"
                    value={formData.currentMarketValue}
                    onChange={(e) => handleInputChange('currentMarketValue', e.target.value)}
                    placeholder="Current estimated value"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="manager">Property Manager Name *</Label>
                  <Input
                    id="manager"
                    value={formData.manager}
                    onChange={(e) => handleInputChange('manager', e.target.value)}
                    placeholder="Manager full name"
                    className={errors.manager ? 'border-red-500' : ''}
                  />
                  {errors.manager && <p className="text-sm text-red-600">{errors.manager}</p>}
                </div>

                <div>
                  <Label htmlFor="managerEmail">Manager Email *</Label>
                  <Input
                    id="managerEmail"
                    type="email"
                    value={formData.managerEmail}
                    onChange={(e) => handleInputChange('managerEmail', e.target.value)}
                    placeholder="manager@example.com"
                    className={errors.managerEmail ? 'border-red-500' : ''}
                  />
                  {errors.managerEmail && <p className="text-sm text-red-600">{errors.managerEmail}</p>}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="managerPhone">Manager Phone *</Label>
                  <Input
                    id="managerPhone"
                    type="tel"
                    value={formData.managerPhone}
                    onChange={(e) => handleInputChange('managerPhone', e.target.value)}
                    placeholder="(555) 123-4567"
                    className={errors.managerPhone ? 'border-red-500' : ''}
                  />
                  {errors.managerPhone && <p className="text-sm text-red-600">{errors.managerPhone}</p>}
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h4 className="font-medium mb-4">Property Features & Amenities</h4>
              <div className="grid md:grid-cols-3 gap-4">
                {availableFeatures.map((feature) => {
                  const IconComponent = feature.icon;
                  const isSelected = formData.features.includes(feature.id);
                  return (
                    <div
                      key={feature.id}
                      className={`flex items-center space-x-3 p-3 border rounded cursor-pointer transition-colors ${
                        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleFeatureToggle(feature.id)}
                    >
                      <div className={`flex items-center justify-center w-8 h-8 rounded ${
                        isSelected ? 'bg-blue-500 text-white' : 'bg-gray-100'
                      }`}>
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <span className="font-medium">{feature.label}</span>
                      {isSelected && <Check className="h-4 w-4 text-blue-500 ml-auto" />}
                    </div>
                  );
                })}
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-4">Unit Features</h4>
              <div className="grid md:grid-cols-3 gap-4">
                {unitFeatures.map((feature) => {
                  const IconComponent = feature.icon;
                  const isSelected = formData.unitFeatures.includes(feature.id);
                  return (
                    <div
                      key={feature.id}
                      className={`flex items-center space-x-3 p-3 border rounded cursor-pointer transition-colors ${
                        isSelected ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleFeatureToggle(feature.id, true)}
                    >
                      <div className={`flex items-center justify-center w-8 h-8 rounded ${
                        isSelected ? 'bg-green-500 text-white' : 'bg-gray-100'
                      }`}>
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <span className="font-medium">{feature.label}</span>
                      {isSelected && <Check className="h-4 w-4 text-green-500 ml-auto" />}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div>
              <h4 className="font-medium mb-4">Insurance Information</h4>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="insuranceProvider">Insurance Provider</Label>
                    <Input
                      id="insuranceProvider"
                      value={formData.insuranceProvider}
                      onChange={(e) => handleInputChange('insuranceProvider', e.target.value)}
                      placeholder="Insurance company name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="insurancePolicyNumber">Policy Number</Label>
                    <Input
                      id="insurancePolicyNumber"
                      value={formData.insurancePolicyNumber}
                      onChange={(e) => handleInputChange('insurancePolicyNumber', e.target.value)}
                      placeholder="Policy number"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="insurancePremium">Annual Premium</Label>
                    <Input
                      id="insurancePremium"
                      type="number"
                      value={formData.insurancePremium}
                      onChange={(e) => handleInputChange('insurancePremium', e.target.value)}
                      placeholder="Annual premium amount"
                    />
                  </div>

                  <div>
                    <Label htmlFor="insuranceExpiration">Policy Expiration</Label>
                    <Input
                      id="insuranceExpiration"
                      type="date"
                      value={formData.insuranceExpiration}
                      onChange={(e) => handleInputChange('insuranceExpiration', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-4">Legal & Tax Information</h4>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="propertyTaxes">Annual Property Taxes</Label>
                  <Input
                    id="propertyTaxes"
                    type="number"
                    value={formData.propertyTaxes}
                    onChange={(e) => handleInputChange('propertyTaxes', e.target.value)}
                    placeholder="Annual tax amount"
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-4">Additional Information</h4>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="description">Property Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe the property, its unique features, and selling points..."
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Internal Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Internal notes, reminders, or special considerations..."
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Info className="h-5 w-5 text-blue-600" />
                <h4 className="font-medium text-blue-900">Review Your Property Information</h4>
              </div>
              <p className="text-sm text-blue-700 mt-2">
                Please review all the information below before submitting. You can go back to make changes if needed.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">{formData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium">{formData.propertyType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Address:</span>
                    <span className="font-medium">{formData.address}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">City, State:</span>
                    <span className="font-medium">{formData.city}, {formData.state} {formData.zipCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Country:</span>
                    <span className="font-medium">{formData.country}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Property Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Units:</span>
                    <span className="font-medium">{formData.totalUnits}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Floors:</span>
                    <span className="font-medium">{formData.floors || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Year Built:</span>
                    <span className="font-medium">{formData.yearBuilt || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Area:</span>
                    <span className="font-medium">{formData.totalArea ? `${formData.totalArea} sq ft` : 'N/A'}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Financial Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Currency:</span>
                    <span className="font-medium">
                      {currencies.find(c => c.code === formData.currency)?.symbol} {currencies.find(c => c.code === formData.currency)?.name} ({formData.currency})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Average Rent:</span>
                    <span className="font-medium">{currencies.find(c => c.code === formData.currency)?.symbol}{formData.avgRent}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Security Deposit:</span>
                    <span className="font-medium">{currencies.find(c => c.code === formData.currency)?.symbol}{formData.securityDeposit || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Purchase Price:</span>
                    <span className="font-medium">{currencies.find(c => c.code === formData.currency)?.symbol}{formData.purchasePrice || 'N/A'}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Manager:</span>
                    <span className="font-medium">{formData.manager}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">{formData.managerEmail}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phone:</span>
                    <span className="font-medium">{formData.managerPhone}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {formData.features.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Property Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {formData.features.map((featureId) => {
                      const feature = availableFeatures.find(f => f.id === featureId);
                      return feature ? (
                        <Badge key={featureId} variant="secondary">
                          {feature.label}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {formData.unitFeatures.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Unit Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {formData.unitFeatures.map((featureId) => {
                      const feature = unitFeatures.find(f => f.id === featureId);
                      return feature ? (
                        <Badge key={featureId} variant="outline">
                          {feature.label}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Cover Image Preview */}
            {formData.coverImage && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Cover Image</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-32 h-24 border rounded-lg overflow-hidden bg-gray-50">
                        <img 
                          src={formData.coverImage} 
                          alt="Property cover"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            if (target.parentNode) {
                              const errorDiv = document.createElement('div');
                              errorDiv.className = 'flex items-center justify-center h-full text-gray-400 text-xs';
                              errorDiv.innerHTML = '<div class="text-center">📷<br/>Error</div>';
                              target.parentNode.appendChild(errorDiv);
                            }
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 break-all">{formData.coverImage}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      default:
        return <div>Invalid step</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button variant="ghost" onClick={onBack} className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Properties
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">Add New Property</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2">
                <span className="text-sm text-gray-600">Step {currentStep} of {steps.length}</span>
                <Progress value={(currentStep / steps.length) * 100} className="w-24 h-2" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Left Sidebar Menu */}
            <aside className="lg:col-span-1">
              <Card>
                <CardContent className="p-4">
                  <nav className="space-y-1">
                    {steps.map((step) => (
                      <button
                        key={step.number}
                        onClick={() => {
                          if (step.number < currentStep || validateStep(currentStep)) {
                            setCurrentStep(step.number);
                          }
                        }}
                        className={`w-full flex items-start space-x-3 px-3 py-3 rounded-lg transition-colors text-left ${
                          currentStep === step.number
                            ? 'bg-gray-900 text-white'
                            : currentStep > step.number
                            ? 'bg-green-50 text-green-900 hover:bg-green-100'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium flex-shrink-0 mt-0.5 ${
                          currentStep === step.number
                            ? 'bg-white text-gray-900'
                            : currentStep > step.number
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}>
                          {currentStep > step.number ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            step.number
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{step.title}</p>
                          <p className={`text-xs mt-0.5 ${
                            currentStep === step.number
                              ? 'text-gray-300'
                              : currentStep > step.number
                              ? 'text-green-700'
                              : 'text-gray-500'
                          }`}>
                            {step.description}
                          </p>
                        </div>
                      </button>
                    ))}
                  </nav>
                </CardContent>
              </Card>
            </aside>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle>{steps[currentStep - 1].title}</CardTitle>
                  <CardDescription>{steps[currentStep - 1].description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {renderStepContent()}
                </CardContent>
              </Card>

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-6">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 1}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>

                <div className="flex space-x-4">
                  {currentStep === steps.length ? (
                    <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">
                      <Save className="h-4 w-4 mr-2" />
                      Add Property
                    </Button>
                  ) : (
                    <Button onClick={handleNext}>
                      Next
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

