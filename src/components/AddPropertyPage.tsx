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
  UserPlus,
  LayoutGrid
} from 'lucide-react';

interface AddPropertyPageProps {
  user: any;
  onBack: () => void;
  onSave: (propertyData: any) => void;
  initialValues?: any;
  mode?: 'add' | 'edit';
  managers?: any[];
  onManagerCreated?: () => Promise<void>; // Callback to refresh managers in parent
  propertyLimit?: number;
  currentPropertyCount?: number;
  unitLimit?: number;
  currentUnitCount?: number;
}

export function AddPropertyPage({ user, onBack, onSave, initialValues, mode = 'add', managers = [], onManagerCreated, propertyLimit, currentPropertyCount = 0, unitLimit, currentUnitCount = 0 }: AddPropertyPageProps) {
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
  const [isSubmitting, setIsSubmitting] = useState(false);
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
        // Check property limit on step 1 (early warning)
        if (mode === 'add' && propertyLimit !== undefined && currentPropertyCount >= propertyLimit) {
          newErrors.propertyLimit = `Property limit reached (${currentPropertyCount}/${propertyLimit}). Please upgrade your plan.`;
        }
        break;
      case 2:
        if (!formData.totalUnits.trim()) newErrors.totalUnits = 'Total units is required';
        if (parseInt(formData.totalUnits) <= 0) newErrors.totalUnits = 'Total units must be greater than 0';
        // Check unit limit
        if (mode === 'add' && unitLimit !== undefined && unitLimit > 0) {
          const totalUnitsToAdd = parseInt(formData.totalUnits) || 0;
          const newTotalUnits = currentUnitCount + totalUnitsToAdd;
          if (newTotalUnits > unitLimit) {
            const remainingUnits = Math.max(0, unitLimit - currentUnitCount);
            newErrors.totalUnits = `Unit limit exceeded. You can only add ${remainingUnits} more units (${currentUnitCount}/${unitLimit} used).`;
          }
        }
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

  const handleSubmit = async () => {
    // Prevent double submission
    if (isSubmitting) {
      return;
    }

    if (validateStep(currentStep)) {
      // Validate property limit (only for new properties, not edits)
      if (mode === 'add' && propertyLimit !== undefined) {
        if (currentPropertyCount >= propertyLimit) {
          toast.error(`Property limit reached. Your plan allows ${propertyLimit} properties. Please upgrade your plan to add more properties.`);
          return;
        }
      }

      // Validate unit limit
      const totalUnitsToAdd = parseInt(formData.totalUnits) || 0;
      if (mode === 'add' && unitLimit !== undefined && unitLimit > 0) {
        const newTotalUnits = currentUnitCount + totalUnitsToAdd;
        if (newTotalUnits > unitLimit) {
          const remainingUnits = Math.max(0, unitLimit - currentUnitCount);
          toast.error(`Unit limit exceeded. Your plan allows ${unitLimit} total units. You currently have ${currentUnitCount} units and can only add ${remainingUnits} more. Please upgrade your plan.`);
          return;
        }
      }

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

      // Set submitting state to prevent double clicks
      setIsSubmitting(true);

      try {
        await onSave(propertyData);
        if (mode === 'add') {
          toast.success('Property added successfully!');
        }
      } catch (error: any) {
        toast.error(error?.message || 'Failed to save property');
        setIsSubmitting(false);
      }
      // Note: We don't reset isSubmitting on success because the component
      // will navigate away after successful save
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-8">
            {/* Property Identity Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#7C3AED] flex items-center justify-center">
                  <Home className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Property Identity</h3>
                  <p className="text-sm text-gray-600">Basic information about your property</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-sm font-semibold text-gray-700">
                      Property Name *
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter property name"
                      className={`border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED] ${errors.name ? 'border-red-500' : ''}`}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="propertyType" className="text-sm font-semibold text-gray-700">
                      Property Type *
                    </Label>
                    <Select value={formData.propertyType} onValueChange={(value) => handleInputChange('propertyType', value)}>
                      <SelectTrigger className={`border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED] ${errors.propertyType ? 'border-red-500' : ''}`}>
                        <SelectValue placeholder="Select property type" />
                      </SelectTrigger>
                      <SelectContent>
                        {propertyTypes.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.propertyType && (
                      <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.propertyType}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="address" className="text-sm font-semibold text-gray-700">
                      Street Address *
                    </Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="Enter street address"
                      className={`border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED] ${errors.address ? 'border-red-500' : ''}`}
                    />
                    {errors.address && (
                      <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.address}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="city" className="text-sm font-semibold text-gray-700">
                      City *
                    </Label>
                    <Select value={formData.city} onValueChange={(value) => handleInputChange('city', value)}>
                      <SelectTrigger className={`border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED] ${errors.city ? 'border-red-500' : ''}`}>
                        <SelectValue placeholder="Select city" />
                      </SelectTrigger>
                      <SelectContent>
                        {NIGERIAN_CITIES.map((city) => (
                          <SelectItem key={city} value={city}>{city}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.city && (
                      <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.city}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="state" className="text-sm font-semibold text-gray-700">
                        State *
                      </Label>
                      <Select value={formData.state} onValueChange={(value) => handleInputChange('state', value)}>
                        <SelectTrigger className={`border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED] ${errors.state ? 'border-red-500' : ''}`}>
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          {NIGERIAN_STATES.map((state) => (
                            <SelectItem key={state} value={state}>{state}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.state && (
                        <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.state}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="postalCode" className="text-sm font-semibold text-gray-700">
                        Postal Code *
                      </Label>
                      <Input
                        id="postalCode"
                        value={formData.postalCode}
                        onChange={(e) => handleInputChange('postalCode', e.target.value)}
                        placeholder="Postal code"
                        className={`border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED] ${errors.postalCode ? 'border-red-500' : ''}`}
                      />
                      {errors.postalCode && (
                        <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.postalCode}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="country" className="text-sm font-semibold text-gray-700">
                      Country *
                    </Label>
                    <Select value={formData.country} onValueChange={(value) => handleInputChange('country', value)}>
                      <SelectTrigger className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]">
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
            </div>

            {/* Location Summary Card */}
            {(formData.address || formData.city || formData.state) && (
              <div className="rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#7C3AED] flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-white" />
                  </div>
                  <h4 className="text-base font-bold text-gray-900">Location Summary</h4>
                </div>
                <div className="bg-white rounded-lg p-4 border border-purple-200">
                  <div className="space-y-2">
                    {formData.name && (
                      <p className="text-lg font-bold text-[#7C3AED]">{formData.name}</p>
                    )}
                    {formData.propertyType && (
                      <p className="text-sm text-gray-600">
                        <span className="font-semibold">Type:</span> {formData.propertyType}
                      </p>
                    )}
                    {formData.address && (
                      <p className="text-sm text-gray-900">{formData.address}</p>
                    )}
                    <p className="text-sm text-gray-600">
                      {[formData.city, formData.state, formData.postalCode].filter(Boolean).join(', ')}
                    </p>
                    {formData.country && (
                      <p className="text-sm text-gray-600 font-medium">{formData.country}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Cover Image Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#7C3AED] flex items-center justify-center">
                  <Camera className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Property Image</h3>
                  <p className="text-sm text-gray-600">Upload a cover image for your property</p>
                </div>
              </div>
              <ImageUpload
                value={formData.coverImage}
                onChange={(value) => handleInputChange('coverImage', value)}
                label="Cover Image"
                description="This will be the main image displayed for your property. You can upload a file or use an image URL."
                maxWidth={300}
                maxHeight={200}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-8">
            {/* Property Specifications Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#7C3AED] flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Property Specifications</h3>
                  <p className="text-sm text-gray-600">Enter the physical details of your property</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="totalUnits" className="text-sm font-semibold text-gray-700">
                      Total Units/Apartments *
                    </Label>
                    <Input
                      id="totalUnits"
                      type="number"
                      value={formData.totalUnits}
                      onChange={(e) => handleInputChange('totalUnits', e.target.value)}
                      placeholder="Number of units or apartments"
                      className={`border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED] ${errors.totalUnits ? 'border-red-500' : ''}`}
                    />
                    {errors.totalUnits && (
                      <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.totalUnits}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">Total number of rentable units in the property</p>
                  </div>

                  <div>
                    <Label htmlFor="floors" className="text-sm font-semibold text-gray-700">
                      Number of Floors/Storeys
                    </Label>
                    <Input
                      id="floors"
                      type="number"
                      value={formData.floors}
                      onChange={(e) => handleInputChange('floors', e.target.value)}
                      placeholder="Number of floors"
                      className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                    />
                    <p className="text-xs text-gray-500 mt-1">G+1, G+2, etc. (Ground + additional floors)</p>
                  </div>

                  <div>
                    <Label htmlFor="yearBuilt" className="text-sm font-semibold text-gray-700">
                      Year Built/Completed
                    </Label>
                    <Input
                      id="yearBuilt"
                      type="number"
                      value={formData.yearBuilt}
                      onChange={(e) => handleInputChange('yearBuilt', e.target.value)}
                      placeholder="e.g., 2020"
                      className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                    />
                    <p className="text-xs text-gray-500 mt-1">Year the property was completed</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="totalArea" className="text-sm font-semibold text-gray-700">
                      Total Built Area (sq m or sq ft)
                    </Label>
                    <Input
                      id="totalArea"
                      type="number"
                      value={formData.totalArea}
                      onChange={(e) => handleInputChange('totalArea', e.target.value)}
                      placeholder="Total built-up area"
                      className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                    />
                    <p className="text-xs text-gray-500 mt-1">Total floor area in square meters or square feet</p>
                  </div>

                  <div>
                    <Label htmlFor="lotSize" className="text-sm font-semibold text-gray-700">
                      Plot/Land Size (sq m or sq ft)
                    </Label>
                    <Input
                      id="lotSize"
                      type="number"
                      value={formData.lotSize}
                      onChange={(e) => handleInputChange('lotSize', e.target.value)}
                      placeholder="Plot size"
                      className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                    />
                    <p className="text-xs text-gray-500 mt-1">Total land area (e.g., 600sqm, 1200sqm)</p>
                  </div>

                  <div>
                    <Label htmlFor="parking" className="text-sm font-semibold text-gray-700">
                      Parking Spaces
                    </Label>
                    <Input
                      id="parking"
                      type="number"
                      value={formData.parking}
                      onChange={(e) => handleInputChange('parking', e.target.value)}
                      placeholder="Number of parking spaces"
                      className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                    />
                    <p className="text-xs text-gray-500 mt-1">Available parking slots for tenants</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Property Summary Card */}
            <div className="rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100/50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#7C3AED] flex items-center justify-center">
                  <LayoutGrid className="h-5 w-5 text-white" />
                </div>
                <h4 className="text-base font-bold text-gray-900">Property Summary</h4>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-3 border border-purple-200">
                  <p className="text-xs text-gray-600 mb-1">Total Units</p>
                  <p className="text-lg font-bold text-[#7C3AED]">{formData.totalUnits || '0'}</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-purple-200">
                  <p className="text-xs text-gray-600 mb-1">Floors</p>
                  <p className="text-lg font-bold text-[#7C3AED]">{formData.floors || '0'}</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-purple-200">
                  <p className="text-xs text-gray-600 mb-1">Parking Spaces</p>
                  <p className="text-lg font-bold text-[#7C3AED]">{formData.parking || '0'}</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-8">
            {/* Currency Selection Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#7C3AED] flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Financial Information</h3>
                  <p className="text-sm text-gray-600">Set rental rates and additional charges</p>
                </div>
              </div>

              <div>
                <Label htmlFor="currency" className="text-sm font-semibold text-gray-700">
                  Currency *
                </Label>
                <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                  <SelectTrigger className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]">
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
            </div>

            {/* Rental & Fees Section */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="avgRent" className="text-sm font-semibold text-gray-700">
                    Annual Rent per Unit *
                  </Label>
                  <Input
                    id="avgRent"
                    type="number"
                    value={formData.avgRent}
                    onChange={(e) => handleInputChange('avgRent', e.target.value)}
                    placeholder="Annual rent amount"
                    className={`border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED] ${errors.avgRent ? 'border-red-500' : ''}`}
                  />
                  {errors.avgRent && (
                    <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.avgRent}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Typical Nigerian rental period is annual</p>
                </div>

                <div>
                  <Label htmlFor="serviceCharge" className="text-sm font-semibold text-gray-700">
                    Annual Service Charge
                  </Label>
                  <Input
                    id="serviceCharge"
                    type="number"
                    value={formData.serviceCharge}
                    onChange={(e) => handleInputChange('serviceCharge', e.target.value)}
                    placeholder="Service charge amount"
                    className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                  />
                  <p className="text-xs text-gray-500 mt-1">Covers maintenance, security, waste management</p>
                </div>

                <div>
                  <Label htmlFor="legalFee" className="text-sm font-semibold text-gray-700">
                    Legal/Documentation Fee
                  </Label>
                  <Input
                    id="legalFee"
                    type="number"
                    value={formData.legalFee}
                    onChange={(e) => handleInputChange('legalFee', e.target.value)}
                    placeholder="Legal documentation fee"
                    className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                  />
                </div>

                <div>
                  <Label htmlFor="applicationFee" className="text-sm font-semibold text-gray-700">
                    Application/Inspection Fee
                  </Label>
                  <Input
                    id="applicationFee"
                    type="number"
                    value={formData.applicationFee}
                    onChange={(e) => handleInputChange('applicationFee', e.target.value)}
                    placeholder="Application fee"
                    className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="agreementFee" className="text-sm font-semibold text-gray-700">
                    Agreement Fee
                  </Label>
                  <Input
                    id="agreementFee"
                    type="number"
                    value={formData.agreementFee}
                    onChange={(e) => handleInputChange('agreementFee', e.target.value)}
                    placeholder="Tenancy agreement fee"
                    className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                  />
                  <p className="text-xs text-gray-500 mt-1">One-time tenancy agreement processing</p>
                </div>

                <div>
                  <Label htmlFor="agentCommission" className="text-sm font-semibold text-gray-700">
                    Agent Commission
                  </Label>
                  <Input
                    id="agentCommission"
                    type="number"
                    value={formData.agentCommission}
                    onChange={(e) => handleInputChange('agentCommission', e.target.value)}
                    placeholder="Agent commission amount"
                    className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                  />
                  <p className="text-xs text-gray-500 mt-1">Typically 10% of annual rent</p>
                </div>

                <div>
                  <Label htmlFor="securityDeposit" className="text-sm font-semibold text-gray-700">
                    Security Deposit
                  </Label>
                  <Input
                    id="securityDeposit"
                    type="number"
                    value={formData.securityDeposit}
                    onChange={(e) => handleInputChange('securityDeposit', e.target.value)}
                    placeholder="Additional security deposit"
                    className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                  />
                </div>
              </div>
            </div>

            {/* Financial Summary Card */}
            {(formData.avgRent || formData.serviceCharge || formData.securityDeposit) && (
              <div className="rounded-xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-white" />
                  </div>
                  <h4 className="text-base font-bold text-gray-900">Financial Summary</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {formData.avgRent && (
                    <div className="bg-white rounded-lg p-4 border border-green-200">
                      <p className="text-xs text-gray-600 mb-1">Annual Rent</p>
                      <p className="text-xl font-bold text-green-600">
                        {formData.currency === 'NGN' ? '₦' : formData.currency === 'USD' ? '$' : formData.currency === 'GBP' ? '£' : formData.currency === 'EUR' ? '€' : ''}
                        {Number(formData.avgRent).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {formData.serviceCharge && (
                    <div className="bg-white rounded-lg p-4 border border-green-200">
                      <p className="text-xs text-gray-600 mb-1">Service Charge</p>
                      <p className="text-xl font-bold text-green-600">
                        {formData.currency === 'NGN' ? '₦' : formData.currency === 'USD' ? '$' : formData.currency === 'GBP' ? '£' : formData.currency === 'EUR' ? '€' : ''}
                        {Number(formData.serviceCharge).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {(formData.avgRent && formData.serviceCharge) && (
                    <div className="bg-white rounded-lg p-4 border border-green-200">
                      <p className="text-xs text-gray-600 mb-1">Total Annual</p>
                      <p className="text-xl font-bold text-green-600">
                        {formData.currency === 'NGN' ? '₦' : formData.currency === 'USD' ? '$' : formData.currency === 'GBP' ? '£' : formData.currency === 'EUR' ? '€' : ''}
                        {(Number(formData.avgRent || 0) + Number(formData.serviceCharge || 0)).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>

                {/* Additional Fees Summary */}
                {(formData.legalFee || formData.agreementFee || formData.agentCommission || formData.applicationFee || formData.securityDeposit) && (
                  <div className="mt-4 bg-white rounded-lg p-4 border border-green-200">
                    <p className="text-xs font-semibold text-gray-700 mb-2">One-Time Fees</p>
                    <div className="space-y-1 text-sm">
                      {formData.securityDeposit && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Security Deposit:</span>
                          <span className="font-semibold text-gray-900">
                            {formData.currency === 'NGN' ? '₦' : formData.currency === 'USD' ? '$' : formData.currency === 'GBP' ? '£' : formData.currency === 'EUR' ? '€' : ''}
                            {Number(formData.securityDeposit).toLocaleString()}
                          </span>
                        </div>
                      )}
                      {formData.legalFee && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Legal Fee:</span>
                          <span className="font-semibold text-gray-900">
                            {formData.currency === 'NGN' ? '₦' : formData.currency === 'USD' ? '$' : formData.currency === 'GBP' ? '£' : formData.currency === 'EUR' ? '€' : ''}
                            {Number(formData.legalFee).toLocaleString()}
                          </span>
                        </div>
                      )}
                      {formData.agreementFee && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Agreement Fee:</span>
                          <span className="font-semibold text-gray-900">
                            {formData.currency === 'NGN' ? '₦' : formData.currency === 'USD' ? '$' : formData.currency === 'GBP' ? '£' : formData.currency === 'EUR' ? '€' : ''}
                            {Number(formData.agreementFee).toLocaleString()}
                          </span>
                        </div>
                      )}
                      {formData.agentCommission && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Agent Commission:</span>
                          <span className="font-semibold text-gray-900">
                            {formData.currency === 'NGN' ? '₦' : formData.currency === 'USD' ? '$' : formData.currency === 'GBP' ? '£' : formData.currency === 'EUR' ? '€' : ''}
                            {Number(formData.agentCommission).toLocaleString()}
                          </span>
                        </div>
                      )}
                      {formData.applicationFee && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Application Fee:</span>
                          <span className="font-semibold text-gray-900">
                            {formData.currency === 'NGN' ? '₦' : formData.currency === 'USD' ? '$' : formData.currency === 'GBP' ? '£' : formData.currency === 'EUR' ? '€' : ''}
                            {Number(formData.applicationFee).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="managerId" className="text-sm font-semibold text-gray-700 mb-2 block">
                  Select Property Manager *
                </Label>
                <Select value={(formData as any).managerId || ''} onValueChange={(value) => handleInputChange('managerId', value)}>
                  <SelectTrigger className={`border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED] ${errors.managerId ? 'border-red-500' : ''}`}>
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
                      className="w-full justify-start text-[#7C3AED] hover:text-[#6D28D9] hover:bg-purple-50 font-semibold"
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
                {errors.managerId && <p className="text-sm text-red-600 mt-1 flex items-center"><AlertCircle className="h-4 w-4 mr-1" />{errors.managerId}</p>}
              </div>

              {selectedManager && (
                <div className="mt-4 p-5 bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200 rounded-xl">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-[#7C3AED] rounded-xl">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-base font-bold text-gray-900 mb-2">Selected Manager</h4>
                      <div className="space-y-2">
                        <div className="flex items-center text-sm">
                          <span className="font-semibold text-gray-700 w-20">Name:</span>
                          <span className="text-gray-900">{selectedManager.name}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <span className="font-semibold text-gray-700 w-20">Email:</span>
                          <span className="text-gray-600">{selectedManager.email}</span>
                        </div>
                        {selectedManager.phone && (
                          <div className="flex items-center text-sm">
                            <span className="font-semibold text-gray-700 w-20">Phone:</span>
                            <span className="text-gray-600">{selectedManager.phone}</span>
                          </div>
                        )}
                        {selectedManager.department && (
                          <div className="flex items-center text-sm">
                            <span className="font-semibold text-gray-700 w-20">Dept:</span>
                            <span className="text-gray-600">{selectedManager.department}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-8">
            <div>
              <div className="flex items-center mb-5">
                <div className="p-2 bg-[#7C3AED] rounded-lg mr-3">
                  <Home className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900">Property Features & Amenities</h4>
                  <p className="text-sm text-gray-600">Select all features available at the property level</p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableFeatures.map((feature) => {
                  const IconComponent = feature.icon;
                  const isSelected = formData.features.includes(feature.id);
                  return (
                    <div
                      key={feature.id}
                      className={`flex items-center space-x-3 p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? 'border-[#7C3AED] bg-gradient-to-br from-purple-50 to-purple-100/50 shadow-md'
                          : 'border-gray-200 hover:border-[#7C3AED]/50 hover:bg-gray-50'
                      }`}
                      onClick={() => handleFeatureToggle(feature.id)}
                    >
                      <div className={`flex items-center justify-center w-10 h-10 rounded-xl transition-colors ${
                        isSelected ? 'bg-[#7C3AED] text-white' : 'bg-gray-100 text-gray-600'
                      }`}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <span className={`font-semibold flex-1 ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                        {feature.label}
                      </span>
                      {isSelected && (
                        <div className="flex-shrink-0">
                          <Check className="h-5 w-5 text-[#7C3AED]" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {formData.features.length > 0 && (
                <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-xl">
                  <p className="text-sm font-semibold text-[#7C3AED]">
                    {formData.features.length} {formData.features.length === 1 ? 'feature' : 'features'} selected
                  </p>
                </div>
              )}
            </div>

            <Separator className="bg-gray-200" />

            <div>
              <div className="flex items-center mb-5">
                <div className="p-2 bg-green-500 rounded-lg mr-3">
                  <Bed className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900">Unit Features</h4>
                  <p className="text-sm text-gray-600">Select features available in individual units</p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {unitFeatures.map((feature) => {
                  const IconComponent = feature.icon;
                  const isSelected = formData.unitFeatures.includes(feature.id);
                  return (
                    <div
                      key={feature.id}
                      className={`flex items-center space-x-3 p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? 'border-green-500 bg-gradient-to-br from-green-50 to-green-100/50 shadow-md'
                          : 'border-gray-200 hover:border-green-500/50 hover:bg-gray-50'
                      }`}
                      onClick={() => handleFeatureToggle(feature.id, true)}
                    >
                      <div className={`flex items-center justify-center w-10 h-10 rounded-xl transition-colors ${
                        isSelected ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'
                      }`}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <span className={`font-semibold flex-1 ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                        {feature.label}
                      </span>
                      {isSelected && (
                        <div className="flex-shrink-0">
                          <Check className="h-5 w-5 text-green-500" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {formData.unitFeatures.length > 0 && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <p className="text-sm font-semibold text-green-700">
                    {formData.unitFeatures.length} {formData.unitFeatures.length === 1 ? 'feature' : 'features'} selected
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-8">
            {/* Insurance Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Insurance Information</h3>
                  <p className="text-sm text-gray-600">Property insurance and coverage details</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="insuranceProvider" className="text-sm font-semibold text-gray-700">
                      Insurance Provider
                    </Label>
                    <Input
                      id="insuranceProvider"
                      value={formData.insuranceProvider}
                      onChange={(e) => handleInputChange('insuranceProvider', e.target.value)}
                      placeholder="Insurance company name"
                      className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                    />
                  </div>

                  <div>
                    <Label htmlFor="insurancePolicyNumber" className="text-sm font-semibold text-gray-700">
                      Policy Number
                    </Label>
                    <Input
                      id="insurancePolicyNumber"
                      value={formData.insurancePolicyNumber}
                      onChange={(e) => handleInputChange('insurancePolicyNumber', e.target.value)}
                      placeholder="Policy number"
                      className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="insurancePremium" className="text-sm font-semibold text-gray-700">
                      Annual Premium
                    </Label>
                    <Input
                      id="insurancePremium"
                      type="number"
                      value={formData.insurancePremium}
                      onChange={(e) => handleInputChange('insurancePremium', e.target.value)}
                      placeholder="Annual premium amount"
                      className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                    />
                  </div>

                  <div>
                    <Label htmlFor="insuranceExpiration" className="text-sm font-semibold text-gray-700">
                      Policy Expiration
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal border-gray-300 hover:border-[#7C3AED] focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                        >
                          <Calendar className="mr-2 h-4 w-4 text-[#7C3AED]" />
                          {formData.insuranceExpiration ? (
                            format(new Date(formData.insuranceExpiration), "PPP")
                          ) : (
                            <span className="text-gray-500">Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-white border-gray-300 rounded-xl shadow-xl" align="start">
                        {/* Calendar Header */}
                        <div className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] px-4 py-3 rounded-t-xl">
                          <p className="text-white font-semibold text-sm">Select Policy Expiration Date</p>
                        </div>
                        {/* Calendar Body */}
                        <div className="p-3 bg-white">
                          <CalendarComponent
                            mode="single"
                            selected={formData.insuranceExpiration ? new Date(formData.insuranceExpiration) : undefined}
                            onSelect={(date) => {
                              if (date) {
                                handleInputChange('insuranceExpiration', format(date, 'yyyy-MM-dd'));
                              }
                            }}
                            initialFocus
                            className="rounded-lg border-0"
                            classNames={{
                              months: "flex flex-col space-y-4",
                              month: "space-y-4",
                              caption: "flex justify-center pt-1 relative items-center mb-2",
                              caption_label: "text-sm font-semibold text-gray-900",
                              nav: "space-x-1 flex items-center",
                              nav_button: "h-8 w-8 bg-transparent p-0 opacity-70 hover:opacity-100 border border-gray-300 rounded-lg hover:bg-purple-50 hover:border-[#7C3AED] hover:text-[#7C3AED] transition-colors",
                              nav_button_previous: "absolute left-1",
                              nav_button_next: "absolute right-1",
                              table: "w-full border-collapse space-y-1",
                              head_row: "flex",
                              head_cell: "text-gray-600 rounded-md w-9 font-normal text-[0.8rem]",
                              row: "flex w-full mt-2",
                              cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-transparent first:[&:has([aria-selected])]:rounded-l-lg last:[&:has([aria-selected])]:rounded-r-lg focus-within:relative focus-within:z-20",
                              day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-[#7C3AED]/10 hover:text-[#7C3AED] rounded-lg transition-colors",
                              day_selected: "bg-[#7C3AED] text-white hover:bg-[#6D28D9] focus:bg-[#6D28D9] font-bold shadow-md",
                              day_today: "bg-purple-100 text-[#7C3AED] font-bold border-2 border-[#7C3AED]",
                              day_outside: "text-gray-400 opacity-50",
                              day_disabled: "text-gray-400 opacity-50",
                              day_range_middle: "aria-selected:bg-purple-100 aria-selected:text-[#7C3AED]",
                              day_hidden: "invisible",
                            }}
                          />
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            </div>

            {/* Legal & Tax Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#7C3AED] flex items-center justify-center">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Legal & Tax Information</h3>
                  <p className="text-sm text-gray-600">Property tax and legal compliance details</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="propertyTaxes" className="text-sm font-semibold text-gray-700">
                    Annual Property Taxes
                  </Label>
                  <Input
                    id="propertyTaxes"
                    type="number"
                    value={formData.propertyTaxes}
                    onChange={(e) => handleInputChange('propertyTaxes', e.target.value)}
                    placeholder="Annual tax amount"
                    className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                  />
                </div>
              </div>
            </div>

            {/* Additional Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-600 flex items-center justify-center">
                  <Info className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Additional Information</h3>
                  <p className="text-sm text-gray-600">Property description and internal notes</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="description" className="text-sm font-semibold text-gray-700">
                    Property Description
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe the property, its unique features, and selling points..."
                    rows={4}
                    className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED] resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">This description will be visible to tenants</p>
                </div>

                <div>
                  <Label htmlFor="notes" className="text-sm font-semibold text-gray-700">
                    Internal Notes
                  </Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Internal notes, reminders, or special considerations..."
                    rows={3}
                    className="border-gray-300 focus:border-[#7C3AED] focus:ring-[#7C3AED] resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">Private notes for internal use only</p>
                </div>
              </div>
            </div>

            {/* Summary Card */}
            {(formData.insuranceProvider || formData.propertyTaxes || formData.description) && (
              <div className="rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#7C3AED] flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  <h4 className="text-base font-bold text-gray-900">Information Summary</h4>
                </div>
                <div className="space-y-2 text-sm">
                  {formData.insuranceProvider && (
                    <div className="bg-white rounded-lg p-3 border border-purple-200">
                      <span className="text-gray-600">Insurance Provider:</span>
                      <span className="ml-2 font-semibold text-gray-900">{formData.insuranceProvider}</span>
                    </div>
                  )}
                  {formData.insuranceExpiration && (
                    <div className="bg-white rounded-lg p-3 border border-purple-200">
                      <span className="text-gray-600">Policy Expires:</span>
                      <span className="ml-2 font-semibold text-gray-900">
                        {format(new Date(formData.insuranceExpiration), "PPP")}
                      </span>
                    </div>
                  )}
                  {formData.propertyTaxes && (
                    <div className="bg-white rounded-lg p-3 border border-purple-200">
                      <span className="text-gray-600">Annual Property Taxes:</span>
                      <span className="ml-2 font-semibold text-gray-900">
                        {formData.currency === 'NGN' ? '₦' : formData.currency === 'USD' ? '$' : formData.currency === 'GBP' ? '£' : formData.currency === 'EUR' ? '€' : ''}
                        {Number(formData.propertyTaxes).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-2 border-purple-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#7C3AED] flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Review Your Property Information</h3>
              </div>
              <p className="text-sm text-gray-700">
                Please review all the information below before submitting. You can go back to make changes if needed.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-2 border-purple-200 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] text-white rounded-t-lg">
                  <div className="flex items-center gap-2">
                    <Home className="h-5 w-5" />
                    <CardTitle className="text-lg">Basic Information</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-6">
                  <div className="flex justify-between items-start">
                    <span className="text-sm text-gray-600 font-medium">Name:</span>
                    <span className="font-semibold text-gray-900 text-right">{formData.name}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-sm text-gray-600 font-medium">Type:</span>
                    <span className="font-semibold text-gray-900 text-right">{formData.propertyType}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-sm text-gray-600 font-medium">Address:</span>
                    <span className="font-semibold text-gray-900 text-right max-w-[60%]">{formData.address}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-sm text-gray-600 font-medium">City, State:</span>
                    <span className="font-semibold text-gray-900 text-right">{formData.city}, {formData.state} {formData.postalCode}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-sm text-gray-600 font-medium">Country:</span>
                    <span className="font-semibold text-gray-900 text-right">{formData.country}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-purple-200 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] text-white rounded-t-lg">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    <CardTitle className="text-lg">Property Details</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-6">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 font-medium">Total Units:</span>
                    <span className="font-semibold text-[#7C3AED]">{formData.totalUnits}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 font-medium">Floors:</span>
                    <span className="font-semibold text-gray-900">{formData.floors || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 font-medium">Year Built:</span>
                    <span className="font-semibold text-gray-900">{formData.yearBuilt || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 font-medium">Total Area:</span>
                    <span className="font-semibold text-gray-900">{formData.totalArea ? `${formData.totalArea} sq ft` : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 font-medium">Lot Size:</span>
                    <span className="font-semibold text-gray-900">{formData.lotSize ? `${formData.lotSize} sq ft` : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 font-medium">Parking Spaces:</span>
                    <span className="font-semibold text-gray-900">{formData.parking || 'N/A'}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-green-200 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-t-lg">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    <CardTitle className="text-lg">Financial Information</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-6">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 font-medium">Currency:</span>
                    <span className="font-semibold text-gray-900">
                      {currencies.find(c => c.code === formData.currency)?.symbol} {currencies.find(c => c.code === formData.currency)?.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 font-medium">Annual Rent:</span>
                    <span className="font-semibold text-green-600">{currencies.find(c => c.code === formData.currency)?.symbol}{Number(formData.avgRent).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 font-medium">Security Deposit:</span>
                    <span className="font-semibold text-gray-900">{formData.securityDeposit ? `${currencies.find(c => c.code === formData.currency)?.symbol}${Number(formData.securityDeposit).toLocaleString()}` : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 font-medium">Service Charge:</span>
                    <span className="font-semibold text-gray-900">{formData.serviceCharge ? `${currencies.find(c => c.code === formData.currency)?.symbol}${Number(formData.serviceCharge).toLocaleString()}` : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 font-medium">Application Fee:</span>
                    <span className="font-semibold text-gray-900">{formData.applicationFee ? `${currencies.find(c => c.code === formData.currency)?.symbol}${Number(formData.applicationFee).toLocaleString()}` : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 font-medium">Legal Fee:</span>
                    <span className="font-semibold text-gray-900">{formData.legalFee ? `${currencies.find(c => c.code === formData.currency)?.symbol}${Number(formData.legalFee).toLocaleString()}` : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 font-medium">Agreement Fee:</span>
                    <span className="font-semibold text-gray-900">{formData.agreementFee ? `${currencies.find(c => c.code === formData.currency)?.symbol}${Number(formData.agreementFee).toLocaleString()}` : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 font-medium">Agent Commission:</span>
                    <span className="font-semibold text-gray-900">{formData.agentCommission ? `${currencies.find(c => c.code === formData.currency)?.symbol}${Number(formData.agentCommission).toLocaleString()}` : 'N/A'}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-purple-200 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] text-white rounded-t-lg">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    <CardTitle className="text-lg">Management</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-6">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 font-medium">Manager:</span>
                    <span className="font-semibold text-gray-900">{selectedManager?.name || 'Unassigned'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 font-medium">Email:</span>
                    <span className="font-semibold text-gray-900 text-sm">{selectedManager?.email || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 font-medium">Phone:</span>
                    <span className="font-semibold text-gray-900">{selectedManager?.phone || '—'}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {formData.features.length > 0 && (
              <Card className="border-2 border-purple-200 shadow-md">
                <CardHeader className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] text-white rounded-t-lg">
                  <div className="flex items-center gap-2">
                    <Home className="h-5 w-5" />
                    <CardTitle className="text-lg">Property Features</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="flex flex-wrap gap-2">
                    {formData.features.map((featureId) => {
                      const feature = availableFeatures.find(f => f.id === featureId);
                      return feature ? (
                        <Badge key={featureId} className="bg-purple-100 text-[#7C3AED] border border-purple-300 hover:bg-purple-200 px-3 py-1">
                          {feature.label}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {formData.unitFeatures.length > 0 && (
              <Card className="border-2 border-green-200 shadow-md">
                <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-t-lg">
                  <div className="flex items-center gap-2">
                    <Bed className="h-5 w-5" />
                    <CardTitle className="text-lg">Unit Features</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="flex flex-wrap gap-2">
                    {formData.unitFeatures.map((featureId) => {
                      const feature = unitFeatures.find(f => f.id === featureId);
                      return feature ? (
                        <Badge key={featureId} className="bg-green-100 text-green-700 border border-green-300 hover:bg-green-200 px-3 py-1">
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
                <Card className="border-2 border-blue-200 shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      <CardTitle className="text-lg">Insurance Information</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-6">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 font-medium">Provider:</span>
                      <span className="font-semibold text-gray-900">{formData.insuranceProvider || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 font-medium">Policy Number:</span>
                      <span className="font-semibold text-gray-900">{formData.insurancePolicyNumber || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 font-medium">Annual Premium:</span>
                      <span className="font-semibold text-gray-900">
                        {formData.insurancePremium ? `${currencies.find(c => c.code === formData.currency)?.symbol}${Number(formData.insurancePremium).toLocaleString()}` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 font-medium">Expiration:</span>
                      <span className="font-semibold text-gray-900">{formData.insuranceExpiration ? format(new Date(formData.insuranceExpiration), "PPP") : 'N/A'}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-purple-200 shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] text-white rounded-t-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      <CardTitle className="text-lg">Legal & Tax</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-6">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 font-medium">Annual Property Taxes:</span>
                      <span className="font-semibold text-gray-900">
                        {formData.propertyTaxes ? `${currencies.find(c => c.code === formData.currency)?.symbol}${Number(formData.propertyTaxes).toLocaleString()}` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 font-medium">Legal/Documentation Fee:</span>
                      <span className="font-semibold text-gray-900">
                        {formData.legalFee ? `${currencies.find(c => c.code === formData.currency)?.symbol}${Number(formData.legalFee).toLocaleString()}` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 font-medium">Agreement Fee:</span>
                      <span className="font-semibold text-gray-900">
                        {formData.agreementFee ? `${currencies.find(c => c.code === formData.currency)?.symbol}${Number(formData.agreementFee).toLocaleString()}` : 'N/A'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Additional Information */}
            {(formData.description || formData.notes) && (
              <Card className="border-2 border-gray-200 shadow-md">
                <CardHeader className="bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-t-lg">
                  <div className="flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    <CardTitle className="text-lg">Additional Information</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  {formData.description && (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <h5 className="text-sm font-semibold text-gray-700 mb-2">Description:</h5>
                      <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">{formData.description}</p>
                    </div>
                  )}
                  {formData.notes && (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <h5 className="text-sm font-semibold text-gray-700 mb-2">Internal Notes:</h5>
                      <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">{formData.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Cover Image Preview */}
            {formData.coverImage && (
              <Card className="border-2 border-purple-200 shadow-md">
                <CardHeader className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] text-white rounded-t-lg">
                  <div className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    <CardTitle className="text-lg">Cover Image</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-40 h-32 border-2 border-purple-200 rounded-xl overflow-hidden bg-gray-50 shadow-md">
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
                      <p className="text-sm text-gray-600 break-all bg-gray-50 rounded-lg p-3 border border-gray-200">
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
      {/* Header - Brand Styled */}
      <header className="bg-gradient-to-r from-[#111827] to-[#1F2937] shadow-lg border-b border-white/10 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button variant="ghost" onClick={onBack} className="mr-4 text-white hover:bg-white/10">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Properties
              </Button>
              <h1 className="text-xl font-bold text-white">{mode === 'edit' ? 'Edit Property' : 'Add New Property'}</h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-3">
                <span className="text-sm font-medium text-white/80">Step {currentStep} of {steps.length}</span>
                <Progress value={(currentStep / steps.length) * 100} className="w-32 h-2 bg-white/20" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Subscription Limits Warning Banner */}
      {mode === 'add' && propertyLimit !== undefined && (
        <div className="bg-gray-50 border-b px-4 sm:px-6 lg:px-8 py-3">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  Properties: <span className={`font-medium ${currentPropertyCount >= propertyLimit ? 'text-red-600' : 'text-gray-900'}`}>
                    {currentPropertyCount}/{propertyLimit}
                  </span>
                </span>
              </div>
              {unitLimit !== undefined && unitLimit > 0 && (
                <div className="flex items-center gap-2">
                  <Home className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    Units: <span className={`font-medium ${currentUnitCount >= unitLimit ? 'text-red-600' : 'text-gray-900'}`}>
                      {currentUnitCount}/{unitLimit}
                    </span>
                  </span>
                </div>
              )}
            </div>
            {(currentPropertyCount >= propertyLimit || (unitLimit && currentUnitCount >= unitLimit)) && (
              <Badge variant="destructive" className="text-xs">
                <AlertCircle className="h-3 w-3 mr-1" />
                Limit Reached - Upgrade Required
              </Badge>
            )}
          </div>
        </div>
      )}

      <div className="p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Left Sidebar Menu - Brand Styled */}
            <aside className="lg:col-span-1">
              <Card className="border-0 shadow-lg">
                <CardContent className="p-4">
                  <nav className="space-y-2">
                    {steps.map((step) => (
                      <button
                        key={step.number}
                        onClick={() => {
                          if (step.number < currentStep || validateStep(currentStep)) {
                            setCurrentStep(step.number);
                          }
                        }}
                        className={`w-full flex items-start space-x-3 px-4 py-3 rounded-xl transition-all text-left ${
                          currentStep === step.number
                            ? 'bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] text-white shadow-lg shadow-purple-500/25'
                            : currentStep > step.number
                            ? 'bg-green-50 text-green-900 hover:bg-green-100 border border-green-200'
                            : 'hover:bg-gray-100 text-gray-700 border border-transparent'
                        }`}
                      >
                        <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold flex-shrink-0 ${
                          currentStep === step.number
                            ? 'bg-white text-[#7C3AED]'
                            : currentStep > step.number
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}>
                          {currentStep > step.number ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            step.number
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{step.title}</p>
                          <p className={`text-xs mt-0.5 ${
                            currentStep === step.number
                              ? 'text-purple-100'
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

              {/* Navigation Buttons - Brand Styled */}
              <div className="flex justify-between mt-6 pt-6 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 1}
                  className="border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>

                <div className="flex space-x-3">
                  {currentStep === steps.length ? (
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] hover:from-[#6D28D9] hover:to-[#4C1D95] text-white shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          {mode === 'edit' ? 'Saving...' : 'Adding Property...'}
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          {mode === 'edit' ? 'Save Changes' : 'Add Property'}
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleNext}
                      className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] hover:from-[#6D28D9] hover:to-[#4C1D95] text-white shadow-md"
                    >
                      Continue
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Manager Dialog - Enhanced Design */}
      <Dialog open={showCreateManagerDialog} onOpenChange={setShowCreateManagerDialog}>
        <DialogContent className="max-w-lg border-0 shadow-2xl p-0 overflow-hidden">
          {/* Gradient Header */}
          <div className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] px-6 py-5">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <UserPlus className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-white m-0">
                  Create New Property Manager
                </DialogTitle>
                <DialogDescription className="text-purple-200 mt-1">
                  Add a manager to your organization
                </DialogDescription>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Personal Information Section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-100 to-violet-100 flex items-center justify-center">
                  <Users className="h-4 w-4 text-[#7C3AED]" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Personal Information</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="manager-name" className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                    Full Name
                    <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative mt-1.5">
                    <Input
                      id="manager-name"
                      placeholder="e.g., Sarah Johnson"
                      value={newManagerForm.name}
                      onChange={(e) => {
                        setNewManagerForm(prev => ({ ...prev, name: e.target.value }));
                        if (managerFormErrors.name) {
                          setManagerFormErrors(prev => ({ ...prev, name: '' }));
                        }
                      }}
                      className={`pl-10 h-11 rounded-xl border-gray-200 focus:border-[#7C3AED] focus:ring-[#7C3AED] ${managerFormErrors.name ? 'border-red-400 bg-red-50' : ''}`}
                    />
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                  {managerFormErrors.name && (
                    <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {managerFormErrors.name}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="manager-email" className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                    Email Address
                    <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative mt-1.5">
                    <Input
                      id="manager-email"
                      type="email"
                      placeholder="e.g., sarah@company.com"
                      value={newManagerForm.email}
                      onChange={(e) => {
                        setNewManagerForm(prev => ({ ...prev, email: e.target.value }));
                        if (managerFormErrors.email) {
                          setManagerFormErrors(prev => ({ ...prev, email: '' }));
                        }
                      }}
                      className={`pl-10 h-11 rounded-xl border-gray-200 focus:border-[#7C3AED] focus:ring-[#7C3AED] ${managerFormErrors.email ? 'border-red-400 bg-red-50' : ''}`}
                    />
                    <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  {managerFormErrors.email && (
                    <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {managerFormErrors.email}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Contact & Details Section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center">
                  <Info className="h-4 w-4 text-blue-600" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Additional Details</h3>
                <span className="text-xs text-gray-400 font-normal normal-case">(Optional)</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="manager-phone" className="text-sm font-semibold text-gray-700">
                    Phone Number
                  </Label>
                  <div className="relative mt-1.5">
                    <Input
                      id="manager-phone"
                      type="tel"
                      placeholder="+234 800 000 0000"
                      value={newManagerForm.phone}
                      onChange={(e) => {
                        setNewManagerForm(prev => ({ ...prev, phone: e.target.value }));
                      }}
                      className="pl-10 h-11 rounded-xl border-gray-200 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                    />
                    <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                </div>

                <div>
                  <Label htmlFor="manager-department" className="text-sm font-semibold text-gray-700">
                    Department
                  </Label>
                  <div className="relative mt-1.5">
                    <Input
                      id="manager-department"
                      placeholder="e.g., Operations"
                      value={newManagerForm.department}
                      onChange={(e) => {
                        setNewManagerForm(prev => ({ ...prev, department: e.target.value }));
                      }}
                      className="pl-10 h-11 rounded-xl border-gray-200 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                    />
                    <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Info Card */}
            <div className="bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <Shield className="h-4 w-4 text-[#7C3AED]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-purple-900 mb-1">Secure Credentials</p>
                  <p className="text-xs text-purple-700 leading-relaxed">
                    A temporary password will be generated and sent to the manager's email.
                    They can change it on their first login.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer with Actions */}
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowCreateManagerDialog(false);
                setNewManagerForm({ name: '', email: '', phone: '', department: '' });
                setManagerFormErrors({});
              }}
              disabled={isCreatingManager}
              className="border-gray-300 text-gray-700 hover:bg-gray-100 rounded-xl px-5"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreateManager}
              disabled={isCreatingManager}
              className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] hover:from-[#6D28D9] hover:to-[#4C1D95] text-white shadow-lg shadow-purple-500/25 rounded-xl px-6"
            >
              {isCreatingManager ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Manager...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create Manager
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


