import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import { NIGERIAN_CITIES, NIGERIAN_STATES, COUNTRIES } from '../constants/nigeria-locations';
import { Separator } from "./ui/separator";
import { Progress } from "./ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar as CalendarComponent } from "./ui/calendar";
import { ImageUpload } from "./ImageUpload";
import { toast } from "sonner";
import { createManager } from '../lib/api/property-managers';
import { format } from "date-fns";
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
  CheckCircle,
  UserPlus
} from 'lucide-react';

interface AddPropertyPageProps {
  user: any;
  onBack: () => void;
  onSave: (propertyData: any) => void;
  initialValues?: any;
  mode?: 'add' | 'edit';
  managers?: any[];
  onManagerCreated?: () => Promise<void>; // Callback to refresh managers in parent
}

export function AddPropertyPage({ user, onBack, onSave, initialValues, mode = 'add', managers = [], onManagerCreated }: AddPropertyPageProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Basic Information
    name: '',
    propertyType: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
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
    avgRent: '',
    purchasePrice: '',
    currentValue: '',
    securityDeposit: '',
    applicationFee: '',
    cautionFee: '',
    legalFee: '',
    agentCommission: '',
    serviceCharge: '',
    agreementFee: '',

    // Management
    managerId: '',

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

  React.useEffect(() => {
    if (initialValues) {
      // Extract managerId from property_managers array if available
      const currentManagerId = initialValues.property_managers && initialValues.property_managers.length > 0
        ? initialValues.property_managers[0].managerId
        : '';

      console.log('📝 Initializing form with property data:', {
        propertyId: initialValues.id,
        managerId: currentManagerId,
        hasPropertyManagers: !!initialValues.property_managers
      });

      setFormData(prev => ({
        ...prev,
        name: initialValues.name || '',
        propertyType: initialValues.propertyType || '',
        address: initialValues.address || '',
        city: initialValues.city || '',
        state: initialValues.state || '',
        postalCode: initialValues.postalCode || '',
        country: initialValues.country || prev.country,
        yearBuilt: initialValues.yearBuilt != null ? String(initialValues.yearBuilt) : '',
        totalUnits: initialValues.totalUnits != null ? String(initialValues.totalUnits) : '',
        floors: initialValues.floors != null ? String(initialValues.floors) : '',
        totalArea: initialValues.totalArea != null ? String(initialValues.totalArea) : '',
        lotSize: initialValues.lotSize != null ? String(initialValues.lotSize) : '',
        parking: initialValues.parking != null ? String(initialValues.parking) : '',
        currency: initialValues.currency || prev.currency,
        avgRent: initialValues.avgRent != null ? String(initialValues.avgRent) : '',
        purchasePrice: initialValues.purchasePrice != null ? String(initialValues.purchasePrice) : '',
        currentValue: initialValues.currentValue != null ? String(initialValues.currentValue) : '',
        securityDeposit: initialValues.securityDeposit != null ? String(initialValues.securityDeposit) : '',
        applicationFee: initialValues.applicationFee != null ? String(initialValues.applicationFee) : '',
        cautionFee: initialValues.cautionFee != null ? String(initialValues.cautionFee) : '',
        legalFee: initialValues.legalFee != null ? String(initialValues.legalFee) : '',
        agentCommission: initialValues.agentCommission != null ? String(initialValues.agentCommission) : '',
        serviceCharge: initialValues.serviceCharge != null ? String(initialValues.serviceCharge) : '',
        agreementFee: initialValues.agreementFee != null ? String(initialValues.agreementFee) : '',
        managerId: (initialValues.property_managers && initialValues.property_managers.find((pm: any) => pm.isActive)?.managerId) || currentManagerId,
        features: Array.isArray(initialValues.features) ? initialValues.features : [],
        unitFeatures: Array.isArray(initialValues.unitFeatures) ? initialValues.unitFeatures : [],
        insuranceProvider: initialValues.insuranceProvider || '',
        insurancePolicyNumber: initialValues.insurancePolicyNumber || '',
        insurancePremium: initialValues.insurancePremium != null ? String(initialValues.insurancePremium) : '',
        insuranceExpiration: initialValues.insuranceExpiration ? String(initialValues.insuranceExpiration).slice(0, 10) : '',
        propertyTaxes: initialValues.propertyTaxes != null ? String(initialValues.propertyTaxes) : '',
        description: initialValues.description || '',
        notes: initialValues.notes || '',
        coverImage: initialValues.coverImage || (Array.isArray(initialValues.images) && initialValues.images[0]) || '',
        images: Array.isArray(initialValues.images) ? initialValues.images : []
      }));
    }
  }, [initialValues]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showCreateManagerDialog, setShowCreateManagerDialog] = useState(false);
  const [isCreatingManager, setIsCreatingManager] = useState(false);
  const [localManagers, setLocalManagers] = useState(managers);
  const [newManagerForm, setNewManagerForm] = useState({
    name: '',
    email: '',
    phone: '',
    department: ''
  });
  const [managerFormErrors, setManagerFormErrors] = useState<Record<string, string>>({});

  // Update local managers when prop changes
  React.useEffect(() => {
    setLocalManagers(managers);
  }, [managers]);

  const selectedManager = React.useMemo(() => {
    return localManagers.find((m: any) => m.id === (formData as any).managerId);
  }, [localManagers, (formData as any).managerId]);

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
    'Apartment Complex/Block of Flats',
    'Detached House',
    'Semi-Detached Duplex',
    'Duplex',
    'Bungalow',
    'Terrace/Townhouse',
    'Penthouse',
    'Mini Flat',
    'Self-Contained',
    'BQ (Boys Quarters)',
    'Estate Housing',
    'Serviced Apartment',
    'Commercial Property',
    'Office Space',
    'Shop/Retail Space',
    'Plaza/Shopping Complex',
    'Warehouse/Industrial',
    'Mixed Use Building',
    'Hotel/Guest House',
    'Student Hostel'
  ];

  const availableFeatures = [
    { id: 'gated', label: 'Gated Estate', icon: Shield },
    { id: '24hr-security', label: '24/7 Security', icon: Shield },
    { id: 'generator', label: 'Generator/Power Backup', icon: Zap },
    { id: 'borehole', label: 'Borehole/Water Supply', icon: Droplets },
    { id: 'parking', label: 'Parking Space', icon: Car },
    { id: 'elevator', label: 'Elevator/Lift', icon: ArrowRight },
    { id: 'pool', label: 'Swimming Pool', icon: Waves },
    { id: 'gym', label: 'Gym/Fitness Center', icon: Dumbbell },
    { id: 'ac', label: 'Air Conditioning', icon: Thermometer },
    { id: 'garden', label: 'Garden/Green Area', icon: TreePine },
    { id: 'playground', label: 'Children Playground', icon: Home },
    { id: 'wifi', label: 'WiFi/Internet', icon: Wifi },
    { id: 'cctv', label: 'CCTV Surveillance', icon: Shield },
    { id: 'interlocking', label: 'Interlocking Tiles/Paved', icon: Home },
    { id: 'streetlight', label: 'Street Lights', icon: Zap },
    { id: 'wastemanagement', label: 'Waste Management', icon: Home }
  ];

  const unitFeatures = [
    { id: 'ensuite', label: 'En-suite Bathroom', icon: Bath },
    { id: 'kitchen', label: 'Fitted Kitchen', icon: Utensils },
    { id: 'wardrobes', label: 'Built-in Wardrobes', icon: Home },
    { id: 'balcony', label: 'Balcony', icon: Home },
    { id: 'tiles', label: 'Tiled Floors', icon: Home },
    { id: 'pop', label: 'POP Ceiling', icon: Home },
    { id: 'cabinet', label: 'Kitchen Cabinets', icon: Utensils },
    { id: 'water-heater', label: 'Water Heater', icon: Droplets },
    { id: 'prepaid-meter', label: 'Prepaid Meter', icon: Zap },
    { id: 'bq', label: 'Boys Quarters (BQ)', icon: Home },
    { id: 'store', label: 'Store Room', icon: Home },
    { id: 'petsallowed', label: 'Pets Allowed', icon: Home }
  ];

  // Using imported Nigerian cities, states, and countries from constants

  const currencies = [
    { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
    { code: 'XOF', symbol: 'CFA', name: 'West African CFA Franc' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
    { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
    { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
    { code: 'GHS', symbol: '₵', name: 'Ghanaian Cedi' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' }
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
        if (!formData.postalCode.trim()) newErrors.postalCode = 'Postal code is required';
        break;
      case 2:
        if (!formData.totalUnits.trim()) newErrors.totalUnits = 'Total units is required';
        if (parseInt(formData.totalUnits) <= 0) newErrors.totalUnits = 'Total units must be greater than 0';
        break;
      case 3:
        if (!formData.avgRent.trim()) newErrors.avgRent = 'Average rent is required';
        break;
      case 4:
        if (!formData.managerId) newErrors.managerId = 'Please select a manager';
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

  const handleCreateManager = async () => {
    // Validate form
    const newErrors: Record<string, string> = {};
    if (!newManagerForm.name.trim()) newErrors.name = 'Name is required';
    if (!newManagerForm.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(newManagerForm.email)) newErrors.email = 'Invalid email format';

    if (Object.keys(newErrors).length > 0) {
      setManagerFormErrors(newErrors);
      return;
    }

    try {
      setIsCreatingManager(true);
      const response = await createManager({
        name: newManagerForm.name,
        email: newManagerForm.email,
        phone: newManagerForm.phone,
        department: newManagerForm.department,
        sendInvitation: true
      });

      if ((response as any).error) {
        throw new Error((response as any).error);
      }

      const newManager = (response as any).data;

      // Refresh managers from parent if callback provided
      if (onManagerCreated) {
        await onManagerCreated();
      }

      // Add to local managers list
      setLocalManagers(prev => [...prev, newManager]);

      // Auto-select the new manager
      handleInputChange('managerId', newManager.id);

      // Reset form and close dialog
      setNewManagerForm({ name: '', email: '', phone: '', department: '' });
      setManagerFormErrors({});
      setShowCreateManagerDialog(false);

      toast.success(`Manager "${newManager.name}" created successfully!`);

      if ((response as any).data?.tempPassword) {
        toast.info(`Temporary password: ${(response as any).data.tempPassword}`, { duration: 10000 });
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to create manager');
    } finally {
      setIsCreatingManager(false);
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
      if (mode === 'add') {
        toast.success('Property added successfully!');
      }
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
                  <Select value={formData.city} onValueChange={(value) => handleInputChange('city', value)}>
                    <SelectTrigger className={errors.city ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select city" />
                    </SelectTrigger>
                    <SelectContent>
                      {NIGERIAN_CITIES.map((city) => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.city && <p className="text-sm text-red-600">{errors.city}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="state">State *</Label>
                    <Select value={formData.state} onValueChange={(value) => handleInputChange('state', value)}>
                      <SelectTrigger className={errors.state ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {NIGERIAN_STATES.map((state) => (
                          <SelectItem key={state} value={state}>{state}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.state && <p className="text-sm text-red-600">{errors.state}</p>}
                  </div>

                  <div>
                    <Label htmlFor="postalCode">Postal Code *</Label>
                    <Input
                      id="postalCode"
                      value={formData.postalCode}
                      onChange={(e) => handleInputChange('postalCode', e.target.value)}
                      placeholder="Postal code"
                      className={errors.postalCode ? 'border-red-500' : ''}
                    />
                    {errors.postalCode && <p className="text-sm text-red-600">{errors.postalCode}</p>}
                  </div>
                </div>

                <div>
                  <Label htmlFor="country">Country *</Label>
                  <Select value={formData.country} onValueChange={(value) => handleInputChange('country', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((country) => (
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
                  <Label htmlFor="totalUnits">Total Units/Apartments *</Label>
                  <Input
                    id="totalUnits"
                    type="number"
                    value={formData.totalUnits}
                    onChange={(e) => handleInputChange('totalUnits', e.target.value)}
                    placeholder="Number of units or apartments"
                    className={errors.totalUnits ? 'border-red-500' : ''}
                  />
                  {errors.totalUnits && <p className="text-sm text-red-600">{errors.totalUnits}</p>}
                  <p className="text-xs text-gray-500 mt-1">Total number of rentable units in the property</p>
                </div>

                <div>
                  <Label htmlFor="floors">Number of Floors/Storeys</Label>
                  <Input
                    id="floors"
                    type="number"
                    value={formData.floors}
                    onChange={(e) => handleInputChange('floors', e.target.value)}
                    placeholder="Number of floors"
                  />
                  <p className="text-xs text-gray-500 mt-1">G+1, G+2, etc. (Ground + additional floors)</p>
                </div>

                <div>
                  <Label htmlFor="yearBuilt">Year Built/Completed</Label>
                  <Input
                    id="yearBuilt"
                    type="number"
                    value={formData.yearBuilt}
                    onChange={(e) => handleInputChange('yearBuilt', e.target.value)}
                    placeholder="e.g., 2020"
                  />
                  <p className="text-xs text-gray-500 mt-1">Year the property was completed</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="totalArea">Total Built Area (sq m or sq ft)</Label>
                  <Input
                    id="totalArea"
                    type="number"
                    value={formData.totalArea}
                    onChange={(e) => handleInputChange('totalArea', e.target.value)}
                    placeholder="Total built-up area"
                  />
                  <p className="text-xs text-gray-500 mt-1">Total floor area in square meters or square feet</p>
                </div>

                <div>
                  <Label htmlFor="lotSize">Plot/Land Size (sq m or sq ft)</Label>
                  <Input
                    id="lotSize"
                    type="number"
                    value={formData.lotSize}
                    onChange={(e) => handleInputChange('lotSize', e.target.value)}
                    placeholder="Plot size"
                  />
                  <p className="text-xs text-gray-500 mt-1">Total land area (e.g., 600sqm, 1200sqm)</p>
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
                  <p className="text-xs text-gray-500 mt-1">Available parking slots for tenants</p>
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
                  <Label htmlFor="avgRent">Annual Rent per Unit *</Label>
                  <Input
                    id="avgRent"
                    type="number"
                    value={formData.avgRent}
                    onChange={(e) => handleInputChange('avgRent', e.target.value)}
                    placeholder="Annual rent amount"
                    className={errors.avgRent ? 'border-red-500' : ''}
                  />
                  {errors.avgRent && <p className="text-sm text-red-600">{errors.avgRent}</p>}
                  <p className="text-xs text-gray-500 mt-1">Typical Nigerian rental period is annual</p>
                </div>

                <div>
                  <Label htmlFor="serviceCharge">Annual Service Charge</Label>
                  <Input
                    id="serviceCharge"
                    type="number"
                    value={formData.serviceCharge}
                    onChange={(e) => handleInputChange('serviceCharge', e.target.value)}
                    placeholder="Service charge amount"
                  />
                  <p className="text-xs text-gray-500 mt-1">Covers maintenance, security, waste management</p>
                </div>

                <div>
                  <Label htmlFor="legalFee">Legal/Documentation Fee</Label>
                  <Input
                    id="legalFee"
                    type="number"
                    value={formData.legalFee}
                    onChange={(e) => handleInputChange('legalFee', e.target.value)}
                    placeholder="Legal documentation fee"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="agreementFee">Agreement Fee</Label>
                  <Input
                    id="agreementFee"
                    type="number"
                    value={formData.agreementFee}
                    onChange={(e) => handleInputChange('agreementFee', e.target.value)}
                    placeholder="Tenancy agreement fee"
                  />
                  <p className="text-xs text-gray-500 mt-1">One-time tenancy agreement processing</p>
                </div>

                <div>
                  <Label htmlFor="agentCommission">Agent Commission</Label>
                  <Input
                    id="agentCommission"
                    type="number"
                    value={formData.agentCommission}
                    onChange={(e) => handleInputChange('agentCommission', e.target.value)}
                    placeholder="Agent commission amount"
                  />
                  <p className="text-xs text-gray-500 mt-1">Typically 10% of annual rent</p>
                </div>

                <div>
                  <Label htmlFor="securityDeposit">Security Deposit</Label>
                  <Input
                    id="securityDeposit"
                    type="number"
                    value={formData.securityDeposit}
                    onChange={(e) => handleInputChange('securityDeposit', e.target.value)}
                    placeholder="Additional security deposit"
                  />
                </div>

                <div>
                  <Label htmlFor="applicationFee">Application/Inspection Fee</Label>
                  <Input
                    id="applicationFee"
                    type="number"
                    value={formData.applicationFee}
                    onChange={(e) => handleInputChange('applicationFee', e.target.value)}
                    placeholder="Application fee"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="managerId">Select Property Manager *</Label>
                <Select value={(formData as any).managerId || ''} onValueChange={(value) => handleInputChange('managerId', value)}>
                  <SelectTrigger className={errors.managerId ? 'border-red-500' : ''}>
                    <SelectValue placeholder={localManagers.length ? 'Choose a manager' : 'No managers available'} />
                  </SelectTrigger>
                  <SelectContent>
                    {localManagers.map((m: any) => (
                      <SelectItem key={m.id} value={m.id}>{m.name} ({m.email})</SelectItem>
                    ))}
                    <Separator className="my-2" />
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full justify-start text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      onClick={(e) => {
                        e.preventDefault();
                        setShowCreateManagerDialog(true);
                      }}
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Create New Manager
                    </Button>
                  </SelectContent>
                </Select>
                {errors.managerId && <p className="text-sm text-red-600">{errors.managerId}</p>}
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
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {formData.insuranceExpiration ? (
                            format(new Date(formData.insuranceExpiration), "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-white border-gray-300" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={formData.insuranceExpiration ? new Date(formData.insuranceExpiration) : undefined}
                          onSelect={(date) => {
                            if (date) {
                              handleInputChange('insuranceExpiration', format(date, 'yyyy-MM-dd'));
                            }
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
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
                    <span className="font-medium">{formData.city}, {formData.state} {formData.postalCode}</span>
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
                  <div className="flex justify-between">
                    <span className="text-gray-600">Lot Size:</span>
                    <span className="font-medium">{formData.lotSize ? `${formData.lotSize} sq ft` : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Parking Spaces:</span>
                    <span className="font-medium">{formData.parking || 'N/A'}</span>
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
                    <span className="text-gray-600">Annual Rent:</span>
                    <span className="font-medium">{currencies.find(c => c.code === formData.currency)?.symbol}{formData.avgRent}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Security Deposit:</span>
                    <span className="font-medium">{currencies.find(c => c.code === formData.currency)?.symbol}{formData.securityDeposit || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Service Charge:</span>
                    <span className="font-medium">{currencies.find(c => c.code === formData.currency)?.symbol}{formData.serviceCharge || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Application Fee:</span>
                    <span className="font-medium">{currencies.find(c => c.code === formData.currency)?.symbol}{formData.applicationFee || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Legal Fee:</span>
                    <span className="font-medium">{currencies.find(c => c.code === formData.currency)?.symbol}{formData.legalFee || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Agreement Fee:</span>
                    <span className="font-medium">{currencies.find(c => c.code === formData.currency)?.symbol}{formData.agreementFee || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Agent Commission:</span>
                    <span className="font-medium">{currencies.find(c => c.code === formData.currency)?.symbol}{formData.agentCommission || 'N/A'}</span>
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
                    <span className="font-medium">{selectedManager?.name || 'Unassigned'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">{selectedManager?.email || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phone:</span>
                    <span className="font-medium">{selectedManager?.phone || '—'}</span>
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

            {/* Insurance & Legal Information */}
            {(formData.insuranceProvider || formData.insurancePolicyNumber || formData.insurancePremium || formData.insuranceExpiration || formData.propertyTaxes) && (
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Insurance Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Provider:</span>
                      <span className="font-medium">{formData.insuranceProvider || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Policy Number:</span>
                      <span className="font-medium">{formData.insurancePolicyNumber || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Annual Premium:</span>
                      <span className="font-medium">
                        {formData.insurancePremium ? `${currencies.find(c => c.code === formData.currency)?.symbol}${formData.insurancePremium}` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Expiration:</span>
                      <span className="font-medium">{formData.insuranceExpiration || 'N/A'}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Legal & Tax</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Annual Property Taxes:</span>
                      <span className="font-medium">
                        {formData.propertyTaxes ? `${currencies.find(c => c.code === formData.currency)?.symbol}${formData.propertyTaxes}` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Legal/Documentation Fee:</span>
                      <span className="font-medium">
                        {formData.legalFee ? `${currencies.find(c => c.code === formData.currency)?.symbol}${formData.legalFee}` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Agreement Fee:</span>
                      <span className="font-medium">
                        {formData.agreementFee ? `${currencies.find(c => c.code === formData.currency)?.symbol}${formData.agreementFee}` : 'N/A'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Additional Information */}
            {(formData.description || formData.notes) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Additional Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {formData.description && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-600 mb-1">Description:</h5>
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">{formData.description}</p>
                    </div>
                  )}
                  {formData.notes && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-600 mb-1">Internal Notes:</h5>
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">{formData.notes}</p>
                    </div>
                  )}
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
                      <p className="text-sm text-gray-600 break-all">
                        {formData.coverImage.startsWith('data:')
                          ? 'Uploaded image (base64)'
                          : formData.coverImage.length > 80
                            ? formData.coverImage.slice(0, 80) + '…'
                            : formData.coverImage}
                      </p>
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
              <h1 className="text-xl font-semibold text-gray-900">{mode === 'edit' ? 'Edit Property' : 'Add New Property'}</h1>
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
                    <Button onClick={handleSubmit} className="bg-gradient-to-r from-gray-900 to-black hover:from-black hover:to-gray-900 text-white">
                      <Save className="h-4 w-4 mr-2" />
                      {mode === 'edit' ? 'Save Changes' : 'Add Property'}
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

      {/* Create Manager Dialog */}
      <Dialog open={showCreateManagerDialog} onOpenChange={setShowCreateManagerDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Property Manager</DialogTitle>
            <DialogDescription>
              Add a new manager to your organization. They will receive an email with login credentials.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="manager-name">Manager Name *</Label>
              <Input
                id="manager-name"
                placeholder="Enter full name"
                value={newManagerForm.name}
                onChange={(e) => {
                  setNewManagerForm(prev => ({ ...prev, name: e.target.value }));
                  if (managerFormErrors.name) {
                    setManagerFormErrors(prev => ({ ...prev, name: '' }));
                  }
                }}
                className={managerFormErrors.name ? 'border-red-500' : ''}
              />
              {managerFormErrors.name && (
                <p className="text-sm text-red-600 mt-1">{managerFormErrors.name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="manager-email">Email Address *</Label>
              <Input
                id="manager-email"
                type="email"
                placeholder="manager@example.com"
                value={newManagerForm.email}
                onChange={(e) => {
                  setNewManagerForm(prev => ({ ...prev, email: e.target.value }));
                  if (managerFormErrors.email) {
                    setManagerFormErrors(prev => ({ ...prev, email: '' }));
                  }
                }}
                className={managerFormErrors.email ? 'border-red-500' : ''}
              />
              {managerFormErrors.email && (
                <p className="text-sm text-red-600 mt-1">{managerFormErrors.email}</p>
              )}
            </div>

            <div>
              <Label htmlFor="manager-phone">Phone Number (Optional)</Label>
              <Input
                id="manager-phone"
                type="tel"
                placeholder="+234 800 000 0000"
                value={newManagerForm.phone}
                onChange={(e) => {
                  setNewManagerForm(prev => ({ ...prev, phone: e.target.value }));
                }}
              />
            </div>

            <div>
              <Label htmlFor="manager-department">Department (Optional)</Label>
              <Input
                id="manager-department"
                placeholder="e.g., Property Management"
                value={newManagerForm.department}
                onChange={(e) => {
                  setNewManagerForm(prev => ({ ...prev, department: e.target.value }));
                }}
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start">
                <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                <p className="text-sm text-blue-800">
                  A temporary password will be generated and sent to the manager's email address.
                  They will be able to log in and change their password on first login.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowCreateManagerDialog(false);
                setNewManagerForm({ name: '', email: '', phone: '', department: '' });
                setManagerFormErrors({});
              }}
              disabled={isCreatingManager}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreateManager}
              disabled={isCreatingManager}
              className="bg-gradient-to-r from-gray-900 to-black hover:from-black hover:to-gray-900 text-white"
            >
              {isCreatingManager ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create Manager
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

