/**
 * Project Stages Checklist Component
 * Displays and manages project stages with progress tracking
 */

import React, { useState, useEffect } from 'react';
import {
  Check,
  Circle,
  Plus,
  Edit2,
  Trash2,
  GripVertical,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  getProjectStages,
  markStageCompleted,
  markStageIncomplete,
  createProjectStage,
  updateProjectStage,
  deleteProjectStage,
  initializeStagesFromTemplate,
  getStageTemplates,
  type ProjectStage,
  type StageTemplate,
} from '../services/projectStages.service';

interface ProjectStagesChecklistProps {
  projectId: string;
  userId: string;
  onProgressUpdate?: (progress: number) => void;
}

export const ProjectStagesChecklist: React.FC<ProjectStagesChecklistProps> = ({
  projectId,
  userId,
  onProgressUpdate,
}) => {
  const [stages, setStages] = useState<ProjectStage[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [totalStages, setTotalStages] = useState(0);
  const [completedStages, setCompletedStages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<StageTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesError, setTemplatesError] = useState<string | null>(null);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showAddStageDialog, setShowAddStageDialog] = useState(false);
  const [editingStage, setEditingStage] = useState<ProjectStage | null>(null);
  const [newStage, setNewStage] = useState({
    name: '',
    description: '',
    weight: 1,
    isOptional: false,
  });

  // Load stages
  const loadStages = async () => {
    try {
      setLoading(true);
      const result = await getProjectStages(projectId);
      setStages(result.stages);
      setOverallProgress(result.overallProgress);
      setTotalStages(result.totalStages);
      setCompletedStages(result.completedStages);

      if (onProgressUpdate) {
        onProgressUpdate(result.overallProgress);
      }
    } catch (error) {
      console.error('Error loading stages:', error);
      toast.error('Failed to load project stages');
    } finally {
      setLoading(false);
    }
  };

  // Load templates
  const loadTemplates = async () => {
    try {
      setTemplatesLoading(true);
      setTemplatesError(null);
      const result = await getStageTemplates();
      console.log('Templates loaded:', result.templates);
      setTemplates(result.templates || []);
    } catch (error: any) {
      console.error('Error loading templates:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to load templates';
      setTemplatesError(errorMessage);
      toast.error(`Failed to load templates: ${errorMessage}`);
    } finally {
      setTemplatesLoading(false);
    }
  };

  useEffect(() => {
    loadStages();
    loadTemplates();
  }, [projectId]);

  // Toggle stage completion
  const handleToggleStage = async (stage: ProjectStage) => {
    try {
      if (stage.isCompleted) {
        const result = await markStageIncomplete(projectId, stage.id);
        toast.success(`${stage.name} marked as incomplete`);
        setOverallProgress(result.projectProgress);
        setCompletedStages(result.completedStages);
        if (onProgressUpdate) {
          onProgressUpdate(result.projectProgress);
        }
      } else {
        const result = await markStageCompleted(projectId, stage.id, userId);
        toast.success(`${stage.name} completed! 🎉`);
        setOverallProgress(result.projectProgress);
        setCompletedStages(result.completedStages);
        if (onProgressUpdate) {
          onProgressUpdate(result.projectProgress);
        }
      }
      await loadStages();
    } catch (error) {
      console.error('Error toggling stage:', error);
      toast.error('Failed to update stage');
    }
  };

  // Initialize from template
  const handleInitializeFromTemplate = async (templateId: string) => {
    try {
      await initializeStagesFromTemplate(projectId, templateId);
      toast.success('Stages initialized successfully!');
      setShowTemplateDialog(false);
      await loadStages();
    } catch (error: any) {
      console.error('Error initializing stages:', error);
      toast.error(error.response?.data?.error || 'Failed to initialize stages');
    }
  };

  // Add new stage
  const handleAddStage = async () => {
    if (!newStage.name.trim()) {
      toast.error('Stage name is required');
      return;
    }

    try {
      const nextOrder = stages.length + 1;
      await createProjectStage(projectId, {
        ...newStage,
        order: nextOrder,
      });
      toast.success('Stage added successfully!');
      setShowAddStageDialog(false);
      setNewStage({ name: '', description: '', weight: 1, isOptional: false });
      await loadStages();
    } catch (error) {
      console.error('Error adding stage:', error);
      toast.error('Failed to add stage');
    }
  };

  // Edit stage
  const handleEditStage = async () => {
    if (!editingStage) return;

    if (!editingStage.name.trim()) {
      toast.error('Stage name is required');
      return;
    }

    try {
      await updateProjectStage(projectId, editingStage.id, {
        name: editingStage.name,
        description: editingStage.description,
        weight: editingStage.weight,
        isOptional: editingStage.isOptional,
      });
      toast.success('Stage updated successfully!');
      setEditingStage(null);
      await loadStages();
    } catch (error) {
      console.error('Error updating stage:', error);
      toast.error('Failed to update stage');
    }
  };

  // Delete stage
  const handleDeleteStage = async (stageId: string, stageName: string) => {
    if (!confirm(`Are you sure you want to delete "${stageName}"?`)) {
      return;
    }

    try {
      await deleteProjectStage(projectId, stageId);
      toast.success('Stage deleted successfully');
      await loadStages();
    } catch (error) {
      console.error('Error deleting stage:', error);
      toast.error('Failed to delete stage');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Project Stages</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Track your project progress by completing stages
              </p>
            </div>
            <div className="flex gap-2">
              {stages.length === 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTemplateDialog(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Use Template
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddStageDialog(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Stage
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Progress Overview */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Overall Progress
              </span>
              <span className="text-lg font-bold text-blue-600">
                {overallProgress}%
              </span>
            </div>
            <Progress value={overallProgress} className="h-3 mb-2" />
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                {completedStages} of {totalStages} stages completed
              </span>
              <span>{totalStages - completedStages} remaining</span>
            </div>
          </div>

          {/* Stages List */}
          {stages.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">No stages defined yet</p>
              <div className="flex gap-2 justify-center">
                <Button
                  variant="outline"
                  onClick={() => setShowTemplateDialog(true)}
                >
                  Use Industry Template
                </Button>
                <Button onClick={() => setShowAddStageDialog(true)}>
                  Create Custom Stage
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {stages.map((stage, index) => (
                <div
                  key={stage.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                    stage.isCompleted
                      ? 'bg-green-50 border-green-200'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {/* Drag Handle */}
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                    <span className="text-sm font-medium text-gray-400 w-6">
                      {index + 1}
                    </span>
                  </div>

                  {/* Checkbox */}
                  <Checkbox
                    checked={stage.isCompleted}
                    onCheckedChange={() => handleToggleStage(stage)}
                    className="mt-1"
                  />

                  {/* Stage Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4
                        className={`font-medium ${
                          stage.isCompleted
                            ? 'text-green-700 line-through'
                            : 'text-gray-900'
                        }`}
                      >
                        {stage.name}
                      </h4>
                      {stage.isOptional && (
                        <Badge variant="secondary" className="text-xs">
                          Optional
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        Weight: {stage.weight}
                      </Badge>
                    </div>
                    {stage.description && (
                      <p className="text-sm text-gray-600">
                        {stage.description}
                      </p>
                    )}
                    {stage.isCompleted && stage.completedAt && (
                      <p className="text-xs text-green-600 mt-1">
                        ✓ Completed on{' '}
                        {new Date(stage.completedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingStage(stage)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteStage(stage.id, stage.name)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Template Selection Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Choose a Stage Template</DialogTitle>
            <DialogDescription>
              Select an industry-standard template to get started quickly
            </DialogDescription>
          </DialogHeader>
          {templatesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Loading templates...</span>
            </div>
          ) : templatesError ? (
            <div className="py-8 text-center">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
              <p className="text-red-600 mb-2">Failed to load templates</p>
              <p className="text-sm text-gray-500 mb-4">{templatesError}</p>
              <Button onClick={loadTemplates} variant="outline">
                Retry
              </Button>
            </div>
          ) : templates.length === 0 ? (
            <div className="py-8 text-center">
              <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">No templates available</p>
              <Button onClick={loadTemplates} variant="outline">
                Reload Templates
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {templates.map((template) => (
              <div
                key={template.id}
                className="border rounded-lg p-4 hover:border-blue-500 cursor-pointer transition-all"
                onClick={() => handleInitializeFromTemplate(template.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{template.name}</h3>
                  <Badge>{template.stageCount} stages</Badge>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  {template.stages.slice(0, 3).map((stage, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Circle className="w-3 h-3" />
                      <span>{stage.name}</span>
                    </div>
                  ))}
                  {template.stageCount > 3 && (
                    <p className="text-xs text-gray-400 ml-5">
                      +{template.stageCount - 3} more stages...
                    </p>
                  )}
                </div>
              </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Stage Dialog */}
      <Dialog open={showAddStageDialog} onOpenChange={setShowAddStageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Stage</DialogTitle>
            <DialogDescription>
              Create a custom stage for your project
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="stage-name">Stage Name *</Label>
              <Input
                id="stage-name"
                value={newStage.name}
                onChange={(e) =>
                  setNewStage({ ...newStage, name: e.target.value })
                }
                placeholder="e.g., Foundation Work"
              />
            </div>
            <div>
              <Label htmlFor="stage-description">Description</Label>
              <Textarea
                id="stage-description"
                value={newStage.description}
                onChange={(e) =>
                  setNewStage({ ...newStage, description: e.target.value })
                }
                placeholder="Brief description of this stage"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="stage-weight">
                Weight (How much this contributes to progress)
              </Label>
              <Input
                id="stage-weight"
                type="number"
                min="1"
                value={newStage.weight}
                onChange={(e) =>
                  setNewStage({
                    ...newStage,
                    weight: parseFloat(e.target.value) || 1,
                  })
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="stage-optional"
                checked={newStage.isOptional}
                onCheckedChange={(checked) =>
                  setNewStage({ ...newStage, isOptional: checked as boolean })
                }
              />
              <Label htmlFor="stage-optional">Optional stage</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddStageDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleAddStage}>Add Stage</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Stage Dialog */}
      <Dialog open={!!editingStage} onOpenChange={(open) => !open && setEditingStage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Stage</DialogTitle>
            <DialogDescription>
              Update the stage details
            </DialogDescription>
          </DialogHeader>
          {editingStage && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-stage-name">Stage Name *</Label>
                <Input
                  id="edit-stage-name"
                  value={editingStage.name}
                  onChange={(e) =>
                    setEditingStage({ ...editingStage, name: e.target.value })
                  }
                  placeholder="e.g., Foundation Work"
                />
              </div>
              <div>
                <Label htmlFor="edit-stage-description">Description</Label>
                <Textarea
                  id="edit-stage-description"
                  value={editingStage.description || ''}
                  onChange={(e) =>
                    setEditingStage({ ...editingStage, description: e.target.value })
                  }
                  placeholder="Brief description of this stage"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="edit-stage-weight">
                  Weight (How much this contributes to progress)
                </Label>
                <Input
                  id="edit-stage-weight"
                  type="number"
                  min="1"
                  value={editingStage.weight}
                  onChange={(e) =>
                    setEditingStage({
                      ...editingStage,
                      weight: parseFloat(e.target.value) || 1,
                    })
                  }
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="edit-stage-optional"
                  checked={editingStage.isOptional}
                  onCheckedChange={(checked) =>
                    setEditingStage({ ...editingStage, isOptional: checked as boolean })
                  }
                />
                <Label htmlFor="edit-stage-optional">Optional stage</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingStage(null)}
            >
              Cancel
            </Button>
            <Button onClick={handleEditStage}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

