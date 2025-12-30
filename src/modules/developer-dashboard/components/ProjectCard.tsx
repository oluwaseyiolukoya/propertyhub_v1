import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Progress } from '../../../components/ui/progress';
import { Eye, MapPin, Calendar, TrendingUp, TrendingDown, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../../components/ui/tooltip';
import type { DeveloperProject, ProjectStage, ProjectStatus } from '../types';
import { getCurrencySymbol } from '../../../lib/currency';

interface ProjectCardProps {
  project: DeveloperProject;
  onView?: (projectId: string) => void;
  currency?: string;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onView,
  currency,
}) => {
  // Use project's currency if available, otherwise fall back to prop or default
  const projectCurrency = currency || project.currency || 'NGN';

  const formatCurrency = (amount: number) => {
    // Use centralized currency symbol to avoid "F CFA" issue with Intl.NumberFormat
    const symbol = getCurrencySymbol(projectCurrency);
    const formatted = amount.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      notation: 'compact',
    });
    return `${symbol}${formatted}`;
  };

  const getStatusBadge = (status: ProjectStatus) => {
    const variants: Record<ProjectStatus, { variant: any; label: string; className?: string }> = {
      active: { variant: 'default', label: 'Active', className: 'bg-blue-100 text-blue-800' },
      'on-hold': { variant: 'secondary', label: 'On Hold' },
      completed: { variant: 'success', label: 'Completed', className: 'bg-green-100 text-green-800' },
      cancelled: { variant: 'destructive', label: 'Cancelled' },
    };

    const config = variants[status] || variants.active;
    return (
      <Badge variant={config.variant} className={config.className || ''}>
        {config.label}
      </Badge>
    );
  };

  const getStageBadge = (stage: ProjectStage) => {
    const stages: Record<ProjectStage, string> = {
      planning: 'Planning',
      design: 'Design',
      'pre-construction': 'Pre-Construction',
      construction: 'Construction',
      completion: 'Completion',
    };

    return (
      <Badge variant="outline" className="text-xs">
        {stages[stage]}
      </Badge>
    );
  };

  const variance = project.actualSpend - project.totalBudget;
  const variancePercent = project.totalBudget > 0
    ? ((variance / project.totalBudget) * 100).toFixed(1)
    : '0.0';
  const isOverBudget = variance > 0;

  return (
    <TooltipProvider>
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2">{project.name}</CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              {getStatusBadge(project.status)}
              {getStageBadge(project.stage)}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onView?.(project.id)}
            className="ml-2"
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Location & Date */}
        <div className="space-y-1 text-sm text-gray-600">
          {project.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5" />
              <span>{project.location}</span>
            </div>
          )}
          {project.startDate && (
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5" />
              <span>Started {new Date(project.startDate).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1">
              <span className="text-gray-600">Progress</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-3 h-3 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="font-semibold mb-2">Automatic Progress Calculation</p>
                  <p className="text-xs">Based on:</p>
                  <ul className="text-xs list-disc list-inside mt-1 space-y-1">
                    <li>Milestones completion (40%)</li>
                    <li>Budget progress (30%)</li>
                    <li>Time elapsed (20%)</li>
                    <li>Project stage (10%)</li>
                  </ul>
                </TooltipContent>
              </Tooltip>
            </div>
            <span className="font-semibold">{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-2" />
        </div>

        {/* Budget Info */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div>
            <p className="text-xs text-gray-500">Total Budget</p>
            <p className="text-sm font-semibold">{formatCurrency(project.totalBudget)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Actual Spend</p>
            <p className="text-sm font-semibold">{formatCurrency(project.actualSpend)}</p>
          </div>
        </div>

        {/* Variance */}
        <div className={`flex items-center justify-between p-2 rounded-md ${
          isOverBudget ? 'bg-red-50' : 'bg-green-50'
        }`}>
          <div className="flex items-center gap-2">
            {isOverBudget ? (
              <TrendingUp className="h-4 w-4 text-red-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-green-600" />
            )}
            <span className={`text-sm font-medium ${
              isOverBudget ? 'text-red-700' : 'text-green-700'
            }`}>
              {isOverBudget ? 'Over Budget' : 'Under Budget'}
            </span>
          </div>
          <span className={`text-sm font-semibold ${
            isOverBudget ? 'text-red-700' : 'text-green-700'
          }`}>
            {isOverBudget ? '+' : ''}{variancePercent}%
          </span>
        </div>
      </CardContent>
    </Card>
    </TooltipProvider>
  );
};

export default ProjectCard;

