import React, { useState, useEffect } from 'react';
import { Building2, DollarSign, Users, CheckCircle2, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { toast } from 'sonner';
import type { DeveloperProject } from '../types';
import { NIGERIAN_CITIES, NIGERIAN_STATES, COUNTRIES } from '../../../constants/nigeria-locations';

interface EditProjectPageProps {
  projectId: string;
  onCancel: () => void;
  onProjectUpdated: (projectId: string) => void;
}

type Step = 1 | 2 | 3 | 4;

export const EditProjectPage: React.FC<EditProjectPageProps> = ({
  projectId,
  onCancel,
  onProjectUpdated,
}) => {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
    status: 'active',
    progress: '0',
  });

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');

      const response = await fetch(`/api/developer-dashboard/projects/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch project');
      }

      const project: DeveloperProject = await response.json();

      // Pre-populate form with existing data
      setProjectData({
        name: project.name || '',
        projectType: project.projectType || '',
        location: project.location || '',
        city: project.city || '',
        state: project.state || '',
        country: project.country || 'Nigeria',
        description: project.description || '',
        currency: project.currency || 'NGN',
        totalBudget: project.totalBudget?.toString() || '',
        contingency: '10',
        startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
        estimatedEndDate: project.estimatedEndDate ? new Date(project.estimatedEndDate).toISOString().split('T')[0] : '',
        stage: project.stage || 'planning',
        status: project.status || 'active',
        progress: project.progress?.toString() || '0',
      });

      setLoading(false);
    } catch (error: any) {
      console.error('[EditProject] Error fetching project:', error);
      toast.error('Failed to load project data');
      setLoading(false);
    }
  };

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

  const handleUpdate = async () => {
    try {
      setSaving(true);
      console.log('[EditProject] Updating project with data:', projectData);

      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      const response = await fetch(`/api/developer-dashboard/projects/${projectId}`, {
        method: 'PATCH',
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
          status: projectData.status,
          progress: parseFloat(projectData.progress) || 0,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update project');
      }

      const updatedProject = await response.json();
      console.log('[EditProject] Project updated successfully:', updatedProject);

      // Update project progress automatically
      try {
        await fetch(`/api/developer-dashboard/projects/${projectId}/progress/update`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        console.log("[EditProject] Project progress updated automatically");
      } catch (progressError) {
        console.warn("[EditProject] Failed to update progress:", progressError);
        // Don't fail the whole operation if progress update fails
      }

      toast.success('Project Updated Successfully', {
        description: `${projectData.name} has been updated.`,
      });

      if (onProjectUpdated) {
        onProjectUpdated(projectId);
      }

      onCancel(); // Go back to project dashboard
    } catch (error: any) {
      console.error('[EditProject] Error updating project:', error);
      toast.error('Failed to update project', {
        description: error.message || 'Please try again.',
      });
    } finally {
      setSaving(false);
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
    { number: 3, title: 'Timeline & Status', icon: Users },
    { number: 4, title: 'Review & Confirm', icon: CheckCircle2 },
  ];

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: projectData.currency || 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading project data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="mb-8">
        <Button variant="ghost" className="gap-2 -ml-2 mb-4" onClick={onCancel}>
          <ArrowLeft className="w-4 h-4" />
          Back to Project
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Project</h1>
            <p className="text-gray-600 mt-1">Update your project information</p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mt-8 flex items-center justify-between">
          {steps.map((step, index) => (
            <React.Fragment key={step.number}>
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    currentStep >= step.number
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {currentStep > step.number ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <step.icon className="w-6 h-6" />
                  )}
                </div>
                <p
                  className={`mt-2 text-sm font-medium ${
                    currentStep >= step.number ? 'text-blue-600' : 'text-gray-600'
                  }`}
                >
                  {step.title}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-4 ${
                    currentStep > step.number ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
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
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="e.g., Plot 123, Lekki Phase 1"
                    value={projectData.location}
                    onChange={(e) =>
                      setProjectData({ ...projectData, location: e.target.value })
                    }
                  />
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
                  <Label htmlFor="state">
                    State <span className="text-red-500">*</span>
                  </Label>
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
                <Label htmlFor="description">Project Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your project..."
                  value={projectData.description}
                  onChange={(e) =>
                    setProjectData({ ...projectData, description: e.target.value })
                  }
                  rows={4}
                />
              </div>
            </div>
          )}

          {/* Step 2: Financial Setup */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
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
                      <SelectItem value="NGN">Nigerian Naira (₦)</SelectItem>
                      <SelectItem value="USD">US Dollar ($)</SelectItem>
                      <SelectItem value="GBP">British Pound (£)</SelectItem>
                      <SelectItem value="EUR">Euro (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="total-budget">
                    Total Budget <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="total-budget"
                    type="number"
                    placeholder="0"
                    value={projectData.totalBudget}
                    onChange={(e) =>
                      setProjectData({ ...projectData, totalBudget: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Timeline & Status */}
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
                      setProjectData({ ...projectData, estimatedEndDate: selectedDate });
                    }}
                  />
                  {projectData.startDate && (
                    <p className="text-xs text-gray-500">
                      Must be after {new Date(projectData.startDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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

                <div className="space-y-2">
                  <Label htmlFor="status">Project Status</Label>
                  <Select
                    value={projectData.status}
                    onValueChange={(value) =>
                      setProjectData({ ...projectData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="on-hold">On Hold</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="progress">Progress (%)</Label>
                <Input
                  id="progress"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="0"
                  value={projectData.progress}
                  disabled
                  className="bg-gray-50 cursor-not-allowed"
                />
                <p className="text-sm text-blue-600">
                  ℹ️ Progress is automatically calculated based on milestones, budget, time, and stage
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Review & Confirm */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Review Project Updates
                </h3>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Project Name</p>
                    <p className="font-medium text-gray-900">{projectData.name}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Project Type</p>
                    <p className="font-medium text-gray-900 capitalize">
                      {projectData.projectType.replace('-', ' ')}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Location</p>
                    <p className="font-medium text-gray-900">
                      {projectData.city}, {projectData.state}, {projectData.country}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Budget</p>
                    <p className="font-medium text-gray-900">
                      {formatCurrency(parseFloat(projectData.totalBudget) || 0)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Start Date</p>
                    <p className="font-medium text-gray-900">
                      {new Date(projectData.startDate).toLocaleDateString()}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Stage</p>
                    <p className="font-medium text-gray-900 capitalize">{projectData.stage}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Status</p>
                    <p className="font-medium text-gray-900 capitalize">{projectData.status}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Progress</p>
                    <p className="font-medium text-gray-900">{projectData.progress}%</p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800">
                  <strong>Note:</strong> Updating the project will change these details across all
                  related budgets, invoices, and reports.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={currentStep === 1 ? onCancel : handleBack}
          disabled={saving}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {currentStep === 1 ? 'Cancel' : 'Back'}
        </Button>

        {currentStep < 4 ? (
          <Button onClick={handleNext} disabled={!isStepValid()}>
            Continue
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleUpdate}
            disabled={!isStepValid() || saving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {saving ? 'Updating...' : 'Update Project'}
            <CheckCircle2 className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
};





