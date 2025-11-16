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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create New Project</h1>
              <p className="text-gray-600 mt-1">Set up your project in 4 easy steps</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onCancel}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mt-8">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;

              return (
                <div key={step.number} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                        isCompleted
                          ? 'bg-green-500 text-white'
                          : isActive
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-6 h-6" />
                      ) : (
                        <StepIcon className="w-6 h-6" />
                      )}
                    </div>
                    <p
                      className={`text-sm mt-2 font-medium ${
                        isActive ? 'text-blue-600' : 'text-gray-600'
                      }`}
                    >
                      {step.title}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-1 mx-4 rounded ${
                        currentStep > step.number ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <Card className="mb-6">
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
                      onValueChange={(value) =>
                        setProjectData({ ...projectData, stage: value })
                      }
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
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">
                      City <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="city"
                      placeholder="e.g., Lagos"
                      value={projectData.city}
                      onChange={(e) =>
                        setProjectData({ ...projectData, city: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      placeholder="e.g., Lagos State"
                      value={projectData.state}
                      onChange={(e) =>
                        setProjectData({ ...projectData, state: e.target.value })
                      }
                    />
                  </div>
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

                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <DollarSign className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-900 mb-1">
                          Total Project Budget (with Contingency)
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          {projectData.totalBudget &&
                            formatCurrency(
                              parseFloat(projectData.totalBudget) +
                                (parseFloat(projectData.totalBudget) *
                                  parseFloat(projectData.contingency)) /
                                  100
                            )}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          Base Budget + {projectData.contingency}% Contingency Reserve
                        </p>
                      </div>
                    </div>
                  </CardContent>
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
                      onChange={(e) =>
                        setProjectData({
                          ...projectData,
                          estimatedEndDate: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <Card className="bg-amber-50 border-amber-200">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Users className="w-5 h-5 text-amber-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-amber-900 mb-1">
                          Team Assignment
                        </p>
                        <p className="text-sm text-gray-700">
                          You can assign team members and set permissions after creating the
                          project from the project dashboard.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Step 4: Review & Confirm */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Project Summary
                  </h3>
                </div>

                <Card>
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

                <Card>
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
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-900">Total Budget:</span>
                        <span className="text-2xl font-bold text-blue-600">
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

                <Card>
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

                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-green-900">
                          Ready to create this project
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          Click "Create Project" to finalize and start managing your project
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>

              <div className="flex gap-3">
                <Button variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
                {currentStep < 4 ? (
                  <Button
                    onClick={handleNext}
                    disabled={!isStepValid()}
                    className="gap-2 bg-blue-600 hover:bg-blue-700"
                  >
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleCreate}
                    className="gap-2 bg-green-600 hover:bg-green-700"
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

