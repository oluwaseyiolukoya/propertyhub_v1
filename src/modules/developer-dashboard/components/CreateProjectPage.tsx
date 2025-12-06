import React, { useState } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Building2,
  DollarSign,
  Users,
  CheckCircle2,
  X,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { Badge } from '../../../components/ui/badge';
import { Card, CardContent } from '../../../components/ui/card';
import { Separator } from '../../../components/ui/separator';
import { toast } from 'sonner';
import { getProgressFromStage } from '../utils/projectProgress';
import { NIGERIAN_CITIES, NIGERIAN_STATES, COUNTRIES } from '../../../constants/nigeria-locations';

interface CreateProjectPageProps {
  onCancel: () => void;
  onProjectCreated?: (projectId: string) => void;
}

type Step = 1 | 2 | 3 | 4;

export const CreateProjectPage: React.FC<CreateProjectPageProps> = ({
  onCancel,
  onProjectCreated,
}) => {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [projectData, setProjectData] = useState({
    name: '',
    projectType: '',
    location: '',
    city: '',
    state: '',
    country: 'Nigeria',
    description: '',
    currency: 'NGN',
    totalBudget: '',
    contingency: '10',
    startDate: '',
    estimatedEndDate: '',
    stage: 'planning',
  });

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep((currentStep + 1) as Step);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step);
    }
  };

  const handleCreate = async () => {
    try {
      console.log('[CreateProject] Creating project with data:', projectData);

      // Get auth token
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication required', {
          description: 'Please log in again.',
        });
        return;
      }

      // Call API to create project
      const response = await fetch('/api/developer-dashboard/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: projectData.name,
          projectType: projectData.projectType,
          location: projectData.location,
          city: projectData.city,
          state: projectData.state,
          description: projectData.description,
          currency: projectData.currency,
          totalBudget: parseFloat(projectData.totalBudget) || 0,
          startDate: projectData.startDate,
          estimatedEndDate: projectData.estimatedEndDate,
          stage: projectData.stage,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create project');
      }

      const newProject = await response.json();
      console.log('[CreateProject] Project created successfully:', newProject);

      toast.success('Project Created Successfully', {
        description: `${projectData.name} has been created and is ready to use.`,
      });

      if (onProjectCreated) {
        onProjectCreated(newProject.id);
      }

      onCancel(); // Go back to portfolio
    } catch (error: any) {
      console.error('[CreateProject] Error creating project:', error);
      toast.error('Failed to create project', {
        description: error.message || 'Please try again or contact support.',
      });
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return projectData.name && projectData.projectType && projectData.city;
      case 2:
        return projectData.currency && projectData.totalBudget;
      case 3:
        return projectData.startDate;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const steps = [
    { number: 1, title: 'Project Info', icon: Building2 },
    { number: 2, title: 'Financial Setup', icon: DollarSign },
    { number: 3, title: 'Timeline & Team', icon: Users },
    { number: 4, title: 'Review & Confirm', icon: CheckCircle2 },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: projectData.currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Enhanced Header with Purple Gradient */}
        <Card className="border-0 shadow-lg overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-purple-600 via-violet-600 to-purple-700 p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Building2 className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Create New Project</h1>
                  <p className="text-purple-100 mt-1">Set up your project in 4 easy steps</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onCancel}
                className="text-white hover:bg-white/20 h-10 w-10"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
          </div>

          {/* Enhanced Progress Steps */}
          <div className="bg-white p-6">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const StepIcon = step.icon;
                const isActive = currentStep === step.number;
                const isCompleted = currentStep > step.number;

                return (
                  <div key={step.number} className="flex items-center flex-1">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 shadow-md ${
                          isCompleted
                            ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white'
                            : isActive
                            ? 'bg-gradient-to-br from-purple-600 to-violet-600 text-white shadow-lg shadow-purple-500/30'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {isCompleted ? (
                          <Check className="w-7 h-7" />
                        ) : (
                          <StepIcon className="w-7 h-7" />
                        )}
                      </div>
                      <p
                        className={`text-sm mt-2 font-medium text-center ${
                          isActive ? 'text-purple-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                        }`}
                      >
                        {step.title}
                      </p>
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={`flex-1 h-2 mx-4 rounded-full transition-all duration-300 ${
                          currentStep > step.number
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                            : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Enhanced Step Content */}
        <Card className="mb-6 border-0 shadow-lg">
          <div className="bg-gradient-to-r from-purple-50 to-violet-50 border-b border-purple-100 px-8 py-4">
            <div className="flex items-center gap-2">
              {currentStep === 1 && <Building2 className="h-5 w-5 text-purple-600" />}
              {currentStep === 2 && <DollarSign className="h-5 w-5 text-purple-600" />}
              {currentStep === 3 && <Users className="h-5 w-5 text-purple-600" />}
              {currentStep === 4 && <CheckCircle2 className="h-5 w-5 text-purple-600" />}
              <h2 className="text-xl font-bold text-gray-900">
                {steps[currentStep - 1].title}
              </h2>
            </div>
          </div>
          <CardContent className="p-8">
            {/* Step 1: Project Info */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="project-name">
                    Project Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="project-name"
                    placeholder="e.g., Lekki Heights Residential Complex"
                    value={projectData.name}
                    onChange={(e) =>
                      setProjectData({ ...projectData, name: e.target.value })
                    }
                    className="text-base"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="project-type">
                      Project Type <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={projectData.projectType}
                      onValueChange={(value) =>
                        setProjectData({ ...projectData, projectType: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="residential">Residential Development</SelectItem>
                        <SelectItem value="commercial">Commercial Building</SelectItem>
                        <SelectItem value="mixed-use">Mixed-Use Development</SelectItem>
                        <SelectItem value="infrastructure">Infrastructure</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stage">Project Stage</Label>
                    <Select
                      value={projectData.stage}
                      onValueChange={(value) => {
                        setProjectData({
                          ...projectData,
                          stage: value,
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planning">Planning</SelectItem>
                        <SelectItem value="design">Design</SelectItem>
                        <SelectItem value="pre-construction">Pre-Construction</SelectItem>
                        <SelectItem value="construction">Construction</SelectItem>
                        <SelectItem value="completion">Completion</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-blue-600">
                      ℹ️ Progress will be automatically calculated based on milestones, budget, time, and stage
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">
                      City <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={projectData.city}
                      onValueChange={(value) =>
                        setProjectData({ ...projectData, city: value })
                      }
                    >
                      <SelectTrigger id="city">
                        <SelectValue placeholder="Select city" />
                      </SelectTrigger>
                      <SelectContent>
                        {NIGERIAN_CITIES.map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Select
                      value={projectData.state}
                      onValueChange={(value) =>
                        setProjectData({ ...projectData, state: value })
                      }
                    >
                      <SelectTrigger id="state">
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {NIGERIAN_STATES.map((state) => (
                          <SelectItem key={state} value={state}>
                            {state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Select
                    value={projectData.country}
                    onValueChange={(value) =>
                      setProjectData({ ...projectData, country: value })
                    }
                  >
                    <SelectTrigger id="country">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Full Address/Location</Label>
                  <Input
                    id="location"
                    placeholder="e.g., Plot 123, Lekki Phase 1, Lagos"
                    value={projectData.location}
                    onChange={(e) =>
                      setProjectData({ ...projectData, location: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Project Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of the project scope and objectives..."
                    rows={4}
                    value={projectData.description}
                    onChange={(e) =>
                      setProjectData({ ...projectData, description: e.target.value })
                    }
                  />
                </div>
              </div>
            )}

            {/* Step 2: Financial Setup */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currency">
                      Currency <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={projectData.currency}
                      onValueChange={(value) =>
                        setProjectData({ ...projectData, currency: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NGN">NGN - Nigerian Naira</SelectItem>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="budget">
                      Total Budget <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="budget"
                      type="number"
                      placeholder="850000000"
                      value={projectData.totalBudget}
                      onChange={(e) =>
                        setProjectData({ ...projectData, totalBudget: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contingency">Contingency Reserve (%)</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="contingency"
                      type="number"
                      value={projectData.contingency}
                      onChange={(e) =>
                        setProjectData({ ...projectData, contingency: e.target.value })
                      }
                      className="w-32"
                    />
                    <span className="text-sm text-gray-600">
                      {projectData.totalBudget &&
                        `= ${formatCurrency(
                          (parseFloat(projectData.totalBudget) *
                            parseFloat(projectData.contingency)) /
                            100
                        )}`}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Recommended: 10-15% for contingency planning
                  </p>
                </div>

                <Card className="border-0 shadow-md overflow-hidden">
                  <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-6 text-white">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <DollarSign className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-100 mb-2">
                          Total Project Budget (with Contingency)
                        </p>
                        <p className="text-3xl font-bold text-white">
                          {projectData.totalBudget &&
                            formatCurrency(
                              parseFloat(projectData.totalBudget) +
                                (parseFloat(projectData.totalBudget) *
                                  parseFloat(projectData.contingency)) /
                                  100
                            )}
                        </p>
                        <div className="mt-3 pt-3 border-t border-white/20">
                          <p className="text-xs text-green-100">
                            Base Budget + {projectData.contingency}% Contingency Reserve
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Step 3: Timeline & Team */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-date">
                      Start Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={projectData.startDate}
                      onChange={(e) =>
                        setProjectData({ ...projectData, startDate: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="end-date">Estimated End Date</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={projectData.estimatedEndDate}
                      min={projectData.startDate || undefined}
                      onChange={(e) => {
                        const selectedDate = e.target.value;
                        // Validate that end date is not before start date
                        if (projectData.startDate && selectedDate && selectedDate < projectData.startDate) {
                          toast.error('Estimated End Date must be after Start Date');
                          return;
                        }
                        setProjectData({
                          ...projectData,
                          estimatedEndDate: selectedDate,
                        });
                      }}
                    />
                    {projectData.startDate && (
                      <p className="text-xs text-gray-500">
                        Must be after {new Date(projectData.startDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>

                <Card className="border-0 shadow-md overflow-hidden">
                  <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-6 text-white">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-amber-100 mb-2">
                          Team Assignment
                        </p>
                        <p className="text-sm text-white/90">
                          You can assign team members and set permissions after creating the
                          project from the project dashboard.
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Step 4: Review & Confirm */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Project Summary
                  </h3>
                </div>
                <p className="text-gray-600 mb-6">Review your project details before creating</p>

                <Card className="border-2 border-purple-200 shadow-md">
                  <div className="bg-gradient-to-r from-purple-50 to-violet-50 px-6 py-3 border-b border-purple-100">
                    <h4 className="font-semibold text-gray-900">Project Information</h4>
                  </div>
                  <CardContent className="p-6 space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Project Name:</span>
                        <span className="font-medium text-gray-900">
                          {projectData.name}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="text-gray-600">Type:</span>
                        <Badge variant="outline" className="capitalize">
                          {projectData.projectType.replace('-', ' ')}
                        </Badge>
                      </div>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="text-gray-600">Location:</span>
                        <span className="text-gray-900">
                          {projectData.city}
                          {projectData.state && `, ${projectData.state}`}
                          {projectData.country && `, ${projectData.country}`}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="text-gray-600">Stage:</span>
                        <Badge variant="secondary" className="capitalize">
                          {projectData.stage}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-green-200 shadow-md">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-3 border-b border-green-100">
                    <h4 className="font-semibold text-gray-900">Financial Details</h4>
                  </div>
                  <CardContent className="p-6 space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Base Budget:</span>
                        <span className="font-medium text-gray-900">
                          {formatCurrency(parseFloat(projectData.totalBudget))}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="text-gray-600">Contingency:</span>
                        <span className="text-gray-900">
                          {projectData.contingency}% (
                          {formatCurrency(
                            (parseFloat(projectData.totalBudget) *
                              parseFloat(projectData.contingency)) /
                              100
                          )}
                          )
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center bg-green-50 -mx-6 -mb-6 px-6 py-4 mt-4 border-t-2 border-green-200">
                        <span className="font-semibold text-gray-900">Total Budget:</span>
                        <span className="text-2xl font-bold text-green-600">
                          {formatCurrency(
                            parseFloat(projectData.totalBudget) +
                              (parseFloat(projectData.totalBudget) *
                                parseFloat(projectData.contingency)) /
                                100
                          )}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-blue-200 shadow-md">
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-6 py-3 border-b border-blue-100">
                    <h4 className="font-semibold text-gray-900">Timeline</h4>
                  </div>
                  <CardContent className="p-6 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Start Date:</span>
                      <span className="text-gray-900">
                        {new Date(projectData.startDate).toLocaleDateString('en-NG', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    {projectData.estimatedEndDate && (
                      <>
                        <Separator />
                        <div className="flex justify-between">
                          <span className="text-gray-600">Estimated End Date:</span>
                          <span className="text-gray-900">
                            {new Date(projectData.estimatedEndDate).toLocaleDateString(
                              'en-NG',
                              {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              }
                            )}
                          </span>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-md overflow-hidden">
                  <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-6 text-white">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <CheckCircle2 className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white mb-1">
                          Ready to create this project
                        </p>
                        <p className="text-sm text-green-100">
                          Click "Create Project" to finalize and start managing your project
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enhanced Navigation Buttons */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
                className="gap-2 border-purple-200 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-400 disabled:opacity-50"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={onCancel}
                  className="border-gray-300 hover:bg-gray-100"
                >
                  Cancel
                </Button>
                {currentStep < 4 ? (
                  <Button
                    onClick={handleNext}
                    disabled={!isStepValid()}
                    className="gap-2 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white shadow-lg shadow-purple-500/30"
                  >
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleCreate}
                    className="gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg shadow-green-500/30"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Create Project
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateProjectPage;

